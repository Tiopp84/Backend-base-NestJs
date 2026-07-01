import { Inject, Injectable } from "@nestjs/common";
import type { IFileStorage } from "./interfaces/file-storage.interface";

@Injectable()
export class UploadService {
    constructor(@Inject('FILE_STORAGE') private storage: IFileStorage) { }

    async handleUpload(file: Express.Multer.File) {
        // Chỉ gọi hàm chuẩn, không quan tâm bên dưới là MinIO hay Cloudinary
        return await this.storage.uploadFile(file, 'uploads');
    }
}