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
