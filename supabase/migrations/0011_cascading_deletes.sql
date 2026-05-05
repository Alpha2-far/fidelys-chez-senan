-- Migration 0011 : Add DELETE policies for cascading deletes
CREATE POLICY "vouchers_delete_auth"
  ON public.vouchers FOR DELETE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "transactions_delete_auth"
  ON public.transactions FOR DELETE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "notification_log_delete_auth"
  ON public.notification_log FOR DELETE
  USING (auth.uid() IS NOT NULL);
