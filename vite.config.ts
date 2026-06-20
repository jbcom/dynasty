import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      $sim: "/src/sim",
      $engine: "/src/engine",
      $audio: "/src/audio",
      $render: "/src/render",
      $ui: "/src/ui",
      $data: "/src/data",
    },
  },
  build: {
    target: "es2022",
    sourcemap: true,
  },
  server: {
    port: 5173,
  },
});
