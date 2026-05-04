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
