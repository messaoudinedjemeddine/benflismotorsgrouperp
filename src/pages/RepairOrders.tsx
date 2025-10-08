import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Eye, Upload, Car, DollarSign } from 'lucide-react';
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

interface RepairImage {
  id: string;
  image_url: string;
  description?: string;
}

interface RepairOrder {
  id: string;
  damage_description?: string;
  repair_price?: number;
  status: 'price_set' | 'price_not_set';
  created_at: string;
  clients: Client;
  cars: Car;
  repair_images: RepairImage[];
  creator_employee_id: string;
  pricer_employee_id?: string;
}

const RepairOrders = () => {
  const { toast } = useToast();
  const { profile, hasRole } = useAuth();
  const [orders, setOrders] = useState<RepairOrder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewOrderDialog, setShowNewOrderDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<RepairOrder | null>(null);
  const [showPricingDialog, setShowPricingDialog] = useState(false);

  // New order form state
  const [newOrder, setNewOrder] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    carBrand: '',
    carModel: '',
    carVin: '',
    damageDescription: '',
    images: [] as File[]
  });

  const [repairPrice, setRepairPrice] = useState('');
  const [selectedImage, setSelectedImage] = useState<RepairImage | null>(null);
  const [showImageDialog, setShowImageDialog] = useState(false);

  useEffect(() => {
    if (profile) {
      fetchOrders();
      fetchClients();
    }
  }, [profile]);

  const fetchOrders = async () => {
    try {
      console.log('Fetching repair orders...');
      const { data, error } = await supabase
        .from('repair_orders')
        .select(`
          *,
          clients(*),
          cars(*),
          repair_images(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Repair orders fetched successfully:', data);
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching repair orders:', error);
      toast({
        title: "Error",
        description: `Failed to fetch repair orders: ${error.message}`,
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

  const validateAlgerianPhone = (phone: string): boolean => {
    return /^0[567][0-9]{8}$/.test(phone);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setNewOrder(prev => ({
      ...prev,
      images: [...prev.images, ...files]
    }));
  };

  const removeImage = (index: number) => {
    setNewOrder(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const uploadImages = async (repairOrderId: string) => {
    const uploadedImages = [];
    
    for (const image of newOrder.images) {
      // Convert image to base64
      const reader = new FileReader();
      const imageData = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(image);
      });

      uploadedImages.push({
        repair_order_id: repairOrderId,
        image_url: imageData,
        description: `Damage Image ${uploadedImages.length + 1}`
      });
    }

    if (uploadedImages.length > 0) {
      const { error } = await supabase
        .from('repair_images')
        .insert(uploadedImages);

      if (error) {
        console.error('Error saving image records:', error);
      }
    }
  };

  const createRepairOrder = async () => {
    try {
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
      } else {
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .insert({
            name: newOrder.clientName,
            phone_number: newOrder.clientPhone,
            email: newOrder.clientEmail || null
          })
          .select()
          .single();

        if (clientError) throw clientError;
        clientId = clientData.id;
      }

      // Create car
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

      if (carError) throw carError;

      // Create repair order
      const { data: orderData, error: orderError } = await supabase
        .from('repair_orders')
        .insert({
          client_id: clientId,
          car_id: carData.id,
          creator_employee_id: profile?.user_id || '',
          damage_description: newOrder.damageDescription,
          status: 'price_not_set'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Upload images
      await uploadImages(orderData.id);

      toast({
        title: "Repair Order Created Successfully",
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
        damageDescription: '',
        images: []
      });
      fetchOrders();
      fetchClients();

    } catch (error: any) {
      console.error('Error creating repair order:', error);
      toast({
        title: "Error Creating Repair Order",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const setPrice = async (orderId: string, price: number) => {
    try {
      const { error } = await supabase
        .from('repair_orders')
        .update({ 
          repair_price: price,
          status: 'price_set',
          pricer_employee_id: profile?.user_id
        })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Price Set Successfully",
        description: `Repair price set: ${price.toLocaleString()} DA`,
      });

      setShowPricingDialog(false);
      setRepairPrice('');
      fetchOrders();
    } catch (error: any) {
      toast({
        title: "Error Setting Price",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'price_set':
        return <Badge variant="default" className="bg-green-500">Price Set</Badge>;
      case 'price_not_set':
        return <Badge variant="secondary">Price Not Set</Badge>;
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
        <h1 className="text-3xl font-bold gradient-text">Repair Orders</h1>
        {hasRole(['sys_admin', 'director', 'apv']) && (
          <Dialog open={showNewOrderDialog} onOpenChange={setShowNewOrderDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary">
                <Plus className="w-4 h-4 mr-2" />
                New Repair Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Repair Order</DialogTitle>
              </DialogHeader>
              
              <Tabs defaultValue="client" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="client">Client Information</TabsTrigger>
                  <TabsTrigger value="car">Car Information</TabsTrigger>
                  <TabsTrigger value="damage">Damage Description</TabsTrigger>
                  <TabsTrigger value="images">Damage Images</TabsTrigger>
                </TabsList>
                
                <TabsContent value="client" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="clientName">Client Name</Label>
                      <Input
                        id="clientName"
                        value={newOrder.clientName}
                        onChange={(e) => setNewOrder(prev => ({...prev, clientName: e.target.value}))}
                        placeholder="Enter client name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="clientPhone">Phone Number</Label>
                      <Input
                        id="clientPhone"
                        value={newOrder.clientPhone}
                        onChange={(e) => setNewOrder(prev => ({...prev, clientPhone: e.target.value}))}
                        placeholder="05xxxxxxxx"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="clientEmail">Email (Optional)</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      value={newOrder.clientEmail}
                      onChange={(e) => setNewOrder(prev => ({...prev, clientEmail: e.target.value}))}
                      placeholder="example@email.com"
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="car" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="carBrand">Brand</Label>
                      <Input
                        id="carBrand"
                        value={newOrder.carBrand}
                        onChange={(e) => setNewOrder(prev => ({...prev, carBrand: e.target.value}))}
                        placeholder="Toyota, Nissan, Renault..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="carModel">Model</Label>
                      <Input
                        id="carModel"
                        value={newOrder.carModel}
                        onChange={(e) => setNewOrder(prev => ({...prev, carModel: e.target.value}))}
                        placeholder="Camry, Altima, Megane..."
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="carVin">VIN Number (Optional)</Label>
                    <Input
                      id="carVin"
                      value={newOrder.carVin}
                      onChange={(e) => setNewOrder(prev => ({...prev, carVin: e.target.value}))}
                      placeholder="Vehicle Identification Number"
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="damage" className="space-y-4">
                  <div>
                    <Label htmlFor="damageDescription">Damage Description</Label>
                    <Textarea
                      id="damageDescription"
                      value={newOrder.damageDescription}
                      onChange={(e) => setNewOrder(prev => ({...prev, damageDescription: e.target.value}))}
                      placeholder="Write a detailed description of the damage found in the car..."
                      className="min-h-32"
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="images" className="space-y-4">
                  <div>
                    <Label htmlFor="images">Damage Images</Label>
                    <Input
                      id="images"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </div>
                  
                  {newOrder.images.length > 0 && (
                    <div className="grid grid-cols-3 gap-4">
                      {newOrder.images.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Image ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => removeImage(index)}
                          >
                            ×
                          </Button>
                          <div className="text-sm text-center mt-2 truncate">
                            {image.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <Button onClick={createRepairOrder} className="w-full bg-gradient-primary">
                    Create Repair Order
                  </Button>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="card-green border-2 border-green/20 hover:border-green/40 transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-white/90">Price Set</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {orders.filter(o => o.status === 'price_set').length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-coral border-2 border-coral/20 hover:border-coral/40 transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-white/90">Price Not Set</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {orders.filter(o => o.status === 'price_not_set').length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-blue border-2 border-blue/20 hover:border-blue/40 transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-white/90">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{orders.length}</div>
          </CardContent>
        </Card>
        
        <Card className="card-primary border-2 border-primary/20 hover:border-primary/40 transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-white/90">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {orders.reduce((sum, o) => sum + (o.repair_price || 0), 0).toLocaleString()} DA
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Repair Orders Table */}
      <Card className="border-2 border-border/50 shadow-lg">
        <CardHeader className="border-b border-border/30">
          <CardTitle className="text-xl font-semibold">All Repair Orders</CardTitle>
          <CardDescription className="text-muted-foreground">Manage and track repair orders</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Car</TableHead>
                <TableHead>Damage</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
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
                       <div className="font-semibold text-foreground">{order.clients?.name || 'Unknown Client'}</div>
                       <div className="text-sm text-muted-foreground font-medium">{order.clients?.phone_number || 'N/A'}</div>
                     </div>
                   </TableCell>
                   <TableCell>
                     <div className="font-semibold text-foreground bg-muted/50 px-3 py-2 rounded-lg border border-border/50">
                       <div className="text-sm font-bold text-primary">{order.cars?.brand || 'Unknown'}</div>
                       <div className="text-sm text-muted-foreground">{order.cars?.model || ''}</div>
                     </div>
                   </TableCell>
                   <TableCell className="max-w-48">
                     <div className="text-sm truncate font-medium text-foreground">
                       {order.damage_description || 'No description'}
                     </div>
                   </TableCell>
                   <TableCell>
                     {order.repair_price ? (
                       <span className="font-bold text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20">
                         {order.repair_price.toLocaleString()} DA
                       </span>
                     ) : (
                       <span className="text-muted-foreground font-medium">Not set</span>
                     )}
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
                      {hasRole(['sys_admin', 'director', 'apv']) && order.status === 'price_not_set' && (
                        <Dialog open={showPricingDialog && selectedOrder?.id === order.id} 
                               onOpenChange={(open) => {
                                 setShowPricingDialog(open);
                                 if (open) setSelectedOrder(order);
                               }}>
                          <DialogTrigger asChild>
                            <Button size="sm" className="bg-gradient-primary">
                              <DollarSign className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Set Repair Price</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="repairPrice">Repair Price (DA)</Label>
                                <Input
                                  id="repairPrice"
                                  type="number"
                                  value={repairPrice}
                                  onChange={(e) => setRepairPrice(e.target.value)}
                                  placeholder="Enter repair price"
                                />
                              </div>
                              <Button
                                onClick={() => setPrice(order.id, parseFloat(repairPrice))}
                                className="w-full bg-gradient-primary"
                                disabled={!repairPrice}
                              >
                                Set Price
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder && !showPricingDialog} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Repair Order Details</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Client Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Client Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Name</Label>
                      <p className="font-semibold">{selectedOrder.clients?.name || 'Unknown'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Phone</Label>
                      <p className="font-semibold">{selectedOrder.clients?.phone_number || 'N/A'}</p>
                    </div>
                    {selectedOrder.clients?.email && (
                      <div className="col-span-2">
                        <Label className="text-muted-foreground">Email</Label>
                        <p className="font-semibold">{selectedOrder.clients.email}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Car Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Vehicle Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Brand</Label>
                      <p className="font-semibold">{selectedOrder.cars?.brand || 'Unknown'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Model</Label>
                      <p className="font-semibold">{selectedOrder.cars?.model || 'Unknown'}</p>
                    </div>
                    {selectedOrder.cars?.vin && (
                      <div className="col-span-2">
                        <Label className="text-muted-foreground">VIN</Label>
                        <p className="font-mono font-semibold">{selectedOrder.cars.vin}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Damage Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Damage Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground whitespace-pre-wrap">
                    {selectedOrder.damage_description || 'No description provided'}
                  </p>
                </CardContent>
              </Card>

              {/* Repair Images */}
              {selectedOrder.repair_images.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Damage Images</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedOrder.repair_images.map((image) => (
                        <div key={image.id} className="space-y-2">
                          <img
                            src={image.image_url}
                            alt={image.description || 'Damage image'}
                            className="w-full h-48 object-cover rounded-lg border-2 border-border hover:border-primary transition-colors cursor-pointer"
                            onClick={() => {
                              console.log('Opening image:', image.image_url);
                              setSelectedImage(image);
                              setShowImageDialog(true);
                            }}
                            onError={(e) => {
                              console.error('Image failed to load:', image.image_url);
                              console.error('Image error:', e);
                              toast({
                                title: "Image Error",
                                description: "Failed to load image",
                                variant: "destructive",
                              });
                            }}
                          />
                          {image.description && (
                            <p className="text-sm text-muted-foreground text-center">
                              {image.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Order Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Order ID</Label>
                      <p className="font-mono font-semibold text-sm">{selectedOrder.id}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Status</Label>
                      <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Created Date</Label>
                      <p className="font-semibold">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Repair Price</Label>
                      <p className="font-bold text-primary">
                        {selectedOrder.repair_price 
                          ? `${selectedOrder.repair_price.toLocaleString()} DA`
                          : 'Not set'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Viewer Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Damage Image</DialogTitle>
            {selectedImage?.description && (
              <DialogDescription>{selectedImage.description}</DialogDescription>
            )}
          </DialogHeader>
          {selectedImage && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <img
                  src={selectedImage.image_url}
                  alt={selectedImage.description || 'Damage image'}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                  onError={(e) => {
                    console.error('Image failed to load in modal:', selectedImage.image_url);
                    toast({
                      title: "Image Error",
                      description: "Failed to load image in viewer",
                      variant: "destructive",
                    });
                  }}
                />
              </div>
              <div className="flex justify-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const imageUrl = selectedImage.image_url.startsWith('http') 
                      ? selectedImage.image_url 
                      : `${window.location.origin}${selectedImage.image_url}`;
                    window.open(imageUrl, '_blank');
                  }}
                >
                  Open in New Tab
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const imageUrl = selectedImage.image_url.startsWith('http') 
                      ? selectedImage.image_url 
                      : `${window.location.origin}${selectedImage.image_url}`;
                    const link = document.createElement('a');
                    link.href = imageUrl;
                    link.download = `damage-image-${selectedImage.id}`;
                    link.click();
                  }}
                >
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RepairOrders;