import fs from "fs";
import { promises as fsp } from "fs";
import path from "path";
import type { Route } from "./+types/home";

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

        const relativePath = path.join("/uploads", userToken, uniqueFileName);
        return new Response(JSON.stringify({ filePath: relativePath }), {
          status: 200,
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
