import { useCallback } from "react";

export function useDeleteFile() {
  const deleteFile = useCallback(async (fileId: string): Promise<void> => {
    const response = await fetch(`/api/file/${fileId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Failed to delete file");
    }
  }, []);

  return { deleteFile };
}
