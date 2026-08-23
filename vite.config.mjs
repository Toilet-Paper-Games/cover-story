import { resolve } from "node:path";
import { tpgWorkbench } from "@tpgames/sdk-dev-kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    tpgWorkbench({
      title: "Cover Story",
      surfaces: {
        host: "/surfaces/host.html",
        controller: "/surfaces/controller.html",
        spectator: "/surfaces/spectator.html"
      },
      controllers: 4,
      spectator: true
    })
  ],
  build: {
    emptyOutDir: true,
    outDir: "build/surfaces",
    target: "es2022",
    lib: {
      entry: {
        controller: resolve(import.meta.dirname, "src/controller.ts"),
        host: resolve(import.meta.dirname, "src/host.ts"),
        spectator: resolve(import.meta.dirname, "src/spectator.ts")
      },
      formats: ["es"]
    },
    rollupOptions: {
      output: {
        assetFileNames: "assets/[name][extname]",
        chunkFileNames: "chunks/[name]-[hash].js",
        entryFileNames: "[name].js"
      }
    }
  }
});
