import { describe, it, expect } from "vitest";
import { COMMENTARY, pickLine } from "@/lib/gameAudio";
describe("commentator", () => {
  it("picks a line belonging to the event", () => {
    expect(COMMENTARY.correct).toContain(pickLine("correct", () => 0.99));
    expect(pickLine("final", () => 0)).toBe(COMMENTARY.final[0]);
  });
});
