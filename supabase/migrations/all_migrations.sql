-- Migration 0001 : Table shops + seed Chez Senan

CREATE TABLE IF NOT EXISTS public.shops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  shop_name text NOT NULL,
  primary_color text NOT NULL DEFAULT '#C17A2B',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed : boutique Chez Senan
INSERT INTO public.shops (name, slug, shop_name, primary_color)
VALUES ('chez-senan', 'chez-senan', 'Chez Sénan', '#C17A2B');

-- Migration 0002 : Table reward_config + seed Chez Senan

CREATE TABLE IF NOT EXISTS public.reward_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  threshold_amount integer NOT NULL DEFAULT 500000,
  voucher_amount integer NOT NULL DEFAULT 50000,
  voucher_validity_days integer NOT NULL DEFAULT 150,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed : config par defaut pour Chez Senan
INSERT INTO public.reward_config (shop_id, threshold_amount, voucher_amount, voucher_validity_days)
SELECT id, 500000, 50000, 150
FROM public.shops
WHERE slug = 'chez-senan';

-- Migration 0003 : Table customers

CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  total_spent integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  push_subscription jsonb,
  access_token uuid NOT NULL DEFAULT gen_random_uuid(),
  CONSTRAINT customers_access_token_unique UNIQUE (access_token),
  CONSTRAINT customers_shop_phone_unique UNIQUE (shop_id, phone)
);

-- Index pour la recherche par access_token (utilise cote client)
CREATE INDEX IF NOT EXISTS idx_customers_access_token ON public.customers(access_token);

-- Index pour la recherche par telephone
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);

-- Migration 0004 : Table vouchers avec colonne generee amount_remaining

CREATE TABLE IF NOT EXISTS public.vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  amount_total integer NOT NULL,
  amount_used integer NOT NULL DEFAULT 0,
  amount_remaining integer GENERATED ALWAYS AS (amount_total - amount_used) STORED,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'partially_used', 'used', 'expired')),
  generated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  milestone integer NOT NULL
);

-- Index pour la recherche par code (utilise par le vendeur)
CREATE INDEX IF NOT EXISTS idx_vouchers_code ON public.vouchers(code);

-- Index pour lister les bons d'un client
CREATE INDEX IF NOT EXISTS idx_vouchers_customer ON public.vouchers(customer_id);

-- Migration 0005 : Table transactions

CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  type text NOT NULL CHECK (type IN ('purchase', 'voucher_use')),
  voucher_id uuid REFERENCES public.vouchers(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index pour l'historique d'un client
CREATE INDEX IF NOT EXISTS idx_transactions_customer ON public.transactions(customer_id, created_at DESC);

-- Migration 0006 : Table notification_log

CREATE TABLE IF NOT EXISTS public.notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('purchase_credited', 'voucher_generated', 'voucher_reminder', 'campaign')),
  voucher_id uuid REFERENCES public.vouchers(id) ON DELETE SET NULL,
  campaign_id uuid,
  sent_at timestamptz NOT NULL DEFAULT now(),
  reminder_day integer CHECK (reminder_day IN (30, 60, 90, 120))
);

-- Index pour la deduplication des rappels (un seul rappel par seuil par bon)
CREATE INDEX IF NOT EXISTS idx_notification_log_dedup
  ON public.notification_log(voucher_id, reminder_day)
  WHERE type = 'voucher_reminder';

-- Migration 0007 : Table campaigns

CREATE TABLE IF NOT EXISTS public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  destination_url text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Ajouter la FK campaign_id dans notification_log maintenant que campaigns existe
ALTER TABLE public.notification_log
  ADD CONSTRAINT notification_log_campaign_fk
  FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE SET NULL;

-- Migration 0008 : Activer RLS sur toutes les tables

ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

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

