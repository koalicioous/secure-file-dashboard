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
    type: file.type,
    progress: 100,
    status: "completed",
    url: file.path,
  }));
}

export function getUserTokenFromCookie(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/currentUser=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function getMimeType(fileName: string): string {
  const extension = fileName.split(".").pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    pdf: "application/pdf",
    png: "image/png",
  };
  return mimeTypes[extension!] || "application/octet-stream";
}
