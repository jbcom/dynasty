import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import RivalField from "../RivalField.svelte";

/**
 * RivalField (RB-5) renders the whole convergence race — every rival line's rung sorted high→low, plus
 * the player's own line marked — so the player sees where the dynasty sits beyond near-vantage glimpses.
 */

let host: HTMLElement;
// biome-ignore lint/suspicious/noExplicitAny: opaque Svelte component instance
let component: any;

beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
});
afterEach(() => {
  if (component) unmount(component);
  host.remove();
});

describe("RivalField (RB-5)", () => {
  it("shows the player's line + each rival with a rung indicator", () => {
    const standings = [
      { id: "rival:bavaria", label: "bavaria", rung: 4 },
      { id: "rival:italian", label: "italian", rung: 1 },
    ];
    component = mount(RivalField, { target: host, props: { standings, playerRung: 2 } });
    const field = host.querySelector('[data-testid="rival-field"]');
    expect(field).toBeTruthy();
    // The player's own line is marked + shows rung+1 stars.
    const you = host.querySelector('[data-testid="field-you"]');
    expect(you?.textContent).toContain("Your line");
    expect(you?.querySelector(".rungs")?.textContent).toBe("★★★"); // rung 2 → 3 stars
    // Both rivals render, and the player is ranked INLINE by rung — not pinned to the top.
    expect(field?.textContent).toContain("bavaria");
    expect(field?.textContent).toContain("italian");
    const labels = [...host.querySelectorAll(".row .who")].map((n) => n.textContent);
    expect(labels).toEqual(["bavaria", "Your line", "italian"]); // rung 4 > player 2 > italian 1
  });

  it("renders nothing when there are no rivals (unfounded / no world)", () => {
    component = mount(RivalField, { target: host, props: { standings: [], playerRung: 0 } });
    expect(host.querySelector('[data-testid="rival-field"]')).toBeNull();
  });
});
