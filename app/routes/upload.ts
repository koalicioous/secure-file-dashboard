import fs from "fs";
import { promises as fsp } from "fs";
import path from "path";
import type { Route } from "./+types/home";
import { getMimeType } from "~/lib/utils";
import type { LoaderFileData } from "~/types";
import NodeClam from "clamscan";

const clamScan = new NodeClam().init({
  clamdscan: {
    socket: false,
    host: process.env.CLAMD_HOST || "clamav",
    port: parseInt(process.env.CLAMD_PORT || "3310", 10),
    path: "/usr/bin/clamdscan",
    active: true,
  },
});

async function revalidateFileType(filePath: string): Promise<boolean> {
  const fileBuffer = await fsp.readFile(filePath);
  if (fileBuffer.slice(0, 4).toString() === "%PDF") {
    return true;
  }
  const pngSignature = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);
  if (fileBuffer.slice(0, 8).equals(pngSignature)) {
    return true;
  }
  return false;
}

export async function action({ request }: Route.ActionArgs) {
  if (request.method === "DELETE") {
    try {
      const formData = await request.formData();
      const fileId = formData.get("fileId") as string;
      const userToken = formData.get("userToken") as string;

      if (!fileId || !userToken) {
        return new Response("Missing required fields", { status: 400 });
      }

      const uploadDir = path.join(process.cwd(), "uploads");
      const tempDir = path.join(uploadDir, "tmp", userToken, fileId);
      if (fs.existsSync(tempDir)) {
        await fsp.rm(tempDir, { recursive: true, force: true });
      }

      const userDir = path.join(uploadDir, userToken);
      const filesInUserDir = await fsp.readdir(userDir);
      const uniqueFileName = filesInUserDir.find((f) =>
        f.startsWith(`${fileId}_`)
      );
      if (uniqueFileName) {
        const finalFilePath = path.join(userDir, uniqueFileName);
        await fsp.unlink(finalFilePath).catch(() => {});
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error removing file:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  } else if (request.method === "POST") {
    try {
      const formData = await request.formData();

      const fileId = formData.get("fileId") as string;
      const chunkIndexStr = formData.get("chunkIndex") as string;
      const totalChunksStr = formData.get("totalChunks") as string;
      const fileName = formData.get("fileName") as string;
      const chunkFile = formData.get("chunk") as File | null;
      const userToken = formData.get("userToken") as string;

      if (!userToken) {
        return new Response("Missing user token", { status: 400 });
      }

      if (
        !fileId ||
        !chunkIndexStr ||
        !totalChunksStr ||
        !fileName ||
        !chunkFile
      ) {
        return new Response("Missing required fields", { status: 400 });
      }

      const chunkIndex = parseInt(chunkIndexStr, 10);
      const totalChunks = parseInt(totalChunksStr, 10);
      if (isNaN(chunkIndex) || isNaN(totalChunks)) {
        return new Response("Invalid chunk index or totalChunks", {
          status: 400,
        });
      }

      const uploadDir = path.join(process.cwd(), "uploads");

      const userDir = path.join(uploadDir, userToken);
      if (!fs.existsSync(userDir)) {
        await fsp.mkdir(userDir, { recursive: true });
      }

      const tempDir = path.join(uploadDir, "tmp", userToken, fileId);
      if (!fs.existsSync(tempDir)) {
        await fsp.mkdir(tempDir, { recursive: true });
      }

      const chunkPath = path.join(tempDir, `chunk_${chunkIndex}`);
      const chunkBuffer = Buffer.from(await chunkFile.arrayBuffer());
      await fsp.writeFile(chunkPath, chunkBuffer);

      const uploadedChunks = await fsp.readdir(tempDir);
      if (uploadedChunks.length === totalChunks) {
        const uniqueFileName = `${fileId}_${fileName}`;
        const finalFilePath = path.join(userDir, uniqueFileName);

        const writeStream = fs.createWriteStream(finalFilePath);

        for (let i = 0; i < totalChunks; i++) {
          const chunkFilePath = path.join(tempDir, `chunk_${i}`);
          const data = await fsp.readFile(chunkFilePath);
          writeStream.write(data);
        }

        await new Promise<void>((resolve, reject) => {
          writeStream.end(() => resolve());
          writeStream.on("error", reject);
        });

        await fsp.rm(tempDir, { recursive: true, force: true });

        const isValidType = await revalidateFileType(finalFilePath);
        if (!isValidType) {
          await fsp.unlink(finalFilePath);
          return new Response("Invalid file type", { status: 400 });
        }

        // Check file virus using clamav
        const scanResult = await (await clamScan).scanFile(finalFilePath);
        if (scanResult.isInfected) {
          await fsp.unlink(finalFilePath);
          return new Response(
            JSON.stringify({
              message: "Virus detected in file",
              viruses: scanResult.viruses,
              error: "VIRUS_DETECTED",
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        const stat = await fsp.stat(finalFilePath);
        const url = uniqueFileName;

        const underscoreIndex = fileName.indexOf("_");
        const originalName =
          underscoreIndex !== -1
            ? fileName.substring(underscoreIndex + 1)
            : fileName;
        const fileType = getMimeType(fileName);
        const finalResponse: LoaderFileData = {
          fileId,
          uniqueFileName,
          originalName,
          path: url,
          size: stat.size,
          modifiedTime: stat.mtime.toString(),
          type: fileType,
        };
        return new Response(JSON.stringify(finalResponse), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response("Chunk uploaded", { status: 200 });
    } catch (error) {
      console.error("Error handling chunk upload:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  }
}

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const url = new URL(request.url);
    const fileId = url.searchParams.get("fileId");
    const userToken = url.searchParams.get("userToken");

    if (!fileId || !userToken) {
      return new Response("Missing required fields", { status: 400 });
    }

    const tempDir = path.join(
      process.cwd(),
      "uploads",
      "tmp",
      userToken,
      fileId
    );

    let uploadedChunks: number[] = [];
    if (fs.existsSync(tempDir)) {
      const files = await fsp.readdir(tempDir);
      uploadedChunks = files
        .map((f) => {
          const match = f.match(/chunk_(\d+)/);
          return match ? parseInt(match[1], 10) : null;
        })
        .filter((idx): idx is number => idx !== null);
    }
    return new Response(JSON.stringify({ uploadedChunks }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching uploaded chunks:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
