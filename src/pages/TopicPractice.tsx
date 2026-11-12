import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  Play,
  RotateCcw,
  Target,
  Timer,
  XCircle,
} from "lucide-react";
import AppShell from "@/components/edura/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MathRenderer } from "@/components/ui/math-renderer";
import { QuestionMedia } from "@/components/questions/QuestionMedia";
import { supabase } from "@/integrations/supabase/client";
import { type Json } from "@/integrations/supabase/types";
import {
  getPracticeOptions,
  getSelectedOptionIndex,
  getTopicMastery,
  type PracticeOption,
} from "@/lib/topicPractice";
import { toast } from "sonner";

type ExamBody = "JAMB" | "WAEC" | "NECO";
type DrillMode = "instant" | "timed";
type Topic = {
  subject_id: string;
  subject_name: string;
  topic_name: string;
  question_count: number;
  attempted_questions: number;
  correct_questions: number;
};
type PracticeSession = {
  session_id: string;
  subject_id: string;
  subject_name: string;
  exam_body: ExamBody;
  topic_name: string;
  mode: DrillMode;
  question_count: number;
  time_limit_seconds: number;
  created_at: string;
  submitted_at: string | null;
};
type PracticeQuestion = {
  id: string;
  question_text: string;
  type: string;
  options: Json;
  media_urls: Json;
  option_media: Json;
  saved_answer: Json;
  saved_is_correct: boolean | null;
  correct_answer: Json;
  explanation: string | null;
};
type ReviewQuestion = {
  id: string;
  question_text: string;
  options: Json;
  media_urls: Json;
  option_media: Json;
  answer: Json;
  is_correct: boolean | null;
  correct_answer: Json;
  explanation: string | null;
};
type AnswerFeedback = {
  isCorrect: boolean;
  correctAnswer: Json;
  explanation: string | null;
};
type DrillSummary = { answered: number; correct: number; total: number; percentage: number };

const EXAMS: { value: ExamBody; label: string }[] = [
  { value: "JAMB", label: "JAMB" },
  { value: "WAEC", label: "WAEC" },
  { value: "NECO", label: "NECO" },
];
const DRILL_SIZES = [5, 10, 20, 30];

function feedbackFromQuestion(question: PracticeQuestion): AnswerFeedback | null {
  if (typeof question.saved_is_correct !== "boolean" || question.saved_answer === null) return null;
  return {
    isCorrect: question.saved_is_correct,
    correctAnswer: question.correct_answer,
    explanation: question.explanation,
  };
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function summaryForReview(rows: ReviewQuestion[]): DrillSummary {
  const answered = rows.filter((row) => row.answer !== null).length;
  const correct = rows.filter((row) => row.is_correct === true).length;
  return {
    answered,
    correct,
    total: rows.length,
    percentage: answered ? Math.round((correct / answered) * 100) : 0,
  };
}

const TopicPractice = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const sessionId = searchParams.get("session");
  const initialExam = searchParams.get("exam");
  const [examBody, setExamBody] = useState<ExamBody>(
    EXAMS.some((exam) => exam.value === initialExam) ? initialExam as ExamBody : "JAMB"
  );
  const [subjectId, setSubjectId] = useState(searchParams.get("subject") ?? "");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [review, setReview] = useState<ReviewQuestion[] | null>(null);
  const [feedback, setFeedback] = useState<Record<string, AnswerFeedback>>({});
  const [answers, setAnswers] = useState<Record<string, Json>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [questionCount, setQuestionCount] = useState(5);
  const [mode, setMode] = useState<DrillMode>("instant");
  const [starting, setStarting] = useState(false);
  const [answerSaving, setAnswerSaving] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [summary, setSummary] = useState<DrillSummary | null>(null);
  const finishInProgress = useRef(false);
  const preselectedTopic = searchParams.get("topic");

  const subjects = useMemo(() => {
    const unique = new Map<string, string>();
    topics.forEach((topic) => unique.set(topic.subject_id, topic.subject_name));
    return [...unique].map(([id, name]) => ({ id, name }));
  }, [topics]);
  const subjectTopics = useMemo(
    () => topics.filter((topic) => topic.subject_id === subjectId),
    [topics, subjectId]
  );
  const currentQuestion = questions[currentIndex] ?? null;

  useEffect(() => {
    let active = true;
    setLibraryLoading(true);
    supabase.rpc("get_topic_practice_library", { target_exam_body: examBody })
      .then(({ data, error }) => {
        if (error) throw error;
        if (!active) return;
        setTopics(data ?? []);
      })
      .catch((error: unknown) => {
        console.error("Failed to load topic practice library:", error);
        toast.error(error instanceof Error ? error.message : "Could not load topic practice.");
        if (active) setTopics([]);
      })
      .finally(() => {
        if (active) setLibraryLoading(false);
      });
    return () => {
      active = false;
    };
  }, [examBody]);

  useEffect(() => {
    if (!subjects.length) {
      setSubjectId("");
      return;
    }
    if (!subjects.some((subject) => subject.id === subjectId)) {
      setSubjectId(subjects[0].id);
    }
  }, [subjects, subjectId]);

  useEffect(() => {
    if (sessionId || !preselectedTopic || libraryLoading) return;
    const topic = topics.find((item) =>
      item.subject_id === (searchParams.get("subject") ?? subjectId)
      && item.topic_name.toLowerCase() === preselectedTopic.toLowerCase()
    );
    if (!topic) return;

    setSubjectId(topic.subject_id);
    setSelectedTopic(topic);
    setQuestionCount(DRILL_SIZES.find((size) => size <= topic.question_count) ?? 5);
    setMode("instant");
    setSearchParams({ exam: examBody, subject: topic.subject_id }, { replace: true });
  }, [sessionId, preselectedTopic, libraryLoading, topics, subjectId, searchParams, examBody, setSearchParams]);

  useEffect(() => {
    if (!sessionId) {
      setSession(null);
      setQuestions([]);
      setReview(null);
      setSummary(null);
      finishInProgress.current = false;
      return;
    }

    let active = true;
    const loadSession = async () => {
      try {
        const [{ data: sessionRows, error: sessionError }, { data: questionRows, error: questionError }] =
          await Promise.all([
            supabase.rpc("get_topic_practice_session", { target_session_id: sessionId }),
            supabase.rpc("get_topic_practice_questions", { target_session_id: sessionId }),
          ]);
        if (sessionError) throw sessionError;
        if (questionError) throw questionError;
        const loadedSession = sessionRows?.[0];
        if (!loadedSession) throw new Error("Practice session not found.");
        if (!active) return;

        setSession(loadedSession);
        setQuestions(questionRows ?? []);
        setCurrentIndex(0);
        setAnswers(Object.fromEntries(
          (questionRows ?? [])
            .filter((question) => question.saved_answer !== null)
            .map((question) => [question.id, question.saved_answer])
        ));
        setFeedback(Object.fromEntries(
          (questionRows ?? [])
            .map((question) => [question.id, feedbackFromQuestion(question)])
            .filter((entry): entry is [string, AnswerFeedback] => entry[1] !== null)
        ));
        finishInProgress.current = false;

        if (loadedSession.submitted_at) {
          const { data: reviewRows, error: reviewError } = await supabase.rpc(
            "get_topic_practice_review",
            { target_session_id: sessionId }
          );
          if (reviewError) throw reviewError;
          if (!active) return;
          const loadedReview = reviewRows ?? [];
          setReview(loadedReview);
          setSummary(summaryForReview(loadedReview));
        }
      } catch (error) {
        console.error("Failed to load topic practice session:", error);
        toast.error(error instanceof Error ? error.message : "Could not load this drill.");
        if (active) setSearchParams({ exam: examBody }, { replace: true });
      }
    };
    void loadSession();
    return () => {
      active = false;
    };
  }, [sessionId, examBody, setSearchParams]);

  const finishSession = useCallback(async () => {
    if (!sessionId || finishInProgress.current) return;
    finishInProgress.current = true;
    setFinishing(true);
    try {
      const { error: finishError } = await supabase.rpc("finish_topic_practice", {
        target_session_id: sessionId,
      });
      if (finishError) throw finishError;

      const { data, error } = await supabase.rpc("get_topic_practice_review", {
        target_session_id: sessionId,
      });
      if (error) throw error;
      const rows = data ?? [];
      setReview(rows);
      setSummary(summaryForReview(rows));
      setSession((current) => current ? { ...current, submitted_at: new Date().toISOString() } : current);
    } catch (error) {
      console.error("Failed to submit topic practice drill:", error);
      toast.error(error instanceof Error ? error.message : "Could not submit this drill.");
      finishInProgress.current = false;
    } finally {
      setFinishing(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!session || session.mode !== "timed" || session.submitted_at || review) return;
    const updateTime = () => {
      const deadline = new Date(session.created_at).getTime() + session.time_limit_seconds * 1000;
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setTimeRemaining(remaining);
      if (remaining === 0) void finishSession();
    };
    updateTime();
    const interval = window.setInterval(updateTime, 1000);
    return () => window.clearInterval(interval);
  }, [session, review, finishSession]);

  const closeSession = () => {
    setSearchParams(
      { exam: examBody, ...(subjectId ? { subject: subjectId } : {}) },
      { replace: true }
    );
  };

  const startDrill = async () => {
    if (!selectedTopic) return;
    setStarting(true);
    try {
      const { data, error } = await supabase.rpc("create_topic_practice_session", {
        target_subject_id: selectedTopic.subject_id,
        target_exam_body: examBody,
        target_topic_name: selectedTopic.topic_name,
        target_question_count: questionCount,
        target_mode: mode,
      });
      if (error) throw error;
      const created = data?.[0];
      if (!created) throw new Error("The drill could not be created.");
      setSelectedTopic(null);
      setSearchParams({ session: created.session_id }, { replace: true });
    } catch (error) {
      console.error("Failed to start topic practice drill:", error);
      toast.error(error instanceof Error ? error.message : "Could not start this drill.");
    } finally {
      setStarting(false);
    }
  };

  const chooseAnswer = async (option: PracticeOption) => {
    if (!session || !currentQuestion || answerSaving || review) return;
    setAnswerSaving(true);
    try {
      const { data, error } = await supabase.rpc("submit_topic_practice_answer", {
        target_session_id: session.session_id,
        target_question_id: currentQuestion.id,
        submitted_answer: option.value,
      });
      if (error) throw error;
      setAnswers((current) => ({ ...current, [currentQuestion.id]: option.value }));

      if (session.mode === "instant") {
        const payload = data && typeof data === "object" && !Array.isArray(data) ? data : {};
        setFeedback((current) => ({
          ...current,
          [currentQuestion.id]: {
            isCorrect: payload.is_correct === true,
            correctAnswer: payload.correct_answer ?? null,
            explanation: typeof payload.explanation === "string" ? payload.explanation : null,
          },
        }));
      }
    } catch (error) {
      console.error("Failed to record topic practice answer:", error);
      toast.error(error instanceof Error ? error.message : "Could not save your answer.");
    } finally {
      setAnswerSaving(false);
    }
  };

  const resetToLibrary = () => {
    setSearchParams(
      { exam: session?.exam_body ?? examBody, ...(session?.subject_id ? { subject: session.subject_id } : {}) },
      { replace: true }
    );
  };

  if (sessionId && (!session || !questions.length)) {
    return (
      <AppShell side="cbt" title="Topic practice" subtitle="Loading your targeted drill…">
        <div className="flex min-h-64 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-primary" aria-label="Loading drill" />
        </div>
      </AppShell>
    );
  }

  if (session && questions.length && review && summary) {
    return (
      <AppShell
        side="cbt"
        title="Drill results"
        subtitle={`${session.subject_name} · ${session.topic_name}`}
        action={
          <Button variant="outline" onClick={resetToLibrary} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> All topics
          </Button>
        }
      >
        <div className="space-y-5">
          <Card>
            <CardContent className="grid gap-4 p-5 sm:grid-cols-3 sm:p-6">
              <div>
                <p className="text-sm text-muted-foreground">Accuracy</p>
                <p className="mt-1 font-display text-3xl font-bold">{summary.percentage}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Correct</p>
                <p className="mt-1 font-display text-3xl font-bold">{summary.correct}/{summary.answered}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Topic</p>
                <p className="mt-1 font-display text-lg font-bold">{session.topic_name}</p>
              </div>
            </CardContent>
          </Card>

          <section aria-label="Answer review" className="space-y-3">
            <h2 className="font-display text-lg font-bold">Answer review</h2>
            {review.map((question, index) => {
              const options = getPracticeOptions(question.options);
              const selectedIndex = question.answer === null ? -1 : getSelectedOptionIndex(options, question.answer);
              const correctIndex = getSelectedOptionIndex(options, question.correct_answer);
              return (
                <Card key={question.id}>
                  <CardContent className="space-y-3 p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <MathRenderer content={question.question_text} className="font-medium" />
                        <QuestionMedia media={question.media_urls} className="mt-3" />
                      </div>
                      {question.is_correct === null ? (
                        <span className="text-xs text-muted-foreground">Skipped</span>
                      ) : question.is_correct ? (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                      ) : (
                        <XCircle className="h-5 w-5 shrink-0 text-destructive" />
                      )}
                    </div>
                    <div className="space-y-1.5 pl-10">
                      {options.map((option, optionIndex) => (
                        <div
                          key={`${option.label}-${optionIndex}`}
                          className={`rounded-lg border px-3 py-2 text-sm ${
                            optionIndex === correctIndex
                              ? "border-emerald-500/50 bg-emerald-500/5"
                              : optionIndex === selectedIndex
                                ? "border-destructive/50 bg-destructive/5"
                                : "border-transparent bg-muted/40"
                          }`}
                        >
                          <span className="mr-2 font-semibold">{option.label}.</span>
                          <MathRenderer content={option.text} className="inline" />
                          {optionIndex === selectedIndex && <span className="ml-2 text-xs text-muted-foreground">(Your answer)</span>}
                          {optionIndex === correctIndex && <span className="ml-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">(Correct)</span>}
                        </div>
                      ))}
                    </div>
                    {question.explanation && (
                      <p className="ml-10 rounded-lg bg-primary/5 p-3 text-sm text-muted-foreground">
                        {question.explanation}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </section>

          <Button onClick={resetToLibrary} className="gap-2">
            <RotateCcw className="h-4 w-4" /> Practice another topic
          </Button>
        </div>
      </AppShell>
    );
  }

  if (session && currentQuestion) {
    const options = getPracticeOptions(currentQuestion.options);
    const currentAnswer = answers[currentQuestion.id];
    const selectedIndex = currentAnswer === undefined ? -1 : getSelectedOptionIndex(options, currentAnswer);
    const currentFeedback = feedback[currentQuestion.id];
    const correctIndex = currentFeedback
      ? getSelectedOptionIndex(options, currentFeedback.correctAnswer)
      : -1;
    const answeredCount = Object.keys(answers).length;

    return (
      <AppShell
        side="cbt"
        title={session.topic_name}
        subtitle={`${session.subject_name} · ${session.exam_body} topic drill`}
        action={
          <Button variant="outline" onClick={closeSession} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> All topics
          </Button>
        }
      >
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              {session.mode === "timed" ? <Timer className="h-4 w-4 text-primary" /> : <Target className="h-4 w-4 text-primary" />}
              <span>{session.mode === "timed" ? "Timed drill" : "Instant review"}</span>
            </div>
            {session.mode === "timed" && (
              <span className={`flex items-center gap-1.5 font-mono text-lg font-bold tabular-nums ${timeRemaining < 60 ? "text-destructive" : ""}`}>
                <Clock3 className="h-4 w-4" aria-hidden="true" />
                <span aria-live="polite">{formatTime(timeRemaining)}</span>
              </span>
            )}
            {session.mode === "instant" && (
              <span className="text-xs text-muted-foreground">{answeredCount} of {questions.length} answered</span>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Question {currentIndex + 1} of {questions.length}</span>
              <span>{Math.round(((currentIndex + 1) / questions.length) * 100)}%</span>
            </div>
            <Progress value={((currentIndex + 1) / questions.length) * 100} className="h-2" />
          </div>

          <Card>
            <CardContent className="space-y-5 p-4 sm:p-6">
              <MathRenderer content={currentQuestion.question_text} className="text-base font-semibold leading-relaxed sm:text-lg" />
              <QuestionMedia media={currentQuestion.media_urls} />
              <RadioGroup
                value={selectedIndex >= 0 ? String(selectedIndex) : ""}
                onValueChange={(value) => {
                  const option = options[Number(value)];
                  if (option) void chooseAnswer(option);
                }}
                className="space-y-2"
                disabled={Boolean(currentFeedback) || answerSaving || Boolean(review)}
              >
                {options.map((option, index) => (
                  <Label
                    key={`${option.label}-${index}`}
                    htmlFor={`topic-option-${currentQuestion.id}-${index}`}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors sm:p-4 ${
                      currentFeedback && correctIndex === index
                        ? "border-emerald-500 bg-emerald-500/5"
                        : selectedIndex === index && currentFeedback && !currentFeedback.isCorrect
                          ? "border-destructive bg-destructive/5"
                          : selectedIndex === index
                            ? "border-primary bg-primary/5"
                            : "hover:border-primary/40"
                    }`}
                  >
                    <RadioGroupItem
                      id={`topic-option-${currentQuestion.id}-${index}`}
                      value={String(index)}
                      className="mt-0.5"
                    />
                    <span className="font-semibold">{option.label}.</span>
                    <MathRenderer content={option.text} className="min-w-0 flex-1" />
                  </Label>
                ))}
              </RadioGroup>

              {currentFeedback && (
                <div className={`rounded-xl border p-4 ${currentFeedback.isCorrect ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5"}`}>
                  <p className="font-semibold">
                    {currentFeedback.isCorrect ? "Correct!" : "Not quite. Review the correct answer."}
                  </p>
                  {currentFeedback.explanation && (
                    <p className="mt-2 text-sm text-muted-foreground">{currentFeedback.explanation}</p>
                  )}
                  {!currentFeedback.explanation && (
                    <p className="mt-2 text-sm text-muted-foreground">Correct answer: {String(currentFeedback.correctAnswer ?? "Unavailable")}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
              disabled={currentIndex === 0 || answerSaving}
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Previous
            </Button>
            {session.mode === "timed" ? (
              currentIndex < questions.length - 1 ? (
                <Button onClick={() => setCurrentIndex((index) => index + 1)} disabled={answerSaving}>
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={() => void finishSession()} disabled={finishing || answerSaving}>
                  {finishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit drill
                </Button>
              )
            ) : currentIndex < questions.length - 1 ? (
              <Button onClick={() => setCurrentIndex((index) => index + 1)} disabled={!currentFeedback || answerSaving}>
                Next <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={() => void finishSession()} disabled={!currentFeedback || finishing}>
                {finishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Finish drill
              </Button>
            )}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      side="cbt"
      title="Topic practice"
      subtitle="Focus on one syllabus topic and build mastery with targeted drills."
    >
      <div className="space-y-5">
        <section className="grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-2 sm:p-5">
          <div className="space-y-2">
            <Label htmlFor="topic-exam">Exam</Label>
            <Select value={examBody} onValueChange={(value: ExamBody) => {
              setExamBody(value);
              setSubjectId("");
              setSearchParams({ exam: value }, { replace: true });
            }}>
              <SelectTrigger id="topic-exam"><SelectValue /></SelectTrigger>
              <SelectContent>
                {EXAMS.map((exam) => <SelectItem key={exam.value} value={exam.value}>{exam.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="topic-subject">Subject</Label>
            <Select value={subjectId} onValueChange={(value) => {
              setSubjectId(value);
              setSearchParams({ exam: examBody, subject: value }, { replace: true });
            }} disabled={!subjects.length}>
              <SelectTrigger id="topic-subject"><SelectValue placeholder="Choose a subject" /></SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </section>

        <section aria-label="Available topics">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold">Choose a topic</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {subjectTopics.length
                  ? `${subjectTopics.length} topics · all-time accuracy updates after each drill`
                  : "Topics appear here when the question bank has tagged questions for this subject."}
              </p>
            </div>
            {libraryLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-label="Loading topics" />}
          </div>

          {libraryLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((item) => <div key={item} className="skeleton h-40 rounded-2xl" />)}
            </div>
          ) : !subjects.length ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Target className="mx-auto h-8 w-8 text-muted-foreground" />
                <h3 className="mt-3 font-semibold">No tagged topics yet</h3>
                <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                  We’ll show topics here as exam questions are tagged and added to the question bank.
                </p>
              </CardContent>
            </Card>
          ) : !subjectTopics.length ? (
            <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No drillable topics found for this subject and exam.</CardContent></Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {subjectTopics.map((topic) => {
                const status = getTopicMastery(topic.attempted_questions, topic.correct_questions);
                const sizes = DRILL_SIZES.filter((size) => size <= topic.question_count);
                return (
                  <Card key={`${topic.subject_id}-${topic.topic_name}`} className="flex flex-col">
                    <CardContent className="flex flex-1 flex-col p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-display font-bold">{topic.topic_name}</h3>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.className}`}>
                          {status.label}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {topic.question_count} available questions
                      </p>
                      {status.score !== null ? (
                        <div className="mt-4">
                          <div className="mb-1.5 flex justify-between text-xs">
                            <span className="text-muted-foreground">All-time accuracy</span>
                            <span className="font-semibold">{status.score}% · {topic.attempted_questions} answered</span>
                          </div>
                          <Progress value={status.score} className="h-1.5" />
                        </div>
                      ) : (
                        <p className="mt-4 text-xs text-muted-foreground">Complete 5 questions to establish a mastery baseline.</p>
                      )}
                      <Button
                        className="mt-4 w-full gap-2"
                        disabled={!sizes.length}
                        onClick={() => {
                          setSelectedTopic(topic);
                          setQuestionCount(sizes[0] ?? 5);
                          setMode("instant");
                        }}
                      >
                        <Play className="h-4 w-4" />
                        {sizes.length ? "Start drill" : "Not enough questions"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <Dialog open={Boolean(selectedTopic)} onOpenChange={(open) => !open && setSelectedTopic(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set up your drill</DialogTitle>
            <DialogDescription>
              {selectedTopic?.topic_name} · {selectedTopic?.subject_name}
            </DialogDescription>
          </DialogHeader>
          {selectedTopic && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="drill-size">Number of questions</Label>
                <Select value={String(questionCount)} onValueChange={(value) => setQuestionCount(Number(value))}>
                  <SelectTrigger id="drill-size"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DRILL_SIZES.filter((size) => size <= selectedTopic.question_count).map((size) => (
                      <SelectItem key={size} value={String(size)}>{size} questions</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Practice mode</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {([
                    { value: "instant" as const, title: "Instant review", detail: "See the answer and explanation after each response." },
                    { value: "timed" as const, title: "Timed drill", detail: "One minute per question; review after you submit." },
                  ]).map((choice) => (
                    <button
                      key={choice.value}
                      type="button"
                      onClick={() => setMode(choice.value)}
                      className={`rounded-xl border p-3 text-left transition-colors ${mode === choice.value ? "border-primary bg-primary/5" : "hover:border-primary/40"}`}
                    >
                      <span className="flex items-center gap-2 font-semibold">
                        {choice.value === "instant" ? <Target className="h-4 w-4" /> : <Timer className="h-4 w-4" />}
                        {choice.title}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">{choice.detail}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={() => void startDrill()} disabled={starting} className="w-full">
                {starting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                Start {questionCount}-question drill
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
};

export default TopicPractice;
