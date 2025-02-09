import fs from "fs";
import { promises as fsp } from "fs";
import path from "path";
import type { Route } from "./+types/user-files";
import type { LoaderFileData } from "~/types";

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
      const url = path.join("/uploads", token, fileName).replace(/\\/g, "/");

      const underscoreIndex = fileName.indexOf("_");
      const originalName =
        underscoreIndex !== -1
          ? fileName.substring(underscoreIndex + 1)
          : fileName;
      const fileId = fileName.substring(0, underscoreIndex);

      return {
        fileId,
        uniqueFileName: fileName,
        originalName,
        url,
        size: stat.size,
        modifiedTime: stat.mtime,
      } as LoaderFileData;
    })
  );

  return new Response(JSON.stringify({ files }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
