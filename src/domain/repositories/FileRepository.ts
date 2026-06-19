export interface FileRepository {
    uploadMultipleFiles(files: File[]): Promise<string>;
    generateImage(prompt: string): Promise<{ base64: string }>;
}
