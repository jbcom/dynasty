import type { Content } from "../content";
import type { ButterflyRule, Choice, GameEvent } from "../schema";
import type { LedgerEntry, RippleField } from "../state";

/**
 * The VISIBLE ledger (butterfly engine, part B): named cause→effect chains the
 * player can read. Robust + deduplicated — a given butterfly rule contributes at
 * most ONE entry per run, so the log never fills with the same chain repeated
 * under different dates (the previous duplication bug).
 */

/** Fill {cause}/{effect}-style placeholders in a chain template. */
export function renderChain(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? `{${key}}`);
}

/**
 * Butterfly rules whose cause just became active because this choice set a flag
 * or pushed a ripple channel positive.
 */
export function firedRules(
  content: Content,
  choice: Choice,
  rippleField: RippleField,
): ButterflyRule[] {
  const newFlags = new Set(choice.setFlags);
  const positiveChannels = new Set(choice.ripples.filter((r) => r.polarity > 0).map((r) => r.to));
  return content.butterflyRules.filter((rule) => {
    if (newFlags.has(rule.cause)) return true;
    if (positiveChannels.has(rule.cause) && (rippleField[rule.cause] ?? 0) > 0) return true;
    return false;
  });
}

/**
 * Build NEW ledger entries for the chains a choice triggered, skipping any rule
 * already represented in `existing` (dedup by ruleId). Returns only the entries
 * to append, with sequence numbers continuing from the current ledger length.
 */
export function buildLedgerEntries(
  content: Content,
  event: GameEvent,
  choice: Choice,
  rippleField: RippleField,
  existing: readonly LedgerEntry[],
): LedgerEntry[] {
  const seenRuleIds = new Set(existing.map((e) => e.ruleId).filter(Boolean));
  const entries: LedgerEntry[] = [];
  let seq = existing.length;

  for (const rule of firedRules(content, choice, rippleField)) {
    if (seenRuleIds.has(rule.id)) continue; // already logged this chain — no duplicate
    seenRuleIds.add(rule.id);
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
