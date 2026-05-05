import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

Deno.serve(async (req: Request) => {
  try {
    // We use the service role key to bypass RLS since this is a cron job
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Mark expired vouchers
    const { error: expireError } = await supabaseClient
      .from('vouchers')
      .update({ status: 'expired' })
      .in('status', ['active', 'partially_used'])
      .lt('expires_at', new Date().toISOString());

    if (expireError) {
      console.error('Error updating expired vouchers:', expireError);
    }

    // 2. Fetch all active/partially_used vouchers along with customer push_subscription
    // Note: PostgREST doesn't support complex joins in a single query easily if we need to check notification_log.
    // We'll fetch the vouchers and then check logs.
    const { data: vouchers, error: vouchersError } = await supabaseClient
      .from('vouchers')
      .select(`
        id, 
        customer_id, 
        shop_id, 
        amount_total, 
        amount_remaining, 
        generated_at,
        customers ( push_subscription, access_token )
      `)
      .in('status', ['active', 'partially_used']);

    if (vouchersError) throw vouchersError;

    // Fetch existing reminder logs for these vouchers to avoid duplicates
    // We only care about 'voucher_reminder' types
    const { data: logs, error: logsError } = await supabaseClient
      .from('notification_log')
      .select('voucher_id, reminder_day')
      .eq('type', 'voucher_reminder');

    if (logsError) throw logsError;

    const sentReminders = new Map(); // voucher_id -> Set of reminder_days
    for (const log of logs) {
      if (!sentReminders.has(log.voucher_id)) {
        sentReminders.set(log.voucher_id, new Set());
      }
      sentReminders.get(log.voucher_id).add(log.reminder_day);
    }

    const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY');
    let webpush = null;
    
    if (vapidPublic && vapidPrivate) {
      webpush = (await import("npm:web-push@3.6.7")).default;
      webpush.setVapidDetails('mailto:contact@chezsenan.com', vapidPublic, vapidPrivate);
    }

    const now = new Date();
    const notifyPromises = [];
    const logsToInsert = [];

    for (const v of vouchers) {
      if (!v.customers || !v.customers.push_subscription) continue;

      const generated = new Date(v.generated_at);
      const diffTime = Math.abs(now.getTime() - generated.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      const milestones = [30, 60, 90, 120];
      let targetMilestone = null;

      for (const m of milestones) {
        // If the voucher is older than the milestone, and we haven't sent a reminder for this milestone
        if (diffDays >= m) {
          const sentDays = sentReminders.get(v.id);
          if (!sentDays || !sentDays.has(m)) {
            targetMilestone = m; // Found a milestone to send
          }
        }
      }

      if (targetMilestone !== null && webpush) {
        const payload = JSON.stringify({
          title: 'N\'oubliez pas votre bon de réduction !',
          body: `Vous avez un bon de ${v.amount_remaining || v.amount_total} FCFA en attente chez CHEZ SENA.`,
          url: `/carte/${v.customers.access_token}`
        });

        notifyPromises.push(
          webpush.sendNotification(v.customers.push_subscription, payload).catch(err => {
            console.error('Failed to send push notification to customer', v.customer_id, err);
          })
        );

        logsToInsert.push({
          customer_id: v.customer_id,
          type: 'voucher_reminder',
          voucher_id: v.id,
          reminder_day: targetMilestone
        });

        // Add to our in-memory set to prevent double sending if loop was weird, though not strictly necessary here
        if (!sentReminders.has(v.id)) {
          sentReminders.set(v.id, new Set());
        }
        sentReminders.get(v.id).add(targetMilestone);
      }
    }

    if (notifyPromises.length > 0) {
      await Promise.allSettled(notifyPromises);
    }

    if (logsToInsert.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('notification_log')
        .insert(logsToInsert);
      if (insertError) {
        console.error('Error inserting notification logs:', insertError);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      remindersSent: logsToInsert.length 
    }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('Error in send-reminders function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
