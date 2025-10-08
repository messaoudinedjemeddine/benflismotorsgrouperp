import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Eye, Mail, MessageSquare, FileText, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Client {
  id: string;
  name: string;
  phone_number: string;
  email?: string;
}

interface Car {
  id: string;
  brand: string;
  model: string;
  vin?: string;
}

interface OrderPiece {
  id?: string;
  reference: string;
  price: number;
  quantity: number;
}

interface PartsOrder {
  id: string;
  status: 'ready' | 'not_ready' | 'canceled';
  total_amount: number;
  created_at: string;
  clients: Client;
  cars: Car;
  order_pieces: OrderPiece[];
}

const PartsOrders = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [orders, setOrders] = useState<PartsOrder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewOrderDialog, setShowNewOrderDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PartsOrder | null>(null);

  // New order form state
  const [newOrder, setNewOrder] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    carBrand: '',
    carModel: '',
    carVin: '',
    pieces: [{ reference: '', price: 0, quantity: 1 }] as OrderPiece[]
  });

  const [stats, setStats] = useState({
    ready: 0,
    not_ready: 0,
    canceled: 0,
    readyTotal: 0,
    notReadyTotal: 0
  });

  useEffect(() => {
    if (user) {
      fetchOrders();
      fetchClients();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      console.log('Fetching orders...');
      const { data, error } = await supabase
        .from('parts_orders')
        .select(`
          *,
          clients(*),
          cars(*),
          order_pieces(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Orders fetched successfully:', data);
      setOrders(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: `Failed to fetch orders: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const calculateStats = (ordersList: PartsOrder[]) => {
    const stats = {
      ready: 0,
      not_ready: 0,
      canceled: 0,
      readyTotal: 0,
      notReadyTotal: 0
    };

    ordersList.forEach(order => {
      if (order.status === 'ready') {
        stats.ready++;
        stats.readyTotal += order.total_amount;
      } else if (order.status === 'not_ready') {
        stats.not_ready++;
        stats.notReadyTotal += order.total_amount;
      } else {
        stats.canceled++;
      }
    });

    setStats(stats);
  };

  const validateAlgerianPhone = (phone: string): boolean => {
    return /^0[567][0-9]{8}$/.test(phone);
  };

  const addPiece = () => {
    setNewOrder(prev => ({
      ...prev,
      pieces: [...prev.pieces, { reference: '', price: 0, quantity: 1 }]
    }));
  };

  const removePiece = (index: number) => {
    setNewOrder(prev => ({
      ...prev,
      pieces: prev.pieces.filter((_, i) => i !== index)
    }));
  };

  const updatePiece = (index: number, field: keyof OrderPiece, value: string | number) => {
    setNewOrder(prev => ({
      ...prev,
      pieces: prev.pieces.map((piece, i) => 
        i === index ? { ...piece, [field]: value } : piece
      )
    }));
  };

  const calculateTotal = () => {
    return newOrder.pieces.reduce((total, piece) => 
      total + (piece.price * piece.quantity), 0
    );
  };

  const createOrder = async () => {
    try {
      console.log('Creating order...', { user: user?.id, newOrder });
      
      if (!validateAlgerianPhone(newOrder.clientPhone)) {
        toast({
          title: "Error",
          description: "Phone number must start with 05, 06, or 07",
          variant: "destructive",
        });
        return;
      }

      // Create or find client
      let clientId: string;
      const existingClient = clients.find(c => c.phone_number === newOrder.clientPhone);
      
      if (existingClient) {
        clientId = existingClient.id;
        console.log('Using existing client:', clientId);
      } else {
        console.log('Creating new client...');
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .insert({
            name: newOrder.clientName,
            phone_number: newOrder.clientPhone,
            email: newOrder.clientEmail || null
          })
          .select()
          .single();

        if (clientError) {
          console.error('Client creation error:', clientError);
          throw clientError;
        }
        clientId = clientData.id;
        console.log('Client created:', clientId);
      }

      // Create car
      console.log('Creating car...');
      const { data: carData, error: carError } = await supabase
        .from('cars')
        .insert({
          client_id: clientId,
          brand: newOrder.carBrand,
          model: newOrder.carModel,
          vin: newOrder.carVin || null
        })
        .select()
        .single();

      if (carError) {
        console.error('Car creation error:', carError);
        throw carError;
      }
      console.log('Car created:', carData.id);

      // Create order
      const total = calculateTotal();
      if (!user?.id) {
        toast({
          title: "Authentication Error",
          description: "User not authenticated",
          variant: "destructive",
        });
        return;
      }

      console.log('Creating parts order...');
      const { data: orderData, error: orderError } = await supabase
        .from('parts_orders')
        .insert({
          client_id: clientId,
          car_id: carData.id,
          employee_id: user.id,
          total_amount: total,
          status: 'not_ready'
        })
        .select()
        .single();

      if (orderError) {
        console.error('Order creation error:', orderError);
        throw orderError;
      }
      console.log('Order created:', orderData.id);

      // Create order pieces
      console.log('Creating order pieces...');
      const piecesData = newOrder.pieces.map(piece => ({
        order_id: orderData.id,
        reference: piece.reference,
        price: piece.price,
        quantity: piece.quantity
      }));

      const { error: piecesError } = await supabase
        .from('order_pieces')
        .insert(piecesData);

      if (piecesError) {
        console.error('Order pieces creation error:', piecesError);
        throw piecesError;
      }
      console.log('Order pieces created successfully');

      toast({
        title: "Order Created Successfully",
        description: `Order ID: ${orderData.id}`,
      });

      setShowNewOrderDialog(false);
      setNewOrder({
        clientName: '',
        clientPhone: '',
        clientEmail: '',
        carBrand: '',
        carModel: '',
        carVin: '',
        pieces: [{ reference: '', price: 0, quantity: 1 }]
      });
      fetchOrders();
      fetchClients();

    } catch (error: any) {
      console.error('Error creating order:', error);
      toast({
        title: "Error Creating Order",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateOrderStatus = async (orderId: string, status: 'ready' | 'not_ready' | 'canceled') => {
    try {
      const { error } = await supabase
        .from('parts_orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: "Order status updated successfully",
      });

      fetchOrders();
    } catch (error: any) {
      toast({
        title: "Error Updating Status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return <Badge variant="default" className="bg-green-500">Ready</Badge>;
      case 'not_ready':
        return <Badge variant="secondary">Not Ready</Badge>;
      case 'canceled':
        return <Badge variant="destructive">Canceled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold gradient-text">Commandes de pièces</h1>
        <Dialog open={showNewOrderDialog} onOpenChange={setShowNewOrderDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle commande
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer une nouvelle commande</DialogTitle>
              <DialogDescription>
                Créer une nouvelle commande de pièces pour un client et son véhicule.
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="client" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="client">Informations client</TabsTrigger>
                <TabsTrigger value="car">Informations véhicule</TabsTrigger>
                <TabsTrigger value="pieces">Pièces</TabsTrigger>
              </TabsList>
              
              <TabsContent value="client" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="clientName">Nom du client</Label>
                    <Input
                      id="clientName"
                      value={newOrder.clientName}
                      onChange={(e) => setNewOrder(prev => ({...prev, clientName: e.target.value}))}
                      placeholder="Saisissez le nom du client"
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientPhone">Numéro de téléphone</Label>
                    <Input
                      id="clientPhone"
                      value={newOrder.clientPhone}
                      onChange={(e) => setNewOrder(prev => ({...prev, clientPhone: e.target.value}))}
                      placeholder="05xxxxxxxx"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="clientEmail">Email (Optionnel)</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={newOrder.clientEmail}
                    onChange={(e) => setNewOrder(prev => ({...prev, clientEmail: e.target.value}))}
                    placeholder="exemple@email.com"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="car" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="carBrand">Marque</Label>
                    <Input
                      id="carBrand"
                      value={newOrder.carBrand}
                      onChange={(e) => setNewOrder(prev => ({...prev, carBrand: e.target.value}))}
                      placeholder="Toyota, Nissan, Renault..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="carModel">Modèle</Label>
                    <Input
                      id="carModel"
                      value={newOrder.carModel}
                      onChange={(e) => setNewOrder(prev => ({...prev, carModel: e.target.value}))}
                      placeholder="Camry, Altima, Megane..."
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="carVin">Numéro VIN (Optionnel)</Label>
                  <Input
                    id="carVin"
                    value={newOrder.carVin}
                    onChange={(e) => setNewOrder(prev => ({...prev, carVin: e.target.value}))}
                    placeholder="Numéro d'identification du véhicule"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="pieces" className="space-y-4">
                <div className="space-y-4">
                  {newOrder.pieces.map((piece, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-4 gap-4 items-end">
                          <div>
                            <Label>Référence</Label>
                            <Input
                              value={piece.reference}
                              onChange={(e) => updatePiece(index, 'reference', e.target.value)}
                              placeholder="Numéro de pièce"
                            />
                          </div>
                          <div>
                            <Label>Prix (DA)</Label>
                            <Input
                              type="number"
                              value={piece.price}
                              onChange={(e) => updatePiece(index, 'price', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <Label>Quantité</Label>
                            <Input
                              type="number"
                              min="1"
                              value={piece.quantity}
                              onChange={(e) => updatePiece(index, 'quantity', parseInt(e.target.value) || 1)}
                            />
                          </div>
                          <div>
                            {newOrder.pieces.length > 1 && (
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => removePiece(index)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  <div className="flex justify-between items-center">
                    <Button onClick={addPiece} variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter une pièce
                    </Button>
                    <div className="text-lg font-semibold">
                      Total: {calculateTotal().toLocaleString()} DA
                    </div>
                  </div>
                  
                  <Button onClick={createOrder} className="w-full bg-gradient-primary">
                    Créer la commande
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-green-600">Commandes prêtes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ready}</div>
            <div className="text-xs text-muted-foreground">{stats.readyTotal.toLocaleString()} DA</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-orange-600">Pas prêtes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.not_ready}</div>
            <div className="text-xs text-muted-foreground">{stats.notReadyTotal.toLocaleString()} DA</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-600">Annulées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.canceled}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total des commandes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Valeur totale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.readyTotal + stats.notReadyTotal).toLocaleString()} DA
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Toutes les commandes de pièces</CardTitle>
          <CardDescription>Gérer et suivre les commandes de pièces</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Commande</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Véhicule</TableHead>
                <TableHead>Pièces</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm">
                    {order.id.substring(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.clients?.name || 'Client inconnu'}</div>
                      <div className="text-sm text-muted-foreground">{order.clients?.phone_number || 'N/A'}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {order.cars?.brand || 'Inconnu'} {order.cars?.model || ''}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {order.order_pieces.slice(0, 2).map((piece, idx) => (
                        <div key={idx}>{piece.reference} (x{piece.quantity})</div>
                      ))}
                      {order.order_pieces.length > 2 && (
                        <div className="text-muted-foreground">+{order.order_pieces.length - 2} de plus</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">
                    {order.total_amount.toLocaleString()} DA
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(order.status)}
                  </TableCell>
                  <TableCell>
                    {new Date(order.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Select
                        value={order.status}
                        onValueChange={(value: 'ready' | 'not_ready' | 'canceled') => 
                          updateOrderStatus(order.id, value)
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ready">Prêt</SelectItem>
                          <SelectItem value="not_ready">Pas prêt</SelectItem>
                          <SelectItem value="canceled">Annulé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PartsOrders;