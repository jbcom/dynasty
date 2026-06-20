# Asset Licenses

Every shipped asset in `public/assets/` is freely licensed. The machine-readable
manifest is `src/data/assets.json` (validated in CI by
`src/data/__tests__/assets.unit.test.ts`).

## Icons — OpenMoji (CC BY-SA 4.0)

Meter icons in `public/assets/icons/` are from [OpenMoji](https://openmoji.org)
15.0, licensed **CC BY-SA 4.0**. Attribution: "OpenMoji – the open-source emoji
and icon project. License: CC BY-SA 4.0".

## Backgrounds & SVG caricatures (CC0 — our own work)

Era backdrops (`public/assets/backgrounds/*.svg`) and the hand-authored SVG
caricature portraits (`public/assets/portraits/*.svg`) are original work created
for this project, released **CC0**.

## Cartoon portrait derivatives (CC0 — our own work)

Portraits ending in `.cartoon.png` are produced by `scripts/cartoonify.mjs`,
which posterizes + ink-edges a source photo into a stylized cartoon. These are
**transformative derivative works and are this project's own output (CC0)**.

Source provenance (for the record — the derivatives themselves are our work):
- Public-domain originals: 1964 NYMA photo, the official PD-USGov White House
  portrait, and the BBC "Donald Trump: his life in pictures" chronology used as
  cartoonify inputs.
- The raw source photos are **not shipped** (gitignored under
  `public/assets/photos/`); only the cartoon derivatives are committed.

## Reproducing the asset pipeline

```sh
node scripts/scrape-photos.mjs   # download curated source photos (dev only)
pnpm cartoonify                  # derive *.cartoon.png from public/assets/photos
```
