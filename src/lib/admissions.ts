import { COURSES, type Course } from "@/data/admissionsData";

export const AKBOY_CONSULTANT_WHATSAPP = "2348101466977";

/** True when 3 non-English subjects satisfy a course's JAMB combination. */
export function isEligible(course: Course, subjects: string[]): boolean {
  const picked = new Set(subjects);
  if (picked.size !== 3) return false;
  if (!course.required.every((s) => picked.has(s))) return false;
  if (course.optional.length === 0) return course.required.length === 3;
  const extras = subjects.filter((s) => !course.required.includes(s));
  return extras.every((s) => course.optional.includes(s));
}

export function matchCourses(subjects: string[], list: Course[] = COURSES): Course[] {
  return list.filter((c) => isEligible(c, subjects));
}

export function missingSubjects(course: Course, subjects: string[]): string[] {
  return course.required.filter((s) => !subjects.includes(s));
}

export type ScoreVerdict = "strong" | "borderline" | "low";
export function scoreVerdict(score: number, cutoff: [number, number]): ScoreVerdict {
  if (score >= cutoff[1]) return "strong";
  if (score >= cutoff[0]) return "borderline";
  return "low";
}

export function consultantLink(context: string): string {
  const msg = `Hi Akboy, I need admission guidance.${context ? `\n\n${context}` : ""}`;
  return `https://wa.me/${AKBOY_CONSULTANT_WHATSAPP}?text=${encodeURIComponent(msg)}`;
}
