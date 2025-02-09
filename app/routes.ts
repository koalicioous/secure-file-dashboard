import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/api/upload-chunk", "routes/upload.ts"),
  route("/api/user/:token/files", "routes/user-files.ts"),
  route("/api/file/:id", "routes/file.ts"),
  // File Serving url
  route("/file/:token/:path", "routes/serve-file.ts"),
  // Download Path
  route("/download/:path", "routes/download-file.ts"),
] satisfies RouteConfig;
