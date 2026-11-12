CREATE TABLE public.question_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id uuid NOT NULL,
  subject text,
  question_text text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_index int,
  explanation text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, question_id)
);
GRANT SELECT, INSERT, DELETE ON public.question_bookmarks TO authenticated;
GRANT ALL ON public.question_bookmarks TO service_role;
ALTER TABLE public.question_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own bookmarks read" ON public.question_bookmarks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own bookmarks add" ON public.question_bookmarks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own bookmarks remove" ON public.question_bookmarks FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX question_bookmarks_user_created ON public.question_bookmarks (user_id, created_at DESC);