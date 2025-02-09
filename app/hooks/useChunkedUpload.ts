import { CHUNK_SIZE } from "~/constants";
import { sanitizeFilename } from "~/lib/utils";
import { useSimpleAuth } from "./useSimpleAuth";

function useChunkedUpload() {
  const { currentUser = "" } = useSimpleAuth();
  const uploadFile = async (
    file: File,
    fileId: string,
    onProgress: (progress: number) => void
  ): Promise<string> => {
    const chunkSize = CHUNK_SIZE;
    const totalChunks = Math.ceil(file.size / chunkSize);
    let finalFilePath = "";

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(file.size, start + chunkSize);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append("userToken", currentUser as string);
      formData.append("fileId", fileId);
      formData.append("chunkIndex", i.toString());
      formData.append("totalChunks", totalChunks.toString());
      formData.append("fileName", sanitizeFilename(file.name));
      formData.append("chunk", chunk, file.name);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to upload chunk ${i}`);
      }

      onProgress(((i + 1) / totalChunks) * 100);

      if (i === totalChunks - 1) {
        const data = await response.json();
        finalFilePath = data.filePath;
      }
    }

    return finalFilePath;
  };

  return { uploadFile };
}

export default useChunkedUpload;
