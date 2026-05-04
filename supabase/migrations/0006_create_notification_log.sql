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
