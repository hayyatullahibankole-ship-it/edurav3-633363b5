import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Lightbulb, Shuffle, Delete, Type } from "lucide-react";
import AppShell from "@/components/edura/AppShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GameStage, useCommentator } from "@/components/games/GameStage";
import { DAILY_WORDS } from "@/components/games/gameContent";
import { dailyIndex, scramble, wordScore, saveBestScore } from "@/lib/arcade";
import { sfx } from "@/lib/gameAudio";
import stageBg from "@/assets/game-words.jpg";

const todayKey = () => new Date(Date.now() + 3600_000).toISOString().slice(0, 10);

export default function WordBuster() {
  const [offset, setOffset] = useState(0); // 0 = today's word, >0 = practice words
  const entry = DAILY_WORDS[(dailyIndex(new Date(), DAILY_WORDS.length) + offset) % DAILY_WORDS.length];
  const [letters, setLetters] = useState(() => scramble(entry.word).split("").map((ch, i) => ({ ch, i })));
  const [used, setUsed] = useState<number[]>([]);
  const [hints, setHints] = useState(0);
  const [wrongs, setWrongs] = useState(0);
  const [solved, setSolved] = useState(false);
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState<"good" | "bad" | null>(null);
  const [started, setStarted] = useState(false);
  const { line, say } = useCommentator();
  const playedToday = useMemo(() => localStorage.getItem("edura_word_day") === todayKey(), [solved]);

  const guess = used.map((u) => letters.find((l) => l.i === u)!.ch).join("");
  const reveal = entry.word.slice(0, hints);

  const load = (o: number) => {
    const e = DAILY_WORDS[(dailyIndex(new Date(), DAILY_WORDS.length) + o) % DAILY_WORDS.length];
    setOffset(o); setLetters(scramble(e.word).split("").map((ch, i) => ({ ch, i })));
    setUsed([]); setHints(0); setWrongs(0); setSolved(false); setFlash(null); setStarted(true); sfx.start(); say("start");
  };

  const tapLetter = (i: number) => {
    if (solved || used.includes(i)) return;
    sfx.tick();
    const next = [...used, i];
    setUsed(next);
    if (next.length === entry.word.length) {
      const g = next.map((u) => letters.find((l) => l.i === u)!.ch).join("");
      if (g === entry.word) {
        setSolved(true); setFlash("good"); sfx.win(); say("win");
        if (offset === 0) { saveBestScore("words", wordScore(hints, wrongs)); localStorage.setItem("edura_word_day", todayKey()); }
      } else {
        setWrongs((w) => w + 1); setFlash("bad"); setShake(true); sfx.wrong(); say("wrong");
        setTimeout(() => { setUsed([]); setShake(false); setFlash(null); }, 700);
      }
    }
  };

  const hint = () => {
    if (hints >= entry.word.length - 1) return;
    sfx.lifeline(); say("lifeline");
    const h = hints + 1; setHints(h);
    // lock first h letters in order
    const order: number[] = [];
    for (const ch of entry.word.slice(0, h)) {
      const l = letters.find((x) => x.ch === ch && !order.includes(x.i)); if (l) order.push(l.i);
    }
    setUsed(order);
  };

  return (
    <AppShell side="cbt" title="Word Buster" subtitle="Unscramble today's exam word. A new one every day.">
      <Link to="/games" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Games</Link>
      {!started ? (
        <div className="mx-auto max-w-lg space-y-4 rounded-3xl border bg-card p-6 text-center">
          <Type className="mx-auto h-10 w-10 text-primary" />
          <p className="font-display text-xl font-bold">Today's word is ready</p>
          <p className="text-sm text-muted-foreground">Everyone gets the same word today. Hints cost points.</p>
          <Button size="lg" className="w-full" onClick={() => load(0)}>{playedToday ? "Play today's word again" : "Play today's word"}</Button>
        </div>
      ) : (
        <GameStage bg={stageBg} line={line} flash={flash}>
          <div className="mx-auto max-w-2xl space-y-6 text-center">
            <div>
              <span className="rounded-full bg-gold px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-gold-foreground">{offset === 0 ? "Word of the day" : "Bonus word"} · {entry.subject}</span>
              <p className="mt-3 text-lg font-semibold">{entry.clue}</p>
            </div>
            <div className={cn("flex flex-wrap justify-center gap-2", shake && "animate-pulse")}>
              {entry.word.split("").map((_, i) => (
                <span key={i} className={cn("grid h-12 w-10 place-items-center rounded-xl border-2 font-display text-2xl font-extrabold sm:h-14 sm:w-12",
                  guess[i] ? (solved ? "border-primary bg-primary text-primary-foreground" : i < reveal.length ? "border-gold bg-gold/20 text-gold" : "border-ink-foreground/40 bg-ink-soft") : "border-dashed border-ink-foreground/30")}>
                  {guess[i] ?? ""}
                </span>
              ))}
            </div>
            {!solved ? (
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
                <p className="text-xs text-ink-foreground/60">Score if solved now: {wordScore(hints, wrongs)}</p>
              </>
            ) : (
              <div className="space-y-3">
                <p className="font-display text-5xl font-extrabold text-gold">{wordScore(hints, wrongs)} pts</p>
                <div className="flex justify-center gap-2">
                  <Button onClick={() => load(offset + 1)}>Bonus word</Button>
                  <Button variant="outline" asChild><Link to="/games">All games</Link></Button>
                </div>
              </div>
            )}
          </div>
        </GameStage>
      )}
    </AppShell>
  );
}
