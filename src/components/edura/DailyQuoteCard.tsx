import { Quote as QuoteIcon } from "lucide-react";
import { quoteForDate } from "@/lib/dailyQuotes";

export default function DailyQuoteCard() {
  const q = quoteForDate(new Date());
  return (
    <figure className="relative flex h-full gap-3 overflow-hidden rounded-2xl border bg-card p-4 shadow-sm">
      <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-primary" />
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <QuoteIcon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Quote of the day</p>
        <blockquote className="mt-1 line-clamp-3 font-display text-[15px] font-bold leading-snug text-foreground">“{q.text}”</blockquote>
        <figcaption className="mt-1.5 truncate text-xs font-medium text-primary">— {q.author}</figcaption>
      </div>
    </figure>
  );
}
