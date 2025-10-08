import { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Eye, FileText, Edit, Trash2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface VnOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_id_number?: string;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_color: string;
  vehicle_vin: string;
  status: string;
  location: string;
  advance_payment: number;
  created_at: string;
}

const statusColors: Record<string, string> = {
  INSCRIPTION: "bg-gray-500",
  PROFORMA: "bg-blue-500",
  COMMANDE: "bg-yellow-500",
  VALIDATION: "bg-purple-500",
  "ACCUSÉ": "bg-indigo-500",
  FACTURATION: "bg-pink-500",
  ARRIVAGE: "bg-orange-500",
  CARTE_JAUNE: "bg-yellow-600",
  LIVRAISON: "bg-green-500",
  DOSSIER_DAIRA: "bg-emerald-600",
};

const VnOrders = () => {
  const [orders, setOrders] = useState<VnOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<VnOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (hasRole) {
      fetchOrders();
    }
  }, [hasRole]);

  useEffect(() => {
    filterOrders();
  }, [searchQuery, statusFilter, orders]);

  const fetchOrders = async () => {
    try {
      console.log('Fetching VN orders...');
      const { data, error } = await supabase
        .from("vn_orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('VN orders fetched successfully:', data);
      setOrders(data || []);
    } catch (error: any) {
      console.error('Error fetching VN orders:', error);
      toast({
        title: "Error",
        description: `Failed to fetch VN orders: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.customer_name.toLowerCase().includes(query) ||
          order.customer_phone.includes(query) ||
          order.order_number.toLowerCase().includes(query) ||
          order.vehicle_vin?.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!hasRole(['sys_admin'])) {
      toast({
        title: "Unauthorized",
        description: "Only admins can delete orders",
        variant: "destructive",
      });
      return;
    }

    if (!confirm("Are you sure you want to delete this order?")) return;

    try {
      const { error } = await supabase.from("vn_orders").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Order deleted successfully",
      });

      fetchOrders();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-DZ", {
      style: "currency",
      currency: "DZD",
    }).format(amount);
  };

  const handleImportExcel = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      let successCount = 0;
      let errorCount = 0;

      for (const row of jsonData) {
        try {
          const inscriptionDate = (row as any)["Inscription date"] 
            ? new Date((row as any)["Inscription date"]).toISOString()
            : new Date().toISOString();

          const { error } = await supabase.from("vn_orders").insert({
            customer_name: `${(row as any)["first name"] || ""} ${(row as any)["last name"] || ""}`.trim(),
            customer_phone: (row as any)["Phone number"] || "",
            customer_id_number: (row as any)["ID Number"] || "",
            vehicle_brand: (row as any)["Car brand"] || "",
            vehicle_model: (row as any)["Car model"] || "",
            vehicle_color: (row as any)["Car color"] || "",
            order_number: "", // Will be auto-generated by trigger
            status: "INSCRIPTION" as const,
            location: "PARC1" as const,
            total_price: 0,
            advance_payment: 0,
            created_at: inscriptionDate,
          });

          if (error) throw error;
          successCount++;
        } catch (err) {
          console.error("Error importing row:", err);
          errorCount++;
        }
      }

      toast({
        title: "Import Complete",
        description: `Successfully imported ${successCount} orders${errorCount > 0 ? `. Failed: ${errorCount}` : ""}`,
      });

      fetchOrders();
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error: any) {
      toast({
        title: "Import Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
          <p className="text-muted-foreground">
            Manage vehicle orders and track their status
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImportExcel}>
            <Upload className="mr-2 h-4 w-4" />
            Import Excel
          </Button>
          <Button onClick={() => navigate("/dashboard/vn/orders/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Order
          </Button>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileUpload}
        className="hidden"
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer, order ID, phone, or VIN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="all">All Statuses</SelectItem>
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
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No orders found
                  </TableCell>
                </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.order_number}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.customer_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {order.customer_phone}
                          </div>
                          {order.customer_id_number && (
                            <div className="group relative inline-block">
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full cursor-help">
                                ID Available
                              </span>
                              <div className="invisible group-hover:visible absolute left-0 top-full mt-1 z-10 bg-popover text-popover-foreground px-3 py-2 rounded-md shadow-lg border text-sm whitespace-nowrap">
                                ID: {order.customer_id_number}
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {order.vehicle_brand} {order.vehicle_model}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {order.vehicle_color} • {order.vehicle_vin || "No VIN"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[order.status]}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{order.location}</Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(order.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/dashboard/vn/orders/${order.id}`)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/dashboard/vn/orders/${order.id}/documents`)}
                            title="Documents"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/dashboard/vn/orders/${order.id}/edit`)}
                            title="Edit Order"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {hasRole(['sys_admin']) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(order.id)}
                              className="text-destructive hover:text-destructive"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
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

export default VnOrders;
