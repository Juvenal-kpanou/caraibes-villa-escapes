DROP POLICY IF EXISTS "bank settings public" ON public.bank_settings;
DROP POLICY IF EXISTS "bank settings auth read" ON public.bank_settings;
CREATE POLICY "admins read bank settings" ON public.bank_settings FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
REVOKE SELECT ON public.bank_settings FROM anon;