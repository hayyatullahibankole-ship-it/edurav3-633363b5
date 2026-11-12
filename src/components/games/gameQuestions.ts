import { supabase } from "@/integrations/supabase/client";

export interface GameOption { key: string; text: string; submit: string | number; }
export interface GameQuestion { id: string; text: string; options: GameOption[]; difficulty: number; }
export interface GameSubject { id: string; name: string; }

export function normalizeOptions(raw: unknown): GameOption[] {
  const letters = ["A", "B", "C", "D", "E"];
  if (Array.isArray(raw)) {
    return raw.map((o, i) => ({ key: letters[i] ?? String(i + 1), text: typeof o === "string" ? o : (o as any)?.text ?? String(o), submit: i }));
  }
  if (raw && typeof raw === "object") {
    return Object.entries(raw as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => ({ key: k.toUpperCase(), text: typeof v === "string" ? v : (v as any)?.text ?? String(v), submit: k.toUpperCase() }));
  }
  return [];
}

export async function loadGameSubjects(): Promise<GameSubject[]> {
  const { data } = await supabase.from("subjects").select("id, name").eq("is_active", true).order("name");
  return data ?? [];
}

export async function loadGameQuestions(subjectIds: string[], perSubject: number): Promise<GameQuestion[]> {
  const { data, error } = await supabase.rpc("get_random_questions_for_subjects", { subject_ids: subjectIds, per_subject_count: perSubject });
  if (error) throw error;
  return (data ?? [])
    .filter((q: any) => q.type !== "ESSAY" && q.type !== "FILL_IN")
    .map((q: any) => ({ id: q.id, text: q.question_text, options: normalizeOptions(q.options), difficulty: q.difficulty_level ?? 1 }))
    .filter((q) => q.options.length >= 2)
    .sort(() => Math.random() - 0.5);
}

/** Finds the correct option index using the server's answer checker (answers never ship to the browser up front). */
export async function findCorrectIndex(q: GameQuestion): Promise<number> {
  const results = await Promise.all(
    q.options.map((o) => supabase.rpc("validate_student_answer", { question_id_param: q.id, submitted_answer: o.submit as any }))
  );
  return results.findIndex((r) => r.data === true);
}
