import type { Json } from "@/integrations/supabase/types";

export type PracticeOption = { label: string; text: string; value: Json };
export type TopicMastery = {
  score: number | null;
  label: string;
  className: string;
};

export function getPracticeOptions(raw: Json): PracticeOption[] {
  if (Array.isArray(raw)) {
    return raw.map((entry, index) => {
      const option = entry && typeof entry === "object" && !Array.isArray(entry) ? entry : null;
      const text = typeof entry === "string"
        ? entry
        : typeof option?.text === "string"
          ? option.text
          : String(entry ?? "");
      return { label: String.fromCharCode(65 + index), text, value: index };
    });
  }

  if (raw && typeof raw === "object") {
    return Object.entries(raw)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => {
        const option = entry && typeof entry === "object" && !Array.isArray(entry) ? entry : null;
        const text = typeof entry === "string"
          ? entry
          : typeof option?.text === "string"
            ? option.text
            : String(entry ?? "");
        return { label: key.toUpperCase(), text, value: key.toUpperCase() };
      });
  }

  return [];
}

export function getSelectedOptionIndex(options: PracticeOption[], answer: Json): number {
  const exact = options.findIndex((option) => JSON.stringify(option.value) === JSON.stringify(answer));
  if (exact >= 0) return exact;

  if (typeof answer === "number" && Number.isInteger(answer)) {
    return answer >= 0 && answer < options.length ? answer : -1;
  }

  if (typeof answer === "string") {
    const trimmed = answer.trim();
    if (/^[A-E]$/i.test(trimmed)) {
      const index = trimmed.toUpperCase().charCodeAt(0) - 65;
      if (index < options.length) return index;
    }
    const numeric = Number(trimmed);
    if (Number.isInteger(numeric) && numeric >= 0 && numeric < options.length) return numeric;
    return options.findIndex((option) => option.text.trim().toLowerCase() === trimmed.toLowerCase());
  }

  return -1;
}

export function getTopicMastery(attempted: number, correct: number): TopicMastery {
  const score = attempted ? Math.round((correct / attempted) * 100) : null;
  if (attempted < 5) {
    return {
      score,
      label: attempted ? "Building a baseline" : "Not attempted",
      className: "bg-muted text-muted-foreground",
    };
  }
  if (score !== null && score >= 85) {
    return { score, label: "Ready", className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" };
  }
  if (score !== null && score < 60) {
    return { score, label: "Needs revision", className: "bg-amber-500/10 text-amber-700 dark:text-amber-300" };
  }
  return { score, label: "Developing", className: "bg-sky-500/10 text-sky-700 dark:text-sky-300" };
}
