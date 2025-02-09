import { CHUNK_SIZE } from "~/constants";
import { sanitizeFilename } from "~/lib/utils";
import { useSimpleAuth } from "./useSimpleAuth";
import { useRef } from "react";
import { LoaderFileDataSchema, type LoaderFileData } from "~/types";

function useChunkedUpload() {
  const { currentUser = "" } = useSimpleAuth();

  const abortControllers = useRef(new Map<string, AbortController>());

  const uploadFile = async (
    file: File,
    fileId: string,
    onProgress: (progress: number, file?: LoaderFileData) => void
  ): Promise<string> => {
    const abortController = new AbortController();
    abortControllers.current.set(fileId, abortController);

    const chunkSize = CHUNK_SIZE;
    const totalChunks = Math.ceil(file.size / chunkSize);
    let finalFileResponse = "";
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

        if (response.status === 201) {
          const json = await response.json();
          const parsedFileData = LoaderFileDataSchema.parse(json);
          finalFileResponse = parsedFileData.path;
          onProgress(100, parsedFileData);
        } else {
          onProgress(((i + 1) / totalChunks) * 100);
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

    return finalFileResponse;
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
