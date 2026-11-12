import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Shuffle, Divide, Repeat, Trophy, ArrowLeft } from "lucide-react";
import AppShell from "@/components/edura/AppShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { SubjectPicker } from "@/components/games/SubjectPicker";
import { GameQuestionCard } from "@/components/games/GameQuestionCard";
import { findCorrectIndex, loadGameQuestions, type GameQuestion } from "@/components/games/gameQuestions";
import { GameStage, useCommentator } from "@/components/games/GameStage";
import { sfx } from "@/lib/gameAudio";
import stageBg from "@/assets/game-millionaire.jpg";
import { MILLIONAIRE_LADDER, SAFE_HAVEN_STEPS, fiftyFiftyHide, millionaireXpOnMiss, millionaireXpOnWalkAway, saveBestScore } from "@/lib/arcade";

type Phase = "setup" | "loading" | "play" | "over";
const fmt = (n: number) => n.toLocaleString("en-NG");

export default function Millionaire() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [pool, setPool] = useState<GameQuestion[]>([]);
  const [step, setStep] = useState(0); // correct answers so far
  const [current, setCurrent] = useState<GameQuestion | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState<number | null>(null);
  const [hidden, setHidden] = useState<number[]>([]);
  const [checking, setChecking] = useState(false);
  const [used, setUsed] = useState({ fifty: false, swap: false, double: false });
  const [doubleActive, setDoubleActive] = useState(false);
  const [finalXp, setFinalXp] = useState(0);
  const [newBest, setNewBest] = useState(false);
  const [flash, setFlash] = useState<"good" | "bad" | null>(null);
  const { line, say } = useCommentator();

  const start = async (ids: string[]) => {
    setPhase("loading");
    try {
      const qs = await loadGameQuestions(ids, Math.ceil(24 / ids.length));
      if (qs.length < 16) { toast.error("Not enough questions in these subjects yet. Try adding another subject."); setPhase("setup"); return; }
      const sorted = [...qs].sort((a, b) => a.difficulty - b.difficulty);
      setCurrent(sorted[0]); setPool(sorted.slice(1));
      setStep(0); setUsed({ fifty: false, swap: false, double: false }); reset(); setPhase("play"); sfx.start(); say("start");
    } catch { toast.error("Couldn't load questions. Check your connection."); setPhase("setup"); }
  };
  const reset = () => { setPicked(null); setCorrect(null); setHidden([]); setDoubleActive(false); };

  const end = (xp: number, won = false) => { if (won) { sfx.win(); say("win"); } else { sfx.lose(); } setFinalXp(xp); setNewBest(saveBestScore("millionaire", xp)); setPhase("over"); };

  const next = () => { setCurrent(pool[0]); setPool(pool.slice(1)); reset(); setFlash(null); if (step === 14) say("final"); };

  const pick = async (i: number) => {
    if (!current || checking) return;
    setPicked(i); setChecking(true); sfx.suspense();
    const c = await findCorrectIndex(current);
    setChecking(false);
    if (i === c) {
      setCorrect(c);
      const s = step + 1; setStep(s); sfx.correct(); setFlash("good");
      if (s === 15) setTimeout(() => end(MILLIONAIRE_LADDER[14], true), 1200);
      else say(SAFE_HAVEN_STEPS.includes(s) ? "haven" : "correct");
    } else if (doubleActive) {
      sfx.wrong(); say("wrong"); toast("Wrong — but you have one more try."); setHidden((h) => [...h, i]); setDoubleActive(false); setPicked(null);
    } else {
      setCorrect(c); sfx.wrong(); setFlash("bad"); say("lose");
      setTimeout(() => end(millionaireXpOnMiss(step)), 2200);
    }
  };

  const useFifty = async () => {
    if (!current) return; setUsed((u) => ({ ...u, fifty: true })); sfx.lifeline(); say("lifeline"); setChecking(true);
    const c = await findCorrectIndex(current); setChecking(false);
    setHidden(fiftyFiftyHide(current.options.length, c));
  };
  const useSwap = () => { setUsed((u) => ({ ...u, swap: true })); sfx.lifeline(); say("lifeline"); next(); };
  const useDouble = () => { setUsed((u) => ({ ...u, double: true })); sfx.lifeline(); say("lifeline"); setDoubleActive(true); };

  const answeredRight = correct !== null && picked === correct;

  return (
    <AppShell side="cbt" title="Edura Millionaire" subtitle="15 questions. Two safe havens. Three lifelines.">
      <Link to="/games" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Games</Link>

      {phase === "setup" && <SubjectPicker cta="Start the climb" onStart={start} />}
      {phase === "loading" && <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}

      {phase === "play" && current && (
        <GameStage bg={stageBg} line={line} flash={flash}>
        <div className="grid gap-6 lg:grid-cols-[1fr_220px]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-display text-sm font-bold">Question {step + 1} of 15 · for {fmt(MILLIONAIRE_LADDER[step])} XP</p>
              {doubleActive && <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold">Double try on</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" disabled={used.fifty || correct !== null || checking} onClick={useFifty}><Divide className="mr-1 h-4 w-4" />50/50</Button>
              <Button variant="secondary" size="sm" disabled={used.swap || correct !== null || checking || !pool.length} onClick={useSwap}><Shuffle className="mr-1 h-4 w-4" />Swap question</Button>
              <Button variant="secondary" size="sm" disabled={used.double || correct !== null || checking} onClick={useDouble}><Repeat className="mr-1 h-4 w-4" />Double try</Button>
            </div>
            <GameQuestionCard question={current} hidden={hidden} picked={picked} correct={correct} disabled={checking} onPick={pick} />
            <div className="flex flex-wrap gap-2">
              {answeredRight && step < 15 && <Button size="lg" onClick={next}>Next question</Button>}
              {correct === null && step > 0 && <Button variant="secondary" onClick={() => { say("walk"); end(millionaireXpOnWalkAway(step)); }}>Walk away with {fmt(MILLIONAIRE_LADDER[step - 1])} XP</Button>}
              {checking && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
            </div>
          </div>
          <ol className="flex flex-col-reverse gap-1 rounded-2xl border-2 border-gold/40 bg-ink/80 p-3 text-sm">
            {MILLIONAIRE_LADDER.map((xp, i) => (
              <li key={xp} className={cn("flex justify-between rounded-lg px-3 py-1.5",
                i === step && "bg-primary text-primary-foreground font-bold",
                i < step && "opacity-50",
                SAFE_HAVEN_STEPS.includes(i + 1) && i !== step && "font-bold text-gold")}>
                <span>{i + 1}</span><span>{fmt(xp)}</span>
              </li>
            ))}
          </ol>
        </div>
        </GameStage>
      )}

      {phase === "over" && (
        <div className="mx-auto max-w-md space-y-4 rounded-3xl border-2 border-ink bg-ink p-8 text-center text-ink-foreground shadow-[0_8px_0_0_hsl(var(--primary))]">
          <Trophy className="mx-auto h-10 w-10 text-gold" />
          <h2 className="font-display text-2xl font-bold">{step === 15 ? "Champion!" : "Game over"}</h2>
          <p className="text-ink-foreground/70">You answered {step} correctly and leave with</p>
          <p className="font-display text-5xl font-extrabold text-gold">{fmt(finalXp)} XP</p>
          {newBest && <p className="text-sm font-semibold">New personal best!</p>}
          <div className="flex justify-center gap-2">
            <Button onClick={() => setPhase("setup")}>Play again</Button>
            <Button variant="outline" asChild><Link to="/games">All games</Link></Button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
