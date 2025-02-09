export interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: "uploading" | "completed" | "error";
  url?: string;
}

export interface LoaderFileData {
  fileId: string;
  uniqueFileName: string;
  originalName: string;
  path: string;
  size: number;
  modifiedTime: Date;
  type: string;
}
