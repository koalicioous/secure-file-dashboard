import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/api/upload", "routes/upload.ts"),
] satisfies RouteConfig;
