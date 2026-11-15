/** XP needed to go from `level` to `level + 1`. */
export const xpForLevel = (level) => 400 + level * 100;

/** Derive level and in-level XP from total experience. */
export function levelFromXp(totalXp) {
  let level = 1;
  let remaining = totalXp;
  while (remaining >= xpForLevel(level) && level < 99) {
    remaining -= xpForLevel(level);
    level += 1;
  }
  return { level, xpIntoLevel: remaining, xpToNext: xpForLevel(level) };
}
