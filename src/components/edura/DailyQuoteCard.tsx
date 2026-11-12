import { Quote as QuoteIcon } from "lucide-react";
import { quoteForDate } from "@/lib/dailyQuotes";

export default function DailyQuoteCard() {
  const q = quoteForDate(new Date());
  return (
    <figure className="relative flex items-center gap-3 overflow-hidden rounded-2xl border-2 border-ink bg-ink p-3 text-ink-foreground shadow-[0_3px_0_0_hsl(var(--primary))]">
      <QuoteIcon aria-hidden className="h-5 w-5 shrink-0 text-gold" />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold">Quote of the day</p>
        <blockquote className="mt-0.5 line-clamp-2 font-display text-sm font-bold leading-snug">“{q.text}”</blockquote>
        <figcaption className="mt-1 truncate text-xs text-ink-foreground/70">— {q.author}</figcaption>
      </div>
    </figure>
  );
}
