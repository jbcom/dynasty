import { svelte } from "@sveltejs/vite-plugin-svelte";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const browserSuffixes = ["browser", "visual", "audio"];
const browserGlobs = browserSuffixes.map((s) => `src/**/*.${s}.test.ts`);

export default defineConfig({
  plugins: [svelte()],
  // Tests are a one-shot run — disable Vite's file watcher so it can't reload a test mid-run.
  server: { watch: null },
  // CI-only flake "Vite unexpectedly reloaded a test" → "failed to find the runner": Vite's dep
  // optimizer runs ONE scan at server start, but it cannot follow runtime-only deps — the lazy
  // `await import("@capacitor/*")` in engine/storage.ts, engine/haptics.ts, engine/formFactor.ts,
  // src/main.ts, plus koota/yuka reached only through runtime sim paths. When a test EXECUTES one of
  // those branches, Vite discovers the new dep, re-optimizes, and issues a FULL PAGE RELOAD; whatever
  // test holds the browser tab at that instant loses its runner and fails. It manifests CI-only because
  // CI has a COLD .vite cache (local runs reuse a warm cache where these were optimized on a prior run)
  // and a slower box, so the async re-optimize lands MID-RUN instead of between files.
  //
  // `entries` (scan root) can't fix it — the offenders are behind dynamic import()/runtime branches the
  // scanner won't follow. `include` force-prebundles them BEFORE the run starts, so the cold-cache
  // optimize is complete up front: no mid-run discovery, no reload. Keep this in sync with every bare
  // dep reached via `await import(...)` or runtime-only sim paths (grep `import("` + sim/world,goap).
  optimizeDeps: {
    entries: ["src/**/*.browser.test.ts", "src/**/*.visual.test.ts", "src/**/*.audio.test.ts"],
    include: [
      "@capacitor/core",
      "@capacitor/status-bar",
      "@capacitor/device",
      "@capacitor/haptics",
      "@capacitor/preferences",
      "koota",
      "yuka",
    ],
  },
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
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.unit.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "browser",
          include: browserGlobs,
          // Run browser test FILES serially. Concurrent files racing on Vite's shared dep-optimizer is
          // what triggers the "Vite unexpectedly reloaded a test" → "failed to find the runner" flake
          // (a re-optimization reloads the page mid-run). One file at a time = no race, no reload.
          fileParallelism: false,
          browser: {
            enabled: true,
            headless: true,
            // Unlock the AudioContext without a user gesture so Tone.js audio
            // tests can start the graph in headless Chromium.
            provider: playwright({
              launchOptions: {
                args: [
                  "--autoplay-policy=no-user-gesture-required",
                  "--use-fake-ui-for-media-stream",
                ],
              },
            }),
            instances: [
              {
                browser: "chromium",
                viewport: { width: 412, height: 915 },
              },
            ],
          },
        },
      },
    ],
  },
});
