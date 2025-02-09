"use client";

import { useDropzone } from "react-dropzone";
import {
  Upload,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  CircleX,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { escapeHTML, sanitizeFilename } from "~/lib/utils";
import { Spinner } from "../Spinner";
import type { FileItem } from "~/types";

interface FileDashboardProps {
  files: FileItem[];
  onDrop: (files: File[]) => void;
  onRemove: (index: number) => void;
  isLoading: boolean;
  onDeleteFile: (id: string) => void;
  onPreview: (file: FileItem) => void;
  onCancelUpload: (id: string) => void;
  previewComponent?: React.ReactNode;
}

export function FileDashboard({
  files,
  onDrop,
  onRemove,
  onDeleteFile,
  onCancelUpload,
  isLoading = false,
  previewComponent,
  onPreview,
}: FileDashboardProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Secure File Dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer ${
            isDragActive ? "border-primary" : "border-muted"
          }`}
        >
          <input {...getInputProps()} aria-label="File dropzone" />
          <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            Drag and drop files here, or click to select
          </p>
        </div>

        {previewComponent}

        {files.length > 0 && (
          <Table className="mt-8">
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((file, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium max-w-[310px] line-clamp-1 overflow-ellipsis whitespace-nowrap">
                    {escapeHTML(sanitizeFilename(file.name))}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatFileSize(file.size)}
                  </TableCell>
                  <TableCell>{file.type}</TableCell>
                  <TableCell className="w-[200px]">
                    <Progress value={file.progress} className="w-full" />
                  </TableCell>
                  <TableCell>
                    {file.status === "uploading" && (
                      <Upload className="h-4 w-4 text-muted-foreground animate-pulse" />
                    )}
                    {file.status === "completed" && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {file.status === "error" && (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="icon"
                        disabled={file.status !== "completed"}
                        onClick={() => onPreview(file)}
                        aria-label="See Content"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        aria-label="Remove File"
                        size="icon"
                        onClick={() => {
                          if (file.status === "uploading") {
                            onCancelUpload(file.id);
                          } else if (file.status === "completed") {
                            onDeleteFile(file.id);
                          } else {
                            onRemove(index);
                          }
                        }}
                      >
                        {file.status === "uploading" ? (
                          <CircleX className="h-4 w-4" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {!files.length && isLoading && <Spinner />}
      </CardContent>
    </Card>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (
    Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  );
}
