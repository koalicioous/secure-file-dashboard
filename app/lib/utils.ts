import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { FileItem, LoaderFileData } from "~/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^\w\s.-]/gi, "");
}

export function escapeHTML(unsafe: string): string {
  const div = document.createElement("div");
  div.innerText = unsafe;
  return div.innerHTML;
}

export function mapLoaderDataToFileItem(
  loaderData: LoaderFileData[]
): FileItem[] {
  return loaderData.map((file) => ({
    id: file.fileId,
    name: file.originalName,
    size: file.size,
    type: file.uniqueFileName.split(".").pop() || "unknown",
    progress: 100,
    status: "completed",
    url: file.url,
  }));
}
