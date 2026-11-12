import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Lightbulb, Shuffle, Delete, Type, BookOpen, Heart, Trophy } from "lucide-react";
import AppShell from "@/components/edura/AppShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GameStage, useCommentator } from "@/components/games/GameStage";
import { DAILY_WORDS } from "@/components/games/gameContent";
import { WORD_TRIES, getBestLevel, saveBestLevel, saveBestScore, scramble, wordScore, wordsByDifficulty } from "@/lib/arcade";
import { sfx } from "@/lib/gameAudio";
import stageBg from "@/assets/game-words.jpg";

const LADDER = wordsByDifficulty(DAILY_WORDS);
const tilesFor = (w: string) => scramble(w).split("").map((ch, i) => ({ ch, i }));

export default function WordBuster() {
  const [phase, setPhase] = useState<"setup" | "play" | "over" | "won">("setup");
  const [level, setLevel] = useState(1);
  const entry = LADDER[level - 1];
  const [letters, setLetters] = useState(() => tilesFor(LADDER[0].word));
  const [used, setUsed] = useState<number[]>([]);
  const [hints, setHints] = useState(0);
  const [wrongs, setWrongs] = useState(0);
  const [tries, setTries] = useState(WORD_TRIES);
  const [score, setScore] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [solved, setSolved] = useState(false);
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState<"good" | "bad" | null>(null);
  const [newBest, setNewBest] = useState(false);
  const { line, say } = useCommentator();

  const guess = used.map((u) => letters.find((l) => l.i === u)!.ch).join("");

  const loadLevel = (lv: number) => {
    setLevel(lv); setLetters(tilesFor(LADDER[lv - 1].word));
    setUsed([]); setHints(0); setWrongs(0); setSolved(false); setShowMeaning(false); setFlash(null);
  };
  const start = () => { setScore(0); setTries(WORD_TRIES); loadLevel(1); setPhase("play"); sfx.start(); say("start"); };

  const endGame = (finalScore: number, reached: number, won = false) => {
    saveBestLevel("words", reached); setNewBest(saveBestScore("words", finalScore));
    setPhase(won ? "won" : "over");
  };

  const tapLetter = (i: number) => {
    if (solved || used.includes(i)) return;
    sfx.tick();
    const next = [...used, i];
    setUsed(next);
    if (next.length !== entry.word.length) return;
    const g = next.map((u) => letters.find((l) => l.i === u)!.ch).join("");
    if (g === entry.word) {
      const s = score + wordScore(hints, wrongs);
      setScore(s); setSolved(true); setFlash("good"); sfx.correct(); say("correct");
      setTimeout(() => {
        if (level >= LADDER.length) { sfx.win(); say("win"); endGame(s, level, true); }
        else loadLevel(level + 1);
      }, 1400);
    } else {
      const left = tries - 1;
      setTries(left); setWrongs((w) => w + 1); setFlash("bad"); setShake(true); sfx.wrong();
      if (left <= 0) {
        say("lose"); sfx.lose();
        setTimeout(() => endGame(score, level - 1), 1200);
      } else {
        say("wrong");
        setTimeout(() => { setUsed(lockedOrder(hints)); setShake(false); setFlash(null); }, 700);
      }
    }
  };

  const lockedOrder = (h: number) => {
    const order: number[] = [];
    for (const ch of entry.word.slice(0, h)) {
      const l = letters.find((x) => x.ch === ch && !order.includes(x.i)); if (l) order.push(l.i);
    }
    return order;
  };
  const hint = () => {
    if (hints >= entry.word.length - 1) return;
    sfx.lifeline(); say("lifeline");
    const h = hints + 1; setHints(h); setUsed(lockedOrder(h));
  };

  return (
    <AppShell side="cbt" title="Word Buster" subtitle="Unscramble exam words. Each word is a level, and they get longer.">
      <Link to="/games" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Games</Link>

      {phase === "setup" && (
        <div className="mx-auto max-w-lg space-y-4 rounded-3xl border bg-card p-6 text-center">
          <Type className="mx-auto h-10 w-10 text-primary" />
          <p className="font-display text-xl font-bold">{LADDER.length} levels. 3 tries.</p>
          <p className="text-sm text-muted-foreground">Solve a word to move up a level. Three wrong spellings and the game ends. Hints cost points; checking the meaning is free.</p>
          {getBestLevel("words") > 0 && <p className="text-sm font-semibold text-primary">Your best: level {getBestLevel("words")}</p>}
          <Button size="lg" className="w-full" onClick={start}>Start</Button>
        </div>
      )}

      {phase === "play" && (
        <GameStage bg={stageBg} line={line} flash={flash} level={level}>
          <div className="mx-auto max-w-2xl space-y-6 text-center">
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-1" aria-label={`${tries} tries left`}>
                {Array.from({ length: WORD_TRIES }).map((_, i) => (
                  <Heart key={i} className={cn("h-6 w-6", i < tries ? "fill-destructive text-destructive" : "scale-75 text-ink-foreground/30")} />
                ))}
              </div>
              <span className="rounded-full bg-ink-soft px-3 py-1 text-xs font-bold">{entry.subject}</span>
              <span className="font-display text-xl font-extrabold tabular-nums text-gold">{score} pts</span>
            </div>

            {showMeaning ? (
              <p className="animate-scale-in rounded-2xl border-2 border-gold/50 bg-ink/80 px-4 py-3 text-lg font-semibold">
                <BookOpen className="mr-2 inline h-5 w-5 text-gold" />{entry.clue}
              </p>
            ) : (
              <Button variant="secondary" onClick={() => { setShowMeaning(true); sfx.lifeline(); }}>
                <BookOpen className="mr-1 h-4 w-4" />Check meaning
              </Button>
            )}

            <div className={cn("flex flex-wrap justify-center gap-2", shake && "animate-pulse")}>
              {entry.word.split("").map((_, i) => (
                <span key={i} className={cn("grid h-12 w-9 place-items-center rounded-xl border-2 font-display text-2xl font-extrabold sm:h-14 sm:w-12",
                  guess[i] ? (solved ? "border-primary bg-primary text-primary-foreground" : i < hints ? "border-gold bg-gold/20 text-gold" : "border-ink-foreground/40 bg-ink-soft") : "border-dashed border-ink-foreground/30")}>
                  {guess[i] ?? ""}
                </span>
              ))}
            </div>

            {solved ? (
              <p className="font-display text-2xl font-extrabold text-gold">+{wordScore(hints, wrongs)} pts · next level coming…</p>
            ) : (
              <>
                <div className="flex flex-wrap justify-center gap-2">
                  {letters.map((l) => (
                    <button key={l.i} onClick={() => tapLetter(l.i)} disabled={used.includes(l.i)}
                      className={cn("grid h-12 w-12 place-items-center rounded-xl border-2 border-gold/60 bg-ink-soft font-display text-2xl font-extrabold text-gold shadow-[0_5px_0_0_hsl(var(--gold)/0.4)] transition-all active:translate-y-1 active:shadow-none sm:h-14 sm:w-14",
                        used.includes(l.i) && "scale-75 opacity-20")}>
                      {l.ch}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button variant="secondary" onClick={() => setUsed(used.slice(0, Math.max(hints, used.length - 1)))}><Delete className="mr-1 h-4 w-4" />Undo</Button>
                  <Button variant="secondary" onClick={() => { sfx.lifeline(); setLetters((ls) => [...ls].sort(() => Math.random() - 0.5)); }}><Shuffle className="mr-1 h-4 w-4" />Shuffle</Button>
                  <Button variant="secondary" onClick={hint} disabled={hints >= entry.word.length - 1}><Lightbulb className="mr-1 h-4 w-4" />Hint (−25)</Button>
                </div>
              </>
            )}
          </div>
        </GameStage>
      )}

      {(phase === "over" || phase === "won") && (
        <div className="mx-auto max-w-md space-y-4 rounded-3xl border-2 border-ink bg-ink p-8 text-center text-ink-foreground shadow-[0_8px_0_0_hsl(var(--primary))]">
          <Trophy className="mx-auto h-10 w-10 text-gold" />
          <h2 className="font-display text-2xl font-bold">{phase === "won" ? "You cleared every level!" : "Out of tries"}</h2>
          {phase === "over" && <p className="text-ink-foreground/70">The word was <span className="font-bold text-gold">{entry.word}</span>. You cleared {level - 1} level{level === 2 ? "" : "s"}.</p>}
          <p className="font-display text-5xl font-extrabold text-gold">{score} pts</p>
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
