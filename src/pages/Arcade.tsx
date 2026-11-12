import { Link } from "react-router-dom";
import { Trophy, Zap, Puzzle, Heart, Play, Gamepad2, Type } from "lucide-react";
import AppShell from "@/components/edura/AppShell";
import { getBestScores } from "@/lib/arcade";
import millionaireArt from "@/assets/game-millionaire.jpg";
import blitzArt from "@/assets/game-blitz.jpg";
import survivalArt from "@/assets/game-survival.jpg";
import matchArt from "@/assets/game-match.jpg";
import wordsArt from "@/assets/game-words.jpg";

const GAMES = [
  { to: "/games/millionaire", key: "millionaire", icon: Trophy, art: millionaireArt, title: "Edura Millionaire", tag: "Quiz show", body: "Climb 15 questions. Two safe havens. Three lifelines.", unit: "XP" },
  { to: "/games/blitz", key: "blitz", icon: Zap, art: blitzArt, title: "60-Second Blitz", tag: "Speed run", body: "Beat the clock. Streaks multiply your score up to 4x.", unit: "pts" },
  { to: "/games/survival", key: "survival", icon: Heart, art: survivalArt, title: "Survival", tag: "Sudden death", body: "Three hearts. Points climb every 5 right answers.", unit: "pts" },
  { to: "/games/match", key: "match", icon: Puzzle, art: matchArt, title: "Formula Match", tag: "Puzzle", body: "Pair formulas and definitions against the clock.", unit: "pts" },
  { to: "/games/words", key: "words", icon: Type, art: wordsArt, title: "Word Buster", tag: "Daily", body: "Unscramble one exam word a day. Hints cost points.", unit: "pts" },
];

export default function Arcade() {
  const best = getBestScores();
  const totalXp = best.millionaire ?? 0;
  return (
    <AppShell side="cbt" title="Games Arcade" subtitle="Real exam questions. Game rules.">
      <div className="space-y-6">
        {/* Player HUD */}
        <div className="flex items-center gap-4 rounded-3xl border-2 border-ink bg-ink p-4 text-ink-foreground shadow-[0_6px_0_0_hsl(var(--primary))]">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gold text-gold-foreground"><Gamepad2 className="h-7 w-7" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Player 1 · Ready</p>
            <p className="font-display text-xl font-extrabold">Pick a game and go</p>
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-xs uppercase tracking-widest text-ink-foreground/60">Best XP</p>
            <p className="font-display text-2xl font-extrabold tabular-nums text-gold">{totalXp.toLocaleString("en-NG")}</p>
          </div>
        </div>

        {/* Game cartridges */}
        <div className="grid gap-5 sm:grid-cols-2">
          {GAMES.map((g) => (
            <Link key={g.to} to={g.to}
              className="group relative overflow-hidden rounded-3xl border-2 border-ink bg-ink text-ink-foreground shadow-[0_8px_0_0_hsl(var(--ink))] transition-all hover:-translate-y-1 hover:shadow-[0_12px_0_0_hsl(var(--primary))] active:translate-y-1 active:shadow-[0_2px_0_0_hsl(var(--ink))]">
              <div className="relative aspect-[16/10] overflow-hidden">
                <img src={g.art} alt={g.title} width={1024} height={640} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute left-3 top-3 rounded-full bg-gold px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-gold-foreground">{g.tag}</span>
                {best[g.key] ? (
                  <span className="absolute right-3 top-3 rounded-full bg-ink/85 px-3 py-1 text-[11px] font-bold text-gold">★ {best[g.key].toLocaleString("en-NG")} {g.unit}</span>
                ) : null}
              </div>
              <div className="flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <h2 className="flex items-center gap-2 font-display text-lg font-extrabold"><g.icon className="h-5 w-5 text-gold" />{g.title}</h2>
                  <p className="mt-0.5 text-sm text-ink-foreground/70">{g.body}</p>
                </div>
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_4px_0_0_hsl(var(--accent))] transition-transform group-hover:scale-110">
                  <Play className="h-5 w-5 fill-current" />
                </span>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </AppShell>
  );
}
