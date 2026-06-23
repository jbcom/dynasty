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

/** Compact factory for an interstitial spec — keeps the 10-act table readable. `kind` is "tex" (TEXTURE,
 *  placed after the act open) or "csq" (CONSEQUENCE, placed after the act's first major decision). */
function inter(gen, kind, after, sense, prose, beats) {
  return { actId: `spine:${gen}`, id: `spine:${gen}:${kind}_${after.split(":").pop()}`, after, sense, prose, beats };
}
/** A weave beat: a line of prose + a gather choice (small motivator nudge, sets a flavor flag). */
function beat(prose, text, motivatorShift, flag) {
  return { prose: [prose], choice: { text, motivatorShift, setFlags: [flag], gather: true } };
}

/** The spine-act interstitials (SPINE-ACT-DEPTH). Voice matches the spine: multi-paragraph sensory prose
 *  with {given_name}/{surname}/{family_name} tokens, 2 weave beats each, decisionless (they fall forward).
 *  g0 is spelled out in full as the pattern-setter; g1-g9 use the compact `inter`/`beat` helpers. */
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
          "An apprentice slips in from the street with the morning's rumor: redcoats counted on the post road, and a crowd already gathering at the wharf.",
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

  // ── g1 — The Crucible of the Young Republic (1790s shipyards, founding a doctrine) ──
  inter(
    "g1:earlyrepublic",
    "tex",
    "spine:g1:earlyrepublic:open",
    "sight",
    [
      "In the slack hour before the yard came alive, {given_name} {surname} stood among the rising ribs of a half-built hull and felt the weight of a country that was still mostly argument. The new republic had a constitution but not yet a character; its banks were rumors, its army a memory, its loyalties still local enough that a Virginian and a Yankee could each call the other a foreigner. What the {family_name} line had inherited from the founding was not money so much as a position — a name people already turned to when they wanted to know which way the wind would blow.",
      "The work itself was a kind of doctrine. Every keel laid down was a bet on commerce over isolation, on a nation that would trade with the world rather than hide from it. {given_name} watched a gang of free and bound men heave a futtock into place and understood that the choices made in this generation — about credit, about labor, about whose interests the family served — would harden into the unspoken rules the grandchildren would mistake for nature.",
    ],
    [
      beat(
        "You walk the stocks at first light, reading the timber for the season's true measure of the house's reach.",
        "Lay down more hulls than the orders justify — wager on a republic that will need them.",
        { wealth: 1, reach: 1 },
        "g1_overbuilt_on_faith",
      ),
      beat(
        "A young clerk asks, plainly, what the family stands for — so he knows what to tell the men.",
        "Give him a creed he can repeat: the house serves the union before any single state.",
        { politics: 1, lineage: 1 },
        "g1_named_the_creed",
      ),
    ],
  ),
  inter(
    "g1:earlyrepublic",
    "csq",
    "spine:g1:earlyrepublic:doctrine",
    "sound",
    [
      "The doctrine, once spoken aloud, began to make enemies and allies of its own accord. Word of where the {surname} house stood traveled the wharves faster than any pamphlet, and within a week the character of the family's visitors had changed — fewer cautious neutrals, more men who wanted something specific from a house that had finally declared itself.",
      "A position is a debt the future pays. {given_name} found that the creed cost custom in one quarter and won it in another, and that a doctrine spoken in a young republic does not stay private — it becomes a fixed point others steer by or steer against. Down the coast, rival houses adjusted to the news, and the slow contest of the next decades quietly took its shape from this single morning's certainty.",
    ],
    [
      beat(
        "You weigh the first ledger since the creed was spoken — custom lost against alliances gained.",
        "Hold the line; a house known for its word is worth more than a house known for its discounts.",
        { honor: -1, lineage: 1 },
        "g1_held_the_doctrine",
      ),
      beat(
        "An old trading partner sends regrets, his politics now at odds with yours.",
        "Let him go gracefully, and send word you'll keep his sons' accounts open regardless.",
        { honor: -1, reach: 1 },
        "g1_kept_the_bridge",
      ),
    ],
  ),

  // ── g2 — The Sundered Threshold (antebellum mills, the union tearing) ──
  inter(
    "g2:antebellum",
    "tex",
    "spine:g2:antebellum:open",
    "smell",
    [
      "The mill smelled of hot oil and raw cotton and the faint sweetness of the river that turned its wheels, and over all of it lay the particular tension of a country that had begun to argue about whether it was one country at all. {given_name} {surname} moved along the spinning frames where children minded the threads, and the prosperity of the whole house ran through fiber grown a thousand miles south by hands that owned nothing, not even themselves.",
      "It was no longer possible to pretend the question was distant. Every bale on the {family_name} floor was an answer to it, every dividend a vote. The pulpits had begun to thunder, the newspapers to choose sides, and the threshold the family stood on was the same one the nation stood on — the moment before a choice that, once made, could not be unmade, and would set the line's course for generations whichever way it fell.",
    ],
    [
      beat(
        "In the carding room the air hangs thick with lint, and the question of how much the house rests on Southern fiber hangs with it.",
        "Quietly begin sourcing wool and flax — a hedge against the day the cotton stops.",
        { wealth: 1, worldview: 1 },
        "g2_diversified_the_fiber",
      ),
      beat(
        "A foreman waits for word on whether to keep taking the new contracts from the slave-worked plantations.",
        "Tell him the house will honor existing bonds but sign no new ones.",
        { honor: -1, politics: 1 },
        "g2_drew_a_quiet_line",
      ),
    ],
  ),
  inter(
    "g2:antebellum",
    "csq",
    "spine:g2:antebellum:allegiance",
    "sound",
    [
      "After the allegiance was chosen, the sound of the mill never changed but everything around it did. {given_name} {surname} heard it first in the way men talked in the counting-room — guarded where they had been easy, or suddenly frank where they had been careful — the whole social weather of the town reorganizing itself around where the {family_name} house had finally planted its flag.",
      "The cost arrived as it always does, sideways and certain. A correspondent in the other section closed his books. A shipment was held at a wharf that had never troubled the family before. And in a hundred parlors across a fracturing nation, other houses were making the same hard arithmetic at the same hour — so that the war still years off was already being fought, quietly, in ledgers and loyalties, with the next generation's inheritance as the stake.",
    ],
    [
      beat(
        "You tally the accounts that closed the week your allegiance became known.",
        "Treat the losses as the toll for standing somewhere — a house that stands nowhere is swept away.",
        { politics: 1, lineage: 1 },
        "g2_paid_the_toll",
      ),
      beat(
        "A letter arrives from kin in the other section, asking only that the family not forget them.",
        "Write back that blood outlasts borders, whatever the coming years demand.",
        { honor: -1, lineage: 1 },
        "g2_kept_faith_with_kin",
      ),
    ],
  ),

  // ── g3 — The Iron and the Ivory (Gilded Age, the exchange, consolidation) ──
  inter(
    "g3:gildedage",
    "tex",
    "spine:g3:gildedage:open",
    "touch",
    [
      "The brass rail of the gallery above the exchange was worn smooth and faintly warm under {given_name} {surname}'s hand, polished by a generation of gloves that had gripped it while fortunes were made and unmade on the floor below. This was the age of consolidation, when a man with nerve and credit could swallow a dozen smaller men in a morning, and the {family_name} name had grown large enough to be either a predator or prey — there was no longer a comfortable middle.",
      "Wealth at this scale had stopped being about goods and become about control: of rails, of ore, of the courts and legislatures that decided whose contracts held. {given_name} could feel the era's logic pressing in — grow or be absorbed — and knew that the choices the family made now, about how much to take and how openly, would set whether the line was remembered as builders or robbers, and whether that distinction would even survive into the century to come.",
    ],
    [
      beat(
        "From the gallery the floor is a single organism of panic and greed, every runner's face an open ledger.",
        "Move while the others hesitate — buy the failing line before it knows it is failing.",
        { wealth: 1, honor: 1 },
        "g3_seized_the_moment",
      ),
      beat(
        "A senator's man waits discreetly in the anteroom, suggesting the right friendships ease the right deals.",
        "Cultivate the friendship; in this age the statute is just another asset to acquire.",
        { power: 1, politics: 1 },
        "g3_bought_the_influence",
      ),
    ],
  ),
  inter(
    "g3:gildedage",
    "csq",
    "spine:g3:gildedage:venture",
    "sight",
    [
      "The newspapers told {given_name} {surname} what the venture had become before the contracts were even dry — the family name set in larger type than ever, praised on one page as enterprise and damned on the next as monopoly, the same act read as virtue or vice depending on who held the press. Scale buys visibility, and visibility buys scrutiny; the house had grown too large to act quietly.",
      "Below the headlines, the real reckoning moved slower. Smaller men ruined by the deal nursed their grievances into politics; a muckraker began to ask where the family's money truly came from; and rival dynasties recalculated, some seeking alliance and some sharpening knives. The Gilded Age rewarded boldness and remembered everything, and {given_name} understood that this single venture had bought the family a permanent place at the center of the country's quarrel with its own wealth.",
    ],
    [
      beat(
        "The morning editions are stacked on the desk — praise and venom in equal measure.",
        "Answer none of it; let the results speak and the critics exhaust themselves.",
        { power: 1, honor: 1 },
        "g3_ignored_the_press",
      ),
      beat(
        "A ruined rival's widow petitions the house for relief, her plea already in the papers.",
        "Grant her a quiet pension — mercy is cheaper than a martyr.",
        { honor: -1, reach: 1 },
        "g3_bought_the_silence",
      ),
    ],
  ),

  // ── g4 — The Iron Loom of Progress (Progressive era, labor, the works) ──
  inter(
    "g4:progressive",
    "tex",
    "spine:g4:progressive:open",
    "sound",
    [
      "The machine shops of the {surname} Iron Works ran with a noise that had its own grammar — the syncopated hammer of the drop-forges, the shriek of steel on the lathe, the human undertone of a thousand men who had begun, lately, to speak of themselves as a single voice. {given_name} {surname} walked the gantry above the floor and heard in that undertone the sound of the new century arguing with the old.",
      "Progress had a price the founding generations had never had to name. The works that made the family rich had also made a class of men who could shut it down, and the reformers in the capital had begun to write the rules of capital and labor into law. {given_name} understood that the house could no longer simply own — it would have to answer: to the men, to the state, to a public that had decided it had a stake in how fortunes were made.",
    ],
    [
      beat(
        "Ten thousand boots ring on the iron stairs below the gantry as the shift turns over.",
        "Walk the floor yourself before the trouble starts — let the men see the name has a face.",
        { power: 1, reach: 1 },
        "g4_walked_the_floor",
      ),
      beat(
        "A reformer's pamphlet, left on your desk, lists the works among the city's worst.",
        "Quietly fund the safety improvements before the inspectors arrive — own the reform.",
        { worldview: 1, honor: -1 },
        "g4_co-opted_the_reform",
      ),
    ],
  ),
  inter(
    "g4:progressive",
    "csq",
    "spine:g4:progressive:allegiance",
    "touch",
    [
      "Whatever the family chose when the strike met the militia, {given_name} {surname} felt the result in the very air of the works — a stiffness in the men's nods, or a sudden ease, the temperature of ten thousand relationships shifting at once. A position taken in a labor war is felt on the body before it is understood in the mind.",
      "The cost came in coin and in something harder to price. Production faltered or steadied; the newspapers assigned the family a character it would wear for decades; and across the industrial cities, other dynasties read the {surname} choice as a signal and adjusted their own. The Progressive age was teaching the great houses that they were no longer private — and this generation's stand fixed, for those that came after, what kind of master the family would be remembered as.",
    ],
    [
      beat(
        "You inspect the idled or running line, the machines warm or cooling under your palm.",
        "Restart the works on terms that cost the house now and buy peace for a generation.",
        { wealth: -1, reach: 1 },
        "g4_bought_the_peace",
      ),
      beat(
        "A foreman who stood with you — or against you — waits to know if he still has a place.",
        "Keep him on; loyalty in a hard hour is the only currency that compounds.",
        { honor: -1, lineage: 1 },
        "g4_rewarded_loyalty",
      ),
    ],
  ),

  // ── g5 — The Chrome Horizon (mid-century, the tower, the subcommittee) ──
  inter(
    "g5:midcentury",
    "tex",
    "spine:g5:midcentury:open",
    "sight",
    [
      "From the top floor of the new glass tower the city looked like a circuit diagram, and {given_name} {surname} stood at the window where their grandfather would have stood at a ledger, master of a house that had learned to make its wealth from movement itself — capital, information, image. The post-war boom had a chrome optimism to it, a faith that the line went only up, and the {family_name} name was woven now into the institutions that made the country believe it.",
      "But the same scale that made the family powerful had made it answerable to a new kind of power: the committee room, the regulator, the press that could try a dynasty in public. {given_name} could see, past the bright skyline, the gathering shape of a reckoning — fifty years of expansion about to be asked, under oath, to explain itself. The choices of this generation would decide whether the house entered the modern age as a respected institution or a cautionary tale.",
    ],
    [
      beat(
        "You stand at the glass, the city's grid laid out like an account to be balanced.",
        "Put the house's affairs in scrupulous order before anyone thinks to ask.",
        { worldview: 1, honor: -1 },
        "g5_put_the_house_in_order",
      ),
      beat(
        "An aide brings word the subcommittee has begun calling the family's old rivals to testify.",
        "Reach out to the rivals first; a shared story is harder to break than a lone one.",
        { power: 1, politics: 1 },
        "g5_aligned_the_testimony",
      ),
    ],
  ),
  inter(
    "g5:midcentury",
    "csq",
    "spine:g5:midcentury:reckoning",
    "sound",
    [
      "After the reckoning, the silence in the tower was its own verdict. {given_name} {surname} heard it in the hush of the outer offices, in the careful phrasing of the lawyers, in the way the telephone rang either too much or not at all — the sound of an institution learning, in real time, whether it had survived its own history.",
      "Consequence at this altitude is structural. A consent decree reshaped a division; a headline rewrote the family's public meaning; a generation of bright young managers decided whether the {family_name} name was one to join or to flee. And in the boardrooms of the era's other dynasties, the outcome of the {surname} reckoning became a lesson studied and applied — so that this one hard season set the terms on which the whole class of great houses would enter the second half of the century.",
    ],
    [
      beat(
        "You read the decree's final language, the price of survival set down in clauses.",
        "Sign it and move on; a house that survives the reckoning outlasts the men who called it.",
        { honor: -1, lineage: 1 },
        "g5_signed_and_survived",
      ),
      beat(
        "A young executive asks whether the name is still worth his career.",
        "Tell him the truth: the house was tested and held — that is what a name is for.",
        { reach: 1, lineage: 1 },
        "g5_renewed_the_name",
      ),
    ],
  ),

  // ── g6 — Prime Time Dominion (broadcast era, the control room, the platform) ──
  inter(
    "g6:broadcast",
    "tex",
    "spine:g6:broadcast:open",
    "sight",
    [
      "Behind the glass of the control room the bank of monitors threw a flickering blue light across {given_name} {surname}'s face, fifty feeds of a country talking to itself through a signal the family owned. The {family_name} network did not merely report the national story — it decided which story the nation would agree it was living in, and that power was newer and stranger than any the line had held before.",
      "Influence at the speed of broadcast was a different beast from wealth or even law. A choice made in this room at six o'clock was a fact in forty million homes by seven, and {given_name} understood that the family had become less a dynasty of owners than a dynasty of editors — shapers of the very air. What the house chose to amplify or bury now would compound, image upon image, into the temper of an age.",
    ],
    [
      beat(
        "Across the bank of monitors the feeds cut and dissolve, the nation's attention pooling where you point it.",
        "Hold a segment back tonight — let the rivals run it first and own the fallout.",
        { power: 1, honor: 1 },
        "g6_held_the_segment",
      ),
      beat(
        "A producer asks which version of the day's story leads the broadcast.",
        "Choose the version that serves the house's longer story, not the night's ratings.",
        { politics: 1, reach: 1 },
        "g6_shaped_the_narrative",
      ),
    ],
  ),
  inter(
    "g6:broadcast",
    "csq",
    "spine:g6:broadcast:platform",
    "sound",
    [
      "The switchboard told the story before any executive could: lines overloaded, affiliates calling in, the low hum of a country reacting all at once to having been told what it was. {given_name} {surname} read the noise like a meter — to shape the national story is to be answerable to everyone who heard it, in the same instant they hear it.",
      "The consequence rippled outward at the speed of the signal itself. Advertisers recalculated; politicians who had courted the network now feared or flattered it; rival broadcasters defined themselves against the {family_name} line. The era of mass attention rewarded boldness and punished it in the same breath, and {given_name} saw that the platform chosen here would become the frame through which a generation understood its own country.",
    ],
    [
      beat(
        "You scan the overnight numbers and the angry wires together, weighing reach against heat.",
        "Lean into the controversy; attention is the only inventory that never spoils.",
        { reach: 1, honor: 1 },
        "g6_leaned_into_heat",
      ),
      beat(
        "An anchor who carries the family's voice asks whether the line has gone too far.",
        "Reassure him the house knows exactly how far it has gone — and why.",
        { power: 1, worldview: -1 },
        "g6_steadied_the_voice",
      ),
    ],
  ),

  // ── g7 — The Sovereign Algorithm (networked age, the server farm, the doctrine) ──
  inter(
    "g7:networked",
    "tex",
    "spine:g7:networked:open",
    "touch",
    [
      "The cold aisle of the server farm pushed a dry, refrigerated wind against {given_name} {surname}'s skin, the breath of machines that now held more of the family's true wealth than any vault ever had — not gold, not even attention, but the patterns of a billion lives, rendered into data the {family_name} systems could read better than the people who lived them. Power had become quiet, ambient, and almost invisible.",
      "The networked age had dissolved the old distinction between owning a thing and knowing it. To hold the data was to hold a kind of sovereignty no constitution had anticipated, and {given_name} understood that the doctrine the family wrote for this technology — what it would gather, what it would refuse, whom it would serve — would govern not just the house but the texture of freedom itself for those who came after.",
    ],
    [
      beat(
        "You walk the humming aisles, the family's reach reduced to blinking light and cold air.",
        "Order the systems to gather everything now and decide later what it means.",
        { reach: 1, worldview: 1 },
        "g7_gathered_everything",
      ),
      beat(
        "An engineer asks where the line is — what the house will and will not know about people.",
        "Set a limit and write it into the architecture, where no quarterly pressure can move it.",
        { honor: -1, worldview: 1 },
        "g7_set_the_limit",
      ),
    ],
  ),
  inter(
    "g7:networked",
    "csq",
    "spine:g7:networked:doctrine",
    "sight",
    [
      "On a wall of dashboards the doctrine's first effects were already scrolling past — adoption curves, sentiment graphs, the slow visible bending of behavior toward what the family's systems rewarded. {given_name} {surname} watched it the way one watches weather form: a doctrine written into code does not argue, it simply becomes the world its users live in.",
      "The reckoning, when it came, came in many registers at once: regulators in three capitals opening files, a press cycle naming the family the architect of the age, brilliant engineers choosing whether the {family_name} name was one to build under or to resist. And the rival houses of the network era, reading the doctrine, moved to copy or to counter it — so that this single architectural choice set the grammar of power for everyone who would live inside the machine the family had built.",
    ],
    [
      beat(
        "On the dashboards the doctrine takes hold in real time, behavior bending to the design.",
        "Hold the course; an architecture is only sovereign if its author does not flinch.",
        { power: 1, worldview: 1 },
        "g7_held_the_architecture",
      ),
      beat(
        "A regulator requests a private meeting, the file already thick on the table.",
        "Go yourself, unscripted; a doctrine is easier to defend in person than in a deposition.",
        { politics: 1, honor: -1 },
        "g7_faced_the_regulator",
      ),
    ],
  ),

  // ── g8 — The Cold Gravity of Ambition (orbital age, the high shipyards, the turn) ──
  inter(
    "g8:orbital",
    "tex",
    "spine:g8:orbital:open",
    "sight",
    [
      "From the high-gantry shipyards of the orbital ring the curve of the world was a hard, bright arc, and {given_name} {surname} floated at the viewport where ancestors had once stood at windows over cities, master now of a house whose frontier was the dark itself. The {family_name} line had carried its name off the planet that bore it, and the old human measures — borders, nations, even gravity — had begun to fall away as quaint.",
      "Ambition in the orbital age had a cold arithmetic: the cost of lifting a kilogram, the delta-v to a moon, the years a colony would take to pay for itself. {given_name} understood that the family stood at a true turn — the moment a dynasty either reaches outward and becomes something the founders could never have imagined, or pulls back and watches a rival house claim the high ground of the entire future.",
    ],
    [
      beat(
        "You hang weightless at the great viewport, the homeworld small enough to cover with a thumb.",
        "Commit the next decade's capital to the deepest reach the house can survive.",
        { reach: 1, lineage: 1 },
        "g8_committed_to_the_deep",
      ),
      beat(
        "A flight director asks whether the family builds for return or for permanence out here.",
        "Tell her permanence; a house that plans to come home has already lost the frontier.",
        { worldview: 1, reach: 1 },
        "g8_built_for_permanence",
      ),
    ],
  ),
  inter(
    "g8:orbital",
    "csq",
    "spine:g8:orbital:turn",
    "touch",
    [
      "A faint, constant thrum ran through the shipyards now — the sound of the whole apparatus retooling, mass and money and ten thousand careers swinging onto a new heading like a station coming slowly about. {given_name} {surname} felt the decision in the deckplates before anyone spoke it aloud.",
      "Out here, consequence was measured in years and light-minutes, but it was no less certain. Supply lines stretched or snapped; a colony took its first breath or failed silently in the dark; and the other great houses of the orbital age, reading the {surname} turn across the void, committed or hedged in answer. The choice made in this generation would reach the next as accomplished fact — a frontier already won or already ceded by the time the heirs were old enough to ask why.",
    ],
    [
      beat(
        "All around, the yards retool — the house's whole mass swinging onto its new heading.",
        "Drive the schedule harder; in the orbital age, the first to arrive writes the rules.",
        { power: 1, reach: 1 },
        "g8_drove_the_schedule",
      ),
      beat(
        "A colony foreman signals back across the delay, asking only that the family not forget them out there.",
        "Promise them the name goes where they go — a dynasty is its farthest outpost.",
        { lineage: 1, reach: 1 },
        "g8_claimed_the_outpost",
      ),
    ],
  ),

  // ── g9 — The Archon of New Horizon (interstellar, the dreadnought, terminal expansion) ──
  inter(
    "g9:interstellar",
    "tex",
    "spine:g9:interstellar:open",
    "sound",
    [
      "The antimatter containment grid filled the dreadnought with a low, ceaseless thrum that {given_name} {surname} had stopped hearing and never stopped feeling, the heartbeat of a vessel that carried the {family_name} name between the stars. The line that had begun in a colonial workshop now spanned light-years, and the old questions of the founding — what the family owed, what it would risk, whom it would carry with it — had returned, transposed into a scale the first ancestors could not have dreamed.",
      "Interstellar expansion was the last and largest wager. Each seeded world was a generation's commitment that would not be answered in {given_name}'s lifetime, or the next, or the next; the dynasty had become a thing measured in centuries and parsecs. And {given_name} understood that this terminal reach — how far, how fast, at what cost to those aboard — was the choice toward which every generation since the founding had been quietly bending, the act that would decide what the whole long line had finally been for.",
    ],
    [
      beat(
        "You stand on the command deck as the stars wheel slow, the family's reach now measured in light.",
        "Order the deepest jump the line can sustain — the founders built toward this horizon.",
        { reach: 1, lineage: 1 },
        "g9_ordered_the_deep_jump",
      ),
      beat(
        "An archivist asks what record of the founding to carry to the new worlds.",
        "Carry all of it, flaws and all; a dynasty that forgets its origin has nothing to plant.",
        { lineage: 1, worldview: -1 },
        "g9_carried_the_origin",
      ),
    ],
  ),
  inter(
    "g9:interstellar",
    "csq",
    "spine:g9:interstellar:turn",
    "sight",
    [
      "Slow lights bloomed across the tactical display — seeded worlds, outbound ships, the {family_name} name spreading into a volume of space too large for any mind to hold at once. {given_name} {surname} stood before it and understood that to act on this scale is to launch consequences that will outlive not just the actor but the civilization that produced them.",
      "There would be no reckoning {given_name} would live to see — only the long unfolding, world by world, century by century, of a choice made on this deck. And in the dark between the stars, the other great lines that had carried their names outward read the {surname} expansion and answered in kind or in opposition, so that the contest begun in colonial counting-houses and Gilded Age exchanges reached its final form here: dynasties no longer competing for a country, but for the shape of the human future itself.",
    ],
    [
      beat(
        "You watch the seeded worlds kindle on the display, each one a promise you will not see kept.",
        "Trust the line to carry it forward; a dynasty's reward is a future it builds blind.",
        { lineage: 1, reach: 1 },
        "g9_trusted_the_line",
      ),
      beat(
        "The ship's last link to the homeworld asks for any word to send back before the deep jump.",
        "Send only this: the name went as far as it could, and carried everyone it could.",
        { honor: -1, lineage: 1 },
        "g9_sent_the_last_word",
      ),
    ],
  ),

  // ════ SPINE-ACT-DEPTH-2: a THIRD interstitial — a mid-act REVERSAL — for the four heaviest-arc acts ════
  // Placed AFTER the consequence scene, BEFORE the act's second decision (g9: before close): a complication
  // that arrives unbidden and recontextualizes the choice ahead. Decisionless, weave-only, falls forward.
  // Save-safe on SAGA-CLOCK-DECOUPLE (the extra scene no longer ages the line — texture passes 0 years).

  inter(
    "g0:founding",
    "rev",
    "spine:g0:founding:csq_aftermath",
    "sound",
    [
      "Word came at the worst hour, the way bad news learns to: a hammering at the shutters after midnight, a breathless apprentice, the name of a rival house spoken like a curse. The loyalist faction {given_name} {surname} had crossed was not content to lose quietly — they had moved against the family's standing on the frontier, whispering to the land-office clerks that a house of known rebels could not be trusted with a Crown grant the Crown might soon reclaim.",
      "Overnight the bargain ahead had changed its shape. What had looked like a simple purchase of acreage was now a contest of loyalties carried out in deeds and signatures, every clerk a potential friend or informer. {given_name} understood, with the cold clarity that comes only when a plan is already in motion, that the family's claim on the continent would have to be won twice now — once from the wilderness, and once from the men who would use the war's confusion to take what the {family_name} line had bled for.",
    ],
    [
      beat(
        "The rival's move is not an attack on your land but on your name's right to hold it — and that you can answer.",
        "Meet it head-on: make the family's claim so public that retracting it would shame the colony.",
        { power: 1, honor: 1 },
        "g0_forced_the_claim_public",
      ),
      beat(
        "A sympathetic clerk hints the records could be quietly set right — for a consideration.",
        "Decline the bribe and win him with the cause instead; a man bought once is bought by anyone.",
        { honor: -1, politics: 1 },
        "g0_won_the_clerk_clean",
      ),
    ],
  ),

  inter(
    "g3:gildedage",
    "rev",
    "spine:g3:gildedage:csq_venture",
    "touch",
    [
      "The telegram was thin paper but it sat in {given_name} {surname}'s hand like a stone: the venture that had bought the family its larger type had a flaw the prospectuses never mentioned, a tangle of overstated assets and friendly auditors that a rival's lawyers had just begun to pull at. In the Gilded Age a fortune and a fraud were often the same structure viewed from different angles, and someone with a motive had chosen this angle.",
      "The forge ahead — the great industrial commitment the family had been building toward — now depended on credit that this single thread could unravel. {given_name} felt the era's brutal logic close in: the same boldness that built an empire in a morning could lose it in an afternoon, and the question was no longer simply how to grow, but how to grow with a knife already at the house's throat.",
    ],
    [
      beat(
        "The rival's case has a weakest joint, where ambition outran the evidence.",
        "Break the attack at its source before it reaches a courtroom or a newspaper.",
        { power: 1, honor: 1 },
        "g3_broke_the_attack",
      ),
      beat(
        "An honest accountant offers to set the books truly right — at the cost of a public stumble.",
        "Take the honest loss now; a house that survives its own audit fears no one's.",
        { worldview: 1, honor: -1 },
        "g3_took_the_honest_loss",
      ),
    ],
  ),

  inter(
    "g8:orbital",
    "rev",
    "spine:g8:orbital:csq_turn",
    "sight",
    [
      "The alert came as a single red bloom on the status board, and then a silence {given_name} {surname} had learned to dread more than any noise: a forward outpost gone dark, its telemetry cut mid-transmission, eleven months of the family's reach erased in the time it took a relay to fail to answer. Out here, distance turned every setback into a mystery solved too late to matter.",
      "The transition ahead — the great reorientation of the line's orbital strategy — had assumed a frontier that held. Now {given_name} stood before the dark place on the board and understood that ambition at this scale was not a ladder climbed but a wager renewed each day against a void that did not negotiate. The question was no longer only which direction to reach, but whether to reach at all into a dark that had just shown what it could take.",
    ],
    [
      beat(
        "The last telemetry from the lost outpost reads like a lesson, if you are willing to learn it.",
        "Push on, but build the next reach to survive what killed the last — learn, don't retreat.",
        { reach: 1, worldview: 1 },
        "g8_learned_from_the_loss",
      ),
      beat(
        "The surviving crews signal, asking whether the family will spend more lives on the dark.",
        "Promise them the line spends nothing it will not answer for — and means to answer for this.",
        { honor: -1, lineage: 1 },
        "g8_answered_for_the_dark",
      ),
    ],
  ),

  inter(
    "g9:interstellar",
    "rev",
    "spine:g9:interstellar:csq_turn",
    "sound",
    [
      "It arrived as a whisper across decades of light — a signal from one of the first-seeded worlds, faint and time-lagged and utterly unexpected: the colony had not merely survived but had become something the {family_name} planners never modeled, a daughter-civilization with its own mind about what the dynasty's name should mean among the stars. The founders had planted a seed; it had grown into a question.",
      "The close ahead — the terminal reckoning of everything the line had reached for since a colonial workshop — now had to account for children grown beyond their parents' design. {given_name} {surname} understood that a dynasty large enough to span the stars was no longer a thing one mind could steer, and that the last choice might not be where to send the name, but whether to hold it closed against its own descendants or open it to what they had become.",
    ],
    [
      beat(
        "The daughter-world's signal carries both tribute and challenge, and asks to be answered as one or the other.",
        "Answer as kin, not as sovereign; a name that cannot share itself dies with its bearer.",
        { lineage: 1, reach: 1 },
        "g9_answered_as_kin",
      ),
      beat(
        "The bridge waits on whether to fold the new world into the dynasty's command or leave it free.",
        "Leave it free, and let the name mean a beginning given, not a chain imposed.",
        { honor: -1, worldview: 1 },
        "g9_left_the_world_free",
      ),
    ],
  ),
];

/** A scene id is a prior interstitial for an act if it matches the act prefix + :tex_, :csq_, or :rev_. */
function isInterstitialId(actId, id) {
  return (
    id.startsWith(`${actId}:tex_`) ||
    id.startsWith(`${actId}:csq_`) ||
    id.startsWith(`${actId}:rev_`)
  );
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

// Apply to every authored spine act (g0..g9). Each gets a TEXTURE (after open) + CONSEQUENCE (after the
// first major decision) interstitial — the same ~6-scene shape, the anti-sameness invariant preserved
// (the major DecisionArchitecture decisions remain the act's pivots).
const ACTS = [
  "spine:g0:founding",
  "spine:g1:earlyrepublic",
  "spine:g2:antebellum",
  "spine:g3:gildedage",
  "spine:g4:progressive",
  "spine:g5:midcentury",
  "spine:g6:broadcast",
  "spine:g7:networked",
  "spine:g8:orbital",
  "spine:g9:interstellar",
];
let total = 0;
for (const actId of ACTS) total += applyInterstitials(actId);

writeFileSync(PATH, `${JSON.stringify(doc, null, 1)}\n`);
console.log(`fs-spine-act-depth: inserted ${total} interstitial scene(s) across ${ACTS.length} acts.`);
