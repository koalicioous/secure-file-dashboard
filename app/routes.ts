import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/api/upload", "routes/upload.ts"),
  route("/api/user/:token/files", "routes/user-files.ts"),
  route("/api/file/:id", "routes/file.ts"),
  route("/file/:token/:path", "routes/serve-file.ts"),
  route("/download/:path", "routes/download-file.ts"),
] satisfies RouteConfig;
