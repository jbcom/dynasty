/**
 * THE PRESET-PERSON LEAK FLOOR — the single source of truth for "no real person's name in generated
 * or authored copy". The dynasty line is COMPOSED from tropes (PLACE × CULTURE × ERA × ARCHETYPE);
 * it is never a literal historical person. Every content gate (the harness audit, the GenAI event +
 * scene validators, the QA passes) checks against THIS regex so they can never drift apart.
 *
 * CASE-SENSITIVE by design: it matches the capitalized PROPER NOUN only, so ordinary common-noun
 * homographs in sensory prose never false-positive — "the heavy musk of dray horses", "a trump card",
 * "a graham cracker", "fred the farrier" are all legitimate English and must pass. Real preset names
 * are always capitalized in prose, so case-sensitivity loses no protection.
 */

/**
 * The literal preset-person names that must never appear. Two deliberate exclusions, each because the
 * token is ALSO legitimate content:
 *   - Bare lowercase homographs (musk/trump/graham) are not matched (case-sensitivity, see above).
 *   - Bare given names a culture pool actually draws are NOT matched — "Friedrich"/"Frederick" is a
 *     real Bavarian given name (onomastics.json), so the {given_name} token can legitimately render
 *     it. The LEAK is the preset SURNAME / full identity ("Drumpf", "Walter Musk"), not the forename.
 * Compound names ("Joseph Kennedy") and initials (JFK/RFK) stay explicit.
 */
export const PRESET_LEAK =
  /\b(Donald|Trump|Drumpf|Elon|Musk|Kennedy|Errol|Walter Musk|Maye|Ivana|Mary Anne|Elizabeth Christ|JFK|RFK|Joseph Kennedy|Patrick Kennedy)\b/;

/** True if `text` contains any preset-person leak. Stringifies non-strings (e.g. a parsed JSON object). */
export function hasPresetLeak(text: unknown): boolean {
  return PRESET_LEAK.test(typeof text === "string" ? text : JSON.stringify(text));
}
