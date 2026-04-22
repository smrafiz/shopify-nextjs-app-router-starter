/**
 * File helper utilities for serialization across server/client boundary
 */

export interface SerializableFile {
    name: string;
    type: string;
    size: number;
    data: string; // base64-encoded
}

/**
 * Convert a File to a base64-encoded serializable object
 */
export async function fileToSerializable(
    file: File,
): Promise<SerializableFile> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result as string;
            resolve({
                name: file.name,
                type: file.type,
                size: file.size,
                data: base64.split(",")[1],
            });
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
    });
}

/**
 * Convert multiple Files to serializable format
 */
export async function filesToSerializable(
    files: File[],
): Promise<SerializableFile[]> {
    return Promise.all(files.map(fileToSerializable));
}

/**
 * Convert a serializable file back to a File object
 */
export function serializableToFile(serializable: SerializableFile): File {
    const byteCharacters = atob(serializable.data);
    const byteNumbers = Array.from(byteCharacters, (c) => c.charCodeAt(0));
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: serializable.type });
    return new File([blob], serializable.name, { type: serializable.type });
}

/**
 * Convert multiple serializable files back to File objects
 */
export function serializablesToFiles(
    serializables: SerializableFile[],
): File[] {
    return serializables.map(serializableToFile);
}
