import { Controller, Body, Get, Post, Req, Res, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from './guards/auth.guard';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { SkipThrottle, Throttle } from '@nestjs/throttler';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @ApiOperation({ summary: 'Register a new user' })
    @Post('register')
    register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Throttle({ default: { ttl: 60000, limit: 5 } })
    @ApiOperation({ summary: 'Login user' })
    @Post('login')
    async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
        const result = await this.authService.login(loginDto);
        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return {
            message: result.message,
            accessToken: result.accessToken,
        };
    }

    @SkipThrottle()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user profile' })
    @UseGuards(AuthGuard)
    @Get('me')
    async getProfile(@Req() req: Request) {
        const user = req.user as any;
        const freshUser = await this.authService.getFreshProfile(user.sub);
        return {
            message: 'Xác thực thành công. Đây là thông tin của bạn:',
            user: {
                id: freshUser?.id,
                email: freshUser?.email,
                fullName: freshUser?.fullName,
                phone: freshUser?.phone,
                loyaltyPoints: freshUser?.loyaltyPoints || 0,
                role: freshUser?.role?.roleName || 'Customer',
            },
        };
    }

    @ApiOperation({ summary: 'Login with Google' })
    @UseGuards(PassportAuthGuard('google'))
    @Get('google')
    async googleAuth(@Req() req: Request) {
        // Guard redirects
    }

    @ApiOperation({ summary: 'Google Auth Callback' })
    @UseGuards(PassportAuthGuard('google'))
    @Get('google/callback')
    googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
        // req.user contains the token payload returned from validateGoogleUser
        const { accessToken, refreshToken } = req.user as any;
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.redirect(`${frontendUrl}#accessToken=${accessToken}`);
    }

    @ApiOperation({ summary: 'Refresh Access Token' })
    @Post('refresh')
    async refresh(@Req() req: Request) {
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) {
            throw new UnauthorizedException('Refresh token không tồn tại trong cookie');
        }
        return this.authService.refreshAccessToken(refreshToken);
    }

    @ApiBearerAuth()
    @ApiOperation({ summary: 'Logout user' })
    @UseGuards(AuthGuard)
    @Post('logout')
    async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
        const userId = req.user.sub;
        await this.authService.clearRefreshToken(userId);
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            path: '/',
        });
        return { message: 'Đăng xuất thành công' };
    }
}
