# Key Pillars

Status: active, 2026-06-24.

This file holds product-direction pillars that are broader than one script or one spec.
Keep `AGENTS.md` operational; put long-running design priorities here.

## Story Model

The played game is one dynasty story founded with America and carried to the stars.
Legacy class/culture/rung JSON is source material: mine the best moments into encounters,
branch fabric, rivals, dossiers, and other non-first-person text. Do not revive the old
class lattice as the protagonist model.

## Player Experience

- Identity should emerge diegetically through the birth/infancy/adolescence flow.
- Choices should be part of the prose: larger, glowing, and selectable, but physically
  within the paragraph flow rather than detached below it.
- Text-heavy reading needs visual relief: portraits, dossiers, maps, charts, diagrams,
  music, narration, and scene-transition pieces should break fatigue without turning the
  game into a menu.
- Reader surfaces should use non-text visual rhythm where it helps: page progress,
  woven-thread marks, portraits, sense tint, and transitions should orient the player
  without adding explanatory UI copy.

## Portrait And Gender Pillars

- Portrait prompts, keys, and UI placement must align with life stage, era, archetype,
  standing/rung, and scene context.
- Gender availability must be explicit across naming, portrait demand, encounter roles,
  and generated/cached asset surfaces.
- Missing art must degrade to prose-only without broken assets, but the target experience
  is visual enough that the story does not become a wall of text.

## Prose Gates

Use library-backed metrics to quantify scannability, clarity, consistency, and similarity.
`pnpm prose:audit` is the current audit surface. Treat failures as editorial triage: remove,
rewrite, or split the worst passages incrementally instead of trying to certify the whole
legacy corpus in one pass.

`pnpm prose:ratchet` compares the current audit against
`src/data/saga/prose-quality-baseline.json`. It is allowed to pass while legacy failures
remain, but it must fail if the corpus regresses on failed count, pass rate, score floors,
or sentence-load ceilings. When an intentional prune/rewrite improves the corpus, update
the baseline in the same PR as the content change.

## Legacy Fabric Triage

Similarity mining should find the wheat from the chaff in legacy class JSON. The preferred
workflow has two sides: keeper reports for the best rewrite sources, and reductive pruning
for the worst played fabric.

Use `pnpm fabric:keepers` to regenerate `src/data/saga/fabric/keepers.json`. This report is
read-only: it ranks retained fabric by source score, prose scan/clarity/consistency,
low similarity, duplicate-opening risk, and weave readiness. Treat the top entries as
positive rewrite candidates for non-first-person encounters or branch beats in the
one-dynasty spine. Runtime crossing selection should prefer keeper-ranked entries when
they match the same family wave and tier, then fall back to the older source score.
The next rung is authored promotion: when a keeper can deepen the one-dynasty spine,
rewrite it as a third-person encounter in `src/data/saga/spine.act.json`, add local
prose/similarity proof, and record the provenance in
`src/data/saga/fabric/transactions.ndjson` with `type:"fabric-promote-keeper"`.
Promotion should keep broadening across source-era bands, not simply repeat the
first successful convergence insertion. After a keeper lands in the Gilded Age,
the next priority is a different era band such as ascension, with sensory relief
strong enough to break late-spine text fatigue.

The preferred pruning workflow is reductive and transactional:

1. Find the most duplicative or least scannable kept fabric item.
2. Remove or quarantine exactly that item from the played fabric.
3. Record the gap with provenance and reason.
4. Later refill the gap with a rewritten encounter or non-first-person branch piece that
   serves the one-dynasty spine.

The same transaction model now supports:

- `--prune-n <count>`: remove the next N worst entries in one reviewed transaction batch.
- `--prune-auto`: run cheap pre-read heuristics first (word count, sentence length,
  duplicate openings, empty settings, similarity if available) to choose the next
  reductive scan target efficiently.
- `--prune-all`: apply the proven heuristic threshold across the retained fabric, with
  transaction records for every removed item and no silent drops.

The goal is broader coverage without reverting to whole-cloth review. Batch pruning should
remove obvious chaff, preserve provenance, and leave explicit rewrite gaps.
