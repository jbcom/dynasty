import { svelte } from "@sveltejs/vite-plugin-svelte";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const browserSuffixes = ["browser", "visual", "audio"];
const browserGlobs = browserSuffixes.map((s) => `src/**/*.${s}.test.ts`);

export default defineConfig({
  plugins: [svelte()],
  // Tests are a one-shot run — disable Vite's file watcher so it can't reload a test mid-run.
  server: { watch: null },
  // The browser-mode CI flake "Vite unexpectedly reloaded a test" → "failed to find the runner" is a
  // dep-OPTIMIZATION reload: when a test (e.g. screens.browser.test.ts → LegacyReport → SceneStage →
  // composeScene) pulls a dep Vite hadn't pre-bundled, Vite re-optimizes and reloads the page mid-run,
  // killing the test runner. Point Vite's dep SCAN at the browser-test entry surface so everything is
  // pre-bundled before the run starts — no mid-run discovery, no reload (discovery stays ON so deps not
  // listed here are still found at scan time).
  optimizeDeps: {
    entries: ["src/**/*.browser.test.ts", "src/**/*.visual.test.ts", "src/**/*.audio.test.ts"],
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
