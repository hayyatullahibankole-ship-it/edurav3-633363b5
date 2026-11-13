import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export interface BookmarkSnapshot {
  questionId: string; subject?: string; questionText: string;
  options: string[]; correctIndex?: number | null; explanation?: string | null;
}

export function BookmarkButton({ q, className, compact }: { q: BookmarkSnapshot; className?: string; compact?: boolean }) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!user) return;
    supabase.from("question_bookmarks").select("id").eq("user_id", user.id).eq("question_id", q.questionId).maybeSingle()
      .then(({ data }) => {
        setSaved(!!data);
        // Saved during a test (no answer yet)? Fill in the answer once it's known on the review screen.
        if (data && q.correctIndex != null) {
          supabase.from("question_bookmarks").update({ correct_index: q.correctIndex, explanation: q.explanation ?? null })
            .eq("id", data.id).is("correct_index", null).then(() => {});
        }
      });
  }, [user, q.questionId, q.correctIndex, q.explanation]);
  if (!user) return null;
  const toggle = async () => {
    setBusy(true);
    if (saved) {
      const { error } = await supabase.from("question_bookmarks").delete().eq("user_id", user.id).eq("question_id", q.questionId);
      if (!error) { setSaved(false); toast("Removed from bookmarks"); }
    } else {
      const { error } = await supabase.from("question_bookmarks").insert({
        user_id: user.id, question_id: q.questionId, subject: q.subject ?? null, question_text: q.questionText,
        options: q.options, correct_index: q.correctIndex ?? null, explanation: q.explanation ?? null,
      });
      if (!error) { setSaved(true); toast.success("Saved to your bookmarks"); } else toast.error("Couldn't save. Try again.");
    }
    setBusy(false);
  };
  return (
    <button type="button" onClick={toggle} disabled={busy} aria-pressed={saved} aria-label={saved ? "Remove bookmark" : "Bookmark question"}
      className={cn("inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
        saved ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-muted", className)}>
      <Bookmark className={cn("h-3.5 w-3.5", saved && "fill-current")} />{compact ? <span className="hidden sm:inline">{saved ? "Saved" : "Bookmark"}</span> : (saved ? "Saved" : "Bookmark")}
    </button>
  );
}
