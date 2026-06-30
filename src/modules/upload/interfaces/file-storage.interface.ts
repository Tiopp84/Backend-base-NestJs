export interface IFileStorage {
    uploadFile(file: Express.Multer.File, folder: string): Promise<string>;
}