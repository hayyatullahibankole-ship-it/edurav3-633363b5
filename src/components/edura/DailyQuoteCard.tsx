import { Quote as QuoteIcon } from "lucide-react";
import { quoteForDate } from "@/lib/dailyQuotes";

export default function DailyQuoteCard() {
  const q = quoteForDate(new Date());
  return (
    <figure className="relative overflow-hidden rounded-3xl border-2 border-ink bg-ink p-5 text-ink-foreground shadow-[0_6px_0_0_hsl(var(--primary))]">
      <QuoteIcon aria-hidden className="absolute -right-2 -top-2 h-24 w-24 rotate-12 text-gold/15" />
      <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-gold">Quote of the day</p>
      <blockquote className="mt-2 font-display text-lg font-bold leading-snug sm:text-xl">“{q.text}”</blockquote>
      <figcaption className="mt-2 text-sm text-ink-foreground/70">— {q.author}</figcaption>
    </figure>
  );
}
