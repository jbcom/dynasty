import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  // appId is the stable Android application identifier — kept as-is so installed
  // builds / store listing continuity is not broken by the Dynasty rebrand. Only
  // the user-facing appName changes.
  appId: "com.jbogaty.magamoneymoves",
  appName: "Dynasty",
  webDir: "dist",
  backgroundColor: "#0a1633",
  loggingBehavior: process.env.NODE_ENV === "production" ? "none" : "debug",
  android: {
    path: "android",
    backgroundColor: "#0a1633",
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
