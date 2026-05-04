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
