import { describe, expect, it } from "vitest";
import {
  getPracticeOptions,
  getSelectedOptionIndex,
  getTopicMastery,
} from "@/lib/topicPractice";

describe("topic practice helpers", () => {
  it("normalizes array and keyed options to the values accepted by the answer checker", () => {
    const arrayOptions = getPracticeOptions(["Lagos", "Abuja"]);
    expect(arrayOptions.map((option) => [option.label, option.text, option.value])).toEqual([
      ["A", "Lagos", 0],
      ["B", "Abuja", 1],
    ]);

    const keyedOptions = getPracticeOptions({ B: "Abuja", A: "Lagos" });
    expect(keyedOptions.map((option) => [option.label, option.text, option.value])).toEqual([
      ["A", "Lagos", "A"],
      ["B", "Abuja", "B"],
    ]);
  });

  it("matches stored answers expressed as indices, letters, or option text", () => {
    const options = getPracticeOptions(["Lagos", "Abuja", "Kano"]);
    expect(getSelectedOptionIndex(options, 1)).toBe(1);
    expect(getSelectedOptionIndex(options, "B")).toBe(1);
    expect(getSelectedOptionIndex(options, "abuja")).toBe(1);
    expect(getSelectedOptionIndex(options, "not an option")).toBe(-1);
  });

  it("does not label mastery ready until there is a five-answer baseline", () => {
    expect(getTopicMastery(4, 4).label).toBe("Building a baseline");
    expect(getTopicMastery(5, 5).label).toBe("Ready");
    expect(getTopicMastery(5, 2).label).toBe("Needs revision");
    expect(getTopicMastery(0, 0).score).toBeNull();
  });
});
