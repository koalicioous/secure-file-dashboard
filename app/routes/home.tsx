import { useState, useCallback } from "react";
import { sanitizeFilename } from "~/lib/utils";
import { FileDashboard } from "~/upload";

const ALLOWED_TYPES = ["application/pdf", "image/png"];
const MAX_SIZE = 100_000_000; // 100MB
const CHUNK_SIZE = 1 * 1024 * 1024; // 1MB

interface FileItem {
  name: string;
  size: number;
  type: string;
  progress: number;
  status: "uploading" | "completed" | "error";
}

export default function Home() {
  const [files, setFiles] = useState<FileItem[]>([]);

  const validateFile = async (file: File): Promise<boolean> => {
    if (file.size > MAX_SIZE) {
      alert(`File ${file.name} exceeds the 100MB limit.`);
      return false;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      alert(`File ${file.name} is not an allowed type.`);
      return false;
    }

    return true;
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      const isValid = await validateFile(file);
      if (!isValid) continue;

      const newFile = {
        name: sanitizeFilename(file.name),
        size: file.size,
        type: file.type,
        progress: 0,
        status: "uploading" as const,
      };

      setFiles((prevFiles) => [...prevFiles, newFile]);

      uploadFile(file)
        .then(() => {
          setFiles((prevFiles) =>
            prevFiles.map((f) =>
              f.name === newFile.name
                ? { ...f, status: "completed", progress: 100 }
                : f
            )
          );
        })
        .catch(() => {
          setFiles((prevFiles) =>
            prevFiles.map((f) =>
              f.name === newFile.name ? { ...f, status: "error" } : f
            )
          );
        });
    }
  }, []);

  async function uploadFile(file: File) {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      let success = false;
      let attempts = 0;

      while (!success && attempts < 3) {
        try {
          await uploadChunk(chunk, chunkIndex);
          success = true;
        } catch (error) {
          console.error(`Retrying chunk ${chunkIndex}`, error);
          attempts++;
        }
      }

      if (!success) {
        alert(`Failed to upload chunk ${chunkIndex}, please retry.`);
        return;
      }
    }
  }

  async function uploadChunk(chunk: Blob, chunkIndex: number) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() < 0.05) reject(new Error("Simulated upload error"));
        else resolve(true);
      }, 500);
    });
  }

  const removeFile = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  return (
    <div className="p-10">
      <FileDashboard files={files} onDrop={onDrop} onRemove={removeFile} />
    </div>
  );
}
