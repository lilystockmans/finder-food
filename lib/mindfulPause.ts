/**
 * Mindful pause: a body-check before logging a likely second helping.
 *
 * Design constraints, all deliberate:
 *
 * - It asks about HUNGER, never about the food. There is no prompt on snacks,
 *   cookies or anything else deemed "unhealthy", and nothing here passes a
 *   verdict on what was eaten. Questioning the food is the pattern that turns
 *   into guilt, and for some people into eating more after a "failed" day.
 *
 * - It never prevents logging. An unlogged meal is worse than an unexamined one,
 *   because it corrupts the data the rest of the app depends on.
 *
 * - The trigger is a TIME GAP, not simply a second entry in a slot. Measured
 *   across 21 logged days of real data, 29% of day-slot pairs already hold 2+
 *   entries, because the components of one meal get logged separately — one
 *   dinner had three. A naive "second entry" rule would fire roughly once a day
 *   on completely ordinary behaviour and train the user to dismiss it unread.
 *
 *   Of 21 real gaps between consecutive same-slot entries, 16 were under 25
 *   minutes (one sitting) and 5 were longer. Beyond about 3 hours it is a
 *   separate eating occasion rather than a second helping: the data contains a
 *   654-minute and a 166-minute gap, both clearly separate meals.
 */

/** Below this, the entries belong to one sitting. */
export const PAUSE_MIN_GAP_MS = 25 * 60 * 1000;
/**
 * Above this it is a separate eating occasion, not a second helping.
 *
 * Replaying real history at a 3-hour ceiling fired on a 174-minute and a
 * 166-minute breakfast gap, both of which are plainly brunch rather than going
 * back for more. 2 hours matches what "second helping" actually means.
 */
export const PAUSE_MAX_GAP_MS = 2 * 60 * 60 * 1000;
/**
 * A real portion has to already be logged in the slot.
 *
 * Without this the replay fired on a 23 kcal and a 28 kcal prior entry — logging
 * a coffee and then eating breakfast. That is a first meal, not a second helping,
 * and prompting there teaches the user the question is noise.
 */
export const PAUSE_MIN_SLOT_KCAL = 150;
/** Seconds the primary action waits, so the question gets a moment's thought. */
export const PAUSE_SECONDS = 10;

export type PauseSkipReason =
  | 'disabled'
  | 'already-shown-this-slot'
  | 'not-today'
  | 'first-in-slot'
  | 'same-sitting'
  | 'separate-occasion'
  | 'nothing-substantial-yet';

export type PauseDecision =
  | { show: false; reason: PauseSkipReason }
  | { show: true; gapMinutes: number; slotKcalSoFar: number };

export type SlotEntry = { timestampMs: number; totalKcal: number };

export function shouldPause(opts: {
  enabled: boolean;
  /** Already shown for this date+slot — cap at one per slot per day. */
  alreadyShown: boolean;
  /** Logging against today, not backfilling an earlier date. */
  isToday: boolean;
  /** Existing entries already logged in this date+slot. */
  slotEntries: SlotEntry[];
  nowMs: number;
}): PauseDecision {
  const { enabled, alreadyShown, isToday, slotEntries, nowMs } = opts;

  if (!enabled) return { show: false, reason: 'disabled' };
  if (alreadyShown) return { show: false, reason: 'already-shown-this-slot' };
  // Backfilling an earlier day is bookkeeping. Asking whether you are still
  // hungry about a dinner from Tuesday is meaningless.
  if (!isToday) return { show: false, reason: 'not-today' };
  if (slotEntries.length === 0) return { show: false, reason: 'first-in-slot' };

  const latest = Math.max(...slotEntries.map((e) => e.timestampMs));
  const gap = nowMs - latest;

  if (gap < PAUSE_MIN_GAP_MS) return { show: false, reason: 'same-sitting' };
  if (gap > PAUSE_MAX_GAP_MS) return { show: false, reason: 'separate-occasion' };

  const slotKcalSoFar = Math.round(slotEntries.reduce((s, e) => s + e.totalKcal, 0));
  if (slotKcalSoFar < PAUSE_MIN_SLOT_KCAL) {
    return { show: false, reason: 'nothing-substantial-yet' };
  }

  return { show: true, gapMinutes: Math.round(gap / 60000), slotKcalSoFar };
}

/** kv key for the once-per-slot-per-day cap. */
export function pauseShownKey(date: string, slot: string): string {
  return `ff:pause_shown:${date}:${slot}`;
}
