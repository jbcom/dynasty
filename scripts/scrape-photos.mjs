#!/usr/bin/env node
/**
 * Dev tool: download a curated list of source photos into public/assets/photos/.
 * Sources are documented per entry. Downloaded photos are then run through
 * scripts/cartoonify.mjs, which produces transformative cartoon derivatives —
 * those derivatives are this project's own work (see ASSETS.md).
 *
 * Usage: node scripts/scrape-photos.mjs
 */
import { createWriteStream, mkdirSync } from "node:fs";
import { pipeline } from "node:stream/promises";

const OUT = "public/assets/photos";

// BBC "Donald Trump: his life in pictures" chronology (976px originals).
// Mapped to life-stage slugs used by the portrait registry / era content.
const SOURCES = [
  { slug: "child_1948", url: "https://ichef.bbci.co.uk/ace/standard/976/cpsprodpb/4407/production/_114751471_5aed5378-b18e-4522-8c82-6859c50b2708.jpg" },
  { slug: "boy_wheelbarrow", url: "https://ichef.bbci.co.uk/ace/standard/976/cpsprodpb/6B17/production/_114751472_85db1439-8b3c-43a8-b339-939a26f8a294.jpg" },
  { slug: "siblings", url: "https://ichef.bbci.co.uk/ace/standard/976/cpsprodpb/9227/production/_114751473_ab9ce05b-add1-4f56-817d-2dd7d50427cb.jpg" },
  { slug: "nyma_grad", url: "https://ichef.bbci.co.uk/ace/standard/976/cpsprodpb/B937/production/_114751474_379da37b-206c-4f17-87fa-3ae2e8a5d0eb.jpg" },
  { slug: "ivana_beach", url: "https://ichef.bbci.co.uk/ace/standard/976/cpsprodpb/10757/production/_114751476_64c465bd-721e-4683-aebf-3346985698ab.jpg" },
  { slug: "central_park", url: "https://ichef.bbci.co.uk/ace/standard/976/cpsprodpb/12E67/production/_114751477_327604b8-accb-4aa7-834d-7a74e8607121.jpg" },
  { slug: "melania", url: "https://ichef.bbci.co.uk/ace/standard/976/cpsprodpb/15577/production/_114751478_52259375-771b-4b97-a9dc-45670225d925.jpg" },
  { slug: "with_don_jr", url: "https://ichef.bbci.co.uk/ace/standard/976/cpsprodpb/17C87/production/_114751479_63ac5df4-1acd-41d8-baf8-8294aa077ce5.jpg" },
];

async function download(url, dest) {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status} for ${url}`);
  await pipeline(res.body, createWriteStream(dest));
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  let ok = 0;
  for (const { slug, url } of SOURCES) {
    const dest = `${OUT}/${slug}.jpg`;
    try {
      await download(url, dest);
      console.log(`downloaded ${slug}`);
      ok++;
    } catch (e) {
      console.error(`FAILED ${slug}: ${(e instanceof Error ? e.message : e)}`);
    }
  }
  console.log(`\n${ok}/${SOURCES.length} downloaded. Run \`pnpm cartoonify\` to derive cartoons.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
