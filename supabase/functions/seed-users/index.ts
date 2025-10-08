import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestUser {
  email: string;
  password: string;
  full_name: string;
  role: string;
}

const testUsers: TestUser[] = [
  { email: "admin@benflismotors.com", password: "Admin123!", full_name: "System Administrator", role: "sys_admin" },
  { email: "director@benflismotors.com", password: "Director123!", full_name: "Director User", role: "director" },
  { email: "cdv@benflismotors.com", password: "Cdv123!", full_name: "CDV User", role: "cdv" },
  { email: "commercial@benflismotors.com", password: "Commercial123!", full_name: "Commercial User", role: "commercial" },
  { email: "magasin@benflismotors.com", password: "Magasin123!", full_name: "Magasin User", role: "magasin" },
  { email: "apv@benflismotors.com", password: "Apv123!", full_name: "APV User", role: "apv" },
  { email: "ged@benflismotors.com", password: "Ged123!", full_name: "GED User", role: "ged" },
  { email: "adv@benflismotors.com", password: "Adv123!", full_name: "ADV User", role: "adv" },
  { email: "livraison@benflismotors.com", password: "Livraison123!", full_name: "Livraison User", role: "livraison" },
  { email: "immatriculation@benflismotors.com", password: "Immat123!", full_name: "Immatriculation User", role: "immatriculation" },
];

const handler = async (req: Request): Promise<Response> => {
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

    const results = [];

    for (const user of testUsers) {
      try {
        console.log(`Creating user: ${user.email}`);
        
        // Check if user already exists
        const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
        const userExists = existingUser?.users?.some(u => u.email === user.email);
        
        if (userExists) {
          console.log(`User ${user.email} already exists, skipping`);
          results.push({ email: user.email, status: "skipped", message: "User already exists" });
          continue;
        }

        // Create user with admin API
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: {
            full_name: user.full_name,
          },
        });

        if (authError) {
          console.error(`Error creating ${user.email}:`, authError);
          results.push({ email: user.email, status: "error", error: authError.message });
          continue;
        }

        if (!authData.user) {
          console.error(`No user created for ${user.email}`);
          results.push({ email: user.email, status: "error", error: "No user created" });
          continue;
        }

        console.log(`Successfully created user ${user.email} with ID ${authData.user.id}`);
        
        // The trigger will handle profile and role creation
        // Just verify it was created
        const { data: roleData, error: roleError } = await supabaseAdmin
          .from("user_roles")
          .select("role")
          .eq("user_id", authData.user.id)
          .single();

        if (roleError) {
          console.error(`Role verification error for ${user.email}:`, roleError);
        }

        results.push({ 
          email: user.email, 
          status: "success", 
          role: roleData?.role || user.role,
          userId: authData.user.id
        });
      } catch (error: any) {
        console.error(`Exception for ${user.email}:`, error);
        results.push({ email: user.email, status: "error", error: error.message });
      }
    }

    console.log("Seed completed with results:", results);

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error seeding users:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
