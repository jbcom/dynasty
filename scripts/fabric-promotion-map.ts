import { readFileSync, writeFileSync } from "node:fs";
import {
  buildPromotionDiversityMap,
  type FabricPromotionTransaction,
} from "../src/sim/saga/promotionDiversity";

const arg = (name: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};

const TRANSACTIONS = arg("transactions") ?? "src/data/saga/fabric/transactions.ndjson";
const OUT = arg("out") ?? "src/data/saga/fabric/promotion-diversity.json";

function readTransactions(path: string): FabricPromotionTransaction[] {
  const raw = readFileSync(path, "utf8").trim();
  if (!raw) return [];
  return raw.split("\n").map((line) => JSON.parse(line) as FabricPromotionTransaction);
}

const report = buildPromotionDiversityMap(readTransactions(TRANSACTIONS));
writeFileSync(OUT, `${JSON.stringify(report, null, 2)}\n`);
console.error(`Wrote ${OUT}: ${report.promotedCount} promoted keeper source(s) mapped from ${TRANSACTIONS}.`);
