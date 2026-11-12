import { describe, expect, it } from "vitest";
import {
  isManualTrialDayOption,
  normalizeSignupTrialDays,
} from "@/lib/signupTrialSettings";

describe("signup free-access duration", () => {
  it("allows signup access to be off, 3 days, or 7 days only", () => {
    expect(normalizeSignupTrialDays("0")).toBe(0);
    expect(normalizeSignupTrialDays("3")).toBe(3);
    expect(normalizeSignupTrialDays("7")).toBe(7);
  });

  it("defaults unsupported or missing signup durations to no access", () => {
    expect(normalizeSignupTrialDays("30")).toBe(0);
    expect(normalizeSignupTrialDays("5")).toBe(0);
    expect(normalizeSignupTrialDays(null)).toBe(0);
  });

  it("allows manual free-access grants for 3 or 7 days only", () => {
    expect(isManualTrialDayOption("3")).toBe(true);
    expect(isManualTrialDayOption("7")).toBe(true);
    expect(isManualTrialDayOption("30")).toBe(false);
    expect(isManualTrialDayOption("0")).toBe(false);
  });
});