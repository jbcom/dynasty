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

/**
 * G1 (Act II — The Crucible of the Young Republic, early republic ~1790s): the same five base-flavored
 * openings, diverting to the shared g1 `doctrine` scene. The existing maritime/shipwright `open` is the
 * press/commerce default. Voice matches the early-republic act (the young nation finding its feet).
 */
const G1_VARIANTS = [
  {
    id: "spine:g1:earlyrepublic:open_land",
    base: "land",
    sense: "sight",
    prose: [
      "From the porch of the new house {given_name} {surname} could see the whole of it: the cleared fields running down to the creek, the slave quarters and the tobacco barns, the survey line that the {family_name} name now held against the world. The Revolution was won, the king was gone, and a man who held land held a vote and a voice in the young republic's first quarrels. But the soil that made the family also bound it — to the crops, to the markets, and to the laboring hands whose freedom the new Constitution had carefully declined to settle.",
      "Word came up the river road of conventions and compromises, of a federal city to be raised from a Potomac swamp, of assumption and tariff and the slow knitting of thirteen jealous states into one. {given_name} weighed it all against the ledger of the harvest, knowing that whichever way the republic tilted — toward the merchants' bank or the planters' fields — the {family_name} acres would have to feed it either way.",
    ],
    beats: [
      {
        prose: ["A surveyor's letter offers western grant land, cheap, if you can hold it against squatters and the tribes."],
        choice: {
          text: "Stake the family's future on the frontier grants.",
          motivatorShift: { wealth: 1, reach: 1 },
          setFlags: ["g1_land_frontier_grants"],
          gather: true,
        },
      },
      {
        prose: ["The county calls for a man of standing to sit its new court and fix the boundaries of a hundred farms."],
        choice: {
          text: "Take the seat — land disputes are settled by those who hold the most.",
          motivatorShift: { power: 1, politics: 1 },
          setFlags: ["g1_land_county_court"],
          gather: true,
        },
      },
    ],
  },
  {
    id: "spine:g1:earlyrepublic:open_commerce",
    base: "commerce",
    sense: "smell",
    prose: [
      "Coffee, tar, and the ledger's iron-gall ink — the smells of the counting-house where {given_name} {surname} now traded under a flag the world did not yet wholly respect. The British ports were half-closed, the French were at war, and an American bottom carrying an American cargo ran a gauntlet of privateers and impressment — yet the same danger meant fortunes for the house bold enough to clear it. The {family_name} name was learning to be its own credit in a republic that had not yet built a bank to lend one.",
      "Word came up from the wharves of Hamilton's funding scheme, of a national debt made into a national asset, of a Bank of the United States that would either make the merchant class or break the planters who feared it. {given_name} read the pamphlets with a trader's eye, weighing which way to lean the house — for in the young republic, commerce was choosing the shape of the nation as surely as any vote.",
    ],
    beats: [
      {
        prose: ["A China-trade venture is forming — a single voyage that could double the house, or sink it whole."],
        choice: {
          text: "Buy a share of the East-Indies gamble.",
          motivatorShift: { wealth: 1, reach: 1 },
          setFlags: ["g1_commerce_china_trade"],
          gather: true,
        },
      },
      {
        prose: ["Hamilton's men seek subscribers to the new national bank — a chance to bind the house to federal power."],
        choice: {
          text: "Subscribe, and tie the family's fortune to the union itself.",
          motivatorShift: { politics: 1, power: 1 },
          setFlags: ["g1_commerce_bank_subscription"],
          gather: true,
        },
      },
    ],
  },
  {
    id: "spine:g1:earlyrepublic:open_pulpit",
    base: "pulpit",
    sense: "sound",
    prose: [
      "The new meetinghouse was raw pine still smelling of sap, and from its pulpit {given_name} {surname} addressed a congregation arguing, as the whole republic argued, over how free a free people ought to be. Disestablishment was spreading state by state; the old tax-supported churches were falling, and a minister now held his flock by conviction alone, not law. The {family_name} voice could still turn a county's conscience — toward the Federalists' ordered liberty or the Republicans' restless democracy — but it had to earn the hearing now.",
      "Word came up the post road of revival stirring on the frontier, of camp-meetings where thousands wept and were saved, of a Second Awakening that would remake American faith from the bottom up. {given_name} weighed the cold reason of the age of Jefferson against the hot conviction rising in the backcountry, knowing the pulpit that read the moment rightly would shape the soul of the young nation.",
    ],
    beats: [
      {
        prose: ["An itinerant revivalist asks leave to preach from your pulpit — fire that could fill the pews or split them."],
        choice: {
          text: "Open the meetinghouse to the awakening.",
          motivatorShift: { worldview: -1, reach: 1 },
          setFlags: ["g1_pulpit_revival"],
          gather: true,
        },
      },
      {
        prose: ["The state moves to end its church tax; the old guard begs you to defend establishment."],
        choice: {
          text: "Preach for a faith that needs no law to compel it.",
          motivatorShift: { worldview: -1, honor: -1 },
          setFlags: ["g1_pulpit_disestablishment"],
          gather: true,
        },
      },
    ],
  },
  {
    id: "spine:g1:earlyrepublic:open_law",
    base: "law",
    sense: "sight",
    prose: [
      "The new courthouse smelled of fresh plaster and ambition, and {given_name} {surname} read the republic's first quarrels in its docket: debt and contract, treason and sedition, the raw edges of a Constitution barely a decade old. The bar was where the young nation argued itself into being — where a lawyer who could marshal Blackstone and the new federal statutes alike could rise from the county court to the assembly, the Congress, perhaps the bench itself. The {family_name} name was being entered, case by case, into the record of how America would be governed.",
      "Word came down from the federal city of Marshall's court claiming the power to judge the law itself, of the Alien and Sedition Acts and the furious resolves against them, of a republic testing whether its own words bound its own rulers. {given_name} weighed each brief knowing that the precedents set now — by men exactly this obscure — would be the iron frame every later generation argued inside.",
    ],
    beats: [
      {
        prose: ["A sedition case lands on your desk: defend a printer the government wants silenced, or prosecute him."],
        choice: {
          text: "Defend the press, and make your name on the Constitution's edge.",
          motivatorShift: { politics: 1, honor: -1 },
          setFlags: ["g1_law_sedition_defense"],
          gather: true,
        },
      },
      {
        prose: ["A seat in the new state legislature is open to a lawyer who can be trusted to shape its first codes."],
        choice: {
          text: "Take it — the men who write the statutes outlast the men who argue them.",
          motivatorShift: { power: 1, politics: 1 },
          setFlags: ["g1_law_legislature"],
          gather: true,
        },
      },
    ],
  },
  {
    id: "spine:g1:earlyrepublic:open_military",
    base: "military",
    sense: "sound",
    prose: [
      "The fifes of the new federal army carried thin over the parade ground, and {given_name} {surname}, an officer of a republic that distrusted standing armies, heard in them both opportunity and warning. The Revolution's veterans were the young nation's natural aristocracy — the Society of the Cincinnati, the bounty-land warrants, the easy slide from a wartime commission to a peacetime governorship. The {family_name} sword had been drawn for independence; now it had to find its place in a country unsure whether it wanted soldiers at all.",
      "Word came up from the frontier of the tribes confederating against the settlements, of St. Clair's army shattered in the Ohio woods, of a republic forced to raise the very army it feared. {given_name} weighed a frontier command against the quieter ladder of militia rank and county office, knowing that in the young nation a reputation won under arms still opened every other door.",
    ],
    beats: [
      {
        prose: ["A commission in the Legion of the United States offers hard frontier service — and a national name."],
        choice: {
          text: "Take the frontier command, and win the family a federal reputation.",
          motivatorShift: { power: 1, reach: 1 },
          setFlags: ["g1_military_frontier_command"],
          gather: true,
        },
      },
      {
        prose: ["The Cincinnati offer the family a hereditary seat among the Revolution's officer-aristocracy."],
        choice: {
          text: "Accept the hereditary honor — and the whisper of an American nobility.",
          motivatorShift: { lineage: 1, honor: 1 },
          setFlags: ["g1_military_cincinnati"],
          gather: true,
        },
      },
    ],
  },
];

/**
 * G2 (Act III — The Sundered Threshold, antebellum / sectional crisis ~1840s-50s): the five base-flavored
 * openings, diverting to the shared g2 `allegiance` scene. The existing industrial/textile `open` is the
 * commerce/default. Voice: a nation pulling apart over slavery, expansion, and the coming war.
 */
const G2_VARIANTS = [
  {
    id: "spine:g2:antebellum:open_land",
    base: "land",
    sense: "smell",
    prose: [
      "The reek of green tobacco and turned red clay hung over the {family_name} fields, and {given_name} {surname} stood at the edge of the great house knowing the land had never been worth more — nor the bondage that worked it more bitterly contested. King Cotton had pushed the plantation frontier west to the black-soil prairies, and every acre the family held was a stake in a wager the whole republic was making: that the peculiar institution could expand forever. The price of land and the price of a human being had risen together, and the contradiction the founding generation had declined to settle was coming due.",
      "Word came up the river road of Kansas bleeding, of a senator caned on the Senate floor, of a Dred Scott decision that made the family's human property a constitutional right and a moral abyss in the same breath. {given_name} weighed the ledger of the harvest against the gathering storm, knowing that a line built on land worked by the enslaved was about to be asked, by history and by armies, what it truly was.",
    ],
    beats: [
      {
        prose: ["A neighbor presses you to join the filibusters pushing slavery into the western territories."],
        choice: {
          text: "Throw the family's weight behind expansion — the institution must grow or die.",
          motivatorShift: { power: 1, honor: 1 },
          setFlags: ["g2_land_expansionist"],
          gather: true,
        },
      },
      {
        prose: ["A Quaker cousin quietly asks whether the family has considered what the coming reckoning will cost."],
        choice: {
          text: "Hold your counsel — the land, and what works it, is not yours to question aloud.",
          motivatorShift: { tradition: -1, lineage: 1 },
          setFlags: ["g2_land_entrenched"],
          gather: true,
        },
      },
    ],
  },
  {
    id: "spine:g2:antebellum:open_commerce",
    base: "commerce",
    sense: "sound",
    prose: [
      "The telegraph key chattered its endless market news through the {family_name} counting-house, and {given_name} {surname} read in it a nation knitting itself together with rail and wire even as it tore itself apart over slavery. Northern mills spun Southern cotton; Northern banks financed Southern planters; the whole economy was a single body the politicians swore was two. A merchant house with ledgers on both sides of the line stood to profit from the union — and to be ruined by its breaking.",
      "Word came down the wire of tariff fights and a panic on the markets, of cotton factors overextended and railroads racing for the western trade. {given_name} weighed which way to lean the house as the sections drifted toward war, knowing that commerce had bound North and South too tightly for either to cut free without bleeding — and that the house that read the rupture early would survive it.",
    ],
    beats: [
      {
        prose: ["A railroad syndicate offers the house a stake in the line that will own the western trade."],
        choice: {
          text: "Buy in — the rails will outlast whatever war is coming.",
          motivatorShift: { wealth: 1, reach: 1 },
          setFlags: ["g2_commerce_railroad"],
          gather: true,
        },
      },
      {
        prose: ["Your Southern factors beg for credit as the sectional crisis spooks the Northern banks."],
        choice: {
          text: "Quietly call in the Southern debts before the storm breaks.",
          motivatorShift: { wealth: 1, honor: 1 },
          setFlags: ["g2_commerce_hedged_the_war"],
          gather: true,
        },
      },
    ],
  },
  {
    id: "spine:g2:antebellum:open_pulpit",
    base: "pulpit",
    sense: "sound",
    prose: [
      "The congregation's hymn died away and the meetinghouse held its breath, for {given_name} {surname} was about to preach on the one subject that had already split the great denominations North from South: slavery. The Methodists had cleaved, the Baptists had cleaved, and a minister who named the institution sin or sanction could empty half the pews either way. The {family_name} pulpit had moral weight in the county — and the coming war would be fought, in part, over which scripture the nation believed.",
      "Word came up the post road of Beecher's rifles and Garrison's burning of the Constitution, of a fugitive dragged back to bondage under federal law while crowds wept and raged. {given_name} weighed the gospel of order against the gospel of the oppressed, knowing the pulpit that spoke now would help decide whether the county marched to war for the Union, for the South, or not at all.",
    ],
    beats: [
      {
        prose: ["An abolitionist circuit-rider asks to thunder against slavery from your pulpit."],
        choice: {
          text: "Give him the pulpit — call the institution the sin it is.",
          motivatorShift: { worldview: -1, honor: -1 },
          setFlags: ["g2_pulpit_abolitionist"],
          gather: true,
        },
      },
      {
        prose: ["Deacons warn that naming slavery a sin will split the congregation as it split the denominations."],
        choice: {
          text: "Preach union and forbearance — hold the flock together above the quarrel.",
          motivatorShift: { power: 1, tradition: -1 },
          setFlags: ["g2_pulpit_union_peace"],
          gather: true,
        },
      },
    ],
  },
  {
    id: "spine:g2:antebellum:open_law",
    base: "law",
    sense: "sight",
    prose: [
      "The statute books on the {family_name} shelf had doubled since the founding, and {given_name} {surname} read in them a republic arguing itself toward the precipice: Fugitive Slave Act, Compromise of 1850, the Kansas-Nebraska repeal of the old line. The law was where the sections fought before they fought with armies — every case a skirmish over whether the Constitution was a covenant for liberty or a bargain with bondage. A lawyer who could argue the great questions stood at the center of the storm, and on the road to the legislature, the Congress, perhaps the bench.",
      "Word came down from Washington of Dred Scott, of a Supreme Court declaring that a Black man had no rights a white man was bound to respect, of a Constitution twisted to make slavery national. {given_name} weighed each brief knowing the law itself was failing to hold the union together — and that the men arguing now would either find the words to save it or write the terms of its breaking.",
    ],
    beats: [
      {
        prose: ["A fugitive-slave case lands on your desk: enforce the federal law, or find the loophole that frees the man."],
        choice: {
          text: "Argue the higher law — no statute can make a man property.",
          motivatorShift: { politics: -1, honor: -1 },
          setFlags: ["g2_law_higher_law"],
          gather: true,
        },
      },
      {
        prose: ["A seat in Congress is open to a lawyer who can speak for the county in the great sectional debates."],
        choice: {
          text: "Take it — the union will be saved or lost in the chamber, not the courtroom.",
          motivatorShift: { power: 1, politics: 1 },
          setFlags: ["g2_law_congress"],
          gather: true,
        },
      },
    ],
  },
  {
    id: "spine:g2:antebellum:open_military",
    base: "military",
    sense: "sound",
    prose: [
      "The militia drums beat a sharper cadence now, and {given_name} {surname}, an officer in a country sliding toward civil war, heard in them the approach of the test every soldier secretly waits for. The veterans of Mexico were the rising commanders; West Point had trained a generation of officers who would soon face each other across the same fields. The {family_name} sword had a reputation in the county — and a war between the states would make or break it utterly, depending on which way the line drew its blade.",
      "Word came up from the territories of Bleeding Kansas, of John Brown's pikes and the arsenal at Harper's Ferry, of state militias arming on both sides of a line that no longer held. {given_name} weighed loyalty to the Union against loyalty to the section, knowing that the choice every officer in the country was about to be forced to make would define the family for a hundred years.",
    ],
    beats: [
      {
        prose: ["The state raises volunteer companies; a colonelcy is yours for the taking if you commit now."],
        choice: {
          text: "Raise the company — a war reputation is forged before the first battle.",
          motivatorShift: { power: 1, reach: 1 },
          setFlags: ["g2_military_raised_company"],
          gather: true,
        },
      },
      {
        prose: ["Old comrades on the other side of the line send word, asking which way your sword will turn."],
        choice: {
          text: "Hold your allegiance close — the line's survival may depend on choosing the winning side.",
          motivatorShift: { honor: 1, lineage: 1 },
          setFlags: ["g2_military_weighing_allegiance"],
          gather: true,
        },
      },
    ],
  },
];

/**
 * G3 (Act IV — The Iron and the Ivory, Gilded Age ~1870s-90s): the five base-flavored openings, diverting
 * to the shared g3 `venture` scene. The existing Broad-Street-exchange `open` is the commerce/default.
 * Voice: industrial colossus, robber-baron capital, labor war, the great fortunes and their reckonings.
 */
const G3_VARIANTS = [
  {
    id: "spine:g3:gildedage:open_land",
    base: "land",
    sense: "sight",
    prose: [
      "From the high window of the new railroad hotel {given_name} {surname} looked out over a continent the {family_name} land had helped to fence: cattle ranges the size of European duchies, wheat seas broken by combine and rail, and the western grants the family had banked on for a century now thick with settlers paying rent. The Gilded Age turned land into an empire of yield — but the homestead myth was souring into tenancy and mortgage, and the Granger and Populist farmers were beginning to ask who really owned the West.",
      "Word came up the line of railroad land-grant scandals, of bonanza farms and busted homesteaders, of a frontier the census would soon declare closed. {given_name} weighed the family's vast holdings against the rising fury of the men who worked them, knowing that in this age land was no longer just acreage — it was a financial instrument, leveraged and mortgaged, as exposed to the panic as any stock.",
    ],
    beats: [
      {
        prose: ["A railroad combine offers to buy the family's western grants at a baron's price — or freeze them out."],
        choice: {
          text: "Sell into the boom and convert the land to capital.",
          motivatorShift: { wealth: 1, reach: 1 },
          setFlags: ["g3_land_sold_to_capital"],
          gather: true,
        },
      },
      {
        prose: ["Granger organizers ask the family to side with the farmers against the railroad's freight rates."],
        choice: {
          text: "Hold the land + the tenants — a landed dynasty outlasts a paper one.",
          motivatorShift: { lineage: 1, tradition: -1 },
          setFlags: ["g3_land_held_the_acres"],
          gather: true,
        },
      },
    ],
  },
  {
    id: "spine:g3:gildedage:open_pulpit",
    base: "pulpit",
    sense: "sound",
    prose: [
      "The new stone church the {family_name} money had built could seat a thousand, and {given_name} {surname} preached now to a city swollen with immigrants, factory smoke, and inequalities the founders never imagined. The Gilded Age was an age of gospels at war: the Gospel of Wealth that blessed the great fortunes as stewardship, and the Social Gospel that called the tenement a sin upon the nation. The {family_name} pulpit could sanctify the new Carnegies or thunder against them — and a city of the desperate was listening.",
      "Word came up the avenue of Moody's revivals filling halls by the thousands, of settlement houses and temperance crusades, of a labor movement quoting scripture against the owners. {given_name} weighed the comfort of the moneyed pews against the multitude outside them, knowing the pulpit that named this age's true gospel would shape whether the century's faith served the fortune or the forgotten.",
    ],
    beats: [
      {
        prose: ["A steel magnate offers to endow the church handsomely — if the sermons bless the Gospel of Wealth."],
        choice: {
          text: "Take the endowment — wealth, rightly stewarded, is God's work.",
          motivatorShift: { wealth: 1, worldview: -1 },
          setFlags: ["g3_pulpit_gospel_of_wealth"],
          gather: true,
        },
      },
      {
        prose: ["A Social Gospel reformer begs the pulpit to name the tenement and the sweatshop as sin."],
        choice: {
          text: "Preach the Social Gospel — the church belongs to the least of these.",
          motivatorShift: { worldview: -1, honor: -1 },
          setFlags: ["g3_pulpit_social_gospel"],
          gather: true,
        },
      },
    ],
  },
  {
    id: "spine:g3:gildedage:open_law",
    base: "law",
    sense: "sight",
    prose: [
      "The mahogany and brass of the corporate law office gleamed with new money, and {given_name} {surname} read in the statute books the great legal invention of the age: the corporation as a person, the trust as an empire, the injunction as a weapon against the strike. The Gilded Age was lawyered into being — the Fourteenth Amendment's protections turned from the freedman to the railroad, the Sherman Act written and then defanged. A lawyer who could build a trust or break a union stood at the right hand of the century's power, and the {family_name} name was already on the great retainers.",
      "Word came down from Washington of the great combinations and the first stirrings of antitrust, of Pullman and Haymarket and the courts enjoining the workers, of a Supreme Court remaking the Constitution into a charter for capital. {given_name} weighed the fortunes to be made serving the trusts against the reformers' rising demand to break them, knowing the law was, as ever, where the age decided who would be allowed to rule.",
    ],
    beats: [
      {
        prose: ["A railroad trust retains the family to architect the holding company that will swallow its rivals."],
        choice: {
          text: "Build the trust — the corporation is the new sovereign, and you draft its charter.",
          motivatorShift: { wealth: 1, power: 1 },
          setFlags: ["g3_law_built_the_trust"],
          gather: true,
        },
      },
      {
        prose: ["A reform coalition asks the family's name behind the new antitrust prosecutions."],
        choice: {
          text: "Take the reform brief — the law that made the trusts can break them.",
          motivatorShift: { politics: -1, honor: -1 },
          setFlags: ["g3_law_trustbuster"],
          gather: true,
        },
      },
    ],
  },
  {
    id: "spine:g3:gildedage:open_military",
    base: "military",
    sense: "sound",
    prose: [
      "The bugle on the parade ground sounded thinner in peacetime, and {given_name} {surname}, an officer between the Civil War's memory and the Spanish War's approach, heard in it the awkward place of the sword in an age of money. The Gilded Age soldier policed the frontier against the last free tribes and, more and more, the strike against the workers — the militia and the federal troops called out to Pullman and Homestead. The {family_name} commission still carried weight, but the century was asking what, exactly, an army was for when the real power sat in the counting-house.",
      "Word came up from the West of Wounded Knee and the closing of the frontier, of regiments marched into mill towns to break the great strikes, of jingoes already beating the drum for an overseas empire. {given_name} weighed the dwindling glory of frontier duty against the ugly work of strikebreaking and the coming imperial adventure, knowing the officer who chose his war rightly could still ride reputation into power.",
    ],
    beats: [
      {
        prose: ["The governor orders your regiment to break a steel strike — bayonets against the family's own workers."],
        choice: {
          text: "March on the strikers — order is order, and the owners remember who kept it.",
          motivatorShift: { power: 1, honor: 1 },
          setFlags: ["g3_military_broke_the_strike"],
          gather: true,
        },
      },
      {
        prose: ["Imperialists court you for the coming overseas war — glory and rank in a new American empire."],
        choice: {
          text: "Angle for the imperial command — the next great reputations will be won abroad.",
          motivatorShift: { reach: 1, power: 1 },
          setFlags: ["g3_military_imperial_turn"],
          gather: true,
        },
      },
    ],
  },
  {
    id: "spine:g3:gildedage:open_press",
    base: "press",
    sense: "sight",
    prose: [
      "The presses in the {family_name} basement ran in five-story thunder now, and {given_name} {surname} stood over a newsroom that could make a war, a president, or a panic before breakfast. The Gilded Age was the dawn of the mass daily — Pulitzer and Hearst turning the front page into a weapon, the muckrakers turning it into a conscience. A family that owned a great paper owned a slice of the public mind in an age when the public was, for the first time, a national audience reachable in a single morning.",
      "Word came up from the composing room of circulation wars and yellow journalism, of exposés that toppled trusts and headlines that started them, of a press torn between the advertisers who paid and the readers who trusted. {given_name} weighed sensation against substance, knowing the paper that chose rightly in this age would shape not just opinion but the century's idea of the truth itself.",
    ],
    beats: [
      {
        prose: ["A circulation war beckons: run the lurid front page that sells, or the sober one that lasts."],
        choice: {
          text: "Run the sensation — circulation is power, and power makes the rules later.",
          motivatorShift: { reach: 1, honor: 1 },
          setFlags: ["g3_press_yellow_journalism"],
          gather: true,
        },
      },
      {
        prose: ["A muckraker brings you a trust-busting exposé that will cost the paper its biggest advertiser."],
        choice: {
          text: "Print it — the press that fears its advertisers is no press at all.",
          motivatorShift: { worldview: 1, honor: -1 },
          setFlags: ["g3_press_muckraker"],
          gather: true,
        },
      },
    ],
  },
];

/**
 * Apply one act's base-flavored opening variants, idempotently: each variant scene is gated on its
 * `base:*` flag + diverts to `divertTo` (skipping the default `open`); the default `open` is gated to NOT
 * fire for any covered base (so an uncovered/default base — press at g0 — gets it). `actId` is the act,
 * `openId` its default opening scene, `divertTo` the scene the variants jump forward to.
 */
function applyAct(actId, openId, divertTo, variants) {
  const ids = variants.map((v) => v.id);
  const act = doc.acts.find((a) => a.id === actId);
  if (!act) throw new Error(`no act ${actId}`);
  // 1. drop any prior variant scenes (idempotent re-apply).
  doc.scenes = doc.scenes.filter((s) => !ids.includes(s.id));
  act.scenes = act.scenes.filter((id) => !ids.includes(id));
  // 2. build the gated variant scenes (each diverts past the default open to divertTo).
  const built = variants.map((v) => ({
    id: v.id,
    sense: v.sense,
    requires: { flags: [`base:${v.base}`], notFlags: [] },
    next: divertTo,
    prose: v.prose,
    beats: v.beats,
  }));
  // 3. insert before the default open in the scenes array (resolveEligible walks act.scenes in order).
  const openIdx = doc.scenes.findIndex((s) => s.id === openId);
  if (openIdx < 0) throw new Error(`no ${openId}`);
  doc.scenes.splice(openIdx, 0, ...built);
  // 4. prepend the variant ids before the default open in the act's scene list.
  const openListIdx = act.scenes.indexOf(openId);
  act.scenes.splice(openListIdx, 0, ...ids);
  // 5. gate the default open to NOT fire for a covered base (the divert already skips it; this is explicit).
  const open = doc.scenes.find((s) => s.id === openId);
  open.requires = { flags: [], notFlags: variants.map((v) => `base:${v.base}`) };
  return built.length;
}

const n0 = applyAct(
  "spine:g0:founding",
  "spine:g0:founding:open",
  ALLEGIANCE,
  VARIANTS,
);
const n1 = applyAct(
  "spine:g1:earlyrepublic",
  "spine:g1:earlyrepublic:open",
  "spine:g1:earlyrepublic:doctrine",
  G1_VARIANTS,
);
const n2 = applyAct(
  "spine:g2:antebellum",
  "spine:g2:antebellum:open",
  "spine:g2:antebellum:allegiance",
  G2_VARIANTS,
);
const n3 = applyAct(
  "spine:g3:gildedage",
  "spine:g3:gildedage:open",
  "spine:g3:gildedage:venture",
  G3_VARIANTS,
);

writeFileSync(PATH, `${JSON.stringify(doc, null, 1)}\n`);
console.log(`inserted base-variant openings — g0: ${n0}, g1: ${n1}, g2: ${n2}, g3: ${n3}`);
