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
workflow is reductive and transactional:

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
