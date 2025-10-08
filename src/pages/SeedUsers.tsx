import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SeedResult {
  email: string;
  status: string;
  role?: string;
  error?: string;
}

const SeedUsers = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SeedResult[]>([]);

  const handleSeedUsers = async () => {
    setLoading(true);
    setResults([]);

    try {
      const { data, error } = await supabase.functions.invoke('seed-users');

      if (error) throw error;

      setResults(data.results);

      const successCount = data.results.filter((r: SeedResult) => r.status === 'success').length;

      toast({
        title: "Users Created",
        description: `Successfully created ${successCount} out of ${data.results.length} users`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Seed Test Users</h2>
        <p className="text-muted-foreground">Create test users for all roles</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Test Accounts</CardTitle>
          <CardDescription>
            This will create 10 test user accounts with different roles:
            sys_admin, director, cdv, commercial, magasin, apv, ged, adv, livraison, immatriculation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleSeedUsers} disabled={loading} size="lg">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Users...
              </>
            ) : (
              <>
                <Users className="mr-2 h-4 w-4" />
                Create All Test Users
              </>
            )}
          </Button>

          {results.length > 0 && (
            <div className="space-y-2 mt-6">
              <h3 className="font-semibold">Results:</h3>
              {results.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{result.email}</span>
                    {result.error && (
                      <span className="text-sm text-destructive">{result.error}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {result.role && (
                      <Badge variant="outline">{result.role}</Badge>
                    )}
                    <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                      {result.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Test User Credentials:</h4>
            <div className="space-y-1 text-sm">
              <p><strong>Admin:</strong> admin@benflismotors.com / Admin123!</p>
              <p><strong>Director:</strong> director@benflismotors.com / Director123!</p>
              <p><strong>CDV:</strong> cdv@benflismotors.com / Cdv123!</p>
              <p><strong>Commercial:</strong> commercial@benflismotors.com / Commercial123!</p>
              <p><strong>Magasin:</strong> magasin@benflismotors.com / Magasin123!</p>
              <p><strong>APV:</strong> apv@benflismotors.com / Apv123!</p>
              <p><strong>GED:</strong> ged@benflismotors.com / Ged123!</p>
              <p><strong>ADV:</strong> adv@benflismotors.com / Adv123!</p>
              <p><strong>Livraison:</strong> livraison@benflismotors.com / Livraison123!</p>
              <p><strong>Immatriculation:</strong> immatriculation@benflismotors.com / Immat123!</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SeedUsers;
