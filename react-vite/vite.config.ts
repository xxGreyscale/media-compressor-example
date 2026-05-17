import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// `@yume-chan/libde265` is an emscripten-built WASM module whose CJS-style
// internals confuse Vite's dependency pre-bundler. Excluding it makes Vite
// serve the module as-is to the worker, which is what the library expects.
// Required even if you never trigger the HEVC path — Vite still scans imports.
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ["@yume-chan/libde265"],
  },
  build: {
    target: "es2022",
  },
});
