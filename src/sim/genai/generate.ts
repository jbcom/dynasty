import type { Content } from "../content";
import type { GameEvent } from "../schema";
import type { GenerateFn } from "./client";
import { parseGenerated } from "./client";
import { buildPrompt, type GenTarget, systemInstruction } from "./prompt";
import { type GenContext, validateBatch } from "./validate";

/**
 * GENAI BREADTH ORCHESTRATOR (EX-4). For a breadth target, build the prompt, call the
 * (injected) generator, parse + VALIDATE the result through the gate, and return only
 * the accepted events — with the rejected ones (and why) surfaced for a re-prompt. The
 * generator is pluggable so the whole pipeline is unit-tested with a stub; the live
 * run wires geminiGenerate(key). NOTHING lands that the gate rejects.
 */

export interface GenResult {
  accepted: GameEvent[];
  rejected: Array<{ raw: unknown; reasons: string[] }>;
}

/** Build the validation context for a target from the loaded content. */
export function genContextFor(content: Content, era: string): GenContext {
  return {
    era,
    eraIds: new Set(content.eras.map((e) => e.id)),
    tropes: content.tropes,
    places: content.places,
    existingIds: new Set(content.allEvents.map((e) => e.id)),
  };
}

/** Generate + validate a batch of events for one target. Pure given the GenerateFn. */
export async function generateForTarget(
  content: Content,
  target: GenTarget,
  generate: GenerateFn,
): Promise<GenResult> {
  const prompt = buildPrompt(target, content.tropes, content.places);
  const text = await generate(systemInstruction(), prompt);
  const raws = parseGenerated(text);
  const { accepted, rejected } = validateBatch(raws, genContextFor(content, target.era));
  return { accepted, rejected };
}

/**
 * Run a list of targets sequentially (so generated ids accumulate and can't collide
 * across targets), returning all accepted events + all rejections. The dev-bulk script
 * writes the accepted events into the matching eras/<place>/<period>/ files and
 * re-runs the harness audit before anything is committed.
 */
export async function generateBreadth(
  content: Content,
  targets: readonly GenTarget[],
  generate: GenerateFn,
): Promise<GenResult> {
  const accepted: GameEvent[] = [];
  const rejected: Array<{ raw: unknown; reasons: string[] }> = [];
  const seen = new Set(content.allEvents.map((e) => e.id));
  for (const target of targets) {
    const prompt = buildPrompt(target, content.tropes, content.places);
    const text = await generate(systemInstruction(), prompt);
    const raws = parseGenerated(text);
    const ctx: GenContext = {
      era: target.era,
      eraIds: new Set(content.eras.map((e) => e.id)),
      tropes: content.tropes,
      places: content.places,
      existingIds: seen,
    };
    const res = validateBatch(raws, ctx);
    for (const ev of res.accepted) {
      accepted.push(ev);
      seen.add(ev.id);
    }
    rejected.push(...res.rejected);
  }
  return { accepted, rejected };
}
