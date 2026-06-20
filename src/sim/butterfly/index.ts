/**
 * The butterfly subpackage — the causal heart of the sim:
 *  - ripples   : (C) seeded chaos field perturbing future event weights.
 *  - ledger    : (B) the visible, deduplicated cause→effect log.
 *  - consequences : (H2) delayed/compounding effects that land years later.
 *
 * Import from `../butterfly` (this index), not the individual files.
 */
export { applyRipples } from "./ripples";
export { buildLedgerEntries, firedRules, renderChain } from "./ledger";
export {
  type LandResult,
  landDueConsequences,
  scheduleConsequences,
} from "./consequences";
