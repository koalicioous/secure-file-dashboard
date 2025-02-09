import { getUserTokenFromCookie } from "~/lib/utils";
import type { Route } from "./+types/download-file";
import fs, { promises as fsp } from "fs";
import path from "path";

export async function loader({ request, params }: Route.LoaderArgs) {
  if (request.method === "GET") {
    const filePathParam = params.path;

    const tokenCookie = getUserTokenFromCookie(request);
    if (!tokenCookie) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (filePathParam.includes("..")) {
      return new Response("Invalid file path", { status: 400 });
    }

    const absoluteFilePath = path.join(
      process.cwd(),
      "uploads",
      tokenCookie,
      filePathParam
    );

    if (!fs.existsSync(absoluteFilePath)) {
      return new Response("File not found", { status: 404 });
    }

    const stat = await fsp.stat(absoluteFilePath);

    const ext = path.extname(absoluteFilePath).toLowerCase();
    let contentType = "application/octet-stream";
    if (ext === ".pdf") {
      contentType = "application/pdf";
    } else if (ext === ".png") {
      contentType = "image/png";
    }

    const fileBuffer = await fsp.readFile(absoluteFilePath);

    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Content-Length", stat.size.toString());
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set(
      "Content-Disposition",
      `attachment; filename="${path.basename(absoluteFilePath)}"`
    );

    return new Response(fileBuffer, {
      status: 200,
      headers,
    });
  }
  return new Response("Method Not Allowed", { status: 405 });
}
