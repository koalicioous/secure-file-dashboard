import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/api/upload", "routes/upload.ts"),
  route("/api/user/:token/files", "routes/user-files.ts"),
] satisfies RouteConfig;
