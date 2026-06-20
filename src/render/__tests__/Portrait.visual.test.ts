import { page } from "vitest/browser";
import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Portrait from "../Portrait.svelte";

let host: HTMLElement;
// biome-ignore lint/suspicious/noExplicitAny: opaque Svelte component instance
let component: any;

beforeEach(() => {
  const r = document.documentElement.style;
  r.setProperty("--mmm-gold", "#d4af37");
  r.setProperty("--mmm-navy-deep", "#050b1c");
  r.setProperty("--mmm-radius", "8px");
  document.body.style.background = "#0a1633";
  host = document.createElement("div");
  document.body.appendChild(host);
});
afterEach(() => {
  if (component) unmount(component);
  host.remove();
});

describe("Portrait", () => {
  it("renders authored caricature art for an svg portrait", async () => {
    component = mount(Portrait, { target: host, props: { portraitId: "mogul", size: 140 } });
    const el = host.querySelector('[data-portrait="mogul"]');
    expect(el).not.toBeNull();
    // mogul uses an authored SVG caricature (an <img> layer).
    const img = el?.querySelector("img.layer") as HTMLImageElement | null;
    expect(img?.getAttribute("src")).toContain("portraits/mogul.svg");
    await page.screenshot({ element: el as Element });
  });

  it("renders a cartoonified photo layer for a photo-backed portrait", () => {
    component = mount(Portrait, { target: host, props: { portraitId: "president", size: 140 } });
    const img = host.querySelector('[data-portrait="president"] img.layer') as HTMLImageElement | null;
    expect(img?.getAttribute("src")).toContain("portraits/president_2025.cartoon.png");
  });

  it("renders the fallback for an unknown portrait without throwing", () => {
    component = mount(Portrait, { target: host, props: { portraitId: "ghost" } });
    expect(host.querySelector('[data-portrait="unknown"]')).not.toBeNull();
  });
});
