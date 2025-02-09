import { useEffect, useState } from "react";
import { z } from "zod";

export const FileMetadataSchema = z.object({
  fileId: z.string(),
  uniqueFileName: z.string(),
  originalName: z.string(),
  url: z.string(),
  size: z.number(),
  createdTime: z.string(),
  modifiedTime: z.string(),
  checksum: z.string(),
});

export type FileMetadata = z.infer<typeof FileMetadataSchema>;

export function useFileMetadata({ fileId }: { fileId: string }) {
  const [data, setData] = useState<FileMetadata | null>(null);
  const getFileMetadata = async (fileId: string): Promise<FileMetadata> => {
    const response = await fetch(`/api/file/${fileId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Failed to fetch file metadata");
    }
    const resData = await response.json();
    try {
      const parsedData = FileMetadataSchema.parse(resData);
      setData(parsedData);
      return parsedData;
    } catch (validationError) {
      console.error("Validation error:", validationError);
      throw new Error("Invalid file metadata format");
    }
  };

  useEffect(() => {
    if (fileId) {
      getFileMetadata(fileId);
    }
  }, [fileId]);

  return data;
}
