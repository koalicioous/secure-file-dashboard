import { CHUNK_SIZE } from "~/constants";
import { sanitizeFilename } from "~/lib/utils";
import { useSimpleAuth } from "./useSimpleAuth";
import { useRef } from "react";

function useChunkedUpload() {
  const { currentUser = "" } = useSimpleAuth();

  const abortControllers = useRef(new Map<string, AbortController>());

  const uploadFile = async (
    file: File,
    fileId: string,
    onProgress: (progress: number) => void
  ): Promise<string> => {
    const abortController = new AbortController();
    abortControllers.current.set(fileId, abortController);

    const chunkSize = CHUNK_SIZE;
    const totalChunks = Math.ceil(file.size / chunkSize);
    let finalFilePath = "";
    try {
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
          signal: abortController.signal,
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
    } catch (error) {
      if (abortController.signal.aborted) {
        throw new Error("Upload cancelled");
      }
      throw error;
    } finally {
      abortControllers.current.delete(fileId);
    }

    return finalFilePath;
  };

  const cancelUpload = (fileId: string) => {
    const controller = abortControllers.current.get(fileId);
    if (controller) {
      controller.abort();
      abortControllers.current.delete(fileId);
    }
  };

  return { uploadFile, cancelUpload };
}

export default useChunkedUpload;
