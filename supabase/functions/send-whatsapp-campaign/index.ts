import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WhatsAppCampaignRequest {
  campaignId: string;
  resellerIds: string[];
  message?: string;
  excelFileUrl: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify the requesting user is authorized
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { campaignId, resellerIds, message, excelFileUrl }: WhatsAppCampaignRequest = await req.json();

    if (!campaignId || !resellerIds || resellerIds.length === 0) {
      throw new Error("Missing required fields: campaignId and resellerIds");
    }

    // Get reseller details
    const { data: resellers, error: resellersError } = await supabaseAdmin
      .from("resellers")
      .select("id, name, email, phone_number")
      .in("id", resellerIds);

    if (resellersError) {
      throw resellersError;
    }

    if (!resellers || resellers.length === 0) {
      throw new Error("No resellers found");
    }

    const results = [];

    // Always use WhatsApp Web redirect (no API needed)
    for (const reseller of resellers) {
      if (!reseller.phone_number) {
        results.push({
          resellerId: reseller.id,
          resellerName: reseller.name,
          status: "skipped",
          message: "No phone number"
        });
        continue;
      }

      // Create WhatsApp Web link
      const phoneNumber = reseller.phone_number.replace(/^0/, "213"); // Convert Algerian format
      const whatsappMessage = encodeURIComponent(
        `Hello ${reseller.name},\n\n` +
        `${message || "Please find our latest promotional campaign."}\n\n` +
        `Campaign File: ${excelFileUrl}\n\n` +
        `Best regards,\nBenflis Motors Team`
      );
      
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${whatsappMessage}`;
      
      results.push({
        resellerId: reseller.id,
        resellerName: reseller.name,
        resellerPhone: reseller.phone_number,
        status: "whatsapp_ready",
        whatsappUrl: whatsappUrl,
        message: "WhatsApp message ready to send via WhatsApp Web"
      });
    }

    const whatsappReadyCount = results.filter(r => r.status === "whatsapp_ready").length;
    const skippedCount = results.filter(r => r.status === "skipped").length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `WhatsApp campaign processed: ${whatsappReadyCount} ready for manual sending, ${skippedCount} skipped`,
        total: resellers.length,
        whatsappReadyCount,
        skippedCount,
        results
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in WhatsApp campaign:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
