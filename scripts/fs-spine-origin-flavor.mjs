/**
 * FS-SPINE-ORIGIN-FLAVOR (approach B): insert base-flavored FOUNDING-act (g0) opening variants so the
 * player's chosen POWER BASE colors the founding scene from beat one. Each variant is gated on its
 * `base:*` seed flag (stamped at founding by foundByComposition) and diverts forward to the shared
 * `spine:g0:founding:allegiance` scene, skipping the default `open`. The existing `open` scene is the
 * PRESS/default (it's already a printing-house scene) — gated to NOT fire for the five other bases.
 *
 * Idempotent: re-running removes any prior base-variant scenes first, then re-inserts. Run:
 *   node scripts/fs-spine-origin-flavor.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

const PATH = "src/data/saga/spine.act.json";
const doc = JSON.parse(readFileSync(PATH, "utf-8"));

const ALLEGIANCE = "spine:g0:founding:allegiance";
const VARIANT_IDS = [
  "spine:g0:founding:open_land",
  "spine:g0:founding:open_commerce",
  "spine:g0:founding:open_pulpit",
  "spine:g0:founding:open_law",
  "spine:g0:founding:open_military",
];

/** The five base-flavored opening scenes (press is the existing default `open`). Voice matches the spine:
 *  multi-paragraph sensory prose with {given_name}/{surname}/{family_name} tokens, 2 beats each. */
const VARIANTS = [
  {
    id: "spine:g0:founding:open_land",
    base: "land",
    sense: "smell",
    prose: [
      "The wet-earth musk of broken sod and river-bottom loam rose around {given_name} {surname} like a held breath, the smell of a continent that had not yet learned whose name it would carry. Beyond the split-rail line the survey stakes marched off into the treeline, each one driven by a hand that meant to own what it measured — and the {family_name} stakes ran farthest of all, into bottomland the Crown's clerks had never troubled to map. A founding nation would be hungry for grain and for the men who could grow it, and land, the old planters said, was the only wealth that also bought the vote.",
      "In the cold clarity of the dawn the abstractions of liberty dissolved into the plain arithmetic of acreage: so many bushels to the field, so many fields to a freehold, so many freeholds to a seat in the assembly. A bound laborer stooped at the fence-row, his back bent to a fortune that was not his, and the contradiction sat in the morning air as heavy as the dew — for the same parchment that promised liberty would be printed on the surplus this soil threw off.",
    ],
    beats: [
      {
        prose: ["You walk the boundary, counting the stakes that fix the line to your family's name."],
        choice: {
          text: "Press the survey to its farthest defensible edge.",
          motivatorShift: { wealth: 1, lineage: 1 },
          setFlags: ["g0_land_surveyed"],
          gather: true,
        },
      },
      {
        prose: ["A neighbor's boy waits at the gate with word that the assembly will sit on the question of western grants."],
        choice: {
          text: "Send him back with your pledge to the men who decide who holds the land.",
          motivatorShift: { power: 1, politics: 1 },
          setFlags: ["g0_land_courted_assembly"],
          gather: true,
        },
      },
    ],
  },
  {
    id: "spine:g0:founding:open_commerce",
    base: "commerce",
    sense: "smell",
    prose: [
      "Tar and brine and the green rot of the tide flats hung over the counting-house where {given_name} {surname} kept the ledgers, a harbor smell that meant money in motion. Down on the long wharf the cranes swung crates of West India sugar and bolts of Holland cloth, and every hogshead that crossed the {family_name} scales left a few pennies behind it — for in a country with no banks worth the name, the merchant who could be trusted to hold a note WAS the bank, and a revolution would need credit more than it needed muskets.",
      "In the cold clarity of the dawn the abstractions of liberty resolved into columns: consignments out, bills of exchange in, the slow tightening of a Glasgow factor's credit against a planter who could no longer pay. The Crown's customs men had begun to seize cargoes that an honest trade had always run quietly past them, and {given_name} understood that a stamped duty was no longer a nuisance — it was the wedge that would split a merchant's loyalty from his king.",
    ],
    beats: [
      {
        prose: ["You run your finger down the day's manifest, weighing which cargoes can move without the customs house knowing."],
        choice: {
          text: "Quietly route the seized goods past the king's men.",
          motivatorShift: { wealth: 1, honor: 1 },
          setFlags: ["g0_commerce_evaded_customs"],
          gather: true,
        },
      },
      {
        prose: ["A delegate's clerk waits at the door, hat in hand, with a request the Congress cannot put in writing: credit."],
        choice: {
          text: "Extend the house's name against the cause's promissory note.",
          motivatorShift: { reach: 1, power: 1 },
          setFlags: ["g0_commerce_financed_cause"],
          gather: true,
        },
      },
    ],
  },
  {
    id: "spine:g0:founding:open_pulpit",
    base: "pulpit",
    sense: "sound",
    prose: [
      "The meetinghouse bell had not yet rung, and in the grey hush {given_name} {surname} could hear the whole town breathing — the cough of an old man, the creak of a pew, the wind worrying the clapboards — a congregation waiting to be told what God thought of a rebellion. From this pulpit the {family_name} voice reached more souls in an hour than any pamphlet reached in a month, for the weekly sermon was the one address every household in the parish was bound to hear, and a minister who named a cause holy could put a musket in a farmer's hands.",
      "In the cold clarity of the dawn the abstractions of liberty resolved into the harder question of covenant: was resistance to the Crown obedience to God, or the sin of rebellion against an ordained king? The election-sermon was three days off, when the magistrates would sit in the front pews to hear the moral weather of the colony read aloud — and {given_name} held the text that could bless the war or damn it, and knew the whole assembly would carry the verdict home.",
    ],
    beats: [
      {
        prose: ["You weigh the morning's text, the open Bible heavy under your hand."],
        choice: {
          text: "Mark the passages that make liberty a sacred duty.",
          motivatorShift: { worldview: -1, honor: -1 },
          setFlags: ["g0_pulpit_blessed_cause"],
          gather: true,
        },
      },
      {
        prose: ["A deacon murmurs that the magistrates will not love a sermon that arms the congregation."],
        choice: {
          text: "Tell him the pulpit answers to a higher bench than theirs.",
          motivatorShift: { power: 1, worldview: -1 },
          setFlags: ["g0_pulpit_defied_magistrates"],
          gather: true,
        },
      },
    ],
  },
  {
    id: "spine:g0:founding:open_law",
    base: "law",
    sense: "sight",
    prose: [
      "Calf-bound and gilt, the long shelf of Coke and Blackstone caught the first light through the chamber window, and {given_name} {surname} read in their spines the one ladder a man without land could still climb. The county court would sit within the week, and the assembly within the month, and both ran on the tongue of whoever could marshal a precedent — for in this new country there were no law schools, only the practitioner's desk a young clerk read at, and the {family_name} name was beginning to be spoken in the same breath as a verdict.",
      "In the cold clarity of the dawn the abstractions of liberty resolved into the concrete machinery of office: the writ, the seat, the unpaid justice's bench from which a gentry family quietly named its own successors. The Crown's writs of assistance had turned a lawyer's grievance into a constitutional one, and {given_name} understood that the men who could argue the case in the assembly would be the men who governed what came after the king — that the bar was the shortest road into a revolution's leadership.",
    ],
    beats: [
      {
        prose: ["You draft the resolves the assembly will hear, choosing each clause for the precedent it sets."],
        choice: {
          text: "Frame the grievance as a matter of constitutional right.",
          motivatorShift: { politics: 1, power: 1 },
          setFlags: ["g0_law_drafted_resolves"],
          gather: true,
        },
      },
      {
        prose: ["A senior justice offers to read you into the county bench — a seat that names its own heirs."],
        choice: {
          text: "Take the seat, and the patronage that comes with it.",
          motivatorShift: { power: 1, honor: 1 },
          setFlags: ["g0_law_took_the_bench"],
          gather: true,
        },
      },
    ],
  },
  {
    id: "spine:g0:founding:open_military",
    base: "military",
    sense: "sound",
    prose: [
      "The ragged stamp of boots on the common, the bark of a sergeant counting cadence, the rattle of a drum that had not yet learned a war — {given_name} {surname} stood at the head of the militia muster and heard, under the noise, the sound of a name being made. A commission was a social title as much as a soldier's: Colonel before the county, gentleman before the assembly, and war reputation that converted, in time, to bounty land and high office. The {family_name} company drilled because a founding nation would crown the men who could be trusted with its guns.",
      "In the cold clarity of the dawn the abstractions of liberty resolved into the plain question of who would command: the Crown's appointed officers, or the local gentry the men actually followed. A continental army was being raised out of these scattered companies, and an officer, it was understood, was a gentleman — so {given_name} weighed each oath of enlistment knowing that the reputation won at the head of this column was the foundation a dynasty could be built upon, if the column did not break.",
    ],
    beats: [
      {
        prose: ["You walk the line of the muster, judging which men will hold and which will run."],
        choice: {
          text: "Drill them past exhaustion — a reputation is won before the first shot.",
          motivatorShift: { power: 1, honor: -1 },
          setFlags: ["g0_military_drilled_hard"],
          gather: true,
        },
      },
      {
        prose: ["A rider brings the offer of a Continental commission — rank that answers to the Congress, not the county."],
        choice: {
          text: "Accept it, and tie the family's name to the national cause.",
          motivatorShift: { power: 1, lineage: 1 },
          setFlags: ["g0_military_took_commission"],
          gather: true,
        },
      },
    ],
  },
];

// --- idempotent rebuild ---
// 1. drop any prior variant scenes + their ids from g0's scene list.
doc.scenes = doc.scenes.filter((s) => !VARIANT_IDS.includes(s.id));
const g0 = doc.acts.find((a) => a.id === "spine:g0:founding");
if (!g0) throw new Error("no g0 act");
g0.scenes = g0.scenes.filter((id) => !VARIANT_IDS.includes(id));

// 2. build the variant scene objects (each diverts forward to allegiance, skipping the default `open`).
const built = VARIANTS.map((v) => ({
  id: v.id,
  sense: v.sense,
  requires: { flags: [`base:${v.base}`], notFlags: [] },
  next: ALLEGIANCE,
  prose: v.prose,
  beats: v.beats,
}));

// 3. insert the variant scenes immediately BEFORE the default `open` in the scenes array (order is the
//    authoritative traversal sequence; resolveEligible walks act.scenes, so the variants must precede open).
const openIdx = doc.scenes.findIndex((s) => s.id === "spine:g0:founding:open");
if (openIdx < 0) throw new Error("no spine:g0:founding:open");
doc.scenes.splice(openIdx, 0, ...built);

// 4. prepend the variant ids before `open` in g0's scene list.
const openListIdx = g0.scenes.indexOf("spine:g0:founding:open");
g0.scenes.splice(openListIdx, 0, ...VARIANT_IDS);

// 5. gate the default `open` (the press scene) to NOT fire when a non-press base variant would — the
//    divert already skips it, but the notFlags make the default explicitly the press/uncovered case.
const open = doc.scenes.find((s) => s.id === "spine:g0:founding:open");
open.requires = { flags: [], notFlags: VARIANTS.map((v) => `base:${v.base}`) };

writeFileSync(PATH, `${JSON.stringify(doc, null, 1)}\n`);
console.log(`inserted ${built.length} base-variant scenes; g0 scenes now: ${g0.scenes.length}`);
