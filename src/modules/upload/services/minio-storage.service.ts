import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { IFileStorage } from '../interfaces/file-storage.interface';
import { S3Client, PutObjectCommand, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MinioStorageService implements IFileStorage, OnModuleInit {
    private s3: S3Client;
    private readonly logger = new Logger(MinioStorageService.name);
    private bucketName: string;

    constructor(private configService: ConfigService) {
        this.bucketName = this.configService.get<string>('AWS_S3_BUCKET', 'uploads');
        this.s3 = new S3Client({
            endpoint: this.configService.get<string>('AWS_S3_ENDPOINT', 'http://localhost:9000'),
            region: 'us-east-1',
            credentials: {
                accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY', 'admin'),
                secretAccessKey: this.configService.get<string>('AWS_SECRET_KEY', 'password123'),
            },
            forcePathStyle: true, // MUST be true for MinIO
        });
    }

    async onModuleInit() {
        try {
            await this.s3.send(new HeadBucketCommand({ Bucket: this.bucketName }));
            this.logger.log(`Bucket '${this.bucketName}' already exists.`);
        } catch (error) {
            this.logger.warn(`Bucket '${this.bucketName}' does not exist. Creating...`);
            try {
                await this.s3.send(new CreateBucketCommand({ Bucket: this.bucketName }));
                this.logger.log(`Bucket '${this.bucketName}' created successfully.`);
            } catch (createError) {
                this.logger.error(`Failed to create bucket '${this.bucketName}':`, createError);
            }
        }
    }

    async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
        const key = `${folder}/${Date.now()}-${file.originalname.replace(/\\s+/g, '-')}`;
        await this.s3.send(new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
        }));
        // Return public URL or relative path
        const endpoint = this.configService.get<string>('AWS_S3_ENDPOINT', 'http://localhost:9000');
        return `${endpoint}/${this.bucketName}/${key}`;
    }
}