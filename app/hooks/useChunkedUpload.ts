import { CHUNK_SIZE } from "~/constants";
import { sanitizeFilename } from "~/lib/utils";
import { useSimpleAuth } from "~/context/AuthContext";
import { useRef } from "react";
import { LoaderFileDataSchema, type LoaderFileData } from "~/types";

function useChunkedUpload() {
  const { currentUser = "" } = useSimpleAuth();
  const abortControllers = useRef(new Map<string, AbortController>());

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const waitForOnline = () =>
    new Promise<void>((resolve) => {
      if (navigator.onLine) {
        resolve();
      } else {
        window.addEventListener("online", () => resolve(), { once: true });
      }
    });

  const getUploadedChunks = async (fileId: string): Promise<number[]> => {
    try {
      const response = await fetch(
        `/api/upload-chunk?fileId=${fileId}&userToken=${encodeURIComponent(
          currentUser as string
        )}`,
        { method: "GET" }
      );
      if (response.ok) {
        const { uploadedChunks } = await response.json();
        return uploadedChunks;
      }
    } catch (err) {
      console.error("Error fetching uploaded chunks:", err);
    }
    return [];
  };

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

    const uploadedChunks = await getUploadedChunks(fileId);

    try {
      for (let i = 0; i < totalChunks; i++) {
        if (uploadedChunks.includes(i)) {
          onProgress(((i + 1) / totalChunks) * 100);
          continue;
        }

        let response: Response | undefined;
        let chunkUploaded = false;
        while (!chunkUploaded) {
          if (abortController.signal.aborted) {
            throw new Error("Upload cancelled");
          }
          try {
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

            response = await fetch("/api/upload-chunk", {
              method: "POST",
              body: formData,
              signal: abortController.signal,
            });

            if (!response.ok) {
              let errorMessage = `Failed to upload chunk ${i}`;
              try {
                const errorData = await response.clone().json();
                if (errorData?.message) {
                  errorMessage = errorData.message;
                }
              } catch (err) {
                console.error("Failed to parse error response", err);
              }

              if (response.status >= 500) {
                console.warn(
                  `Server error on chunk ${i}: ${errorMessage}. Retrying in 2 seconds...`
                );
                await delay(2000);
                continue;
              }
              throw new Error(errorMessage);
            }

            chunkUploaded = true;
          } catch (err: any) {
            if (abortController.signal.aborted) {
              throw new Error("Upload cancelled");
            }
            if (err instanceof TypeError || !navigator.onLine) {
              console.warn(
                `Network issue on chunk ${i}: ${err.message}. Waiting for network to resume...`
              );
              await waitForOnline();
              await delay(1000);
              continue;
            } else {
              throw err;
            }
          }
        }

        if (response) {
          if (response.status === 201) {
            const json = await response.json();
            const parsedFileData = LoaderFileDataSchema.parse(json);
            finalFileResponse = parsedFileData.path;
            onProgress(100, parsedFileData);
          } else {
            onProgress(((i + 1) / totalChunks) * 100);
          }
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
