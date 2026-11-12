import { describe, it, expect } from "vitest";
import { weeklySprintEnd, formatCountdown } from "@/lib/weeklySprint";

describe("weekly sprint", () => {
  it("ends at Monday 00:00 Lagos (Sunday 23:00 UTC)", () => {
    expect(weeklySprintEnd(new Date("2026-11-12T08:08:00Z")).toISOString()).toBe("2026-11-15T23:00:00.000Z");
  });
  it("Sunday late in Lagos still ends that night", () => {
    expect(weeklySprintEnd(new Date("2026-11-15T22:30:00Z")).toISOString()).toBe("2026-11-15T23:00:00.000Z");
  });
  it("Monday 00:30 Lagos starts a new week", () => {
    expect(weeklySprintEnd(new Date("2026-11-15T23:30:00Z")).toISOString()).toBe("2026-11-22T23:00:00.000Z");
  });
  it("formats countdown", () => {
    expect(formatCountdown((2 * 86400 + 14 * 3600 + 5 * 60) * 1000)).toBe("2d 14h 5m");
  });
});
