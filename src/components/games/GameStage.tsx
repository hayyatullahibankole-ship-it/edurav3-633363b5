import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Mic, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { isMuted, pickLine, setMuted, speak, type CommentEvent } from "@/lib/gameAudio";

/** Hook: commentator line shown on screen and spoken aloud. */
export function useCommentator() {
  const [line, setLine] = useState<{ text: string; key: number } | null>(null);
  const say = useCallback((e: CommentEvent) => {
    const text = pickLine(e); setLine({ text, key: Date.now() }); speak(text);
  }, []);
  useEffect(() => () => { if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel(); }, []);
  return { line, say };
}

export function GameStage({ bg, line, flash, children }: {
  bg: string; line: { text: string; key: number } | null; flash?: "good" | "bad" | null; children: ReactNode;
}) {
  const [muted, setM] = useState(isMuted());
  return (
    <div className="relative isolate overflow-hidden rounded-3xl border-4 border-gold/60 bg-ink text-ink-foreground shadow-[0_10px_0_0_hsl(var(--ink-soft))]">
      <img src={bg} alt="" aria-hidden className="absolute inset-0 -z-20 h-full w-full scale-110 object-cover opacity-40 blur-[2px]" />
      <div className="absolute inset-0 -z-10 bg-ink/70" />
      {/* spotlights */}
      <div aria-hidden className="pointer-events-none absolute -left-20 -top-24 -z-10 h-72 w-72 animate-pulse rounded-full bg-gold/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 -z-10 h-72 w-72 animate-pulse rounded-full bg-primary/25 blur-3xl [animation-delay:1s]" />
      {/* stage lights row */}
      <div aria-hidden className="flex justify-center gap-3 bg-ink/60 py-2">
        {Array.from({ length: 14 }).map((_, i) => (
          <span key={i} className="h-2 w-2 animate-pulse rounded-full bg-gold" style={{ animationDelay: `${(i % 4) * 0.25}s` }} />
        ))}
      </div>
      {flash && <div key={line?.key} className={cn("pointer-events-none absolute inset-0 z-10 animate-fade-out", flash === "good" ? "bg-primary/30" : "bg-destructive/30")} />}

      <div className="flex items-center justify-between gap-3 px-4 pt-3 sm:px-6">
        <div className="flex min-h-[44px] flex-1 items-center gap-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold text-gold-foreground"><Mic className="h-4 w-4" /></span>
          {line && (
            <p key={line.key} className="animate-scale-in rounded-2xl rounded-tl-none bg-ink-soft px-3 py-2 text-sm font-semibold italic">“{line.text}”</p>
          )}
        </div>
        <button type="button" aria-label={muted ? "Turn sound on" : "Turn sound off"}
          onClick={() => { setMuted(!muted); setM(!muted); }}
          className="grid h-10 w-10 place-items-center rounded-full bg-ink-soft hover:bg-ink-soft/70">
          {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5 text-gold" />}
        </button>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  );
}
