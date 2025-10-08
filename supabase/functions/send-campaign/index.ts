import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CampaignRequest {
  campaignId: string;
  resellerIds: string[];
  communicationType: 'email' | 'whatsapp' | 'both';
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

    const { campaignId, resellerIds, communicationType, message, excelFileUrl }: CampaignRequest = await req.json();

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
    const whatsappServiceUrl = Deno.env.get("WHATSAPP_SERVICE_URL");
    const whatsappServiceApiKey = Deno.env.get("WHATSAPP_SERVICE_API_KEY");

    for (const reseller of resellers) {
      const resellerResult: any = {
        resellerId: reseller.id,
        resellerName: reseller.name,
        email: null,
        whatsapp: null
      };

      // Handle email communication
      if (communicationType === 'email' || communicationType === 'both') {
        if (!reseller.email) {
          resellerResult.email = {
            status: "skipped",
            message: "No email address"
          };
        } else {
          // If no email service is configured, use mailto fallback
          if (!emailServiceUrl || !emailServiceApiKey) {
            const subject = encodeURIComponent(`Campaign: ${campaignId}`);
            const body = encodeURIComponent(
              `${message || "Please find attached our latest promotional campaign."}\n\n` +
              `Campaign File: ${excelFileUrl}\n\n` +
              `Best regards,\nBenflis Motors Team`
            );
            
            const mailtoUrl = `mailto:${reseller.email}?subject=${subject}&body=${body}`;
            
            resellerResult.email = {
              status: "mailto_ready",
              mailtoUrl: mailtoUrl,
              message: "Email ready to send via default mail client"
            };
          } else {
            // Use configured email service
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
                resellerResult.email = {
                  status: "sent",
                  message: "Email sent successfully"
                };
              } else {
                throw new Error(`Email service returned ${emailResponse.status}`);
              }
            } catch (error: any) {
              console.error(`Failed to send email to ${reseller.email}:`, error);
              resellerResult.email = {
                status: "error",
                message: error.message
              };
            }
          }
        }
      }

      // Handle WhatsApp communication
      if (communicationType === 'whatsapp' || communicationType === 'both') {
        if (!reseller.phone_number) {
          resellerResult.whatsapp = {
            status: "skipped",
            message: "No phone number"
          };
        } else {
          // Always use WhatsApp Web redirect (no API needed)
          const phoneNumber = reseller.phone_number.replace(/^0/, "213"); // Convert Algerian format
          const whatsappMessage = encodeURIComponent(
            `Hello ${reseller.name},\n\n` +
            `${message || "Please find our latest promotional campaign."}\n\n` +
            `Campaign File: ${excelFileUrl}\n\n` +
            `Best regards,\nBenflis Motors Team`
          );
          
          const whatsappUrl = `https://wa.me/${phoneNumber}?text=${whatsappMessage}`;
          
          resellerResult.whatsapp = {
            status: "whatsapp_ready",
            whatsappUrl: whatsappUrl,
            message: "WhatsApp message ready to send via WhatsApp Web"
          };
        }
      }

      results.push(resellerResult);
    }

    // Calculate summary statistics
    const emailSent = results.filter(r => r.email?.status === "sent").length;
    const emailReady = results.filter(r => r.email?.status === "mailto_ready").length;
    const emailError = results.filter(r => r.email?.status === "error").length;
    const emailSkipped = results.filter(r => r.email?.status === "skipped").length;

    const whatsappReady = results.filter(r => r.whatsapp?.status === "whatsapp_ready").length;
    const whatsappSkipped = results.filter(r => r.whatsapp?.status === "skipped").length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Campaign processed: Email (${emailSent} sent, ${emailReady} ready, ${emailError} failed, ${emailSkipped} skipped), WhatsApp (${whatsappReady} ready, ${whatsappSkipped} skipped)`,
        total: resellers.length,
        communicationType,
        email: {
          sent: emailSent,
          ready: emailReady,
          error: emailError,
          skipped: emailSkipped
        },
        whatsapp: {
          ready: whatsappReady,
          skipped: whatsappSkipped
        },
        results
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in campaign:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
