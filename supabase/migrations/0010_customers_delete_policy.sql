-- Migration : Permettre au vendeur authentifie de supprimer des clients
CREATE POLICY "customers_delete_auth"
  ON public.customers FOR DELETE
  USING (auth.uid() IS NOT NULL);
