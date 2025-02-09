import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
