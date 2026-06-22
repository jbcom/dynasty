import { flushSync, mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { CodexEntry } from "../../../sim/saga/schema";
import CodexView from "../CodexView.svelte";

/** The Codex view (PF-11): lore briefs collapsed by default; tap a title to expand its body. */

const entries: CodexEntry[] = [
  {
    id: "wave:ireland",
    title: "The Irish Wave",
    body: "Driven out by a hunger that emptied parishes.",
  },
  {
    id: "macro:convergence",
    title: "The Convergence",
    body: "A hundred waves pour into one young country.",
  },
];

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

describe("CodexView", () => {
  it("lists titles collapsed; the body shows only when a title is tapped", () => {
    component = mount(CodexView, { target: host, props: { entries } });
    expect(host.querySelectorAll(".entry-head").length).toBe(2);
    // Bodies hidden until expanded.
    expect(host.textContent).not.toContain("Driven out by a hunger");
    const head = host.querySelectorAll(".entry-head")[0] as HTMLButtonElement;
    head.click();
    flushSync();
    expect(host.textContent).toContain("Driven out by a hunger");
  });

  it("resolves identity tokens through the term fn", () => {
    const tokened: CodexEntry[] = [{ id: "x", title: "The {family_name} Brief", body: "Body." }];
    component = mount(CodexView, {
      target: host,
      props: { entries: tokened, term: (t: string) => t.replaceAll("{family_name}", "Bauer") },
    });
    expect(host.textContent).toContain("The Bauer Brief");
  });

  it("shows an empty note when there are no entries", () => {
    component = mount(CodexView, { target: host, props: { entries: [] } });
    expect(host.querySelector(".empty")).not.toBeNull();
  });
});
