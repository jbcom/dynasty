/**
 * SPINE-ACT-DEPTH: deepen each spine act toward the hour+ gameplay mandate by interleaving decisionless
 * INTERSTITIAL scenes between the authored DecisionArchitecture beats (see
 * docs/superpowers/specs/2026-06-22-founding-spine-redesign.md §SPINE-ACT-DEPTH). Per [[novel-not-fragments]]
 * not every scene is a choice: a TEXTURE scene grounds the generation's world + the family's standing
 * before the first decision, and a CONSEQUENCE scene shows a decision landing before the next one. Both
 * are weave-only (gather:true beats, small motivator nudges) and fall forward via `next`.
 *
 * Mechanism (idempotent — spine.act.json is GenAI-generated, so this is the regen-safe re-apply):
 *   For each interstitial { actId, id, after, prose, beats }:
 *     1. drop any prior interstitial scenes for the act (ids matching /:(tex|csq)_/), so a re-run is clean;
 *     2. the interstitial INHERITS the `after` scene's current forward target as its own `next`
 *        (act-order fall-through if `after` had none), then `after` is pinned to point at the interstitial;
 *     3. any sibling whose `next` equaled that same forward target (e.g. the origin-flavor base-opening
 *        variants that `next` straight to `allegiance`) is repointed to the interstitial — so EVERY path
 *        through the act passes the new texture, not just the default open.
 *
 * RUN ORDER: this is DOWNSTREAM of fs-spine-origin-flavor.mjs (it repoints the base-opening variants that
 * script creates). The canonical regen sequence is:
 *   node scripts/fs-spine-origin-flavor.mjs && node scripts/fs-spine-act-depth.mjs
 * Re-running origin-flavor afterward resets the variants' `next` to the shared decision and bypasses the
 * texture — so always re-run THIS script last. Each script is individually idempotent.
 *
 * Run:  node scripts/fs-spine-act-depth.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

const PATH = "src/data/saga/spine.act.json";
const doc = JSON.parse(readFileSync(PATH, "utf-8"));

/** The g0 founding-act interstitials. Voice matches the spine: multi-paragraph sensory prose with
 *  {given_name}/{surname}/{family_name} tokens, 2 weave beats each, decisionless (they fall forward). */
const INTERSTITIALS = [
  {
    actId: "spine:g0:founding",
    id: "spine:g0:founding:tex_pressroom",
    after: "spine:g0:founding:open",
    sense: "sight",
    prose: [
      "Before the day's first customer, the workshop belonged only to {given_name} {surname} and the slow grey light coming up over the rooftops. Type lay in its cases like a sleeping army — the worn lowercase e's, the proud capitals, the long s that the younger printers were starting to abandon — and every drawer of it was a kind of wealth that no customs officer knew how to seize. A founding country would be argued into being on paper before it was ever won on a field, and the {family_name} press sat astride the one trade that turned a private opinion into a public fact.",
      "The town was waking into its divisions. A loyalist magistrate kept his accounts three doors down; a Committee of Correspondence met above the cooper's shop and thought no one had noticed; the militia drilled in the common where children had played a year ago. {given_name} had eaten at tables on both sides of the quarrel, and knew the names behind every anonymous broadside, and understood — with the cold steadiness of someone counting their own stock — that whichever way the colony broke, the family that controlled the printing would be remembered as the ones who had told it which way to go.",
    ],
    beats: [
      {
        prose: [
          "You straighten the standing type, reading the half-set column upside down out of long habit, weighing whose words you have agreed to put before the town.",
        ],
        choice: {
          text: "Hold the press open to every faction that can pay — and learn all their secrets.",
          motivatorShift: { honor: 1, reach: 1 },
          setFlags: ["g0_press_kept_open"],
          gather: true,
        },
      },
      {
        prose: [
          "A apprentice slips in from the street with the morning's rumor: redcoats counted on the post road, and a crowd already gathering at the wharf.",
        ],
        choice: {
          text: "Send him to listen at the wharf and bring back names, not noise.",
          motivatorShift: { power: 1, worldview: 1 },
          setFlags: ["g0_press_gathered_intelligence"],
          gather: true,
        },
      },
    ],
  },
  {
    actId: "spine:g0:founding",
    id: "spine:g0:founding:csq_aftermath",
    after: "spine:g0:founding:allegiance",
    sense: "smell",
    prose: [
      "By nightfall the choice {given_name} {surname} had made was no longer an opinion but a fact the whole town could smell — lamp-oil and sweat in the back room where the allies now gathered, woodsmoke from the houses of those who had already decided the {family_name} name was a danger to be near. A position taken is a door closed: the loyalist magistrate no longer nodded in the street, and a Committee man who had once been a stranger now spoke to {given_name} as though they had always been kin.",
      "The first cost came due quietly, the way real costs do. A standing order was canceled with no reason given. A note that should have been easy to renew was suddenly called. Across the colony other families were making the same reckoning at the same hour, and the rival houses {given_name} had grown up measuring themselves against were choosing their own sides — so that the country taking shape would be a lattice of these private allegiances, each one a debt or a shield that the next generation would inherit before it had drawn a breath.",
    ],
    beats: [
      {
        prose: [
          "You tally what the day has already cost — custom lost, credit tightened — against what it has bought: men who will now answer when the family calls.",
        ],
        choice: {
          text: "Treat the lost trade as the price of a seat at the table that will rule what comes next.",
          motivatorShift: { politics: 1, lineage: 1 },
          setFlags: ["g0_accepted_the_cost"],
          gather: true,
        },
      },
      {
        prose: [
          "Late, a neighbor who chose the other side leaves a son at your door — too young to fight, with nowhere safer to send him.",
        ],
        choice: {
          text: "Take the boy in, and let the town see the family keeps its mercy even in a quarrel.",
          motivatorShift: { honor: -1, reach: 1 },
          setFlags: ["g0_sheltered_a_rival_kin"],
          gather: true,
        },
      },
    ],
  },
];

/** A scene id is a prior interstitial for an act if it matches the act prefix + :tex_ or :csq_. */
function isInterstitialId(actId, id) {
  return id.startsWith(`${actId}:tex_`) || id.startsWith(`${actId}:csq_`);
}

/** The forward target of a scene: its explicit `next`, else the act-order successor, else null. */
function forwardTargetOf(act, scene) {
  if (scene.next) return scene.next;
  const i = act.scenes.indexOf(scene.id);
  return i >= 0 && i + 1 < act.scenes.length ? act.scenes[i + 1] : null;
}

function applyInterstitials(actId) {
  const act = doc.acts.find((a) => a.id === actId);
  if (!act) throw new Error(`no act ${actId}`);
  // 1. Capture each prior interstitial's `next` BEFORE removing them, so a pointer INTO an interstitial
  //    can be repaired to the real downstream scene the chain led to (not silently collapsed to the
  //    act-order successor — that loses the original target and breaks idempotency on re-run).
  const priorNext = new Map(
    doc.scenes.filter((s) => isInterstitialId(actId, s.id)).map((s) => [s.id, s.next ?? null]),
  );
  /** Follow a `next` through any chain of (now-removed) interstitials to the first surviving target. */
  const resolveThroughRemoved = (next) => {
    let cur = next;
    const seen = new Set();
    while (cur && isInterstitialId(actId, cur) && !seen.has(cur)) {
      seen.add(cur);
      cur = priorNext.get(cur) ?? null;
    }
    return cur;
  };
  // 2. drop ALL prior interstitial scenes for this act (idempotent re-apply).
  doc.scenes = doc.scenes.filter((s) => !isInterstitialId(actId, s.id));
  act.scenes = act.scenes.filter((id) => !isInterstitialId(actId, id));
  // 3. repair every `next` that pointed at a removed interstitial back to the real scene the chain led to
  //    (e.g. the base-opening variants pointed at tex_pressroom → restore them to `allegiance`), so the
  //    act is in its pre-deepening shape before re-insertion re-derives the pointers.
  for (const id of act.scenes) {
    const s = doc.scenes.find((x) => x.id === id);
    if (s?.next && isInterstitialId(actId, s.next)) {
      const real = resolveThroughRemoved(s.next);
      s.next = real ?? undefined;
    }
  }

  let inserted = 0;
  for (const spec of INTERSTITIALS.filter((x) => x.actId === actId)) {
    const after = doc.scenes.find((s) => s.id === spec.after);
    if (!after) throw new Error(`no after-scene ${spec.after}`);
    // The interstitial inherits the after-scene's CURRENT forward target as its own `next`.
    const target = forwardTargetOf(act, after);
    const scene = {
      id: spec.id,
      sense: spec.sense,
      requires: { flags: [], notFlags: [] },
      gather: true,
      ...(target ? { next: target } : {}),
      prose: spec.prose,
      beats: spec.beats,
    };
    // Insert right after the after-scene in BOTH the scenes array and the act's ordered scene list.
    const sceneIdx = doc.scenes.findIndex((s) => s.id === spec.after);
    doc.scenes.splice(sceneIdx + 1, 0, scene);
    const listIdx = act.scenes.indexOf(spec.after);
    act.scenes.splice(listIdx + 1, 0, spec.id);
    // Pin the after-scene forward to the interstitial.
    after.next = spec.id;
    // Repoint every sibling whose `next` was the SAME target (e.g. origin-flavor base-opening variants
    // that `next` straight to the shared scene) so ALL paths pass through the new texture.
    if (target) {
      for (const id of act.scenes) {
        if (id === spec.id || id === spec.after) continue;
        const s = doc.scenes.find((x) => x.id === id);
        if (s?.next === target) s.next = spec.id;
      }
    }
    inserted += 1;
  }
  return inserted;
}

const n0 = applyInterstitials("spine:g0:founding");

writeFileSync(PATH, `${JSON.stringify(doc, null, 1)}\n`);
console.log(`fs-spine-act-depth: inserted ${n0} interstitial scene(s) into g0.`);
