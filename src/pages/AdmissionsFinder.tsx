import { useMemo, useState } from "react";
import { Compass, GraduationCap, School as SchoolIcon, MessageCircle, Check, X, Search } from "lucide-react";
import AppShell from "@/components/edura/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COURSES, SCHOOLS, JAMB_SUBJECTS, type Course, type SchoolType } from "@/data/admissionsData";
import { matchCourses, missingSubjects, scoreVerdict, consultantLink, isEligible } from "@/lib/admissions";
import { cn } from "@/lib/utils";

const FACULTIES = ["All", ...Array.from(new Set(COURSES.map((c) => c.faculty)))];
const STATES = ["All", ...Array.from(new Set(SCHOOLS.map((s) => s.state))).sort()];
const VERDICT = {
  strong: { label: "Strong chance", cls: "bg-primary/10 text-primary" },
  borderline: { label: "Borderline", cls: "bg-accent text-accent-foreground" },
  low: { label: "Below typical cut-off", cls: "bg-destructive/10 text-destructive" },
};

function ConsultantCard({ context }: { context: string }) {
  return (
    <div className="rounded-2xl border border-primary/30 bg-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1">
        <p className="font-semibold text-foreground">Need personal admission guidance?</p>
        <p className="text-sm text-muted-foreground">Chat with an Akboy admissions consultant on WhatsApp — change of course, O'level gaps, cut-offs.</p>
      </div>
      <Button asChild className="gap-2 shrink-0">
        <a href={consultantLink(context)} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4" /> Talk to a consultant</a>
      </Button>
    </div>
  );
}

function CourseDetail({ course, score }: { course: Course; score: number | null }) {
  const v = score ? VERDICT[scoreVerdict(score, course.cutoff)] : null;
  const schools = SCHOOLS.filter((s) => s.strengths.some((x) => course.name.toLowerCase().includes(x.toLowerCase()) || x.toLowerCase().includes(course.faculty.split(" ")[0].toLowerCase())));
  return (
    <div className="rounded-2xl border bg-card p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-foreground">{course.name}</h3>
          <p className="text-sm text-muted-foreground">{course.faculty}</p>
        </div>
        {v && <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", v.cls)}>{v.label}</span>}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">JAMB subjects</p>
        <div className="flex flex-wrap gap-2">
          <Badge>English</Badge>
          {course.required.map((s) => <Badge key={s}>{s}</Badge>)}
          {course.required.length < 3 && (
            <Badge variant="outline">+ {3 - course.required.length} from {course.optional.length ? course.optional.slice(0, 4).join(", ") + (course.optional.length > 4 ? "…" : "") : "any subject"}</Badge>
          )}
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4 text-sm">
        <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">O'level</p><p>{course.olevel}</p></div>
        <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Typical UTME cut-off</p><p>{course.cutoff[0]} – {course.cutoff[1]}+ (competitive schools higher)</p></div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Career paths</p>
        <p className="text-sm">{course.careers.join(" · ")}</p>
      </div>
      {schools.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Known for this</p>
          <div className="flex flex-wrap gap-2">{schools.slice(0, 8).map((s) => <Badge key={s.short} variant="secondary">{s.short}</Badge>)}</div>
        </div>
      )}
    </div>
  );
}

function CourseChecker() {
  const [q, setQ] = useState("");
  const [fac, setFac] = useState("All");
  const [selected, setSelected] = useState<Course | null>(null);
  const [score, setScore] = useState("");
  const list = COURSES.filter((c) => (fac === "All" || c.faculty === fac) && c.name.toLowerCase().includes(q.toLowerCase()));
  const s = Number(score) || null;
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-2">
        <div className="relative sm:col-span-2"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search a course e.g. Nursing" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <Select value={fac} onValueChange={setFac}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{FACULTIES.map((f) => <SelectItem key={f} value={f}>{f === "All" ? "All faculties" : f}</SelectItem>)}</SelectContent></Select>
      </div>
      <div className="flex flex-wrap gap-2">
        {list.map((c) => (
          <button key={c.id} onClick={() => setSelected(c)} className={cn("rounded-full border px-3 py-1.5 text-sm transition-colors", selected?.id === c.id ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:border-primary")}>{c.name}</button>
        ))}
        {list.length === 0 && <p className="text-sm text-muted-foreground">No course found.</p>}
      </div>
      {selected && (
        <>
          <Input type="number" inputMode="numeric" placeholder="Your JAMB score (optional)" value={score} onChange={(e) => setScore(e.target.value)} className="max-w-xs" />
          <CourseDetail course={selected} score={s} />
          <ConsultantCard context={`Course: ${selected.name}${s ? `\nJAMB score: ${s}` : ""}`} />
        </>
      )}
    </div>
  );
}

function ReverseMatcher() {
  const [subs, setSubs] = useState<string[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const toggle = (s: string) => setSubs((x) => x.includes(s) ? x.filter((y) => y !== s) : x.length < 3 ? [...x, s] : x);
  const matches = useMemo(() => subs.length === 3 ? matchCourses(subs) : [], [subs]);
  const near = useMemo(() => subs.length === 3 ? COURSES.filter((c) => !isEligible(c, subs) && missingSubjects(c, subs).length === 1) : [], [subs]);
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">English is compulsory. Pick your other <b>3</b> JAMB subjects ({subs.length}/3).</p>
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-primary text-primary-foreground px-3 py-1.5 text-sm">English ✓</span>
        {JAMB_SUBJECTS.map((s) => (
          <button key={s} onClick={() => toggle(s)} disabled={!subs.includes(s) && subs.length >= 3} className={cn("rounded-full border px-3 py-1.5 text-sm transition-colors disabled:opacity-40", subs.includes(s) ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:border-primary")}>{s}</button>
        ))}
      </div>
      {subs.length === 3 && (
        <div className="space-y-3">
          <p className="font-semibold">{matches.length} course{matches.length === 1 ? "" : "s"} you can apply for</p>
          {matches.map((c) => (
            <div key={c.id}>
              <button onClick={() => setOpen(open === c.id ? null : c.id)} className="w-full flex items-center justify-between rounded-xl border bg-card px-4 py-3 text-left hover:border-primary">
                <span className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /><span className="font-medium">{c.name}</span></span>
                <span className="text-xs text-muted-foreground">{c.faculty}</span>
              </button>
              {open === c.id && <div className="mt-2"><CourseDetail course={c} score={null} /></div>}
            </div>
          ))}
          {matches.length === 0 && <p className="text-sm text-muted-foreground">No course in our list fits this exact combination.</p>}
          {near.length > 0 && (
            <div className="rounded-xl border border-dashed p-4">
              <p className="text-sm font-semibold mb-2">One subject away</p>
              <ul className="space-y-1 text-sm">{near.slice(0, 8).map((c) => <li key={c.id} className="flex items-center gap-2"><X className="h-3.5 w-3.5 text-destructive" />{c.name} — needs {missingSubjects(c, subs).join(", ")}</li>)}</ul>
            </div>
          )}
          <ConsultantCard context={`My JAMB subjects: English, ${subs.join(", ")}`} />
        </div>
      )}
    </div>
  );
}

function SchoolDirectory() {
  const [state, setState] = useState("All");
  const [type, setType] = useState<"All" | SchoolType>("All");
  const [score, setScore] = useState("");
  const s = Number(score) || 0;
  const list = SCHOOLS.filter((x) => (state === "All" || x.state === state) && (type === "All" || x.type === type));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <Select value={state} onValueChange={setState}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATES.map((x) => <SelectItem key={x} value={x}>{x === "All" ? "All states" : x}</SelectItem>)}</SelectContent></Select>
        <Select value={type} onValueChange={(v) => setType(v as typeof type)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["All", "Federal", "State", "Private", "Polytechnic"].map((x) => <SelectItem key={x} value={x}>{x === "All" ? "All types" : x}</SelectItem>)}</SelectContent></Select>
        <Input className="col-span-2 sm:col-span-1" type="number" inputMode="numeric" placeholder="Your JAMB score" value={score} onChange={(e) => setScore(e.target.value)} />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {list.map((x) => (
          <div key={x.short} className="rounded-xl border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div><p className="font-semibold">{x.short}</p><p className="text-xs text-muted-foreground">{x.name}</p></div>
              <Badge variant="outline">{x.type}</Badge>
            </div>
            <p className="mt-2 text-sm">{x.state} · Min. cut-off <b>{x.minCutoff}</b></p>
            <p className="text-xs text-muted-foreground mt-1">Known for: {x.strengths.join(", ")}</p>
            {s > 0 && <p className={cn("mt-2 text-xs font-semibold", s >= x.minCutoff ? "text-primary" : "text-destructive")}>{s >= x.minCutoff ? "You meet the general cut-off" : "Below general cut-off"}</p>}
          </div>
        ))}
      </div>
      <ConsultantCard context={`Looking for schools${state !== "All" ? ` in ${state}` : ""}${s ? `\nJAMB score: ${s}` : ""}`} />
    </div>
  );
}

export default function AdmissionsFinder() {
  return (
    <AppShell side="cbt" title="Course & School Finder" subtitle="Find the right course, JAMB subjects and school for you.">
      <Tabs defaultValue="course" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="course" className="gap-1.5 text-xs sm:text-sm"><GraduationCap className="h-4 w-4 hidden sm:block" />Course</TabsTrigger>
          <TabsTrigger value="subjects" className="gap-1.5 text-xs sm:text-sm"><Compass className="h-4 w-4 hidden sm:block" />My subjects</TabsTrigger>
          <TabsTrigger value="schools" className="gap-1.5 text-xs sm:text-sm"><SchoolIcon className="h-4 w-4 hidden sm:block" />Schools</TabsTrigger>
        </TabsList>
        <TabsContent value="course"><CourseChecker /></TabsContent>
        <TabsContent value="subjects"><ReverseMatcher /></TabsContent>
        <TabsContent value="schools"><SchoolDirectory /></TabsContent>
      </Tabs>
      <p className="mt-6 text-xs text-muted-foreground">Requirements and cut-offs are a guide and change yearly. Always confirm with the JAMB brochure and the school.</p>
    </AppShell>
  );
}
