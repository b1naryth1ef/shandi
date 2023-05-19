/* eslint-disable import/no-extraneous-dependencies */
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, normalizePath } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    viteStaticCopy({
      targets: [
        {
          src: normalizePath(path.resolve(__dirname, "../data/classes/**")),
          dest: "classes",
        },
        {
          src: normalizePath(
            path.resolve(__dirname, "../data/meter-data/images/**")
          ),
          dest: "images",
          rename: (
            fileName: string,
            fileExtension: string,
            fullPath: string
          ) => {
            return `${fileName.toLowerCase()}.${fileExtension}`;
          },
        },
      ],
      watch: {
        reloadPageOnChange: true,
      },
    }),
  ],
  server: {
    proxy: {
      "/api": "http://localhost:9282",
    },
  },
  json: {
    stringify: true,
  },
});
