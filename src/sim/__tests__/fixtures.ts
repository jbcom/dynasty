import type { RawContent } from "../content";

/** Minimal valid content bundle used across sim unit tests. */
export function validRaw(): RawContent {
  return {
    meters: {
      meters: [
        { id: "money", label: "Money", icon: "💰", scale: "log", min: 0, max: 1e12, start: 1000, color: "#d4af37", signed: false },
        { id: "power", label: "Power", icon: "🏛️", scale: "linear", min: 0, max: 100, start: 5, color: "#7a1f2b" },
        { id: "reputation", label: "Reputation", icon: "📣", scale: "linear", min: -100, max: 100, start: 0, color: "#c08a2e", signed: true },
        { id: "loyalty", label: "Loyalty", icon: "🤝", scale: "linear", min: 0, max: 100, start: 30, color: "#274690" },
        { id: "health", label: "Health", icon: "❤️", scale: "linear", min: 0, max: 100, start: 100, critLow: 15, color: "#b03030" },
        { id: "heat", label: "Heat", icon: "🔥", scale: "linear", min: 0, max: 100, start: 0, critHigh: 80, color: "#e2562a" },
      ],
    },
    eraIndex: {
      eras: [
        { id: "boyhood", order: 0, title: "Birth & Boyhood", yearStart: 1946, yearEnd: 1964, ambientTrack: "boyhood.ogg", paletteAccent: "#274690", eventBudget: 2 },
        { id: "mogul", order: 1, title: "Apprentice Mogul", yearStart: 1964, yearEnd: 1987, ambientTrack: "mogul.ogg", paletteAccent: "#d4af37", eventBudget: 2 },
      ],
    },
    eraEvents: [
      {
        era: "boyhood",
        data: {
          era: "boyhood",
          events: [
            {
              id: "ev_born",
              era: "boyhood",
              year: 1946,
              title: "Born in Queens",
              scene: "Jamaica Estates. A doctor's son enters the world.",
              researchNote: "Donald J. Trump born June 14, 1946 in Queens, NYC.",
              portrait: "infant",
              requires: { flags: [], notFlags: [], meters: {} },
              weight: 10,
              choices: [
                {
                  id: "cry_loud",
                  text: "Announce yourself to the world — loudly.",
                  effects: { reputation: 2 },
                  setFlags: ["loud_baby"],
                  outcome: "The nurses will remember this one.",
                },
              ],
            },
            {
              id: "ev_military_school",
              era: "boyhood",
              year: 1959,
              title: "New York Military Academy",
              scene: "Your father has had enough of your antics.",
              researchNote: "Trump attended NYMA from 1959 after a rebellious boyhood.",
              portrait: "cadet",
              requires: { flags: ["loud_baby"], notFlags: [], meters: {} },
              weight: 8,
              choices: [
                {
                  id: "excel",
                  text: "Win every drill. Make captain.",
                  effects: { power: 5, loyalty: 3 },
                  setFlags: ["disciplined"],
                  ripples: [{ to: "leadership_reputation", weight: 0.6, polarity: 1 }],
                  outcome: "You learn that command feels good.",
                },
              ],
            },
          ],
        },
      },
      {
        era: "mogul",
        data: {
          era: "mogul",
          events: [
            {
              id: "ev_first_deal",
              era: "mogul",
              year: 1974,
              title: "The Commodore Hotel",
              scene: "A derelict hotel by Grand Central. A tax abatement is the key.",
              researchNote: "Trump's 1976 Commodore/Grand Hyatt deal launched his Manhattan career.",
              portrait: "young_mogul",
              requires: { flags: [], notFlags: [], meters: { money: ">=500" } },
              weight: 10,
              choices: [
                {
                  id: "go_big",
                  text: "Bet everything on the abatement.",
                  effects: { money: 200, power: 8, heat: 4 },
                  setFlags: ["first_tower"],
                  ripples: [{ to: "media_relationship", weight: 0.7, polarity: 1 }],
                  outcome: "The gamble pays. The name goes up in gold.",
                },
              ],
            },
          ],
        },
      },
    ],
    butterflyRules: {
      rules: [
        {
          id: "br_discipline",
          cause: "disciplined",
          affects: "ev_first_deal",
          affectsKind: "event",
          weightMultiplier: 1.5,
          chainTemplate: "Because you mastered the academy, the Commodore deal came easier.",
        },
      ],
    },
    assets: {
      assets: [
        { id: "icon_money", path: "assets/icons/money.svg", kind: "icon", source: "https://openmoji.org", license: "CC-BY", attribution: "OpenMoji" },
      ],
    },
  };
}
