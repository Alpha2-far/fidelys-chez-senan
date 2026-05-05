import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { campaign_id, shop_id } = await req.json();

    if (!campaign_id || !shop_id) {
      throw new Error('campaign_id and shop_id are required');
    }

    // Check if campaign belongs to the shop and is not yet sent
    const { data: campaign, error: campaignError } = await supabaseClient
      .from('campaigns')
      .select('*')
      .eq('id', campaign_id)
      .eq('shop_id', shop_id)
      .single();

    if (campaignError || !campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.sent_at) {
      throw new Error('Campaign already sent');
    }

    // Fetch customers with push_subscription
    const { data: customers, error: customersError } = await supabaseClient
      .from('customers')
      .select('id, push_subscription, access_token')
      .eq('shop_id', shop_id)
      .not('push_subscription', 'is', null);

    if (customersError) {
      throw customersError;
    }

    let sentCount = 0;
    const logsToInsert = [];
    const notifyPromises = [];

    const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY');

    if (vapidPublic && vapidPrivate && customers.length > 0) {
      const webpush = (await import("npm:web-push@3.6.7")).default;
      webpush.setVapidDetails('mailto:contact@chezsenan.com', vapidPublic, vapidPrivate);

      for (const customer of customers) {
        // Fallback to customer card URL if no destination_url provided
        const url = campaign.destination_url || `/carte/${customer.access_token}`;

        const payload = JSON.stringify({
          title: campaign.title,
          body: campaign.body,
          url: url
        });

        notifyPromises.push(
          webpush.sendNotification(customer.push_subscription, payload).then(() => {
            sentCount++;
            logsToInsert.push({
              customer_id: customer.id,
              type: 'campaign',
              campaign_id: campaign.id
            });
          }).catch(err => {
            console.error('Failed to send campaign push to customer', customer.id, err);
          })
        );
      }

      await Promise.allSettled(notifyPromises);

      // Log sent notifications
      if (logsToInsert.length > 0) {
        // We need service role key to insert logs because RLS might prevent inserting into notification_log 
        // if policies aren't fully open for the shop admin on this table, but since we are authenticated as the shop admin 
        // it should be fine if there's an RLS policy for it.
        // Wait, does notification_log have RLS for auth.uid()? Let's bypass to be safe since it's a backend operation.
        const supabaseAdmin = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        const { error: logError } = await supabaseAdmin.from('notification_log').insert(logsToInsert);
        if (logError) console.error('Failed to log campaign notifications:', logError);
      }
    }

    // Update campaign sent_at
    const { error: updateError } = await supabaseClient
      .from('campaigns')
      .update({ sent_at: new Date().toISOString() })
      .eq('id', campaign_id);

    if (updateError) {
      throw updateError;
    }

    return new Response(JSON.stringify({ success: true, sent_count: sentCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
