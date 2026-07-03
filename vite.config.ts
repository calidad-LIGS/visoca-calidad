import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";

export default defineConfig({
  css: {
    transformer: "lightningcss",
  },
  resolve: {
    alias: {
      "@": `${process.cwd()}/src`,
    },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  plugins: [
    tanstackStart({
      server: { entry: "src/server.ts" },
    }),
    nitro({
      preset: "cloudflare-pages",
      cloudflare: {
        nodeCompat: true,
      },
    }),
    tailwindcss(),
    react(),
    tsconfigPaths(),
  ],
  server: {
    host: "::",
    port: 3000,
  },
});