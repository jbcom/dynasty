/**
 * FD-4 — the procedural event-pool package (design spec §1d / §1d.1). A pure,
 * seeded, combinatorial generator that materializes a vast deterministic event
 * pool from a small authored base of EventTemplates. Barrel re-exports the public
 * surface; internals stay file-scoped.
 */
export { type ExpandContext, expandTemplate } from "./expand";
