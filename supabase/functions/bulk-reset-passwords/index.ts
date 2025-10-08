import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    // Verify the requesting user is a sys_admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user has sys_admin role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleError || roleData?.role !== "sys_admin") {
      throw new Error("Only system administrators can perform bulk password resets");
    }

    // Get all users who are NOT sys_admin
    const { data: allRoles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role");

    if (rolesError) {
      throw rolesError;
    }

    // Filter out sys_admin users
    const nonAdminUserIds = allRoles
      .filter(r => r.role !== "sys_admin")
      .map(r => r.user_id);

    console.log(`Found ${nonAdminUserIds.length} non-admin users to reset passwords`);

    const newPassword = "Benflis@2026!";
    const results = [];

    // Reset password for each non-admin user
    for (const userId of nonAdminUserIds) {
      try {
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          { password: newPassword }
        );

        if (updateError) {
          console.error(`Failed to reset password for user ${userId}:`, updateError);
          results.push({ userId, status: "error", error: updateError.message });
        } else {
          console.log(`Successfully reset password for user ${userId}`);
          results.push({ userId, status: "success" });
        }
      } catch (error: any) {
        console.error(`Exception resetting password for user ${userId}:`, error);
        results.push({ userId, status: "error", error: error.message });
      }
    }

    const successCount = results.filter(r => r.status === "success").length;
    const failureCount = results.filter(r => r.status === "error").length;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Password reset completed: ${successCount} successful, ${failureCount} failed`,
        total: nonAdminUserIds.length,
        successCount,
        failureCount,
        results
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in bulk password reset:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
