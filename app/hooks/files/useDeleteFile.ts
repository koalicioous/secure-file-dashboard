import { useCallback } from "react";
import { z } from "zod";

const DeleteFileResponseSchema = z.object({
  success: z.boolean(),
});

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
    const data = await response.json();
    const parsedData = DeleteFileResponseSchema.parse(data);

    if (!parsedData.success) {
      throw new Error("File deletion unsuccessful");
    }
  }, []);

  return { deleteFile };
}
