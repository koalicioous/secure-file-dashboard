import { useState, useCallback, useEffect } from "react";
import useChunkedUpload from "~/hooks/useChunkedUpload";
import { mapLoaderDataToFileItem, sanitizeFilename } from "~/lib/utils";
import { FileDashboard } from "~/components/Upload";
import { useSimpleAuth } from "~/context/AuthContext";
import { AuthModal } from "~/components/AuthenticationModal";
import { Button } from "~/components/ui/button";
import type { Route } from "./+types/user-files";
import { useRevalidator } from "react-router";
import {
  LoaderFileDataSchema,
  type FileItem,
  type LoaderFileData,
} from "~/types";
import { Spinner } from "~/components/Spinner";
import { useDeleteFile } from "~/hooks/files/useDeleteFile";
import SanitizedPreview from "~/components/SanitizedPreview";
import { useCancelUpload } from "~/hooks/useCancelUpload";
import { z } from "zod";
import { ContentSecurityPolicyProvider } from "~/components/ContentSecurityPolicyProvider";
import { useToast } from "~/hooks/use-toast";

const ALLOWED_TYPES = ["application/pdf", "image/png"];
const MAX_SIZE = 100_000_000;

export const FilesResponseSchema = z.object({
  files: z.array(LoaderFileDataSchema),
});

export async function clientLoader({
  params,
  request,
}: Route.ClientLoaderArgs) {
  let token: string | null = null;
  if (typeof window !== "undefined") {
    token = JSON.parse(sessionStorage.getItem("currentUser") as string)?.token;
  }

  if (!token) {
    return { files: [] };
  }

  const res = await fetch(`/api/user/${token}/files`);
  if (!res.ok) {
    throw new Error(`Failed to load files: ${res.statusText}`);
  }
  const data = await res.json();
  const parsedData = FilesResponseSchema.parse(data);
  return parsedData;
}

export function HydrateFallback() {
  return (
    <div className="w-screen h-screen flex items-center justify-center flex-col font-semibold text-2xl">
      <Spinner />
      <p>Loading files...</p>
    </div>
  );
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { files: loaderFiles = [] } = loaderData;
  const revalidator = useRevalidator();
  const isLoadingData = revalidator.state === "loading";
  const [files, setFiles] = useState<FileItem[]>(
    mapLoaderDataToFileItem(loaderFiles)
  );
  const { toast } = useToast();

  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

  const { isAuthenticated, login, logout } = useSimpleAuth();

  const [authModalOpen, setAuthModalOpen] = useState(!isAuthenticated);

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

  const { uploadFile, cancelUpload } = useChunkedUpload();
  const { cancelUpload: cleanupTempFile } = useCancelUpload();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
        const isValid = await validateFile(file);
        if (!isValid) continue;

        const fileId = `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 10)}`;

        const newFile: FileItem = {
          id: fileId,
          name: sanitizeFilename(file.name),
          size: file.size,
          type: file.type,
          progress: 5,
          status: "uploading",
        };
        setFiles((prev) => [...prev, newFile]);

        uploadFile(
          file,
          fileId,
          (progress: number, fileData?: LoaderFileData) => {
            setFiles((prevFiles) =>
              prevFiles.map((f) => {
                if (f.id === fileId) {
                  if (fileData) {
                    toast({
                      title: `${f.name} is uploaded`,
                      description: "File uploaded successfully",
                    });
                    return {
                      ...f,
                      progress,
                      status: "completed",
                      name: fileData.originalName,
                      type: fileData.type,
                      url: fileData.path,
                      size: fileData.size,
                    };
                  } else {
                    return { ...f, progress };
                  }
                }
                return f;
              })
            );
          }
        )
          .then((finalFilePath) => {
            setFiles((prevFiles) =>
              prevFiles.map((f) =>
                f.id === fileId
                  ? { ...f, progress: 100, status: "completed" }
                  : f
              )
            );
          })
          .catch((error) => {
            setFiles((prevFiles) =>
              prevFiles.map((f) =>
                f.id === fileId ? { ...f, status: "error" } : f
              )
            );
            toast({
              variant: "destructive",
              title: "Failed to upload file",
              description: error.message,
            });
            console.error("Error uploading file:", error.message);
          });
      }
    },
    [uploadFile]
  );

  const removeFile = (id: string) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file.id !== id));
  };

  const { deleteFile } = useDeleteFile();

  const handleDeleteFile = async (fileId: string) => {
    try {
      await deleteFile(fileId);
      setFiles((prevFiles) => prevFiles.filter((file) => file.id !== fileId));
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  const handleCancelUpload = async (fileId: string) => {
    try {
      cancelUpload(fileId);
      await cleanupTempFile(fileId);
      removeFile(fileId);
    } catch (error) {
      console.error("Error cancelling upload:", error);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
    }
    revalidator.revalidate();
  }, [isAuthenticated]);

  useEffect(() => {
    setFiles(mapLoaderDataToFileItem(loaderFiles));
    setSelectedFile(null);
  }, [loaderFiles]);

  return (
    <div className="p-10 flex flex-col items-center justify-center">
      <ContentSecurityPolicyProvider policy="default-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-inline' https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;">
        <FileDashboard
          files={files}
          onDrop={onDrop}
          onRemove={(index: number) => {
            const fileToRemove = files[index];
            if (fileToRemove) {
              removeFile(fileToRemove.id);
            }
          }}
          onPreview={(target: FileItem) => setSelectedFile(target)}
          onDeleteFile={handleDeleteFile}
          onCancelUpload={handleCancelUpload}
          isLoading={isLoadingData}
          previewComponent={
            <SanitizedPreview
              content={selectedFile}
              onClose={() => setSelectedFile(null)}
            />
          }
        />
      </ContentSecurityPolicyProvider>
      <AuthModal
        open={authModalOpen}
        setOpen={setAuthModalOpen}
        onAuthenticate={(username, password) => login(username, password)}
      />
      {isAuthenticated && (
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="mx-auto w-full max-w-[200px] mt-10  px-3 py-2 hover:bg-transparent"
          onClick={() => logout()}
          aria-label="Logout"
        >
          Logout
        </Button>
      )}
    </div>
  );
}
