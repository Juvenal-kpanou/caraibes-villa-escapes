DROP POLICY IF EXISTS "villas readable by users" ON public.villas;
CREATE POLICY "active villas readable by authenticated"
ON public.villas FOR SELECT TO authenticated
USING (is_active OR public.has_role(auth.uid(), 'admin'));

REVOKE ALL ON FUNCTION public.handle_new_user_role() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;