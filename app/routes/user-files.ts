import fs from "fs";
import { promises as fsp } from "fs";
import path from "path";
import type { Route } from "./+types/user-files";
import type { LoaderFileData } from "~/types";

const getMimeType = (fileName: string): string => {
  const extension = fileName.split(".").pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    pdf: "application/pdf",
    png: "image/png",
  };
  return mimeTypes[extension!] || "application/octet-stream";
};

export async function loader({ params }: Route.LoaderArgs) {
  const token = params.token;
  const userDir = path.join(process.cwd(), "uploads", token);

  if (!fs.existsSync(userDir)) {
    return new Response(JSON.stringify({ files: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const fileNames = await fsp.readdir(userDir);
  const files = await Promise.all(
    fileNames.map(async (fileName) => {
      const filePath = path.join(userDir, fileName);
      const stat = await fsp.stat(filePath);
      const url = path.join(fileName);

      const underscoreIndex = fileName.indexOf("_");
      const originalName =
        underscoreIndex !== -1
          ? fileName.substring(underscoreIndex + 1)
          : fileName;
      const fileId = fileName.substring(0, underscoreIndex);
      const fileType = getMimeType(fileName);

      return {
        fileId,
        uniqueFileName: fileName,
        originalName,
        path: url,
        size: stat.size,
        modifiedTime: stat.mtime,
        type: fileType,
      } as LoaderFileData;
    })
  );

  return new Response(JSON.stringify({ files }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
