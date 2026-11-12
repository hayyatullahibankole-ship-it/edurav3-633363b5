import { describe, it, expect } from "vitest";
import { survivalPoints, matchScore, dailyIndex, scramble, wordScore } from "@/lib/arcade";
describe("survival", () => {
  it("points step up every 5 correct", () => {
    expect(survivalPoints(0)).toBe(10); expect(survivalPoints(4)).toBe(10);
    expect(survivalPoints(5)).toBe(20); expect(survivalPoints(12)).toBe(30);
  });
});
describe("formula match", () => {
  it("scores pairs, misses and time, never negative", () => {
    expect(matchScore(6, 2, 30)).toBe(600 - 40 + 150);
    expect(matchScore(0, 10, 0)).toBe(0);
  });
});
describe("word buster", () => {
  it("same day gives same word, next day differs", () => {
    const d = new Date("2026-11-12T10:00:00Z");
    expect(dailyIndex(d, 28)).toBe(dailyIndex(new Date("2026-11-12T20:00:00Z"), 28));
    expect(dailyIndex(new Date("2026-11-13T10:00:00Z"), 28)).toBe((dailyIndex(d, 28) + 1) % 28);
  });
  it("scramble keeps letters but changes order", () => {
    const s = scramble("OSMOSIS");
    expect(s).not.toBe("OSMOSIS"); expect([...s].sort().join("")).toBe([..."OSMOSIS"].sort().join(""));
  });
  it("score drops with hints and wrong guesses, min 10", () => {
    expect(wordScore(0, 0)).toBe(100); expect(wordScore(1, 2)).toBe(55); expect(wordScore(4, 5)).toBe(10);
  });
});
