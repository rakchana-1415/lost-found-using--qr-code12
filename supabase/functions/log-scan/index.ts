import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { uniqueCode } = await req.json();

    if (!uniqueCode) {
      return new Response(
        JSON.stringify({ error: 'Unique code is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find the user
    const { data: user, error: userError } = await supabase
      .from('qr_users')
      .select('*')
      .eq('unique_code', uniqueCode)
      .single();

    if (userError || !user) {
      console.error('User not found:', userError);
      return new Response(
        JSON.stringify({ error: 'QR code not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get request details
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Log the scan
    const { error: scanError } = await supabase
      .from('qr_scans')
      .insert({
        qr_user_id: user.id,
        ip_address: ipAddress,
        user_agent: userAgent
      });

    if (scanError) {
      console.error('Failed to log scan:', scanError);
    }

    console.log(`QR scanned for user ${user.name} (${user.id})`);

    return new Response(
      JSON.stringify({ 
        name: user.name, 
        phone: user.phone 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
