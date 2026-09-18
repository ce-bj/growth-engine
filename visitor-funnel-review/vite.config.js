import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const here = path.dirname(fileURLToPath(import.meta.url));
const demoNm = path.resolve(here, "../demo-project/node_modules");

export default defineConfig({
  plugins: [react({ fastRefresh: false })],
  resolve: {
    alias: {
      react: path.join(demoNm, "react"),
      "react-dom": path.join(demoNm, "react-dom"),
    },
  },
  server: {
    host: true,
    port: 5176,
    fs: { allow: [here, path.resolve(here, "../demo-project")] },
  },
});
