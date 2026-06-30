import { Controller, Body, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from './guards/auth.guard';
import type { Request } from 'express';
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
    login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @SkipThrottle()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user profile' })
    @UseGuards(AuthGuard)
    @Get('me')
    getProfile(@Req() req: Request) {
        return {
            message: 'Xác thực thành công. Đây là thông tin của bạn:',
            user: req['user'],
        };
    }
}
