import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { loadGameSubjects, type GameSubject } from "./gameQuestions";

export const SubjectPicker = ({ onStart, max = 4, cta }: { onStart: (ids: string[]) => void; max?: number; cta: string }) => {
  const [subjects, setSubjects] = useState<GameSubject[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  useEffect(() => { loadGameSubjects().then(setSubjects); }, []);
  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= max ? p : [...p, id]));
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Pick up to {max} subjects.</p>
      <div className="flex flex-wrap gap-2">
        {subjects.map((s) => (
          <button key={s.id} type="button" onClick={() => toggle(s.id)}
            className={cn("press rounded-full border px-4 py-2 text-sm font-medium", picked.includes(s.id) ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary")}>
            {s.name}
          </button>
        ))}
      </div>
      <Button size="lg" className="w-full sm:w-auto" disabled={!picked.length} onClick={() => onStart(picked)}>{cta}</Button>
    </div>
  );
};
