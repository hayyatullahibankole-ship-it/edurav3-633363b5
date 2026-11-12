// Pure rules for the Edura Games Arcade.

/** XP shown on the 15-step Millionaire ladder (index 0 = question 1). */
export const MILLIONAIRE_LADDER = [
  100, 200, 300, 500, 1000,
  2000, 4000, 8000, 16000, 32000,
  64000, 125000, 250000, 500000, 1000000,
];

/** Questions 5 and 10 are safe havens: XP there is kept even after a wrong answer. */
export const SAFE_HAVEN_STEPS = [5, 10];

/** XP kept when a player misses after answering `correctCount` questions correctly. */
export function millionaireXpOnMiss(correctCount: number): number {
  const reached = SAFE_HAVEN_STEPS.filter((s) => s <= correctCount);
  if (!reached.length) return 0;
  return MILLIONAIRE_LADDER[reached[reached.length - 1] - 1];
}

/** XP kept when a player walks away after `correctCount` correct answers. */
export function millionaireXpOnWalkAway(correctCount: number): number {
  return correctCount <= 0 ? 0 : MILLIONAIRE_LADDER[Math.min(correctCount, 15) - 1];
}

export const BLITZ_START_SECONDS = 60;
export const BLITZ_CORRECT_BONUS = 2;
export const BLITZ_WRONG_PENALTY = 3;

/** Streak multiplier: 1x, then 2x from 3 in a row, 3x from 6, 4x from 9. */
export function blitzMultiplier(streak: number): number {
  if (streak >= 9) return 4;
  if (streak >= 6) return 3;
  if (streak >= 3) return 2;
  return 1;
}

export interface BlitzState { secondsLeft: number; streak: number; score: number; }

export function applyBlitzAnswer(state: BlitzState, correct: boolean): BlitzState {
  if (!correct) {
    return { ...state, streak: 0, secondsLeft: Math.max(0, state.secondsLeft - BLITZ_WRONG_PENALTY) };
  }
  const streak = state.streak + 1;
  return {
    streak,
    score: state.score + 10 * blitzMultiplier(streak),
    secondsLeft: state.secondsLeft + BLITZ_CORRECT_BONUS,
  };
}

/** Pick which option indexes to hide for 50/50: two wrong ones, never the correct one. */
export function fiftyFiftyHide(optionCount: number, correctIndex: number, rand = Math.random): number[] {
  const wrong = Array.from({ length: optionCount }, (_, i) => i).filter((i) => i !== correctIndex);
  for (let i = wrong.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [wrong[i], wrong[j]] = [wrong[j], wrong[i]];
  }
  return wrong.slice(0, Math.min(2, wrong.length));
}

const BEST_KEY = "edura-arcade-best";
export function getBestScores(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(BEST_KEY) || "{}"); } catch { return {}; }
}
export function saveBestScore(game: string, score: number): boolean {
  const all = getBestScores();
  if (score <= (all[game] ?? 0)) return false;
  all[game] = score;
  localStorage.setItem(BEST_KEY, JSON.stringify(all));
  return true;
}

// ---------- Survival ----------
export const SURVIVAL_HEARTS = 3;
/** Points per right answer grow every 5 correct: 10, 20, 30... */
export const survivalPoints = (correctSoFar: number) => 10 * (Math.floor(correctSoFar / 5) + 1);

// ---------- Formula Match ----------
export const MATCH_ROUND_PAIRS = 6;
export const MATCH_START_SECONDS = 90;
/** Score: 100 per pair, minus 20 per miss, plus 5 per second left. Never below 0. */
export const matchScore = (pairs: number, misses: number, secondsLeft: number) =>
  Math.max(0, pairs * 100 - misses * 20 + secondsLeft * 5);

// ---------- Word Buster ----------
/** Same word for everyone on a given Lagos date. */
export function dailyIndex(date: Date, length: number): number {
  const lagos = new Date(date.getTime() + 60 * 60 * 1000);
  const days = Math.floor(lagos.getTime() / 86_400_000);
  return ((days % length) + length) % length;
}
export function scramble(word: string, rand = Math.random): string {
  if (new Set(word).size < 2) return word;
  let out = word;
  while (out === word) {
    const a = word.split("");
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    out = a.join("");
  }
  return out;
}
/** 100 base, -25 per hint, -10 per wrong guess, min 10 when solved. */
export const wordScore = (hints: number, wrong: number) => Math.max(10, 100 - hints * 25 - wrong * 10);

// ---------- Levels (shared) ----------
/** Level goes up every `per` correct answers, starting at 1. */
export const levelFromCount = (correct: number, per = 5) => Math.floor(correct / per) + 1;
export function getBestLevel(game: string): number {
  try { return Number(JSON.parse(localStorage.getItem("edura_arcade_levels") || "{}")[game] || 0); } catch { return 0; }
}
export function saveBestLevel(game: string, level: number) {
  try {
    const all = JSON.parse(localStorage.getItem("edura_arcade_levels") || "{}");
    if (level > (all[game] || 0)) { all[game] = level; localStorage.setItem("edura_arcade_levels", JSON.stringify(all)); }
  } catch { /* ignore */ }
}
/** Formula Match: level 1 = 4 pairs/60s; each level adds a pair (max 10) and the clock gets tighter. */
export function matchLevelConfig(level: number) {
  const pairs = Math.min(3 + level, 10);
  return { pairs, seconds: Math.max(30, pairs * 15 - (level - 1) * 5) };
}
/** Word Buster: 3 tries per run; each solved word is one level, words ordered shortest first. */
export const WORD_TRIES = 3;
export const wordsByDifficulty = <T extends { word: string }>(words: T[]) =>
  [...words].sort((a, b) => a.word.length - b.word.length || a.word.localeCompare(b.word));
