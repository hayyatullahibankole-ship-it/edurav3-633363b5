CREATE TABLE public.topic_practice_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  exam_body text NOT NULL CHECK (exam_body IN ('JAMB', 'WAEC', 'NECO')),
  topic_name text NOT NULL,
  mode text NOT NULL CHECK (mode IN ('instant', 'timed')),
  question_ids uuid[] NOT NULL,
  time_limit_seconds integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz
);

CREATE TABLE public.topic_practice_answers (
  session_id uuid NOT NULL REFERENCES public.topic_practice_sessions(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  answer jsonb NOT NULL,
  is_correct boolean NOT NULL,
  answered_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, question_id)
);

ALTER TABLE public.topic_practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_practice_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can read their topic practice sessions"
  ON public.topic_practice_sessions FOR SELECT
  USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Students can read their topic practice answers"
  ON public.topic_practice_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.topic_practice_sessions s
      JOIN public.users u ON u.id = s.user_id
      WHERE s.id = topic_practice_answers.session_id
        AND u.auth_user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.topic_practice_tag_names(p_tags jsonb)
RETURNS TABLE(topic_name text)
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT DISTINCT candidate.name
  FROM jsonb_array_elements(
    CASE
      WHEN jsonb_typeof(p_tags) = 'array' THEN p_tags
      WHEN jsonb_typeof(p_tags) = 'object' THEN jsonb_build_array(p_tags)
      ELSE '[]'::jsonb
    END
  ) AS tag(value)
  CROSS JOIN LATERAL (
    SELECT NULLIF(
      btrim(
        CASE jsonb_typeof(tag.value)
          WHEN 'object' THEN COALESCE(tag.value ->> 'topic', tag.value ->> 'name', tag.value ->> 'title')
          WHEN 'string' THEN tag.value #>> '{}'
          ELSE NULL
        END
      ),
      ''
    ) AS name
  ) AS candidate
  WHERE candidate.name IS NOT NULL
    AND upper(candidate.name) NOT IN ('JAMB', 'WAEC', 'NECO', 'POST_UTME', 'POST-UTME')
    AND candidate.name !~ '^[0-9]{4}$';
$$;

CREATE OR REPLACE FUNCTION public.get_topic_practice_library(target_exam_body text)
RETURNS TABLE(
  subject_id uuid,
  subject_name text,
  topic_name text,
  question_count bigint,
  attempted_questions integer,
  correct_questions integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_exam_body text := upper(btrim(target_exam_body));
  v_strict_mode boolean;
BEGIN
  SELECT id INTO v_user_id
  FROM public.users
  WHERE auth_user_id = auth.uid()
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF v_exam_body IS NULL OR v_exam_body NOT IN ('JAMB', 'WAEC', 'NECO') THEN
    RAISE EXCEPTION 'Unsupported exam body';
  END IF;

  SELECT COALESCE((
    SELECT s.value = 'true'
    FROM public.system_settings s
    WHERE s.key = 'strict_exam_body_filter'
  ), false) INTO v_strict_mode;

  RETURN QUERY
  WITH eligible_questions AS (
    SELECT q.id, q.subject_id, q.tags
    FROM public.questions q
    WHERE q.is_active = true
      AND q.type IN ('MCQ_SINGLE', 'TRUE_FALSE')
      AND q.subject_id IS NOT NULL
      AND (
        upper(q.exam_body) = v_exam_body
        OR (NOT v_strict_mode AND q.exam_body IS NULL)
      )
  ),
  topic_rows AS (
    SELECT eq.id, eq.subject_id, COALESCE(tags.topic_name, 'General') AS topic_name
    FROM eligible_questions eq
    LEFT JOIN LATERAL public.topic_practice_tag_names(eq.tags) tags ON true
  )
  SELECT tr.subject_id,
         s.name::text,
         tr.topic_name,
         count(DISTINCT tr.id),
         COALESCE(sc.attempted_questions, 0),
         COALESCE(sc.correct_questions, 0)
  FROM topic_rows tr
  JOIN public.subjects s ON s.id = tr.subject_id AND s.is_active = true
  LEFT JOIN public.syllabus_coverage sc
    ON sc.user_id = v_user_id
   AND sc.subject_id = tr.subject_id
   AND lower(btrim(sc.topic_name)) = lower(btrim(tr.topic_name))
  GROUP BY tr.subject_id, s.name, tr.topic_name,
           sc.attempted_questions, sc.correct_questions
  ORDER BY s.name, tr.topic_name;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_topic_practice_session(
  target_subject_id uuid,
  target_exam_body text,
  target_topic_name text,
  target_question_count integer,
  target_mode text
)
RETURNS TABLE(session_id uuid, created_at timestamptz, time_limit_seconds integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_exam_body text := upper(btrim(target_exam_body));
  v_topic_name text := btrim(target_topic_name);
  v_strict_mode boolean;
  v_question_ids uuid[];
  v_session_id uuid;
  v_created_at timestamptz;
  v_time_limit integer;
BEGIN
  SELECT id INTO v_user_id
  FROM public.users
  WHERE auth_user_id = auth.uid()
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF v_exam_body IS NULL OR v_exam_body NOT IN ('JAMB', 'WAEC', 'NECO') THEN
    RAISE EXCEPTION 'Unsupported exam body';
  END IF;
  IF target_question_count NOT IN (5, 10, 20, 30) THEN
    RAISE EXCEPTION 'Unsupported question count';
  END IF;
  IF target_mode IS NULL OR target_mode NOT IN ('instant', 'timed') THEN
    RAISE EXCEPTION 'Unsupported practice mode';
  END IF;
  IF v_topic_name IS NULL OR v_topic_name = '' THEN
    RAISE EXCEPTION 'A topic is required';
  END IF;

  SELECT COALESCE((
    SELECT s.value = 'true'
    FROM public.system_settings s
    WHERE s.key = 'strict_exam_body_filter'
  ), false) INTO v_strict_mode;

  SELECT array_agg(selected.id)
  INTO v_question_ids
  FROM (
    SELECT q.id
    FROM public.questions q
    WHERE q.is_active = true
      AND q.type IN ('MCQ_SINGLE', 'TRUE_FALSE')
      AND q.subject_id = target_subject_id
      AND (
        upper(q.exam_body) = v_exam_body
        OR (NOT v_strict_mode AND q.exam_body IS NULL)
      )
      AND (
        (v_topic_name = 'General' AND NOT EXISTS (
          SELECT 1 FROM public.topic_practice_tag_names(q.tags)
        ))
        OR EXISTS (
          SELECT 1
          FROM public.topic_practice_tag_names(q.tags) topic
          WHERE lower(btrim(topic.topic_name)) = lower(v_topic_name)
        )
      )
    ORDER BY random()
    LIMIT target_question_count
  ) AS selected;

  IF COALESCE(cardinality(v_question_ids), 0) < target_question_count THEN
    RAISE EXCEPTION 'Not enough questions are available for this drill';
  END IF;

  v_time_limit := target_question_count * 60;

  INSERT INTO public.topic_practice_sessions (
    user_id, subject_id, exam_body, topic_name, mode,
    question_ids, time_limit_seconds
  )
  VALUES (
    v_user_id, target_subject_id, v_exam_body, v_topic_name, target_mode,
    v_question_ids, v_time_limit
  )
  RETURNING id, topic_practice_sessions.created_at
  INTO v_session_id, v_created_at;

  RETURN QUERY SELECT v_session_id, v_created_at, v_time_limit;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_topic_practice_session(target_session_id uuid)
RETURNS TABLE(
  session_id uuid,
  subject_id uuid,
  subject_name text,
  exam_body text,
  topic_name text,
  mode text,
  question_count integer,
  time_limit_seconds integer,
  created_at timestamptz,
  submitted_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT s.id, s.subject_id, sub.name::text, s.exam_body, s.topic_name, s.mode,
         cardinality(s.question_ids), s.time_limit_seconds, s.created_at, s.submitted_at
  FROM public.topic_practice_sessions s
  JOIN public.subjects sub ON sub.id = s.subject_id
  JOIN public.users u ON u.id = s.user_id
  WHERE s.id = target_session_id
    AND u.auth_user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_topic_practice_questions(target_session_id uuid)
RETURNS TABLE(
  id uuid,
  question_text text,
  type question_type,
  options jsonb,
  media_urls jsonb,
  option_media jsonb,
  saved_answer jsonb,
  saved_is_correct boolean,
  correct_answer jsonb,
  explanation text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT q.id, q.question_text, q.type, q.options, q.media_urls, q.option_media,
         a.answer,
         CASE WHEN s.mode = 'instant' THEN a.is_correct ELSE NULL END,
         CASE WHEN s.mode = 'instant' AND a.question_id IS NOT NULL
              THEN to_jsonb(q.correct_answer) ELSE NULL END,
         CASE WHEN s.mode = 'instant' AND a.question_id IS NOT NULL
              THEN q.explanation ELSE NULL END
  FROM public.topic_practice_sessions s
  JOIN public.users u ON u.id = s.user_id
  CROSS JOIN LATERAL unnest(s.question_ids) WITH ORDINALITY AS chosen(question_id, position)
  JOIN public.questions q ON q.id = chosen.question_id
  LEFT JOIN public.topic_practice_answers a
    ON a.session_id = s.id AND a.question_id = q.id
  WHERE s.id = target_session_id
    AND u.auth_user_id = auth.uid()
  ORDER BY chosen.position;
$$;

CREATE OR REPLACE FUNCTION public.submit_topic_practice_answer(
  target_session_id uuid,
  target_question_id uuid,
  submitted_answer jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_session public.topic_practice_sessions%ROWTYPE;
  v_user_id uuid;
  v_is_correct boolean;
  v_correct_answer jsonb;
  v_explanation text;
BEGIN
  SELECT id INTO v_user_id
  FROM public.users
  WHERE auth_user_id = auth.uid()
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_session
  FROM public.topic_practice_sessions
  WHERE id = target_session_id
    AND user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Practice session not found';
  END IF;
  IF v_session.submitted_at IS NOT NULL THEN
    RAISE EXCEPTION 'This practice session has been submitted';
  END IF;
  IF NOT target_question_id = ANY(v_session.question_ids) THEN
    RAISE EXCEPTION 'Question is not part of this practice session';
  END IF;
  IF v_session.mode = 'timed'
    AND now() > v_session.created_at + make_interval(secs => v_session.time_limit_seconds) THEN
    RAISE EXCEPTION 'The time limit for this drill has expired';
  END IF;
  IF submitted_answer IS NULL THEN
    RAISE EXCEPTION 'An answer is required';
  END IF;

  v_is_correct := public.validate_student_answer(target_question_id, submitted_answer);

  IF v_session.mode = 'instant' THEN
    IF EXISTS (
      SELECT 1 FROM public.topic_practice_answers
      WHERE session_id = target_session_id AND question_id = target_question_id
    ) THEN
      RAISE EXCEPTION 'This question has already been answered';
    END IF;

    INSERT INTO public.topic_practice_answers(session_id, question_id, answer, is_correct)
    VALUES (target_session_id, target_question_id, submitted_answer, v_is_correct);

    INSERT INTO public.syllabus_coverage (
      user_id, subject_id, topic_name, total_questions,
      attempted_questions, correct_questions, last_practiced_at
    )
    VALUES (
      v_user_id, v_session.subject_id, v_session.topic_name, 1, 1,
      CASE WHEN v_is_correct THEN 1 ELSE 0 END, now()
    )
    ON CONFLICT (user_id, subject_id, topic_name)
    DO UPDATE SET
      attempted_questions = public.syllabus_coverage.attempted_questions + 1,
      correct_questions = public.syllabus_coverage.correct_questions + CASE WHEN v_is_correct THEN 1 ELSE 0 END,
      total_questions = GREATEST(
        public.syllabus_coverage.total_questions,
        public.syllabus_coverage.attempted_questions + 1
      ),
      last_practiced_at = now(),
      updated_at = now();

    SELECT to_jsonb(q.correct_answer), q.explanation
    INTO v_correct_answer, v_explanation
    FROM public.questions q
    WHERE q.id = target_question_id;

    RETURN jsonb_build_object(
      'saved', true,
      'is_correct', v_is_correct,
      'correct_answer', v_correct_answer,
      'explanation', v_explanation
    );
  END IF;

  INSERT INTO public.topic_practice_answers(session_id, question_id, answer, is_correct)
  VALUES (target_session_id, target_question_id, submitted_answer, v_is_correct)
  ON CONFLICT (session_id, question_id)
  DO UPDATE SET
    answer = EXCLUDED.answer,
    is_correct = EXCLUDED.is_correct,
    answered_at = now();

  RETURN jsonb_build_object('saved', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.finish_topic_practice(target_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_session public.topic_practice_sessions%ROWTYPE;
  v_user_id uuid;
  v_answered integer;
  v_correct integer;
BEGIN
  SELECT id INTO v_user_id
  FROM public.users
  WHERE auth_user_id = auth.uid()
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_session
  FROM public.topic_practice_sessions
  WHERE id = target_session_id
    AND user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Practice session not found';
  END IF;

  IF v_session.submitted_at IS NULL THEN
    UPDATE public.topic_practice_sessions
    SET submitted_at = now()
    WHERE id = target_session_id;

    IF v_session.mode = 'timed' THEN
      INSERT INTO public.syllabus_coverage (
        user_id, subject_id, topic_name, total_questions,
        attempted_questions, correct_questions, last_practiced_at
      )
      SELECT v_user_id, v_session.subject_id, v_session.topic_name,
             count(*)::integer, count(*)::integer,
             count(*) FILTER (WHERE a.is_correct)::integer, now()
      FROM public.topic_practice_answers a
      WHERE a.session_id = target_session_id
      HAVING count(*) > 0
      ON CONFLICT (user_id, subject_id, topic_name)
      DO UPDATE SET
        attempted_questions = public.syllabus_coverage.attempted_questions + EXCLUDED.attempted_questions,
        correct_questions = public.syllabus_coverage.correct_questions + EXCLUDED.correct_questions,
        total_questions = GREATEST(
          public.syllabus_coverage.total_questions,
          public.syllabus_coverage.attempted_questions + EXCLUDED.attempted_questions
        ),
        last_practiced_at = now(),
        updated_at = now();
    END IF;
  END IF;

  SELECT count(*)::integer, count(*) FILTER (WHERE a.is_correct)::integer
  INTO v_answered, v_correct
  FROM public.topic_practice_answers a
  WHERE a.session_id = target_session_id;

  RETURN jsonb_build_object(
    'session_id', target_session_id,
    'answered', v_answered,
    'correct', v_correct,
    'total', cardinality(v_session.question_ids),
    'percentage', CASE WHEN v_answered > 0 THEN round(v_correct::numeric * 100 / v_answered, 1) ELSE 0 END
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_topic_practice_review(target_session_id uuid)
RETURNS TABLE(
  id uuid,
  question_text text,
  options jsonb,
  media_urls jsonb,
  option_media jsonb,
  answer jsonb,
  is_correct boolean,
  correct_answer jsonb,
  explanation text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT q.id, q.question_text, q.options, q.media_urls, q.option_media,
         a.answer, a.is_correct, to_jsonb(q.correct_answer), q.explanation
  FROM public.topic_practice_sessions s
  JOIN public.users u ON u.id = s.user_id
  CROSS JOIN LATERAL unnest(s.question_ids) WITH ORDINALITY AS chosen(question_id, position)
  JOIN public.questions q ON q.id = chosen.question_id
  LEFT JOIN public.topic_practice_answers a
    ON a.session_id = s.id AND a.question_id = q.id
  WHERE s.id = target_session_id
    AND u.auth_user_id = auth.uid()
    AND s.submitted_at IS NOT NULL
  ORDER BY chosen.position;
$$;

CREATE OR REPLACE FUNCTION public.get_weak_topic_for_attempt(target_attempt_id uuid)
RETURNS TABLE(
  subject_id uuid,
  subject_name text,
  topic_name text,
  correct_questions integer,
  total_questions integer,
  accuracy numeric,
  exam_body text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_attempt public.attempts%ROWTYPE;
  v_exam_body text;
BEGIN
  SELECT id INTO v_user_id
  FROM public.users
  WHERE auth_user_id = auth.uid()
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT a.* INTO v_attempt
  FROM public.attempts a
  WHERE a.id = target_attempt_id
    AND a.user_id = v_user_id
    AND a.status IN ('SUBMITTED', 'GRADED');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submitted attempt not found';
  END IF;

  v_exam_body := CASE
    WHEN upper(concat_ws(' ', v_attempt.proctoring_data ->> 'exam_type', v_attempt.proctoring_data ->> 'exam_body')) LIKE '%JAMB%' THEN 'JAMB'
    WHEN upper(concat_ws(' ', v_attempt.proctoring_data ->> 'exam_type', v_attempt.proctoring_data ->> 'exam_body')) LIKE '%WAEC%' THEN 'WAEC'
    WHEN upper(concat_ws(' ', v_attempt.proctoring_data ->> 'exam_type', v_attempt.proctoring_data ->> 'exam_body')) LIKE '%NECO%' THEN 'NECO'
    ELSE NULL
  END;

  RETURN QUERY
  WITH answered_questions AS (
    SELECT q.id, q.subject_id, q.tags, COALESCE(aa.is_correct, false) AS is_correct
    FROM public.attempt_answers aa
    JOIN public.questions q ON q.id = aa.question_id
    WHERE aa.attempt_id = target_attempt_id
      AND aa.answer IS NOT NULL
      AND q.subject_id IS NOT NULL
  ),
  topic_rows AS (
    SELECT aq.id, aq.subject_id, aq.is_correct,
           COALESCE(tags.topic_name, 'General') AS topic_name
    FROM answered_questions aq
    LEFT JOIN LATERAL public.topic_practice_tag_names(aq.tags) tags ON true
  ),
  topic_scores AS (
    SELECT tr.subject_id, s.name::text AS subject_name, tr.topic_name,
           count(DISTINCT tr.id) FILTER (WHERE tr.is_correct)::integer AS correct_questions,
           count(DISTINCT tr.id)::integer AS total_questions
    FROM topic_rows tr
    JOIN public.subjects s ON s.id = tr.subject_id
    GROUP BY tr.subject_id, s.name, tr.topic_name
  )
  SELECT ts.subject_id, ts.subject_name, ts.topic_name,
         ts.correct_questions, ts.total_questions,
         round(ts.correct_questions::numeric * 100 / NULLIF(ts.total_questions, 0), 1),
         v_exam_body
  FROM topic_scores ts
  ORDER BY (ts.correct_questions::numeric / NULLIF(ts.total_questions, 0)) ASC,
           ts.total_questions DESC
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.topic_practice_tag_names(jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_topic_practice_library(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_topic_practice_session(uuid, text, text, integer, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_topic_practice_session(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_topic_practice_questions(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.submit_topic_practice_answer(uuid, uuid, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.finish_topic_practice(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_topic_practice_review(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_weak_topic_for_attempt(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_topic_practice_library(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_topic_practice_session(uuid, text, text, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_topic_practice_session(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_topic_practice_questions(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_topic_practice_answer(uuid, uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finish_topic_practice(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_topic_practice_review(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_weak_topic_for_attempt(uuid) TO authenticated;
