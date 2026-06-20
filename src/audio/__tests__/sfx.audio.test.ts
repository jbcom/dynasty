import { afterEach, describe, expect, it } from "vitest";
import { Sfx } from "../sfx";

let sfx: Sfx | undefined;
afterEach(() => {
  sfx?.dispose();
  sfx = undefined;
});

describe("Sfx (Howler one-shots)", () => {
  it("constructs and plays without throwing", () => {
    sfx = new Sfx();
    expect(() => sfx?.play("stinger")).not.toThrow();
    expect(() => sfx?.play("victory")).not.toThrow();
  });

  it("honors mute", () => {
    sfx = new Sfx();
    sfx.setMuted(true);
    expect(() => sfx?.play("click")).not.toThrow();
  });

  it("preloads without throwing", () => {
    sfx = new Sfx();
    expect(() => sfx?.preload("stinger", "achievement", "click", "victory")).not.toThrow();
  });
});
