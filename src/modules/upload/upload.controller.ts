import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    ParseFilePipe,
    MaxFileSizeValidator,
    FileTypeValidator
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
    constructor(private readonly uploadService: UploadService) { }

    @Post('image')
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
            },
        },
    })
    @UseInterceptors(FileInterceptor('file'))
    async uploadImage(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }), // Tối đa 5MB
                    new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }), // Chỉ nhận ảnh
                ],
            }),
        )
        file: Express.Multer.File,
    ) {
        // Controller chỉ gọi Service, không quan tâm bên trong lưu ở đâu
        const path = await this.uploadService.handleUpload(file);
        return {
            message: 'Upload thành công',
            url: path, // Đây sẽ là đường dẫn tương đối (ví dụ: uploads/123-abc.png)
        };
    }
}