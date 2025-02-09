import { useCallback } from "react";
import { useSimpleAuth } from "~/hooks/useSimpleAuth";

export function useCancelUpload() {
  const { currentUser } = useSimpleAuth();

  const cancelUpload = useCallback(
    async (fileId: string): Promise<void> => {
      if (!currentUser) {
        throw new Error("User not authenticated");
      }

      const formData = new FormData();
      formData.append("fileId", fileId);
      formData.append("userToken", currentUser);

      const response = await fetch("/api/upload", {
        method: "DELETE",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to cancel upload");
      }
    },
    [currentUser]
  );

  return { cancelUpload };
}
