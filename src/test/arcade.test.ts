import { describe, it, expect } from "vitest";
import { millionaireXpOnMiss, millionaireXpOnWalkAway, applyBlitzAnswer, blitzMultiplier, fiftyFiftyHide, MILLIONAIRE_LADDER } from "@/lib/arcade";

describe("Millionaire rules", () => {
  it("has 15 steps", () => expect(MILLIONAIRE_LADDER).toHaveLength(15));
  it("keeps nothing before question 5", () => expect(millionaireXpOnMiss(4)).toBe(0));
  it("keeps question 5 safe haven", () => expect(millionaireXpOnMiss(7)).toBe(1000));
  it("keeps question 10 safe haven", () => expect(millionaireXpOnMiss(12)).toBe(32000));
  it("walk away keeps current step", () => expect(millionaireXpOnWalkAway(12)).toBe(125000));
});

describe("60-Second Blitz rules", () => {
  it("correct adds 2 seconds", () => expect(applyBlitzAnswer({ secondsLeft: 30, streak: 0, score: 0 }, true).secondsLeft).toBe(32));
  it("wrong removes 3 seconds and resets streak", () => {
    const s = applyBlitzAnswer({ secondsLeft: 30, streak: 5, score: 50 }, false);
    expect(s.secondsLeft).toBe(27); expect(s.streak).toBe(0);
  });
  it("multiplier 2x at 3 in a row, 4x at 9", () => { expect(blitzMultiplier(3)).toBe(2); expect(blitzMultiplier(9)).toBe(4); });
});

describe("50/50", () => {
  it("hides two wrong options, never the correct one", () => {
    const hidden = fiftyFiftyHide(4, 2);
    expect(hidden).toHaveLength(2); expect(hidden).not.toContain(2);
  });
});
