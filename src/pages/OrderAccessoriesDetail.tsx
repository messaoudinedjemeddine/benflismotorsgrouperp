import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

interface OrderDetails {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_address: string;
  customer_id_number: string;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_color: string;
  vehicle_vin: string;
  status: string;
  total_price: number;
}

interface OrderAccessory {
  id: string;
  quantity: number;
  created_by: string;
  added_by_name: string;
  accessory: {
    id: string;
    name: string;
    reference: string;
    price_ht: number;
    price_ttc: number;
  };
}

const OrderAccessoriesDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [accessories, setAccessories] = useState<OrderAccessory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && user) {
      fetchOrderDetails();
    }
  }, [id, user]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);

      // Fetch order details
      const { data: orderData, error: orderError } = await supabase
        .from("vn_orders")
        .select("*")
        .eq("id", id)
        .single();

      if (orderError) throw orderError;
      setOrder(orderData);

      // Fetch order accessories
      const { data: accessoriesData, error: accessoriesError } = await supabase
        .from("vn_order_accessories")
        .select(`
          id,
          quantity,
          created_by,
          accessories (
            id,
            name,
            reference,
            price_ht,
            price_ttc
          )
        `)
        .eq("order_id", id);

      if (accessoriesError) throw accessoriesError;

      // Get user profiles for created_by
      const userIds = accessoriesData?.map(item => item.created_by).filter(Boolean) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const userMap = profiles?.reduce((acc: any, profile) => {
        acc[profile.user_id] = profile.full_name;
        return acc;
      }, {}) || {};

      const formattedAccessories = (accessoriesData || []).map((item) => ({
        id: item.id,
        quantity: item.quantity,
        created_by: item.created_by,
        added_by_name: item.created_by ? (userMap[item.created_by] || "Unknown") : "N/A",
        accessory: item.accessories as any,
      }));

      setAccessories(formattedAccessories);
    } catch (error: any) {
      console.error("Error fetching order details:", error);
      toast({
        title: "Error",
        description: "Failed to fetch order details",
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

  const calculateTotal = () => {
    return accessories.reduce((sum, item) => {
      return sum + item.accessory.price_ttc * item.quantity;
    }, 0);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading order details...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto py-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Order not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Order Accessories Details</h1>
          <p className="text-muted-foreground">Order {order.order_number}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{order.customer_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{order.customer_phone}</p>
            </div>
            {order.customer_email && (
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{order.customer_email}</p>
              </div>
            )}
            {order.customer_id_number && (
              <div>
                <p className="text-sm text-muted-foreground">ID Number</p>
                <p className="font-medium">{order.customer_id_number}</p>
              </div>
            )}
            {order.customer_address && (
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{order.customer_address}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vehicle Information */}
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Brand & Model</p>
              <p className="font-medium">
                {order.vehicle_brand} {order.vehicle_model}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Year</p>
              <p className="font-medium">{order.vehicle_year}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Color</p>
              <p className="font-medium">{order.vehicle_color}</p>
            </div>
            {order.vehicle_vin && (
              <div>
                <p className="text-sm text-muted-foreground">VIN</p>
                <p className="font-medium">{order.vehicle_vin}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Order Status</p>
              <div className="mt-1">{getStatusBadge(order.status)}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accessories List */}
      <Card>
        <CardHeader>
          <CardTitle>Accessories Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Accessory</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Added By</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Price HT</TableHead>
                  <TableHead className="text-right">Price TTC</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accessories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No accessories found for this order
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {accessories.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.accessory.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.accessory.reference}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.added_by_name}
                        </TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.accessory.price_ht)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.accessory.price_ttc)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(item.accessory.price_ttc * item.quantity)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={6} className="text-right font-bold">
                        Total Accessories:
                      </TableCell>
                      <TableCell className="text-right font-bold text-primary text-lg">
                        {formatCurrency(calculateTotal())}
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderAccessoriesDetail;
