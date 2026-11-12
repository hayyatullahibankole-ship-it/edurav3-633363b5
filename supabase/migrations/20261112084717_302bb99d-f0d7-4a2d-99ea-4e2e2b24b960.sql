DROP POLICY IF EXISTS "Pro users can view challenges" ON public.challenges;
CREATE POLICY "Signed-in users can view live challenges" ON public.challenges
FOR SELECT TO authenticated
USING (is_active = true AND start_date <= now() AND end_date >= now());
GRANT SELECT ON public.challenges TO authenticated;