import type { Rng } from "./rng";

/**
 * BIRTH DATE (OB-2). Geography (place) and chronology (era/date) are separate concerns. The
 * player chooses WHERE; the doctor/midwife — diegetically — records WHEN: the YEAR comes from
 * the era, but the MONTH + DAY are drawn from the buried world seed (a date is world-flavor,
 * not an identity choice). The full date is narrated in the birth beat ("…born Sep 6, 1885.").
 * Pure + seeded — same rng → same date, so a saved run reconstructs it bit-for-bit.
 */

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** Days in each month (non-leap; Feb capped at 28 so every drawn date is always valid). */
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export interface BirthDate {
  /** 1–12. */
  month: number;
  /** 1–(days in that month). */
  day: number;
}

/** Draw a valid {month, day} from the seed (year is supplied separately by the era). */
export function drawBirthDate(rng: Rng): BirthDate {
  const month = rng.fork("birth:month").int(1, 12);
  const maxDay = DAYS_IN_MONTH[month - 1] ?? 30;
  const day = rng.fork("birth:day").int(1, maxDay);
  return { month, day };
}

/** Narrate a full birth date the way the doctor's notes read: "September 6, 1885". */
export function formatBirthDate(date: BirthDate, year: number): string {
  const month = MONTHS[date.month - 1] ?? "—";
  return `${month} ${date.day}, ${year}`;
}
