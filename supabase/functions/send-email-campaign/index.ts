import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailCampaignRequest {
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

    const { campaignId, resellerIds, message, excelFileUrl }: EmailCampaignRequest = await req.json();

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
    const emailServiceUrl = Deno.env.get("EMAIL_SERVICE_URL");
    const emailServiceApiKey = Deno.env.get("EMAIL_SERVICE_API_KEY");

    // If no email service is configured, use mailto fallback
    if (!emailServiceUrl || !emailServiceApiKey) {
      console.log("No email service configured, using mailto fallback");
      
      for (const reseller of resellers) {
        if (!reseller.email) {
          results.push({
            resellerId: reseller.id,
            resellerName: reseller.name,
            status: "skipped",
            message: "No email address"
          });
          continue;
        }

        // Create mailto link
        const subject = encodeURIComponent(`Campaign: ${campaignId}`);
        const body = encodeURIComponent(
          `${message || "Please find attached our latest promotional campaign."}\n\n` +
          `Campaign File: ${excelFileUrl}\n\n` +
          `Best regards,\nBenflis Motors Team`
        );
        
        const mailtoUrl = `mailto:${reseller.email}?subject=${subject}&body=${body}`;
        
        results.push({
          resellerId: reseller.id,
          resellerName: reseller.name,
          resellerEmail: reseller.email,
          status: "mailto_ready",
          mailtoUrl: mailtoUrl,
          message: "Email ready to send via default mail client"
        });
      }
    } else {
      // Use configured email service
      for (const reseller of resellers) {
        if (!reseller.email) {
          results.push({
            resellerId: reseller.id,
            resellerName: reseller.name,
            status: "skipped",
            message: "No email address"
          });
          continue;
        }

        try {
          const emailData = {
            to: reseller.email,
            subject: `Campaign: ${campaignId}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Benflis Motors - Promotional Campaign</h2>
                <p>Dear ${reseller.name},</p>
                <p>${message || "Please find attached our latest promotional campaign."}</p>
                <p>You can download the campaign file here: <a href="${excelFileUrl}" style="color: #007bff;">Download Campaign File</a></p>
                <p>Best regards,<br>Benflis Motors Team</p>
              </div>
            `,
            text: `
              Dear ${reseller.name},
              
              ${message || "Please find attached our latest promotional campaign."}
              
              Campaign File: ${excelFileUrl}
              
              Best regards,
              Benflis Motors Team
            `
          };

          const emailResponse = await fetch(emailServiceUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${emailServiceApiKey}`
            },
            body: JSON.stringify(emailData)
          });

          if (emailResponse.ok) {
            results.push({
              resellerId: reseller.id,
              resellerName: reseller.name,
              resellerEmail: reseller.email,
              status: "sent",
              message: "Email sent successfully"
            });
          } else {
            throw new Error(`Email service returned ${emailResponse.status}`);
          }
        } catch (error: any) {
          console.error(`Failed to send email to ${reseller.email}:`, error);
          results.push({
            resellerId: reseller.id,
            resellerName: reseller.name,
            resellerEmail: reseller.email,
            status: "error",
            message: error.message
          });
        }
      }
    }

    const successCount = results.filter(r => r.status === "sent").length;
    const mailtoCount = results.filter(r => r.status === "mailto_ready").length;
    const errorCount = results.filter(r => r.status === "error").length;
    const skippedCount = results.filter(r => r.status === "skipped").length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Email campaign processed: ${successCount} sent, ${mailtoCount} ready for manual sending, ${errorCount} failed, ${skippedCount} skipped`,
        total: resellers.length,
        successCount,
        mailtoCount,
        errorCount,
        skippedCount,
        results
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in email campaign:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

