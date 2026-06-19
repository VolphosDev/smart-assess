import { FileRepository } from "../../domain/repositories/FileRepository";
import { apiClient } from "../http/apiClient";

export class ApiFileRepository implements FileRepository {
    async uploadMultipleFiles(files: File[]): Promise<string> {
        const formData = new FormData();
        files.forEach(file => {
            formData.append("archivos", file);
        });

        const token = localStorage.getItem("token");
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
        const res = await fetch(`${baseUrl}/archivos/subir`, {
            method: "POST",
            headers,
            body: formData,
        });

        if (!res.ok) throw new Error("Error al subir archivos");
        return res.text();
    }

    generateImage(prompt: string): Promise<{ base64: string }> {
        return apiClient.get<{ base64: string }>(`/archivos/generar-imagen?prompt=${encodeURIComponent(prompt)}`);
    }
}
