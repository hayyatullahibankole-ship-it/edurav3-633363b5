export const SIGNUP_TRIAL_DAY_OPTIONS = [0, 3, 7] as const;
export const MANUAL_TRIAL_DAY_OPTIONS = ["3", "7"] as const;

export type SignupTrialDays = (typeof SIGNUP_TRIAL_DAY_OPTIONS)[number];
export type ManualTrialDays = (typeof MANUAL_TRIAL_DAY_OPTIONS)[number];

export function normalizeSignupTrialDays(value: string | null | undefined): SignupTrialDays {
  if (value === "3") return 3;
  if (value === "7") return 7;
  return 0;
}

export function isManualTrialDayOption(value: string): value is ManualTrialDays {
  return value === "3" || value === "7";
}