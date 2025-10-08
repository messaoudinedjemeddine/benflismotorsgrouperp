import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface OrderWithAccessories {
  id: string;
  order_number: string;
  customer_name: string;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_color: string;
  vehicle_vin: string;
  status: string;
  accessories_count: number;
  total_accessories_price: number;
  added_by_names: string[];
}

const OrdersWithAccessories = () => {
  const { user, userRole, hasRole } = useAuth();
  const [orders, setOrders] = useState<OrderWithAccessories[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // Debug logging
  console.log('OrdersWithAccessories - User:', user);
  console.log('OrdersWithAccessories - User role:', userRole);
  console.log('OrdersWithAccessories - Has access role:', hasRole(['sys_admin', 'director', 'cdv', 'commercial', 'magasin']));

  useEffect(() => {
    if (user) {
      fetchOrdersWithAccessories();
    }
  }, [user]);

  const fetchOrdersWithAccessories = async () => {
    try {
      console.log('OrdersWithAccessories - Starting to fetch orders...');
      console.log('OrdersWithAccessories - Current user role:', userRole);
      setLoading(true);
      
      // First, get all order IDs that have accessories with user info
      console.log('OrdersWithAccessories - Fetching order accessories...');
      const { data: orderAccessories, error: accessoriesError } = await supabase
        .from("vn_order_accessories")
        .select(`
          order_id,
          quantity,
          created_by,
          accessories (
            price_ttc
          )
        `);

      if (accessoriesError) {
        console.error("Error fetching order accessories:", accessoriesError);
        console.error("Accessories error details:", accessoriesError.message, accessoriesError.code);
        throw accessoriesError;
      }
      
      console.log('OrdersWithAccessories - Order accessories fetched:', orderAccessories);

      // Get unique user IDs
      const userIds = [...new Set(orderAccessories?.map(item => item.created_by).filter(Boolean))];
      
      // Fetch user profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const userMap = profiles?.reduce((acc: any, profile) => {
        acc[profile.user_id] = profile.full_name;
        return acc;
      }, {}) || {};

      // Group by order_id and calculate totals
      const orderStats = orderAccessories?.reduce((acc: any, item) => {
        if (!acc[item.order_id]) {
          acc[item.order_id] = {
            count: 0,
            total: 0,
            users: new Set()
          };
        }
        acc[item.order_id].count += item.quantity;
        acc[item.order_id].total += (item.accessories as any)?.price_ttc * item.quantity || 0;
        if (item.created_by) {
          acc[item.order_id].users.add(userMap[item.created_by] || "Unknown");
        }
        return acc;
      }, {}) || {};

      const orderIds = Object.keys(orderStats);

      if (orderIds.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

      // Fetch the orders details
      console.log('OrdersWithAccessories - Fetching VN orders for IDs:', orderIds);
      const { data: ordersData, error: ordersError } = await supabase
        .from("vn_orders")
        .select("id, order_number, customer_name, vehicle_brand, vehicle_model, vehicle_color, vehicle_vin, status")
        .in("id", orderIds)
        .order("created_at", { ascending: false });

      if (ordersError) {
        console.error("Error fetching VN orders:", ordersError);
        console.error("Orders error details:", ordersError.message, ordersError.code);
        throw ordersError;
      }
      
      console.log('OrdersWithAccessories - VN orders fetched:', ordersData);

      // Combine the data
      const combinedData = ordersData?.map(order => ({
        ...order,
        accessories_count: orderStats[order.id].count,
        total_accessories_price: orderStats[order.id].total,
        added_by_names: Array.from(orderStats[order.id].users) as string[]
      })) || [];

      setOrders(combinedData);
    } catch (error: any) {
      console.error("Error fetching orders with accessories:", error);
      toast({
        title: "Erreur",
        description: "Échec de la récupération des commandes avec accessoires",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-DZ", {
      style: "currency",
      currency: "DZD",
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      INSCRIPTION: "bg-gray-500",
      PROFORMA: "bg-blue-500",
      COMMANDE: "bg-purple-500",
      VALIDATION: "bg-yellow-500",
      ACCUSÉ: "bg-indigo-500",
      FACTURATION: "bg-orange-500",
      ARRIVAGE: "bg-cyan-500",
      CARTE_JAUNE: "bg-green-500",
      LIVRAISON: "bg-teal-500",
      DOSSIER_DAIRA: "bg-pink-500",
    };

    return (
      <Badge className={`${statusColors[status] || "bg-gray-500"} text-white`}>
        {status.replace(/_/g, " ")}
      </Badge>
    );
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
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">
          Chargement des commandes...
          <div className="text-sm text-gray-500 mt-2">
            Debug: User={user ? 'Yes' : 'No'}, Role={userRole || 'None'}, HasMagasin={hasRole(['magasin']) ? 'Yes' : 'No'}
          </div>
        </div>
      </div>
    );
  }

  // Role check - allow sys_admin, director, cdv, commercial, and magasin roles
  if (!hasRole(['sys_admin', 'director', 'cdv', 'commercial', 'magasin'])) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Accès refusé</h1>
          <p className="text-gray-600 mb-4">Vous n'avez pas la permission d'accéder à cette page.</p>
          <div className="text-sm text-gray-500">
            Debug Info: User={user ? 'Yes' : 'No'}, Role={userRole || 'None'}, HasAccess={hasRole(['sys_admin', 'director', 'cdv', 'commercial', 'magasin']) ? 'Yes' : 'No'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Commandes avec accessoires</h1>
        <p className="text-muted-foreground">Voir toutes les commandes de véhicules qui ont des accessoires</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Résumé des commandes</CardTitle>
          <CardDescription>
            {filteredOrders.length} commande{filteredOrders.length !== 1 ? 's' : ''} avec accessoires
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par client, véhicule, numéro de commande ou VIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro de commande</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Véhicule</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Ajouté par</TableHead>
                  <TableHead className="text-right">Nombre d'accessoires</TableHead>
                  <TableHead className="text-right">Prix total</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  {searchQuery ? "Aucune commande trouvée correspondant à votre recherche" : "Aucune commande avec accessoires trouvée"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{order.order_number}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customer_name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {order.vehicle_brand} {order.vehicle_model}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.vehicle_color}
                          </p>
                          {order.vehicle_vin && (
                            <p className="text-xs text-muted-foreground">
                              VIN: {order.vehicle_vin}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {order.added_by_names.length > 0 ? (
                            order.added_by_names.map((name, idx) => (
                              <div key={idx} className="text-muted-foreground">
                                {name}
                              </div>
                            ))
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {order.accessories_count}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-primary">
                        {formatCurrency(order.total_accessories_price)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/dashboard/orders-with-accessories/${order.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Voir les détails
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrdersWithAccessories;
