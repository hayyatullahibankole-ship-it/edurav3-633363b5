import { ContentRenderer } from "@/components/ui/content-renderer";
import { cn } from "@/lib/utils";
import type { GameQuestion } from "./gameQuestions";

interface Props {
  question: GameQuestion;
  hidden?: number[];
  picked: number | null;
  correct: number | null;
  disabled?: boolean;
  onPick: (index: number) => void;
}

export const GameQuestionCard = ({ question, hidden = [], picked, correct, disabled, onPick }: Props) => (
  <div className="space-y-4">
    <div className="rounded-2xl border bg-card p-5 text-base font-medium leading-relaxed">
      <ContentRenderer content={question.text} />
    </div>
    <div className="grid gap-2.5 sm:grid-cols-2">
      {question.options.map((o, i) => {
        const isHidden = hidden.includes(i);
        const revealed = correct !== null;
        return (
          <button
            key={o.key}
            type="button"
            disabled={disabled || isHidden || revealed}
            onClick={() => onPick(i)}
            className={cn(
              "press flex min-h-14 items-center gap-3 rounded-xl border-2 bg-card px-4 py-3 text-left text-sm transition-colors",
              !revealed && !isHidden && "hover:border-primary",
              picked === i && !revealed && "border-primary bg-primary/10",
              revealed && i === correct && "border-primary bg-primary/15",
              revealed && picked === i && i !== correct && "border-destructive bg-destructive/10",
              isHidden && "opacity-25",
            )}
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted font-display text-xs font-bold">{o.key}</span>
            <span className={cn(isHidden && "invisible")}><ContentRenderer content={o.text} /></span>
          </button>
        );
      })}
    </div>
  </div>
);
