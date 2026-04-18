-- Allow creators to view their own companies (fixes RLS visibility right after INSERT...RETURNING)
CREATE POLICY "Creator views own companies"
ON public.companies
FOR SELECT
USING (auth.uid() = created_by);