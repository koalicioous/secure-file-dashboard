import { useCallback } from "react";

export function useDownloadFile() {
  const downloadFile = useCallback(async (fileId: string): Promise<string> => {
    const response = await fetch(`/api/file/${fileId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Failed to download file");
    }
    const data = await response.json();
    return data.url;
  }, []);

  return { downloadFile };
}
