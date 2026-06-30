import { Module } from "@nestjs/common";
import { MinioStorageService } from "./services/minio-storage.service";
import { UploadService } from "./upload.service";
import { UploadController } from "./upload.controller";

@Module({
    providers: [
        {
            provide: 'FILE_STORAGE',
            useClass: MinioStorageService
            // process.env.STORAGE_PROVIDER === 'MINIO'
            // : CloudinaryStorageService  --- switch cloudinary or minio
        },
        UploadService,
    ],
    controllers: [UploadController],
})
export class UploadModule { }