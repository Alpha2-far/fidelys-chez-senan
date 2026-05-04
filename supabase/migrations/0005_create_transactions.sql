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
