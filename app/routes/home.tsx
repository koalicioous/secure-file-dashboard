import { useState, useCallback, useEffect } from "react";
import useChunkedUpload from "~/hooks/useChunkedUpload";
import { sanitizeFilename } from "~/lib/utils";
import { FileDashboard } from "~/components/Upload";
import { useSimpleAuth } from "~/hooks/useSimpleAuth";
import { AuthModal } from "~/components/AuthenticationModal";
import { Button } from "~/components/ui/button";

const ALLOWED_TYPES = ["application/pdf", "image/png"];
const MAX_SIZE = 100_000_000;

interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: "uploading" | "completed" | "error";
}

export default function Home() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const { isAuthenticated, login, logout } = useSimpleAuth();

  const [authModalOpen, setAuthModalOpen] = useState(!isAuthenticated);

  const { uploadFile } = useChunkedUpload();

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
          progress: 0,
          status: "uploading",
        };
        setFiles((prev) => [...prev, newFile]);

        uploadFile(file, fileId, (progress: number) => {
          setFiles((prevFiles) =>
            prevFiles.map((f) => (f.id === fileId ? { ...f, progress } : f))
          );
        })
          .then((finalFilePath) => {
            setFiles((prevFiles) =>
              prevFiles.map((f) =>
                f.id === fileId
                  ? { ...f, progress: 100, status: "completed" }
                  : f
              )
            );
            console.log("File uploaded successfully at:", finalFilePath);
          })
          .catch((error) => {
            setFiles((prevFiles) =>
              prevFiles.map((f) =>
                f.id === fileId ? { ...f, status: "error" } : f
              )
            );
            console.error("Error uploading file:", error);
          });
      }
    },
    [uploadFile]
  );

  const removeFile = (id: string) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file.id !== id));
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
    }
  }, [isAuthenticated]);

  return (
    <div className="p-10 flex flex-col items-center justify-center">
      <FileDashboard
        files={files}
        onDrop={onDrop}
        onRemove={(index: number) => {
          const fileToRemove = files[index];
          if (fileToRemove) {
            removeFile(fileToRemove.id);
          }
        }}
      />
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
        >
          Logout
        </Button>
      )}
    </div>
  );
}
