import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.jbogaty.magamoneymoves",
  appName: "MAGA Money Moves",
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
