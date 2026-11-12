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
