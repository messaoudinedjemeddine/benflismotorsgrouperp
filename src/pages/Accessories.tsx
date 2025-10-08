import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Accessory {
  id: string;
  name: string;
  reference: string;
  price_ht: number;
  price_ttc: number;
  created_at: string;
  updated_at: string;
}

const Accessories = () => {
  const { user } = useAuth();
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccessory, setEditingAccessory] = useState<Accessory | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    reference: "",
    price_ht: "",
  });

  useEffect(() => {
    if (user) {
      fetchAccessories();
    }
  }, [user]);

  const fetchAccessories = async () => {
    try {
      console.log('Fetching accessories...');
      const { data, error } = await supabase
        .from("accessories")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Accessories fetched successfully:', data);
      setAccessories(data || []);
    } catch (error) {
      console.error("Error fetching accessories:", error);
      toast({
        title: "Erreur",
        description: `Échec de la récupération des accessoires : ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.reference || !formData.price_ht) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    try {
      const price_ht = parseFloat(formData.price_ht);
      
      if (editingAccessory) {
        const { error } = await supabase
          .from("accessories")
          .update({
            name: formData.name,
            reference: formData.reference,
            price_ht,
          })
          .eq("id", editingAccessory.id);

        if (error) throw error;
        toast({ title: "Succès", description: "Accessoire mis à jour avec succès" });
      } else {
        const { error } = await supabase
          .from("accessories")
          .insert({
            name: formData.name,
            reference: formData.reference,
            price_ht,
          });

        if (error) throw error;
        toast({ title: "Succès", description: "Accessoire ajouté avec succès" });
      }

      setDialogOpen(false);
      resetForm();
      fetchAccessories();
    } catch (error) {
      console.error("Error saving accessory:", error);
      toast({
        title: "Erreur",
        description: "Échec de la sauvegarde de l'accessoire",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (accessory: Accessory) => {
    setEditingAccessory(accessory);
    setFormData({
      name: accessory.name,
      reference: accessory.reference,
      price_ht: accessory.price_ht.toString(),
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet accessoire ?")) return;

    try {
      const { error } = await supabase
        .from("accessories")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Succès", description: "Accessoire supprimé avec succès" });
      fetchAccessories();
    } catch (error) {
      console.error("Error deleting accessory:", error);
      toast({
        title: "Erreur",
        description: "Échec de la suppression de l'accessoire",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({ name: "", reference: "", price_ht: "" });
    setEditingAccessory(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-DZ", {
      style: "currency",
      currency: "DZD",
    }).format(value);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Accessoires</h1>
          <p className="text-muted-foreground">Gérer les accessoires de véhicules et les prix</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un Accessoire
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingAccessory ? "Modifier l'Accessoire" : "Ajouter un Nouvel Accessoire"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nom de l'accessoire"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reference">Référence</Label>
                <Input
                  id="reference"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  placeholder="Code de référence"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price_ht">Prix HT (Hors Taxe)</Label>
                <Input
                  id="price_ht"
                  type="number"
                  step="0.01"
                  value={formData.price_ht}
                  onChange={(e) => setFormData({ ...formData, price_ht: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              {formData.price_ht && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium">
                    Prix TTC (Incluant 19% de Taxe) :{" "}
                    <span className="text-primary">
                      {formatCurrency(parseFloat(formData.price_ht) * 1.19)}
                    </span>
                  </p>
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">
                  {editingAccessory ? "Mettre à jour" : "Ajouter"} l'Accessoire
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Référence</TableHead>
              <TableHead>Prix HT</TableHead>
              <TableHead>Prix TTC (19%)</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accessories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Aucun accessoire trouvé. Ajoutez votre premier accessoire pour commencer.
                </TableCell>
              </TableRow>
            ) : (
              accessories.map((accessory) => (
                <TableRow key={accessory.id}>
                  <TableCell className="font-medium">{accessory.name}</TableCell>
                  <TableCell>{accessory.reference}</TableCell>
                  <TableCell>{formatCurrency(accessory.price_ht)}</TableCell>
                  <TableCell className="font-semibold text-primary">
                    {formatCurrency(accessory.price_ttc)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(accessory)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(accessory.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Accessories;
