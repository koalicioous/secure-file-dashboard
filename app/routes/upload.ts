import fs from "fs";
import { promises as fsp } from "fs";
import path from "path";
import type { Route } from "./+types/home";

export async function action({ request }: Route.ActionArgs) {
  try {
    const formData = await request.formData();

    const fileId = formData.get("fileId") as string;
    const chunkIndexStr = formData.get("chunkIndex") as string;
    const totalChunksStr = formData.get("totalChunks") as string;
    const fileName = formData.get("fileName") as string;
    const chunkFile = formData.get("chunk") as File | null;

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
    const tempDir = path.join(uploadDir, "tmp", fileId);

    if (!fs.existsSync(tempDir)) {
      await fsp.mkdir(tempDir, { recursive: true });
    }

    const chunkPath = path.join(tempDir, `chunk_${chunkIndex}`);
    const chunkBuffer = Buffer.from(await chunkFile.arrayBuffer());
    await fsp.writeFile(chunkPath, chunkBuffer);

    const uploadedChunks = await fsp.readdir(tempDir);
    if (uploadedChunks.length === totalChunks) {
      const finalFilePath = path.join(uploadDir, fileName);

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

      const relativePath = path.join("/uploads", fileName);
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
