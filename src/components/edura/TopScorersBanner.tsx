import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Crown, Medal, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Row { rank: number; display_name: string; avg_score: number; is_me: boolean }

export default function TopScorersBanner() {
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    supabase.rpc("get_leaderboard" as never, { p_period: "week", p_limit: 3 } as never).then(({ data }) => {
      setRows(((data as unknown as Row[]) || []).slice(0, 3));
    });
  }, []);
  if (!rows.length) return null;
  return (
    <Link to="/leaderboard" className="block h-full rounded-2xl border bg-card p-4 shadow-sm transition-transform hover:-translate-y-0.5">
      <div className="mb-2 flex items-center justify-between">
        <p className="flex items-center gap-1.5 font-display text-xs font-extrabold"><Crown className="h-4 w-4 text-gold" />This week's top scorers</p>
        <span className="flex items-center text-xs font-semibold text-primary">Leaderboard<ChevronRight className="h-4 w-4" /></span>
      </div>
      <ol className="space-y-1.5">
        {rows.map((r, i) => (
          <li key={i} className={cn("flex min-w-0 items-center gap-2 rounded-xl px-2.5 py-1.5", r.is_me ? "bg-primary/10" : "bg-muted/60")}>
            <span className="w-4 shrink-0 text-center font-display text-xs font-extrabold text-muted-foreground">{i + 1}</span>
            {i === 0 ? <Crown className="h-4 w-4 shrink-0 text-gold" /> : <Medal className="h-4 w-4 shrink-0 text-muted-foreground" />}
            <p className="min-w-0 flex-1 truncate text-xs font-bold">{r.is_me ? "You" : r.display_name}</p>
            <p className={cn("shrink-0 font-display text-xs font-extrabold", "text-primary")}>{Math.round(Number(r.avg_score))}%</p>
          </li>
        ))}
      </ol>
    </Link>
  );
}
