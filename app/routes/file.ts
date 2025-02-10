import fs from "fs";
import { promises as fsp } from "fs";
import path from "path";
import type { Route } from "./+types/file";
import { getUserTokenFromCookie } from "~/lib/utils";
import crypto from "crypto";

async function computeChecksum(filePath: string): Promise<string> {
  const fileBuffer = await fsp.readFile(filePath);
  return crypto.createHash("sha256").update(fileBuffer).digest("hex");
}

async function findUserFile(
  userDir: string,
  fileId: string
): Promise<string | null> {
  const files = await fsp.readdir(userDir);
  const matchingFile = files.find((f) => f.startsWith(`${fileId}_`));
  return matchingFile || null;
}

/**
 * GET /api/file/:id
 *
 * Returns metadata about the file.
 */
export async function loader({ request, params }: Route.LoaderArgs) {
  const token = getUserTokenFromCookie(request);
  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userDir = path.join(process.cwd(), "uploads", token);
  if (!fs.existsSync(userDir)) {
    return new Response("Unauthorized", { status: 401 });
  }
  const fileId = params.id;
  if (!fileId) {
    return new Response("Missing file id", { status: 400 });
  }
  const uniqueFileName = await findUserFile(userDir, fileId);
  if (!uniqueFileName) {
    return new Response("File not found", { status: 404 });
  }
  const filePath = path.join(userDir, uniqueFileName);
  const stat = await fsp.stat(filePath);
  const underscoreIndex = uniqueFileName.indexOf("_");
  const originalName =
    underscoreIndex !== -1
      ? uniqueFileName.slice(underscoreIndex + 1)
      : uniqueFileName;
  const checksum = await computeChecksum(filePath);

  const metadata = {
    fileId,
    uniqueFileName,
    originalName,
    url: path.join("/uploads", token, uniqueFileName).replace(/\\/g, "/"),
    size: stat.size,
    createdTime: stat.birthtime,
    modifiedTime: stat.mtime,
    checksum,
  };
  return new Response(JSON.stringify(metadata), {
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * DELETE and POST on /api/file/:id
 *
 * - DELETE: Removes the file.
 * - POST: Returns the download URL for the file.
 */
export async function action({ request, params }: Route.ActionArgs) {
  const token = getUserTokenFromCookie(request);
  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userDir = path.join(process.cwd(), "uploads", token);
  if (!fs.existsSync(userDir)) {
    return new Response("Unauthorized", { status: 401 });
  }
  const fileId = params.id;
  if (!fileId) {
    return new Response("Missing file id", { status: 400 });
  }
  const uniqueFileName = await findUserFile(userDir, fileId);
  if (!uniqueFileName) {
    return new Response("File not found", { status: 404 });
  }
  const filePath = path.join(userDir, uniqueFileName);

  if (request.method === "DELETE") {
    try {
      await fsp.unlink(filePath);
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response("Error deleting file", { status: 500 });
    }
  }

  return new Response("Method Not Allowed", { status: 405 });
}
