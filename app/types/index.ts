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
  url: string;
  size: number;
  modifiedTime: Date;
}
