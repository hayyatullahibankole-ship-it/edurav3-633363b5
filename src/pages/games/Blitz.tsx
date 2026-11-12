import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Zap, ArrowLeft, Timer } from "lucide-react";
import AppShell from "@/components/edura/AppShell";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SubjectPicker } from "@/components/games/SubjectPicker";
import { GameQuestionCard } from "@/components/games/GameQuestionCard";
import { findCorrectIndex, loadGameQuestions, type GameQuestion } from "@/components/games/gameQuestions";
import { BLITZ_START_SECONDS, applyBlitzAnswer, blitzMultiplier, saveBestScore, type BlitzState } from "@/lib/arcade";

type Phase = "setup" | "loading" | "play" | "over";

export default function Blitz() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [queue, setQueue] = useState<GameQuestion[]>([]);
  const [state, setState] = useState<BlitzState>({ secondsLeft: BLITZ_START_SECONDS, streak: 0, score: 0 });
  const [answered, setAnswered] = useState({ right: 0, total: 0 });
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState<number | null>(null);
  const [checking, setChecking] = useState(false);
  const [newBest, setNewBest] = useState(false);
  const idsRef = useRef<string[]>([]);

  useEffect(() => {
    if (phase !== "play") return;
    const t = setInterval(() => setState((s) => ({ ...s, secondsLeft: Math.max(0, s.secondsLeft - 1) })), 1000);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (phase === "play" && state.secondsLeft <= 0) { setNewBest(saveBestScore("blitz", state.score)); setPhase("over"); }
  }, [phase, state.secondsLeft, state.score]);

  const start = async (ids: string[]) => {
    idsRef.current = ids; setPhase("loading");
    try {
      const qs = await loadGameQuestions(ids, Math.ceil(40 / ids.length));
      if (qs.length < 5) { toast.error("Not enough questions in these subjects yet."); setPhase("setup"); return; }
      setQueue(qs); setState({ secondsLeft: BLITZ_START_SECONDS, streak: 0, score: 0 });
      setAnswered({ right: 0, total: 0 }); setPicked(null); setCorrect(null); setPhase("play");
    } catch { toast.error("Couldn't load questions. Check your connection."); setPhase("setup"); }
  };

  const pick = async (i: number) => {
    const q = queue[0]; if (!q || checking) return;
    setPicked(i); setChecking(true);
    const c = await findCorrectIndex(q);
    setChecking(false); setCorrect(c);
    const ok = i === c;
    setState((s) => applyBlitzAnswer(s, ok));
    setAnswered((a) => ({ right: a.right + (ok ? 1 : 0), total: a.total + 1 }));
    setTimeout(async () => {
      let rest = queue.slice(1);
      if (rest.length < 3) rest = [...rest, ...(await loadGameQuestions(idsRef.current, 10).catch(() => []))];
      setQueue(rest); setPicked(null); setCorrect(null);
    }, ok ? 450 : 900);
  };

  const mult = blitzMultiplier(state.streak);

  return (
    <AppShell side="cbt" title="60-Second Blitz" subtitle="Right answers add 2 seconds. Wrong answers cost 3.">
      <Link to="/games" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Games</Link>

      {phase === "setup" && <SubjectPicker cta="Start the clock" onStart={start} />}
      {phase === "loading" && <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}

      {phase === "play" && queue[0] && (
        <div className="space-y-4 rounded-3xl bg-ink p-4 text-ink-foreground sm:p-6">
          <div className="grid grid-cols-3 gap-2">
            <div className={cn("rounded-2xl border-2 border-ink-soft bg-ink-soft p-3 text-center", state.secondsLeft <= 10 && "border-destructive")}>
              <Timer className="mx-auto h-4 w-4 text-gold" />
              <p className={cn("font-display text-3xl font-extrabold tabular-nums", state.secondsLeft <= 10 && "text-destructive")}>{state.secondsLeft}</p>
            </div>
            <div className="rounded-2xl border-2 border-ink-soft bg-ink-soft p-3 text-center">
              <p className="text-xs text-muted-foreground">Score</p>
              <p className="font-display text-3xl font-extrabold tabular-nums">{state.score}</p>
            </div>
            <div className="rounded-2xl border-2 border-ink-soft bg-ink-soft p-3 text-center">
              <Zap className={cn("mx-auto h-4 w-4", mult > 1 ? "text-primary" : "text-muted-foreground")} />
              <p className="font-display text-3xl font-extrabold">{mult}x</p>
            </div>
          </div>
          <GameQuestionCard question={queue[0]} picked={picked} correct={correct} disabled={checking} onPick={pick} />
        </div>
      )}

      {phase === "over" && (
        <div className="mx-auto max-w-md space-y-4 rounded-3xl border-2 border-ink bg-ink p-8 text-center text-ink-foreground shadow-[0_8px_0_0_hsl(var(--primary))]">
          <Zap className="mx-auto h-10 w-10 text-gold" />
          <h2 className="font-display text-2xl font-bold">Time's up!</h2>
          <p className="font-display text-5xl font-extrabold text-gold">{state.score} pts</p>
          <p className="text-ink-foreground/70">{answered.right} of {answered.total} correct</p>
          {newBest && <p className="text-sm font-semibold">New personal best!</p>}
          <div className="flex justify-center gap-2">
            <Button onClick={() => start(idsRef.current)}>Play again</Button>
            <Button variant="outline" asChild><Link to="/games">All games</Link></Button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
