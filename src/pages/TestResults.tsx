import { useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useCleanResults } from '@/hooks/useCleanResults';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Trophy, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText,
  Download,
  Target,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { generateExamReportPDF } from '@/utils/pdfGenerator';

export default function TestResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const attemptId = searchParams.get('attempt');
  const { toast } = useToast();
  const { results, loading } = useCleanResults(attemptId);
  const [downloading, setDownloading] = useState(false);
  const [weakTopic, setWeakTopic] = useState<{
    subject_id: string;
    subject_name: string;
    topic_name: string;
    accuracy: number;
    exam_body: string | null;
    total_questions: number;
  } | null>(null);

  useEffect(() => {
    if (!attemptId) return;
    let active = true;
    Promise.resolve(supabase.rpc('get_weak_topic_for_attempt', { target_attempt_id: attemptId }))
      .then(({ data, error }) => {
        if (error) throw error;
        if (active) setWeakTopic(data?.[0] ?? null);
      })
      .catch((error: unknown) => {
        console.error('Failed to load weak topic recommendation:', error);
        if (active) toast({
          title: 'Topic recommendation unavailable',
          description: error instanceof Error ? error.message : 'Could not load a topic to revise.',
          variant: 'destructive'
        });
      });
    return () => { active = false; };
  }, [attemptId, toast]);

  const handleDownloadPDF = async () => {
    if (!results || !attemptId) return;

    try {
      setDownloading(true);

      // Fetch additional data needed for PDF
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const [userProfileResp, attemptResp] = await Promise.all([
        supabase.from('users').select('first_name, last_name, email').eq('auth_user_id', user.id).single(),
        supabase.from('attempts').select('proctoring_data, started_at').eq('id', attemptId).single()
      ]);

      const userProfile = userProfileResp.data;
      const attemptData = attemptResp.data;

      if (!userProfile || !attemptData) {
        throw new Error('Failed to fetch required data');
      }

      const proctorData = attemptData.proctoring_data as any;
      const examTitle = proctorData?.title || 'Practice Test';
      const durationMinutes = proctorData?.duration_minutes || 180;

      // Prepare data for PDF generator
      const pdfData = {
        examTitle,
        studentName: `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || 'Student',
        studentEmail: userProfile.email || user.email || '',
        examDate: new Date(attemptData.started_at || results.createdAt).toLocaleDateString(),
        totalQuestions: results.totalQuestions,
        correctAnswers: results.correctAnswers,
        wrongAnswers: results.wrongAnswers,
        unanswered: results.unanswered,
        score: results.rawScore,
        percentage: results.percentage,
        timeTaken: results.timeTakenMinutes,
        timeAllotted: durationMinutes,
        subjectBreakdown: results.subjectBreakdown,
        attemptId: results.attemptId
      };

      await generateExamReportPDF(pdfData);

      toast({
        title: 'Success',
        description: 'Results PDF downloaded successfully'
      });

    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Results not found</p>
            <p className="text-sm text-muted-foreground mt-2">
              If you just completed a **mock exam**, please use the mock results
              portal instead (menu → Mock Results) – the regular results page
              only works for live/official exams.
            </p>
            <Button onClick={() => navigate('/dashboard')} className="mt-4">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Clean Header */}
      <div className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900">
              <Trophy className="h-6 w-6 text-primary" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Exam Results</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {results.percentage >= 50 ? "Great job! Here's your detailed performance." : "Here's your detailed performance."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-6">
        {/* Primary Score Section */}
        <Card className="border border-slate-200 dark:border-slate-800">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Large Score Display */}
              <div className="text-center">
                <div className="mb-6">
                  <div className="text-6xl md:text-7xl font-bold text-primary mb-2">
                    {results.percentage.toFixed(1)}%
                  </div>
                  {results.scaledScore && (
                    <div className="text-lg text-muted-foreground font-medium">
                      Scaled Score: {results.scaledScore}/400
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Correct</p>
                      <p className="text-2xl font-bold text-foreground">{results.correctAnswers}</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    {((results.correctAnswers / results.totalQuestions) * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                      <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Incorrect</p>
                      <p className="text-2xl font-bold text-foreground">{results.wrongAnswers}</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    {((results.wrongAnswers / results.totalQuestions) * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                      <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Unanswered</p>
                      <p className="text-2xl font-bold text-foreground">{results.unanswered}</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    {((results.unanswered / results.totalQuestions) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Total Questions</p>
                  <p className="text-2xl font-bold text-foreground">{results.totalQuestions}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Time Taken</p>
                  <p className="text-2xl font-bold text-foreground">{results.timeTakenMinutes}m</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Performance</p>
                  <p className={`text-2xl font-bold ${results.percentage >= 70 ? 'text-green-600 dark:text-green-400' : results.percentage >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                    {results.percentage >= 70 ? 'Excellent' : results.percentage >= 50 ? 'Good' : 'Needs Work'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subject Breakdown */}
        {Object.keys(results.subjectBreakdown).length > 0 && (
          <Card className="border border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Subject Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(results.subjectBreakdown).map(([subject, stats]) => (
                <div key={subject} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">{subject}</span>
                    <span className="text-sm font-medium text-muted-foreground">
                      {stats.correct} / {stats.total} ({stats.percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${stats.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
              {weakTopic && (
                <div className="mt-5 flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold">Topic to revise: {weakTopic.topic_name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {weakTopic.subject_name} · {weakTopic.accuracy}% accuracy across {weakTopic.total_questions ?? 0} answered questions
                    </p>
                  </div>
                  {weakTopic.exam_body && (
                    <Button
                      onClick={() => navigate(
                        `/topic-practice?exam=${weakTopic.exam_body}&subject=${weakTopic.subject_id}&topic=${encodeURIComponent(weakTopic.topic_name)}`
                      )}
                      className="gap-2"
                    >
                      <Target className="h-4 w-4" /> Revise weak topic
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={() => navigate(`/answer-review?attempt=${attemptId}`)}
            size="lg"
            className="h-12 text-base font-semibold"
          >
            <FileText className="h-5 w-5 mr-2" />
            Review Answers
          </Button>

          <Button
            onClick={handleDownloadPDF}
            disabled={downloading}
            variant="outline"
            size="lg"
            className="h-12 text-base font-semibold"
          >
            {downloading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-5 w-5 mr-2" />
                Download Results
              </>
            )}
          </Button>

          <Button
            onClick={() => navigate('/dashboard')}
            variant="ghost"
            size="lg"
            className="h-12 text-base font-semibold"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
