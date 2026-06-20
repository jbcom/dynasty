import { svelte } from "@sveltejs/vite-plugin-svelte";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const browserSuffixes = ["browser", "visual", "audio"];
const browserGlobs = browserSuffixes.map((s) => `src/**/*.${s}.test.ts`);

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
