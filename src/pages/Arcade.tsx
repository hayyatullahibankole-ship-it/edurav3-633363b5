import { Link } from "react-router-dom";
import { Trophy, Zap, Puzzle, Heart, ArrowRight } from "lucide-react";
import AppShell from "@/components/edura/AppShell";
import { getBestScores } from "@/lib/arcade";

const GAMES = [
  { to: "/games/millionaire", key: "millionaire", icon: Trophy, title: "Edura Millionaire", body: "Climb 15 questions with 50/50, swap and double-try lifelines.", unit: "XP" },
  { to: "/games/blitz", key: "blitz", icon: Zap, title: "60-Second Blitz", body: "Answer fast. Streaks multiply your score up to 4x.", unit: "pts" },
];
const SOON = [
  { icon: Puzzle, title: "Formula Match", body: "Pair formulas, compounds and definitions." },
  { icon: Heart, title: "Survival", body: "Three hearts. How long can you last?" },
];

export default function Arcade() {
  const best = getBestScores();
  return (
    <AppShell side="cbt" title="Games" subtitle="Learn with real exam questions — just faster and more fun.">
      <div className="grid gap-3 sm:grid-cols-2">
        {GAMES.map((g) => (
          <Link key={g.to} to={g.to} className="press group flex flex-col gap-3 rounded-2xl border bg-card p-5 hover:border-primary">
            <div className="flex items-center justify-between">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary"><g.icon className="h-6 w-6" /></span>
              {best[g.key] ? <span className="text-xs font-semibold text-muted-foreground">Best: {best[g.key].toLocaleString("en-NG")} {g.unit}</span> : null}
            </div>
            <div>
              <h2 className="font-display text-lg font-bold">{g.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{g.body}</p>
            </div>
            <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-primary">Play <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
          </Link>
        ))}
        {SOON.map((g) => (
          <div key={g.title} className="flex flex-col gap-3 rounded-2xl border border-dashed p-5 opacity-70">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-muted text-muted-foreground"><g.icon className="h-6 w-6" /></span>
            <div>
              <h2 className="font-display text-lg font-bold">{g.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{g.body}</p>
            </div>
            <span className="mt-auto text-xs font-semibold uppercase tracking-wide text-muted-foreground">Coming soon</span>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
