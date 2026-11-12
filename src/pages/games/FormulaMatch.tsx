import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Puzzle, Timer, Check } from "lucide-react";
import AppShell from "@/components/edura/AppShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GameStage, useCommentator } from "@/components/games/GameStage";
import { MATCH_PAIRS } from "@/components/games/gameContent";
import { matchLevelConfig, matchScore, saveBestScore, saveBestLevel } from "@/lib/arcade";
import { sfx } from "@/lib/gameAudio";
import stageBg from "@/assets/game-match.jpg";

type Tile = { id: string; pair: number; text: string; side: "a" | "b" };
const SUBJECTS = ["All", ...Array.from(new Set(MATCH_PAIRS.map((p) => p.subject)))];
const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);

export default function FormulaMatch() {
  const [phase, setPhase] = useState<"setup" | "play" | "over">("setup");
  const [subject, setSubject] = useState("All");
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [sel, setSel] = useState<Tile | null>(null);
  const [done, setDone] = useState<number[]>([]);
  const [wrong, setWrong] = useState<string[]>([]);
  const [misses, setMisses] = useState(0);
  const [secs, setSecs] = useState(60);
  const [level, setLevel] = useState(1);
  const [total, setTotal] = useState(0);
  const [final, setFinal] = useState(0);
  const [newBest, setNewBest] = useState(false);
  const [flash, setFlash] = useState<"good" | "bad" | null>(null);
  const { line, say } = useCommentator();

  const start = () => { setTotal(0); setLevel(1); deal(1); sfx.start(); say("start"); };
  const deal = (lv: number) => {
    const { pairs, seconds } = matchLevelConfig(lv);
    const pool = MATCH_PAIRS.map((p, i) => ({ ...p, i })).filter((p) => subject === "All" || p.subject === subject);
    const picked = shuffle(pool).slice(0, pairs);
    setTiles(shuffle(picked.flatMap((p) => [
      { id: `${p.i}a`, pair: p.i, text: p.a, side: "a" as const },
      { id: `${p.i}b`, pair: p.i, text: p.b, side: "b" as const },
    ])));
    setDone([]); setSel(null); setMisses(0); setSecs(seconds); setPhase("play");
  };

  const finish = (pairs: number, m: number, s: number) => {
    const sc = total + matchScore(pairs, m, s);
    if (pairs === tiles.length / 2) { setTotal(sc); setLevel(level + 1); deal(level + 1); return; }
    setFinal(sc); setNewBest(saveBestScore("match", sc)); saveBestLevel("match", level);
    sfx.lose(); say("lose"); setPhase("over");
  };

  useEffect(() => {
    if (phase !== "play") return;
    if (secs <= 0) { finish(done.length, misses, 0); return; }
    if (secs <= 10) sfx.tick();
    if (secs === 10) say("hurry");
    const t = setTimeout(() => setSecs((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, secs]);

  const tap = (t: Tile) => {
    if (done.includes(t.pair) || wrong.length) return;
    if (!sel) { setSel(t); sfx.tick(); return; }
    if (sel.id === t.id) { setSel(null); return; }
    if (sel.pair === t.pair && sel.side !== t.side) {
      const d = [...done, t.pair]; setDone(d); setSel(null); setFlash("good"); sfx.correct();
      setTimeout(() => setFlash(null), 600);
      if (d.length === tiles.length / 2) setTimeout(() => finish(d.length, misses, secs), 500);
      else if (d.length % 2 === 0) say("correct");
    } else {
      setWrong([sel.id, t.id]); setMisses((m) => m + 1); setFlash("bad"); sfx.wrong();
      setTimeout(() => { setWrong([]); setSel(null); setFlash(null); }, 700);
    }
  };

  return (
    <AppShell side="cbt" title="Formula Match" subtitle="Pair each formula with what it means before time runs out.">
      <Link to="/games" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Games</Link>
      {phase === "setup" && (
        <div className="mx-auto max-w-lg space-y-4 rounded-3xl border bg-card p-6">
          <p className="font-display font-bold">Choose a subject</p>
          <div className="flex flex-wrap gap-2">
            {SUBJECTS.map((s) => (
              <button key={s} onClick={() => setSubject(s)} className={cn("rounded-full border-2 px-4 py-1.5 text-sm font-semibold", subject === s ? "border-primary bg-primary text-primary-foreground" : "border-border")}>{s}</button>
            ))}
          </div>
          <Button size="lg" className="w-full" onClick={start}>Start matching</Button>
        </div>
      )}
      {phase === "play" && (
        <GameStage bg={stageBg} line={line} flash={flash} level={level}>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl border-2 border-gold/40 bg-ink/80 px-4 py-2">
              <span className={cn("flex items-center gap-2 font-display text-2xl font-extrabold tabular-nums", secs <= 10 && "text-destructive")}><Timer className="h-5 w-5 text-gold" />{secs}s</span>
              <span className="font-display font-bold text-gold">{done.length}/{tiles.length / 2} pairs · {total} pts</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {tiles.map((t) => {
                const matched = done.includes(t.pair);
                return (
                  <button key={t.id} onClick={() => tap(t)} disabled={matched}
                    className={cn("relative min-h-[84px] rounded-2xl border-2 p-3 text-sm font-bold shadow-[0_5px_0_0_hsl(var(--ink-soft))] transition-all active:translate-y-1 active:shadow-none",
                      t.side === "a" ? "border-gold/60 bg-ink-soft font-display text-base text-gold" : "border-ink-foreground/20 bg-ink/80",
                      sel?.id === t.id && "-translate-y-1 border-primary ring-4 ring-primary/40",
                      wrong.includes(t.id) && "animate-pulse border-destructive bg-destructive/30",
                      matched && "scale-95 border-primary bg-primary/20 opacity-60 shadow-none")}>
                    {matched && <Check className="absolute right-2 top-2 h-4 w-4 text-primary" />}
                    {t.text}
                  </button>
                );
              })}
            </div>
          </div>
        </GameStage>
      )}
      {phase === "over" && (
        <div className="mx-auto max-w-md space-y-4 rounded-3xl border-2 border-ink bg-ink p-8 text-center text-ink-foreground shadow-[0_8px_0_0_hsl(var(--primary))]">
          <Puzzle className="mx-auto h-10 w-10 text-gold" />
          <h2 className="font-display text-2xl font-bold">Time's up on level {level}</h2>
          <p className="font-display text-5xl font-extrabold text-gold">{final} pts</p>
          <p className="text-ink-foreground/70">You cleared {level - 1} level{level === 2 ? "" : "s"}</p>
          {newBest && <p className="text-sm font-semibold">New personal best!</p>}
          <div className="flex justify-center gap-2">
            <Button onClick={start}>Play again</Button>
            <Button variant="outline" asChild><Link to="/games">All games</Link></Button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
