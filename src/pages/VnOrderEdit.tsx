import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const VnOrderEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState<{
    customer_name: string;
    customer_phone: string;
    customer_id_number: string;
    customer_email: string;
    customer_address: string;
    vehicle_brand: string;
    vehicle_model: string;
    vehicle_year: number;
    vehicle_color: string;
    vehicle_vin: string;
    vehicle_avaries: string;
    total_price: number;
    advance_payment: number;
    location: "PARC1" | "PARC2" | "SHOWROOM";
    status: "INSCRIPTION" | "PROFORMA" | "COMMANDE" | "VALIDATION" | "ACCUSÉ" | "FACTURATION" | "ARRIVAGE" | "CARTE_JAUNE" | "LIVRAISON" | "DOSSIER_DAIRA";
  }>({
    customer_name: "",
    customer_phone: "",
    customer_id_number: "",
    customer_email: "",
    customer_address: "",
    vehicle_brand: "",
    vehicle_model: "",
    vehicle_year: new Date().getFullYear(),
    vehicle_color: "",
    vehicle_vin: "",
    vehicle_avaries: "",
    total_price: 0,
    advance_payment: 0,
    location: "PARC1",
    status: "INSCRIPTION",
  });

  useEffect(() => {
    if (id) {
      fetchOrder();
    }
  }, [id]);

  const fetchOrder = async () => {
    try {
      const { data, error } = await supabase
        .from("vn_orders")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setFormData({
        customer_name: data.customer_name || "",
        customer_phone: data.customer_phone || "",
        customer_id_number: data.customer_id_number || "",
        customer_email: data.customer_email || "",
        customer_address: data.customer_address || "",
        vehicle_brand: data.vehicle_brand || "",
        vehicle_model: data.vehicle_model || "",
        vehicle_year: data.vehicle_year || new Date().getFullYear(),
        vehicle_color: data.vehicle_color || "",
        vehicle_vin: data.vehicle_vin || "",
        vehicle_avaries: data.vehicle_avaries || "",
        total_price: data.total_price || 0,
        advance_payment: data.advance_payment || 0,
        location: data.location || "PARC1",
        status: data.status || "INSCRIPTION",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("vn_orders")
        .update(formData)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Commande mise à jour avec succès",
      });

      navigate(`/dashboard/vn/orders/${id}`);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Chargement de la commande...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/dashboard/vn/orders/${id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Modifier la commande</h2>
          <p className="text-muted-foreground">Mettre à jour les informations de la commande</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informations client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer_name">Nom complet *</Label>
                <Input
                  id="customer_name"
                  required
                  value={formData.customer_name}
                  onChange={(e) => handleChange("customer_name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer_phone">Numéro de téléphone *</Label>
                <Input
                  id="customer_phone"
                  required
                  value={formData.customer_phone}
                  onChange={(e) => handleChange("customer_phone", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer_id_number">Numéro d'identité (18 chiffres) *</Label>
                <Input
                  id="customer_id_number"
                  required
                  maxLength={18}
                  value={formData.customer_id_number}
                  onChange={(e) => handleChange("customer_id_number", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer_email">Email</Label>
                <Input
                  id="customer_email"
                  type="email"
                  value={formData.customer_email}
                  onChange={(e) => handleChange("customer_email", e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="customer_address">Adresse</Label>
                <Textarea
                  id="customer_address"
                  value={formData.customer_address}
                  onChange={(e) => handleChange("customer_address", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Informations véhicule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle_brand">Marque *</Label>
                <Input
                  id="vehicle_brand"
                  required
                  value={formData.vehicle_brand}
                  onChange={(e) => handleChange("vehicle_brand", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicle_model">Modèle *</Label>
                <Input
                  id="vehicle_model"
                  required
                  value={formData.vehicle_model}
                  onChange={(e) => handleChange("vehicle_model", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicle_year">Année</Label>
                <Input
                  id="vehicle_year"
                  type="number"
                  value={formData.vehicle_year}
                  onChange={(e) => handleChange("vehicle_year", parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicle_color">Couleur</Label>
                <Input
                  id="vehicle_color"
                  value={formData.vehicle_color}
                  onChange={(e) => handleChange("vehicle_color", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicle_vin">VIN</Label>
                <Input
                  id="vehicle_vin"
                  value={formData.vehicle_vin}
                  onChange={(e) => handleChange("vehicle_vin", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Emplacement *</Label>
                <Select
                  value={formData.location}
                  onValueChange={(value) => handleChange("location", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PARC1">PARC 1</SelectItem>
                    <SelectItem value="PARC2">PARC 2</SelectItem>
                    <SelectItem value="SHOWROOM">SHOWROOM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="vehicle_avaries">Dommages/Avaries</Label>
                <Textarea
                  id="vehicle_avaries"
                  value={formData.vehicle_avaries}
                  onChange={(e) => handleChange("vehicle_avaries", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Statut de la commande et paiement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Statut *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INSCRIPTION">INSCRIPTION</SelectItem>
                    <SelectItem value="PROFORMA">PROFORMA</SelectItem>
                    <SelectItem value="COMMANDE">COMMANDE</SelectItem>
                    <SelectItem value="VALIDATION">VALIDATION</SelectItem>
                    <SelectItem value="ACCUSÉ">ACCUSÉ</SelectItem>
                    <SelectItem value="FACTURATION">FACTURATION</SelectItem>
                    <SelectItem value="ARRIVAGE">ARRIVAGE</SelectItem>
                    <SelectItem value="CARTE_JAUNE">CARTE JAUNE</SelectItem>
                    <SelectItem value="LIVRAISON">LIVRAISON</SelectItem>
                    <SelectItem value="DOSSIER_DAIRA">DOSSIER DAIRA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="total_price">Prix total (DZD)</Label>
                <Input
                  id="total_price"
                  type="number"
                  value={formData.total_price}
                  onChange={(e) => handleChange("total_price", parseFloat(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="advance_payment">Acompte (DZD)</Label>
                <Input
                  id="advance_payment"
                  type="number"
                  value={formData.advance_payment}
                  onChange={(e) => handleChange("advance_payment", parseFloat(e.target.value))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/dashboard/vn/orders/${id}`)}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Sauvegarde..." : "Sauvegarder les modifications"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default VnOrderEdit;
