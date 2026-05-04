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
