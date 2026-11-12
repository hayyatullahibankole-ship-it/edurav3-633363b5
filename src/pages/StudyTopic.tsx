import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, FileText, Video, Download, PlayCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';

interface Lesson {
  id: string;
  title: string;
  summary: string;
  estimated_minutes: number;
  display_order: number;
  isCompleted?: boolean;
}

interface Resource {
  id: string;
  title: string;
  resource_type: string;
  resource_url: string;
}

export default function StudyTopic() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [topic, setTopic] = useState<any>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (topicId) {
      fetchTopicDetails();
    }
  }, [topicId]);

  const fetchTopicDetails = async () => {
    try {
      setLoading(true);

      const [topicRes, lessonsRes, completionsRes] = await Promise.all([
        supabase
          .from('study_topics')
          .select('*, subjects(name)')
          .eq('id', topicId)
          .single(),
        supabase
          .from('study_lessons')
          .select('*')
          .eq('topic_id', topicId)
          .eq('is_active', true)
          .order('display_order'),
        supabase
          .from('lesson_completions')
          .select('lesson_id')
      ]);

      if (topicRes.error) throw topicRes.error;
      if (lessonsRes.error) throw lessonsRes.error;

      setTopic(topicRes.data);

      // Mark completed lessons
      const completedLessonIds = new Set(
        completionsRes.data?.map(c => c.lesson_id) || []
      );

      const lessonsWithCompletion = (lessonsRes.data || []).map(lesson => ({
        ...lesson,
        isCompleted: completedLessonIds.has(lesson.id)
      }));

      setLessons(lessonsWithCompletion);
    } catch (error) {
      console.error('Error fetching topic:', error);
      toast.error('Failed to load topic details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!topic) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <p>Topic not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/study-hub')}
          className="mb-4 text-xs sm:text-sm"
        >
          ← Back to Classroom
        </Button>

        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-2">{topic.title}</h1>
          <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-4">
            <Badge className="text-xs">{topic.subjects?.name}</Badge>
            <Badge variant="secondary" className="text-xs">{topic.exam_type}</Badge>
            <span className="text-xs sm:text-sm text-muted-foreground">
              Difficulty: {topic.difficulty_level}/5
            </span>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">{topic.description}</p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">Lessons ({lessons.length})</h2>
          
          {lessons.map((lesson, index) => (
            <Card 
              key={lesson.id}
              className="hover:shadow-lg transition-all cursor-pointer animate-fade-in hover-scale"
              onClick={() => navigate(`/study-hub/lesson/${lesson.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                        Lesson {index + 1}
                      </span>
                      {lesson.isCompleted && (
                        <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Done
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-base sm:text-lg line-clamp-2">{lesson.title}</CardTitle>
                    <CardDescription className="mt-2 text-xs sm:text-sm line-clamp-2">
                      {lesson.summary}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span>{lesson.estimated_minutes} min</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {lessons.length === 0 && (
            <Card className="animate-fade-in">
              <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
                <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-4" />
                <p className="text-sm sm:text-base text-muted-foreground text-center">No lessons available for this topic yet</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
