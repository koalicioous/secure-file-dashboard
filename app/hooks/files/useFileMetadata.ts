import { useEffect, useState } from "react";

export interface FileMetadata {
  fileId: string;
  uniqueFileName: string;
  originalName: string;
  url: string;
  size: number;
  createdTime: string;
  modifiedTime: string;
}

export function useFileMetadata({ fileId }: { fileId: string }) {
  const [data, setData] = useState(null);
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
    setData(resData);
    return resData;
  };

  useEffect(() => {
    if (fileId) {
      getFileMetadata(fileId);
    }
  }, [fileId]);

  return data;
}
