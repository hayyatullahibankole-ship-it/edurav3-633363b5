import { useEffect, useMemo, useState } from "react";
import { Bookmark, Trash2, Eye, EyeOff } from "lucide-react";
import AppShell from "@/components/edura/AppShell";
import { Button } from "@/components/ui/button";
import { MathRenderer } from "@/components/ui/math-renderer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface Row { id: string; question_id: string; subject: string | null; question_text: string; options: string[]; correct_index: number | null; explanation: string | null; created_at: string }
const L = ["A", "B", "C", "D", "E", "F"];

export default function Bookmarks() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("All");
  const [shown, setShown] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) return;
    supabase.from("question_bookmarks").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(500)
      .then(({ data }) => { setRows((data as unknown as Row[]) || []); setLoading(false); });
  }, [user]);

  const subjects = useMemo(() => ["All", ...Array.from(new Set(rows.map((r) => r.subject || "Other")))], [rows]);
  const list = rows.filter((r) => subject === "All" || (r.subject || "Other") === subject);

  const remove = async (r: Row) => {
    setRows((x) => x.filter((y) => y.id !== r.id));
    await supabase.from("question_bookmarks").delete().eq("id", r.id);
  };

  return (
    <AppShell side="cbt" title="Bookmarked questions" subtitle="Questions you saved to revise later.">
      {loading ? <p className="py-10 text-center text-muted-foreground">Loading…</p> : !rows.length ? (
        <div className="rounded-3xl border-2 border-dashed p-10 text-center">
          <Bookmark className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-display font-bold">No bookmarks yet</p>
          <p className="text-sm text-muted-foreground">Tap "Bookmark" on any question during a test or when reviewing your answers.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {subjects.map((s) => (
              <button key={s} onClick={() => setSubject(s)} className={cn("rounded-full border-2 px-3 py-1 text-sm font-semibold", subject === s ? "border-primary bg-primary text-primary-foreground" : "border-border")}>{s}</button>
            ))}
          </div>
          {list.map((r) => (
            <article key={r.id} className="space-y-3 rounded-2xl border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">{r.subject || "Other"}</span>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setShown((s) => ({ ...s, [r.id]: !s[r.id] }))}>
                    {shown[r.id] ? <EyeOff className="mr-1 h-4 w-4" /> : <Eye className="mr-1 h-4 w-4" />}{shown[r.id] ? "Hide answer" : "Show answer"}
                  </Button>
                  <Button size="sm" variant="ghost" aria-label="Remove bookmark" onClick={() => remove(r)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
              <MathRenderer content={r.question_text} />
              <ul className="space-y-1.5">
                {(r.options || []).map((o, i) => (
                  <li key={i} className={cn("flex gap-2 rounded-xl border p-2 text-sm", shown[r.id] && i === r.correct_index && "border-primary bg-primary/10 font-semibold")}>
                    <span className="font-bold">{L[i]}.</span><MathRenderer content={o} />
                  </li>
                ))}
              </ul>
              {shown[r.id] && r.correct_index == null && <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">The answer appears here after you finish the test and open its answer review.</p>}
              {shown[r.id] && r.explanation && <div className="rounded-xl bg-muted p-3 text-sm"><MathRenderer content={r.explanation} /></div>}
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}
