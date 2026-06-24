import { describe, expect, it } from "vitest";
import {
  buildNewsDispatchPrompt,
  moodForTrend,
  newsDispatchKey,
  newsDispatchSystem,
} from "../genaiNews";

/**
 * GA-NEWS GN-1 — the pure dispatch prompt builder + key. Period-voiced, leak-safe, deterministic
 * (era × mood). Offline-generated + cached like the dossier briefs.
 */

describe("GA-NEWS dispatch key + mood", () => {
  it("keys era × mood (run-independent, offline-cached)", () => {
    expect(newsDispatchKey("industrial_late1800s", "rising")).toBe(
      "news:industrial_late1800s:rising",
    );
    expect(newsDispatchKey("stellar", "falling")).toBe("news:stellar:falling");
  });

  it("maps a rung trend to a dispatch mood", () => {
    expect(moodForTrend("rising")).toBe("rising");
    expect(moodForTrend("steady")).toBe("steady");
    expect(moodForTrend("falling")).toBe("falling");
  });
});

describe("GA-NEWS dispatch prompt", () => {
  it("writes in the era's press register + the mood lens, leak-safe", () => {
    const p = buildNewsDispatchPrompt("industrial_late1800s", "rising");
    expect(p).toMatch(/Gilded Age/);
    expect(p).toMatch(/on the way up|notice|envy/i);
    expect(p).toMatch(/\{family_name\}/);
    expect(p).toMatch(/Headlines only/i);
  });

  it("the era register tracks the band (founding broadsheets vs stellar relays)", () => {
    expect(buildNewsDispatchPrompt("founding_1700s", "steady")).toMatch(/broadsheets|pamphlets/i);
    expect(buildNewsDispatchPrompt("stellar", "steady")).toMatch(/star age|relays/i);
  });

  it("the system instruction demands headlines-only, no real names, no JSON", () => {
    const s = newsDispatchSystem();
    expect(s).toMatch(/3 headlines/);
    expect(s).toMatch(/never a real person's name/i);
    expect(s).toMatch(/no JSON/i);
    expect(s).toMatch(/\{family_name\}/);
  });
});
