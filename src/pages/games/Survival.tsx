import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Heart, ArrowLeft, Skull, Flame } from "lucide-react";
import AppShell from "@/components/edura/AppShell";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SubjectPicker } from "@/components/games/SubjectPicker";
import { GameQuestionCard } from "@/components/games/GameQuestionCard";
import { GameStage, useCommentator } from "@/components/games/GameStage";
import { findCorrectIndex, loadGameQuestions, type GameQuestion } from "@/components/games/gameQuestions";
import { SURVIVAL_HEARTS, survivalPoints, saveBestScore } from "@/lib/arcade";
import { sfx } from "@/lib/gameAudio";
import stageBg from "@/assets/game-survival.jpg";

type Phase = "setup" | "loading" | "play" | "over";

export default function Survival() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [ids, setIds] = useState<string[]>([]);
  const [queue, setQueue] = useState<GameQuestion[]>([]);
  const [hearts, setHearts] = useState(SURVIVAL_HEARTS);
  const [right, setRight] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState<number | null>(null);
  const [checking, setChecking] = useState(false);
  const [flash, setFlash] = useState<"good" | "bad" | null>(null);
  const [newBest, setNewBest] = useState(false);
  const { line, say } = useCommentator();

  const start = async (sel: string[]) => {
    setIds(sel); setPhase("loading");
    try {
      const qs = await loadGameQuestions(sel, Math.ceil(30 / sel.length));
      if (qs.length < 5) { toast.error("Not enough questions in these subjects yet."); setPhase("setup"); return; }
      setQueue(qs); setHearts(SURVIVAL_HEARTS); setRight(0); setScore(0); setPicked(null); setCorrect(null);
      setPhase("play"); sfx.start(); say("start");
    } catch { toast.error("Couldn't load questions. Check your connection."); setPhase("setup"); }
  };

  const pick = async (i: number) => {
    const q = queue[0]; if (!q || checking || correct !== null) return;
    setPicked(i); setChecking(true); sfx.suspense();
    const c = await findCorrectIndex(q);
    setChecking(false); setCorrect(c);
    let left = hearts, total = score;
    if (i === c) {
      total = score + survivalPoints(right); setScore(total); setRight(right + 1);
      setFlash("good");
      if ((right + 1) % 5 === 0) { sfx.streak(); say("streak"); } else { sfx.correct(); say("correct"); }
    } else {
      left = hearts - 1; setHearts(left); setFlash("bad"); sfx.wrong(); say(left === 0 ? "lose" : "wrong");
    }
    setTimeout(async () => {
      if (left === 0) { sfx.lose(); setNewBest(saveBestScore("survival", total)); setPhase("over"); return; }
      let rest = queue.slice(1);
      if (rest.length < 3) rest = [...rest, ...(await loadGameQuestions(ids, 10).catch(() => []))];
      if (!rest.length) { setNewBest(saveBestScore("survival", total)); setPhase("over"); return; }
      setQueue(rest); setPicked(null); setCorrect(null); setFlash(null);
    }, i === c ? 900 : 1600);
  };

  return (
    <AppShell side="cbt" title="Survival" subtitle="Three hearts. Every wrong answer costs one.">
      <Link to="/games" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Games</Link>
      {phase === "setup" && <SubjectPicker cta="Enter the arena" onStart={start} />}
      {phase === "loading" && <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
      {phase === "play" && queue[0] && (
        <GameStage bg={stageBg} line={line} flash={flash}>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl border-2 border-gold/40 bg-ink/80 p-3 text-center">
                <div className="flex justify-center gap-1">
                  {Array.from({ length: SURVIVAL_HEARTS }).map((_, i) => (
                    <Heart key={i} className={cn("h-6 w-6 transition-all", i < hearts ? "fill-destructive text-destructive" : "scale-75 text-ink-foreground/30")} />
                  ))}
                </div>
                <p className="mt-1 text-xs text-ink-foreground/60">Hearts</p>
              </div>
              <div className="rounded-2xl border-2 border-gold/40 bg-ink/80 p-3 text-center">
                <p className="font-display text-3xl font-extrabold tabular-nums text-gold">{score}</p>
                <p className="text-xs text-ink-foreground/60">Score</p>
              </div>
              <div className="rounded-2xl border-2 border-gold/40 bg-ink/80 p-3 text-center">
                <p className="flex items-center justify-center gap-1 font-display text-3xl font-extrabold"><Flame className="h-5 w-5 text-gold" />{survivalPoints(right)}</p>
                <p className="text-xs text-ink-foreground/60">Next answer</p>
              </div>
            </div>
            <GameQuestionCard question={queue[0]} picked={picked} correct={correct} disabled={checking || correct !== null} onPick={pick} />
          </div>
        </GameStage>
      )}
      {phase === "over" && (
        <div className="mx-auto max-w-md space-y-4 rounded-3xl border-2 border-ink bg-ink p-8 text-center text-ink-foreground shadow-[0_8px_0_0_hsl(var(--primary))]">
          <Skull className="mx-auto h-10 w-10 text-gold" />
          <h2 className="font-display text-2xl font-bold">You survived {right} questions</h2>
          <p className="font-display text-5xl font-extrabold text-gold">{score} pts</p>
          {newBest && <p className="text-sm font-semibold">New personal best!</p>}
          <div className="flex justify-center gap-2">
            <Button onClick={() => start(ids)}>Play again</Button>
            <Button variant="outline" asChild><Link to="/games">All games</Link></Button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
