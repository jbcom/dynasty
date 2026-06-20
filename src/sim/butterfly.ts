import type { Content } from "./content";
import type { Rng } from "./rng";
import type { ButterflyRule, Choice, GameEvent, Ripple } from "./schema";
import type { LedgerEntry, RippleField } from "./state";

/**
 * The butterfly engine combines:
 *  (B) a VISIBLE ledger — named cause→effect chains the player can read; and
 *  (C) a CHAOS field — seeded weighted ripples that perturb future event
 *      weights so timelines diverge across playthroughs.
 */

/** Apply a choice's ripples into the ripple field, jittered by a seeded RNG. */
export function applyRipples(
  field: RippleField,
  ripples: readonly Ripple[],
  rng: Rng,
): RippleField {
  if (ripples.length === 0) return { ...field };
  const next: RippleField = { ...field };
  for (const r of ripples) {
    // Seeded jitter (0.5..1.0 of the nominal weight) so identical choices still
    // diverge across runs while staying fully reproducible per seed.
    const jitter = 0.5 + rng.next() * 0.5;
    const delta = r.weight * r.polarity * jitter;
    next[r.to] = (next[r.to] ?? 0) + delta;
  }
  return next;
}

/** Fill {cause}/{effect}-style placeholders in a chain template. */
export function renderChain(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? `{${key}}`);
}

/**
 * Cross-era butterfly rules whose cause just became active because this choice
 * set a flag or pushed a ripple channel positive. Each yields a ledger entry.
 */
export function firedRules(
  content: Content,
  choice: Choice,
  rippleField: RippleField,
): ButterflyRule[] {
  const newFlags = new Set(choice.setFlags);
  const positiveChannels = new Set(
    choice.ripples.filter((r) => r.polarity > 0).map((r) => r.to),
  );
  return content.butterflyRules.filter((rule) => {
    if (newFlags.has(rule.cause)) return true;
    // A ripple channel counts as "caused" when this choice pushed it positive.
    if (positiveChannels.has(rule.cause) && (rippleField[rule.cause] ?? 0) > 0) {
      return true;
    }
    return false;
  });
}

/** Build ledger entries for the chains a choice triggered. */
export function buildLedgerEntries(
  content: Content,
  event: GameEvent,
  choice: Choice,
  rippleField: RippleField,
  startSeq: number,
): LedgerEntry[] {
  const entries: LedgerEntry[] = [];
  let seq = startSeq;

  for (const rule of firedRules(content, choice, rippleField)) {
    entries.push({
      seq: seq++,
      sourceChoice: choice.id,
      sourceEvent: event.id,
      year: event.year,
      ruleId: rule.id,
      text: renderChain(rule.chainTemplate, {
        cause: choice.text,
        effect: rule.affects,
        event: event.title,
      }),
    });
  }

  return entries;
}
