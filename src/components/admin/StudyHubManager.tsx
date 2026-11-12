import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { GraduationCap, Plus, Edit, Trash2, BookOpen, FileText, Video, Image, Upload, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function StudyHubManager() {
  const { toast } = useToast();
  const [topics, setTopics] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTopicDialogOpen, setIsTopicDialogOpen] = useState(false);
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<any>(null);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);

  const [topicForm, setTopicForm] = useState({
    title: '',
    description: '',
    subject_id: '',
    exam_type: 'JAMB' as 'JAMB' | 'WAEC' | 'CUSTOM',
    difficulty_level: 1,
    display_order: 0,
    is_active: true
  });

  const [lessonForm, setLessonForm] = useState({
    topic_id: '',
    title: '',
    content: '',
    summary: '',
    estimated_minutes: 15,
    display_order: 0,
    is_active: true,
    media_urls: [] as Array<{ url: string; type: 'image' | 'video'; caption?: string }>
  });

  const [uploadingMedia, setUploadingMedia] = useState(false);

  useEffect(() => {
    fetchData();

    // Subscribe to real-time updates
    const topicsChannel = supabase
      .channel('study-topics-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'study_topics' }, () => {
        fetchData();
      })
      .subscribe();

    const lessonsChannel = supabase
      .channel('study-lessons-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'study_lessons' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(topicsChannel);
      supabase.removeChannel(lessonsChannel);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Fetching study hub data...');
      
      const [topicsRes, lessonsRes, subjectsRes] = await Promise.all([
        supabase.from('study_topics').select('*, subjects(name)').order('display_order'),
        supabase.from('study_lessons').select('*, study_topics(title)').order('display_order'),
        supabase.from('subjects').select('*').eq('is_active', true)
      ]);

      console.log('Topics response:', topicsRes);
      console.log('Lessons response:', lessonsRes);
      console.log('Subjects response:', subjectsRes);

      if (topicsRes.error) {
        console.error('Topics fetch error:', topicsRes.error);
        throw topicsRes.error;
      }
      if (lessonsRes.error) {
        console.error('Lessons fetch error:', lessonsRes.error);
        throw lessonsRes.error;
      }
      if (subjectsRes.error) {
        console.error('Subjects fetch error:', subjectsRes.error);
        throw subjectsRes.error;
      }

      console.log(`Loaded ${topicsRes.data?.length || 0} topics, ${lessonsRes.data?.length || 0} lessons`);
      setTopics(topicsRes.data || []);
      setLessons(lessonsRes.data || []);
      setSubjects(subjectsRes.data || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load study hub data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTopic = async () => {
    try {
      console.log('Creating topic with data:', topicForm);
      
      const { data, error } = await supabase
        .from('study_topics')
        .insert([topicForm])
        .select();
      
      if (error) {
        console.error('Insert error:', error);
        throw error;
      }

      console.log('Topic created successfully:', data);
      toast({ title: 'Success', description: 'Topic created successfully' });
      setIsTopicDialogOpen(false);
      resetTopicForm();
      fetchData();
    } catch (error: any) {
      console.error('Full error object:', error);
      toast({
        title: 'Error',
        description: error.message || error.toString() || 'Failed to create topic',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateTopic = async () => {
    try {
      const { error } = await supabase
        .from('study_topics')
        .update(topicForm)
        .eq('id', selectedTopic.id);
      if (error) throw error;

      toast({ title: 'Success', description: 'Topic updated successfully' });
      setIsTopicDialogOpen(false);
      setSelectedTopic(null);
      resetTopicForm();
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update topic',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (!confirm('Are you sure you want to delete this topic?')) return;

    try {
      const { error } = await supabase.from('study_topics').delete().eq('id', topicId);
      if (error) throw error;

      // Immediately update local state
      setTopics(prev => prev.filter(t => t.id !== topicId));
      
      toast({ title: 'Success', description: 'Topic deleted successfully' });
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete topic',
        variant: 'destructive'
      });
      // Refetch on error to ensure consistency
      fetchData();
    }
  };

  const handleCreateLesson = async () => {
    try {
      const { error } = await supabase.from('study_lessons').insert([lessonForm]);
      if (error) throw error;

      toast({ title: 'Success', description: 'Lesson created successfully' });
      setIsLessonDialogOpen(false);
      resetLessonForm();
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create lesson',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateLesson = async () => {
    try {
      const { error } = await supabase
        .from('study_lessons')
        .update(lessonForm)
        .eq('id', selectedLesson.id);
      if (error) throw error;

      toast({ title: 'Success', description: 'Lesson updated successfully' });
      setIsLessonDialogOpen(false);
      setSelectedLesson(null);
      resetLessonForm();
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update lesson',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;

    try {
      const { error } = await supabase.from('study_lessons').delete().eq('id', lessonId);
      if (error) throw error;

      // Immediately update local state
      setLessons(prev => prev.filter(l => l.id !== lessonId));
      
      toast({ title: 'Success', description: 'Lesson deleted successfully' });
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete lesson',
        variant: 'destructive'
      });
      // Refetch on error to ensure consistency
      fetchData();
    }
  };

  const resetTopicForm = () => {
    setTopicForm({
      title: '',
      description: '',
      subject_id: '',
      exam_type: 'JAMB',
      difficulty_level: 1,
      display_order: 0,
      is_active: true
    });
  };

  const resetLessonForm = () => {
    setLessonForm({
      topic_id: '',
      title: '',
      content: '',
      summary: '',
      estimated_minutes: 15,
      display_order: 0,
      is_active: true,
      media_urls: []
    });
  };

  const handleMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    
    if (type === 'image' && !validImageTypes.includes(file.type)) {
      toast({ title: 'Error', description: 'Please upload a valid image file (JPEG, PNG, GIF, WEBP)', variant: 'destructive' });
      return;
    }
    
    if (type === 'video' && !validVideoTypes.includes(file.type)) {
      toast({ title: 'Error', description: 'Please upload a valid video file (MP4, WEBM, OGG)', variant: 'destructive' });
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast({ title: 'Error', description: 'File size must be less than 50MB', variant: 'destructive' });
      return;
    }

    try {
      setUploadingMedia(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `lesson-media/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('resources')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('resources')
        .getPublicUrl(filePath);

      setLessonForm({
        ...lessonForm,
        media_urls: [...lessonForm.media_urls, { url: publicUrl, type, caption: '' }]
      });

      toast({ title: 'Success', description: `${type === 'image' ? 'Image' : 'Video'} uploaded successfully` });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ title: 'Error', description: error.message || 'Failed to upload file', variant: 'destructive' });
    } finally {
      setUploadingMedia(false);
      event.target.value = '';
    }
  };

  const removeMedia = (index: number) => {
    setLessonForm({
      ...lessonForm,
      media_urls: lessonForm.media_urls.filter((_, i) => i !== index)
    });
  };

  const updateMediaCaption = (index: number, caption: string) => {
    const updatedMedia = [...lessonForm.media_urls];
    updatedMedia[index] = { ...updatedMedia[index], caption };
    setLessonForm({ ...lessonForm, media_urls: updatedMedia });
  };

  const editTopic = (topic: any) => {
    setSelectedTopic(topic);
    setTopicForm({
      title: topic.title,
      description: topic.description || '',
      subject_id: topic.subject_id,
      exam_type: topic.exam_type,
      difficulty_level: topic.difficulty_level,
      display_order: topic.display_order,
      is_active: topic.is_active
    });
    setIsTopicDialogOpen(true);
  };

  const editLesson = (lesson: any) => {
    setSelectedLesson(lesson);
    setLessonForm({
      topic_id: lesson.topic_id,
      title: lesson.title,
      content: lesson.content,
      summary: lesson.summary || '',
      estimated_minutes: lesson.estimated_minutes,
      display_order: lesson.display_order,
      is_active: lesson.is_active,
      media_urls: lesson.media_urls || []
    });
    setIsLessonDialogOpen(true);
  };

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Classroom Management</h2>
          <p className="text-muted-foreground">Manage topics, lessons, and resources</p>
        </div>
      </div>

      <Tabs defaultValue="topics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="topics">Topics</TabsTrigger>
          <TabsTrigger value="lessons">Lessons</TabsTrigger>
        </TabsList>

        <TabsContent value="topics" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{topics.length} topics total</p>
            <Dialog open={isTopicDialogOpen} onOpenChange={setIsTopicDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setSelectedTopic(null); resetTopicForm(); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Topic
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{selectedTopic ? 'Edit Topic' : 'Create New Topic'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={topicForm.title}
                      onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
                      placeholder="Topic title"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={topicForm.description}
                      onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })}
                      placeholder="Topic description"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Subject</Label>
                      <Select value={topicForm.subject_id} onValueChange={(v) => setTopicForm({ ...topicForm, subject_id: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Exam Type</Label>
                      <Select value={topicForm.exam_type} onValueChange={(v: any) => setTopicForm({ ...topicForm, exam_type: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="JAMB">JAMB</SelectItem>
                          <SelectItem value="WAEC">WAEC</SelectItem>
                          <SelectItem value="CUSTOM">CUSTOM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Difficulty Level (1-5)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="5"
                        value={topicForm.difficulty_level}
                        onChange={(e) => setTopicForm({ ...topicForm, difficulty_level: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label>Display Order</Label>
                      <Input
                        type="number"
                        value={topicForm.display_order}
                        onChange={(e) => setTopicForm({ ...topicForm, display_order: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={topicForm.is_active}
                      onCheckedChange={(checked) => setTopicForm({ ...topicForm, is_active: checked })}
                    />
                    <Label>Active</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsTopicDialogOpen(false)}>Cancel</Button>
                  <Button onClick={selectedTopic ? handleUpdateTopic : handleCreateTopic}>
                    {selectedTopic ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {topics.map((topic) => (
              <Card key={topic.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="w-5 h-5" />
                        {topic.title}
                        {!topic.is_active && <Badge variant="secondary">Inactive</Badge>}
                      </CardTitle>
                      <CardDescription>{topic.description}</CardDescription>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{topic.subjects?.name}</Badge>
                        <Badge variant="outline">{topic.exam_type.toUpperCase()}</Badge>
                        <Badge variant="outline">Level {topic.difficulty_level}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => editTopic(topic)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteTopic(topic.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="lessons" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{lessons.length} lessons total</p>
            <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setSelectedLesson(null); resetLessonForm(); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Lesson
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{selectedLesson ? 'Edit Lesson' : 'Create New Lesson'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Topic</Label>
                    <Select value={lessonForm.topic_id} onValueChange={(v) => setLessonForm({ ...lessonForm, topic_id: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select topic" />
                      </SelectTrigger>
                      <SelectContent>
                        {topics.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Lesson Title</Label>
                    <Input
                      value={lessonForm.title}
                      onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                      placeholder="Lesson title"
                    />
                  </div>
                  <div>
                    <Label>Summary</Label>
                    <Textarea
                      value={lessonForm.summary}
                      onChange={(e) => setLessonForm({ ...lessonForm, summary: e.target.value })}
                      placeholder="Brief summary"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>Content (Rich Text / Markdown)</Label>
                    <Textarea
                      value={lessonForm.content}
                      onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                      placeholder="Lesson content with markdown support"
                      rows={10}
                    />
                  </div>
                  
                  {/* Media Upload Section */}
                  <div className="space-y-3">
                    <Label>Images & Videos</Label>
                    <div className="flex gap-2">
                      <div>
                        <Input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleMediaUpload(e, 'image')}
                          disabled={uploadingMedia}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('image-upload')?.click()}
                          disabled={uploadingMedia}
                        >
                          <Image className="w-4 h-4 mr-2" />
                          Upload Image
                        </Button>
                      </div>
                      <div>
                        <Input
                          id="video-upload"
                          type="file"
                          accept="video/*"
                          onChange={(e) => handleMediaUpload(e, 'video')}
                          disabled={uploadingMedia}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('video-upload')?.click()}
                          disabled={uploadingMedia}
                        >
                          <Video className="w-4 h-4 mr-2" />
                          Upload Video
                        </Button>
                      </div>
                    </div>
                    
                    {/* Display uploaded media */}
                    {lessonForm.media_urls.length > 0 && (
                      <div className="space-y-2 mt-3">
                        {lessonForm.media_urls.map((media, index) => (
                          <div key={index} className="flex items-start gap-2 p-3 border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {media.type === 'image' ? (
                                  <Image className="w-4 h-4" />
                                ) : (
                                  <Video className="w-4 h-4" />
                                )}
                                <span className="text-sm font-medium">
                                  {media.type === 'image' ? 'Image' : 'Video'} {index + 1}
                                </span>
                              </div>
                              <Input
                                placeholder="Add caption (optional)"
                                value={media.caption || ''}
                                onChange={(e) => updateMediaCaption(index, e.target.value)}
                                className="text-sm"
                              />
                              <a
                                href={media.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-muted-foreground hover:underline mt-1 inline-block"
                              >
                                View file
                              </a>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMedia(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Estimated Minutes</Label>
                      <Input
                        type="number"
                        value={lessonForm.estimated_minutes}
                        onChange={(e) => setLessonForm({ ...lessonForm, estimated_minutes: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label>Display Order</Label>
                      <Input
                        type="number"
                        value={lessonForm.display_order}
                        onChange={(e) => setLessonForm({ ...lessonForm, display_order: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={lessonForm.is_active}
                      onCheckedChange={(checked) => setLessonForm({ ...lessonForm, is_active: checked })}
                    />
                    <Label>Active</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsLessonDialogOpen(false)}>Cancel</Button>
                  <Button onClick={selectedLesson ? handleUpdateLesson : handleCreateLesson}>
                    {selectedLesson ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {lessons.map((lesson) => (
              <Card key={lesson.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        {lesson.title}
                        {!lesson.is_active && <Badge variant="secondary">Inactive</Badge>}
                      </CardTitle>
                      <CardDescription>{lesson.summary}</CardDescription>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{lesson.study_topics?.title}</Badge>
                        <Badge variant="outline">{lesson.estimated_minutes} mins</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => editLesson(lesson)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteLesson(lesson.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
