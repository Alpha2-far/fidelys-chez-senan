import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate a random 6-character uppercase alphanumeric code (excluding ambiguous chars)
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed O, 0, I, 1
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Also create a service role client to bypass RLS for inserts/updates if needed
    // In our case, the seller has auth, but they need to insert vouchers for customers.
    // The RLS policy for vouchers might block it if we don't use service role, 
    // OR we should ensure the seller's RLS policy allows inserting vouchers.
    // Since the seller has a session and matches shop_id, RLS should allow it.
    // Let's use the authenticated client first.

    const { customer_id, shop_id, amount } = await req.json();

    if (!customer_id || !shop_id || typeof amount !== 'number' || amount <= 0) {
      throw new Error('Invalid input');
    }

    // 1. Get current customer state
    const { data: customer, error: customerError } = await supabaseClient
      .from('customers')
      .select('total_spent')
      .eq('id', customer_id)
      .eq('shop_id', shop_id)
      .single();

    if (customerError || !customer) {
      throw new Error('Customer not found or unauthorized');
    }

    // 2. Get reward config for the shop
    const { data: config, error: configError } = await supabaseClient
      .from('reward_config')
      .select('threshold_amount, voucher_amount, voucher_validity_days')
      .eq('shop_id', shop_id)
      .single();

    if (configError || !config) {
      throw new Error('Reward config not found');
    }

    const oldTotal = customer.total_spent;
    const newTotal = oldTotal + amount;
    const threshold = config.threshold_amount;
    
    // Calculate how many vouchers to generate
    const oldMilestones = Math.floor(oldTotal / threshold);
    const newMilestones = Math.floor(newTotal / threshold);
    const vouchersToGenerate = newMilestones - oldMilestones;

    const newVouchers = [];

    // 3. Update customer total_spent
    const { error: updateError } = await supabaseClient
      .from('customers')
      .update({ total_spent: newTotal })
      .eq('id', customer_id);

    if (updateError) throw updateError;

    // 4. Insert transaction
    const { error: txError } = await supabaseClient
      .from('transactions')
      .insert({
        customer_id,
        shop_id,
        amount,
        type: 'purchase'
      });

    if (txError) throw txError;

    // 5. Generate vouchers if needed
    if (vouchersToGenerate > 0) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + config.voucher_validity_days);

      for (let i = 0; i < vouchersToGenerate; i++) {
        let code = generateCode();
        let isUnique = false;
        
        // Ensure code uniqueness
        while (!isUnique) {
          const { data: existing } = await supabaseClient
            .from('vouchers')
            .select('id')
            .eq('code', code)
            .maybeSingle();
            
          if (!existing) {
            isUnique = true;
          } else {
            code = generateCode();
          }
        }

        const milestone = (oldMilestones + i + 1) * threshold;

        const newVoucher = {
          customer_id,
          shop_id,
          code,
          amount_total: config.voucher_amount,
          amount_used: 0,
          status: 'active',
          expires_at: expiresAt.toISOString(),
          milestone: milestone
        };

        const { data: insertedVoucher, error: voucherError } = await supabaseClient
          .from('vouchers')
          .insert(newVoucher)
          .select()
          .single();

        if (voucherError) throw voucherError;
        if (insertedVoucher) newVouchers.push(insertedVoucher);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        new_total_spent: newTotal,
        vouchers_generated: newVouchers.length,
        vouchers: newVouchers
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
