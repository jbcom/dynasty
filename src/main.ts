import { mount } from "svelte";
import App from "./App.svelte";
import "./app.css";

/**
 * Native shell setup (Android via Capacitor). Lazily imported and guarded so the
 * web build never fails when the plugin/native bridge is absent.
 */
async function initNativeShell(): Promise<void> {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return;
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setOverlaysWebView({ overlay: true }); // edge-to-edge
  } catch {
    // Not on a native platform / plugin unavailable — web build, ignore.
  }
}

const target = document.getElementById("app");
if (!target) {
  throw new Error("Mount target #app not found");
}

const app = mount(App, { target });
void initNativeShell();

export default app;
