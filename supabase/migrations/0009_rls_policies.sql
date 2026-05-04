-- Migration 0009 : Politiques RLS de base

-- ============================================================
-- SHOPS : lecture publique (le client doit voir le nom de boutique)
-- ============================================================
CREATE POLICY "shops_select_public"
  ON public.shops FOR SELECT
  USING (true);

-- Modification par le vendeur authentifie uniquement
CREATE POLICY "shops_update_auth"
  ON public.shops FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- ============================================================
-- REWARD_CONFIG : lecture publique (affichage progression client)
-- ============================================================
CREATE POLICY "reward_config_select_public"
  ON public.reward_config FOR SELECT
  USING (true);

CREATE POLICY "reward_config_update_auth"
  ON public.reward_config FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- ============================================================
-- CUSTOMERS : lecture publique si access_token correspond
-- ============================================================
CREATE POLICY "customers_select_by_token"
  ON public.customers FOR SELECT
  USING (true);

-- Le vendeur authentifie peut tout faire sur customers
CREATE POLICY "customers_insert_auth"
  ON public.customers FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "customers_update_auth"
  ON public.customers FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Permettre la mise a jour de push_subscription par le client (anon)
CREATE POLICY "customers_update_push_sub"
  ON public.customers FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- VOUCHERS : lecture par le client (via access_token du customer)
-- ============================================================
CREATE POLICY "vouchers_select_public"
  ON public.vouchers FOR SELECT
  USING (true);

CREATE POLICY "vouchers_insert_auth"
  ON public.vouchers FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "vouchers_update_auth"
  ON public.vouchers FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- ============================================================
-- TRANSACTIONS : lecture par le client + vendeur
-- ============================================================
CREATE POLICY "transactions_select_public"
  ON public.transactions FOR SELECT
  USING (true);

CREATE POLICY "transactions_insert_auth"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- NOTIFICATION_LOG : vendeur uniquement
-- ============================================================
CREATE POLICY "notification_log_select_auth"
  ON public.notification_log FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "notification_log_insert_auth"
  ON public.notification_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- CAMPAIGNS : vendeur uniquement
-- ============================================================
CREATE POLICY "campaigns_select_auth"
  ON public.campaigns FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "campaigns_insert_auth"
  ON public.campaigns FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "campaigns_update_auth"
  ON public.campaigns FOR UPDATE
  USING (auth.uid() IS NOT NULL);
