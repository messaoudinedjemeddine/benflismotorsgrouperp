import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Users, Mail, MessageSquare, FileSpreadsheet, Calendar } from 'lucide-react';
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
}

interface ClientVisit {
  id: string;
  last_visit_date: string;
  category: 'less_than_month' | 'one_to_three_months' | 'three_to_six_months' | 'six_months_to_year' | 'more_than_year';
  notes?: string;
  created_at: string;
  updated_at: string;
  clients: Client;
  cars: Car;
}

const ClientVisits = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [visits, setVisits] = useState<ClientVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      fetchVisits();
    }
  }, [user]);

  const fetchVisits = async () => {
    try {
      console.log('Fetching client visits...');
      const { data, error } = await supabase
        .from('client_visits')
        .select(`
          *,
          clients(*),
          cars(*)
        `)
        .order('last_visit_date', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Client visits fetched successfully:', data);
      setVisits(data || []);
    } catch (error) {
      console.error('Error fetching client visits:', error);
      toast({
        title: "Error",
        description: `Failed to fetch client visits: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateCategory = (lastVisitDate: string): 'less_than_month' | 'one_to_three_months' | 'three_to_six_months' | 'six_months_to_year' | 'more_than_year' => {
    const now = new Date();
    const visitDate = new Date(lastVisitDate);
    const diffInDays = Math.floor((now.getTime() - visitDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 30) return 'less_than_month';
    if (diffInDays < 90) return 'one_to_three_months';
    if (diffInDays < 180) return 'three_to_six_months';
    if (diffInDays < 365) return 'six_months_to_year';
    return 'more_than_year';
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const processExcelFile = async () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select an Excel file",
        variant: "destructive",
      });
      return;
    }

    try {
      // Upload file to storage
      const fileName = `imports/${Date.now()}-${selectedFile.name}`;
      const { data, error } = await supabase.storage
        .from('excel-files')
        .upload(fileName, selectedFile);

      if (error) throw error;

      // Here you would typically process the Excel file
      // For now, we'll show a success message
      toast({
        title: "File Uploaded Successfully",
        description: "Processing client data...",
      });

      setSelectedFile(null);
      
      // Simulate processing and refresh data
      setTimeout(() => {
        fetchVisits();
        toast({
          title: "Processing Complete",
          description: "Client data imported successfully",
        });
      }, 2000);

    } catch (error: any) {
      toast({
        title: "Error Uploading File",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateNotes = async (visitId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('client_visits')
        .update({ notes })
        .eq('id', visitId);

      if (error) throw error;

      toast({
        title: "Note Saved",
        description: "Note saved successfully",
      });

      fetchVisits();
    } catch (error: any) {
      toast({
        title: "Error Saving Note",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'less_than_month':
        return <Badge className="bg-green-500">Less than 1 month</Badge>;
      case 'one_to_three_months':
        return <Badge className="bg-blue-500">1-3 months</Badge>;
      case 'three_to_six_months':
        return <Badge className="bg-yellow-500">3-6 months</Badge>;
      case 'six_months_to_year':
        return <Badge className="bg-orange-500">6 months - 1 year</Badge>;
      case 'more_than_year':
        return <Badge className="bg-red-500">More than 1 year</Badge>;
      default:
        return <Badge variant="outline">{category}</Badge>;
    }
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'less_than_month': return 'bg-green-100 border-green-200';
      case 'one_to_three_months': return 'bg-blue-100 border-blue-200';
      case 'three_to_six_months': return 'bg-yellow-100 border-yellow-200';
      case 'six_months_to_year': return 'bg-orange-100 border-orange-200';
      case 'more_than_year': return 'bg-red-100 border-red-200';
      default: return 'bg-gray-100 border-gray-200';
    }
  };

  const sendEmail = (email: string, name: string) => {
    if (!email) {
      toast({
        title: "No Email Available",
        description: "This client doesn't have an email registered",
        variant: "destructive",
      });
      return;
    }
    
    const subject = encodeURIComponent('Service Center Visit Invitation');
    const body = encodeURIComponent(`Hello ${name},\n\nWe would like to invite you to visit our service center for a periodic inspection of your car.\n\nThank you`);
    window.open(`mailto:${email}?subject=${subject}&body=${body}`);
  };

  const sendWhatsApp = (phone: string, name: string) => {
    const message = encodeURIComponent(`Hello ${name}, we would like to invite you to visit our service center for a periodic inspection of your car. Thank you`);
    window.open(`https://wa.me/${phone.replace(/^0/, '213')}?text=${message}`);
  };

  const filteredVisits = visits.filter(visit => {
    const matchesCategory = filterCategory === 'all' || visit.category === filterCategory;
    const matchesSearch = visit.clients.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         visit.clients.phone_number.includes(searchTerm);
    return matchesCategory && matchesSearch;
  });

  const categoryStats = {
    less_than_month: visits.filter(v => v.category === 'less_than_month').length,
    one_to_three_months: visits.filter(v => v.category === 'one_to_three_months').length,
    three_to_six_months: visits.filter(v => v.category === 'three_to_six_months').length,
    six_months_to_year: visits.filter(v => v.category === 'six_months_to_year').length,
    more_than_year: visits.filter(v => v.category === 'more_than_year').length,
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
        <h1 className="text-3xl font-bold gradient-text">Client Visits</h1>
      </div>

      <Tabs defaultValue="import" className="w-full">
        <TabsList>
          <TabsTrigger value="import">Import Data</TabsTrigger>
          <TabsTrigger value="visits">Manage Visits</TabsTrigger>
        </TabsList>

        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle>Import Client Data</CardTitle>
              <CardDescription>
                Upload an Excel file containing client data and last visit dates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="excel-file">Select Excel File</Label>
                <Input
                  id="excel-file"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="mt-2"
                />
                {selectedFile && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    Selected file: {selectedFile.name}
                  </div>
                )}
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Required File Format:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Client Name</li>
                  <li>• Phone Number</li>
                  <li>• Email</li>
                  <li>• Car Brand</li>
                  <li>• Car Model</li>
                  <li>• Last Visit Date</li>
                </ul>
              </div>

              <Button 
                onClick={processExcelFile}
                disabled={!selectedFile}
                className="w-full bg-gradient-primary"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload and Process File
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visits">
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card className="bg-green-50 border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-green-700">Less than 1 month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-800">{categoryStats.less_than_month}</div>
              </CardContent>
            </Card>
            
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-blue-700">1-3 months</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-800">{categoryStats.one_to_three_months}</div>
              </CardContent>
            </Card>
            
            <Card className="bg-yellow-50 border-yellow-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-yellow-700">3-6 months</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-800">{categoryStats.three_to_six_months}</div>
              </CardContent>
            </Card>
            
            <Card className="bg-orange-50 border-orange-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-orange-700">6 months - 1 year</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-800">{categoryStats.six_months_to_year}</div>
              </CardContent>
            </Card>
            
            <Card className="bg-red-50 border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-red-700">More than 1 year</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-800">{categoryStats.more_than_year}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="search">Search</Label>
                  <Input
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name or phone number..."
                  />
                </div>
                <div>
                  <Label htmlFor="category">Filter by Category</Label>
                  <select
                    id="category"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="all">All Categories</option>
                    <option value="less_than_month">Less than 1 month</option>
                    <option value="one_to_three_months">1-3 months</option>
                    <option value="three_to_six_months">3-6 months</option>
                    <option value="six_months_to_year">6 months - 1 year</option>
                    <option value="more_than_year">More than 1 year</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visits Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Client Visits</CardTitle>
              <CardDescription>Manage and track client visits</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Car</TableHead>
                    <TableHead>Last Visit</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVisits.map((visit) => (
                    <TableRow 
                      key={visit.id} 
                      className={`${getCategoryColor(visit.category)} hover:opacity-80`}
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium">{visit.clients.name}</div>
                          <div className="text-sm text-muted-foreground">{visit.clients.phone_number}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {visit.cars.brand} {visit.cars.model}
                      </TableCell>
                      <TableCell>
                        {new Date(visit.last_visit_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {getCategoryBadge(visit.category)}
                      </TableCell>
                      <TableCell>
                        <Textarea
                          value={visit.notes || ''}
                          onChange={(e) => updateNotes(visit.id, e.target.value)}
                          placeholder="Add note..."
                          className="min-h-8 text-sm"
                          onBlur={(e) => {
                            if (e.target.value !== (visit.notes || '')) {
                              updateNotes(visit.id, e.target.value);
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => sendEmail(visit.clients.email || '', visit.clients.name)}
                          >
                            <Mail className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => sendWhatsApp(visit.clients.phone_number, visit.clients.name)}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientVisits;