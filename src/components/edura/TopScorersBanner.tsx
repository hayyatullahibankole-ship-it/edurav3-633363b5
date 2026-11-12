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
    <Link to="/leaderboard" className="block rounded-3xl border-2 border-gold/60 bg-card p-4 transition-transform hover:-translate-y-0.5">
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-2 font-display text-sm font-extrabold"><Crown className="h-4 w-4 text-gold" />This week's top scorers</p>
        <span className="flex items-center text-xs font-semibold text-primary">Leaderboard<ChevronRight className="h-4 w-4" /></span>
      </div>
      <ol className="grid grid-cols-3 gap-2">
        {rows.map((r, i) => (
          <li key={i} className={cn("rounded-2xl p-3 text-center", i === 0 ? "bg-ink text-ink-foreground" : "bg-muted")}>
            {i === 0 ? <Crown className="mx-auto h-5 w-5 text-gold" /> : <Medal className="mx-auto h-5 w-5 text-muted-foreground" />}
            <p className="mt-1 truncate text-sm font-bold">{r.is_me ? "You" : r.display_name}</p>
            <p className={cn("font-display text-lg font-extrabold", i === 0 && "text-gold")}>{Math.round(Number(r.avg_score))}%</p>
          </li>
        ))}
      </ol>
    </Link>
  );
}
