import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface VnOrder {
  id: string;
  order_number: string;
  customer_name: string;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_color: string;
  vehicle_vin: string;
}

interface Accessory {
  id: string;
  name: string;
  reference: string;
  price_ht: number;
  price_ttc: number;
}

interface OrderAccessory {
  id: string;
  order_id: string;
  accessory_id: string;
  quantity: number;
  accessory?: Accessory;
}

const AccessoriesOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<VnOrder[]>([]);
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<VnOrder | null>(null);
  const [orderAccessories, setOrderAccessories] = useState<OrderAccessory[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAccessoryId, setSelectedAccessoryId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
      fetchAccessories();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      console.log('Fetching VN orders...');
      const { data, error } = await supabase
        .from("vn_orders")
        .select("id, order_number, customer_name, vehicle_brand, vehicle_model, vehicle_color, vehicle_vin")
        .order("created_at", { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('VN orders fetched successfully:', data);
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Erreur",
        description: `Failed to fetch orders: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAccessories = async () => {
    try {
      const { data, error } = await supabase
        .from("accessories")
        .select("*")
        .order("name");

      if (error) throw error;
      setAccessories(data || []);
    } catch (error) {
      console.error("Error fetching accessories:", error);
    }
  };

  const fetchOrderAccessories = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from("vn_order_accessories")
        .select(`
          id,
          order_id,
          accessory_id,
          quantity,
          accessories (
            id,
            name,
            reference,
            price_ht,
            price_ttc
          )
        `)
        .eq("order_id", orderId);

      if (error) throw error;
      
      const formattedData = (data || []).map(item => ({
        ...item,
        accessory: item.accessories as unknown as Accessory
      }));
      
      setOrderAccessories(formattedData);
    } catch (error) {
      console.error("Error fetching order accessories:", error);
    }
  };

  const handleOrderSelect = (order: VnOrder) => {
    setSelectedOrder(order);
    fetchOrderAccessories(order.id);
  };

  const handleAddAccessory = async () => {
    if (!selectedOrder || !selectedAccessoryId || !quantity) {
      toast({
        title: "Erreur",
        description: "Please select an accessory and enter quantity",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("vn_order_accessories")
        .insert({
          order_id: selectedOrder.id,
          accessory_id: selectedAccessoryId,
          quantity: parseInt(quantity),
          created_by: user?.id,
        });

      if (error) throw error;

      toast({ title: "Succès", description: "Accessoire ajouté à la commande" });
      setDialogOpen(false);
      setSelectedAccessoryId("");
      setQuantity("1");
      fetchOrderAccessories(selectedOrder.id);
    } catch (error: any) {
      console.error("Error adding accessory:", error);
      toast({
        title: "Erreur",
        description: error.message?.includes("duplicate") 
          ? "Cet accessoire est déjà ajouté à cette commande" 
          : "Échec de l'ajout de l'accessoire",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccessory = async (id: string) => {
    if (!confirm("Supprimer cet accessoire de la commande ?")) return;

    try {
      const { error } = await supabase
        .from("vn_order_accessories")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Succès", description: "Accessoire supprimé de la commande" });
      if (selectedOrder) fetchOrderAccessories(selectedOrder.id);
    } catch (error) {
      console.error("Error deleting accessory:", error);
      toast({
        title: "Erreur",
        description: "Échec de la suppression de l'accessoire",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-DZ", {
      style: "currency",
      currency: "DZD",
    }).format(value);
  };

  const calculateTotal = () => {
    return orderAccessories.reduce((sum, item) => {
      return sum + (item.accessory?.price_ttc || 0) * item.quantity;
    }, 0);
  };

  const filteredOrders = orders.filter((order) => {
    const search = searchQuery.toLowerCase();
    return (
      order.customer_name.toLowerCase().includes(search) ||
      order.vehicle_brand.toLowerCase().includes(search) ||
      order.vehicle_model.toLowerCase().includes(search) ||
      order.order_number.toLowerCase().includes(search) ||
      order.vehicle_vin?.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return <div className="flex justify-center items-center h-64">Chargement...</div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Commandes d'accessoires</h1>
        <p className="text-muted-foreground">Ajouter des accessoires aux commandes VN</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders List */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Rechercher des commandes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="border rounded-lg max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Commande</TableHead>
                  <TableHead>Client et véhicule</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    className={`cursor-pointer ${selectedOrder?.id === order.id ? "bg-muted" : ""}`}
                    onClick={() => handleOrderSelect(order)}
                  >
                    <TableCell className="font-medium">{order.order_number}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{order.customer_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.vehicle_brand} {order.vehicle_model} - {order.vehicle_color}
                        </p>
                        {order.vehicle_vin && (
                          <p className="text-xs text-muted-foreground">VIN: {order.vehicle_vin}</p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Order Accessories */}
        <div className="space-y-4">
          {selectedOrder ? (
            <>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold">Commande {selectedOrder.order_number}</h3>
                  <p className="text-sm text-muted-foreground">{selectedOrder.customer_name}</p>
                </div>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un accessoire
                </Button>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Accessoire</TableHead>
                      <TableHead>Qté</TableHead>
                      <TableHead>Prix TTC</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderAccessories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          Aucun accessoire ajouté pour le moment
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {orderAccessories.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{item.accessory?.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {item.accessory?.reference}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>
                              {formatCurrency(item.accessory?.price_ttc || 0)}
                            </TableCell>
                            <TableCell className="font-semibold">
                              {formatCurrency((item.accessory?.price_ttc || 0) * item.quantity)}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteAccessory(item.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={3} className="text-right font-bold">
                            Total :
                          </TableCell>
                          <TableCell colSpan={2} className="font-bold text-primary text-lg">
                            {formatCurrency(calculateTotal())}
                          </TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[400px] border rounded-lg">
              <p className="text-muted-foreground">Sélectionnez une commande pour voir et ajouter des accessoires</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Accessory Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un accessoire à la commande</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Accessoire</label>
              <Select value={selectedAccessoryId} onValueChange={setSelectedAccessoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un accessoire" />
                </SelectTrigger>
                <SelectContent>
                  {accessories.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name} - {acc.reference} ({formatCurrency(acc.price_ttc)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Quantité</label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleAddAccessory}>Ajouter</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccessoriesOrders;
