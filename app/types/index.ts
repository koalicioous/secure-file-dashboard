import { z } from "zod";
export interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: "uploading" | "completed" | "error";
  url?: string;
}

export const LoaderFileDataSchema = z.object({
  fileId: z.string(),
  uniqueFileName: z.string(),
  originalName: z.string(),
  path: z.string(),
  size: z.number(),
  modifiedTime: z.string(),
  type: z.string(),
});

export type LoaderFileData = z.infer<typeof LoaderFileDataSchema>;
