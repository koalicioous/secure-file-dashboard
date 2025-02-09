import { useCallback } from "react";

export function useDownloadFile() {
  const downloadFile = useCallback(async (path: string) => {
    window.open(`/download/${path}`, "_blank");
  }, []);

  return { downloadFile };
}
