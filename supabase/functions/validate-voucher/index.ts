import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { code, amount_to_use, shop_id } = await req.json();

    if (!code || !shop_id || typeof amount_to_use !== 'number' || amount_to_use <= 0) {
      throw new Error('Invalid input');
    }

    // 1. Get the voucher
    const { data: voucher, error: voucherError } = await supabaseClient
      .from('vouchers')
      .select('*')
      .eq('code', code)
      .eq('shop_id', shop_id)
      .single();

    if (voucherError || !voucher) {
      throw new Error('Voucher not found');
    }

    // 2. Validate voucher status and expiration
    if (voucher.status !== 'active' && voucher.status !== 'partially_used') {
      throw new Error(`Voucher cannot be used (status: ${voucher.status})`);
    }

    if (new Date(voucher.expires_at) < new Date()) {
      // It's expired. Update status to expired
      await supabaseClient
        .from('vouchers')
        .update({ status: 'expired' })
        .eq('id', voucher.id);
      throw new Error('Voucher has expired');
    }

    // 3. Check remaining amount
    if (voucher.amount_remaining < amount_to_use) {
      throw new Error(`Insufficient voucher balance. Remaining: ${voucher.amount_remaining} FCFA`);
    }

    // 4. Update voucher
    const newAmountUsed = voucher.amount_used + amount_to_use;
    const newStatus = newAmountUsed >= voucher.amount_total ? 'used' : 'partially_used';

    const { data: updatedVoucher, error: updateError } = await supabaseClient
      .from('vouchers')
      .update({
        amount_used: newAmountUsed,
        status: newStatus
      })
      .eq('id', voucher.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // 5. Insert transaction
    const { error: txError } = await supabaseClient
      .from('transactions')
      .insert({
        customer_id: voucher.customer_id,
        shop_id: voucher.shop_id,
        amount: amount_to_use,
        type: 'voucher_use',
        voucher_id: voucher.id
      });

    if (txError) {
      console.error('Failed to log transaction', txError);
      // We don't fail the whole request if logging fails, but it shouldn't fail
    }

    return new Response(
      JSON.stringify({
        success: true,
        amount_used: amount_to_use,
        amount_remaining: updatedVoucher.amount_remaining,
        new_status: newStatus
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
