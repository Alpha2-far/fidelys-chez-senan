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
