import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cinematicKey } from "../../../sim/cinematic/genaiCinematic";
import { applyBrandTokens, makeHost } from "../../__tests__/visualHarness";
import CinematicView from "../CinematicView.svelte";

let host: HTMLElement;
// biome-ignore lint/suspicious/noExplicitAny: Svelte mount returns an opaque component instance
let component: any;

beforeEach(() => {
  applyBrandTokens();
  host = makeHost();
});

afterEach(() => {
  if (component) unmount(component);
  host.remove();
});

describe("CinematicView", () => {
  it("GA-VIDEO: renders a <video> whose src maps the cinematic key (`:` → `_`) to the asset path", () => {
    component = mount(CinematicView, {
      target: host,
      props: { cinematicKey: cinematicKey("finale", "stars") },
    });
    const video = host.querySelector<HTMLVideoElement>("[data-testid='cinematic']");
    expect(video, "the video surface renders").not.toBeNull();
    // The composite key cinematic:finale:stars → /assets/generated/cinematics/cinematic_finale_stars.mp4
    expect(video?.getAttribute("src")).toBe(
      "/assets/generated/cinematics/cinematic_finale_stars.mp4",
    );
    // Decorative: muted + looped + aria-hidden so it never blocks the flow or the a11y tree.
    expect(video?.muted).toBe(true);
    expect(video?.loop).toBe(true);
    expect(video?.getAttribute("aria-hidden")).toBe("true");
  });

  it("GA-VIDEO: hides on error when the clip isn't generated yet (graceful degradation)", async () => {
    component = mount(CinematicView, {
      target: host,
      // A key with no cached mp4 — the <video> 404s and must hide so the surface beneath shows through.
      props: { cinematicKey: cinematicKey("handoff", "stellar") },
    });
    const video = host.querySelector<HTMLVideoElement>("[data-testid='cinematic']");
    expect(video).not.toBeNull();
    // Fire the same error path the missing asset would trigger (jsdom/browser won't reliably 404 a fake path).
    video?.dispatchEvent(new Event("error"));
    await Promise.resolve();
    expect((video as HTMLVideoElement).style.display).toBe("none");
  });
});
