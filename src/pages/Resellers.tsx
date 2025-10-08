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
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Upload, Send, History, Mail, MessageSquare, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Reseller {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  created_at: string;
}

interface PromoCampaign {
  id: string;
  campaign_name: string;
  excel_file_url: string;
  communication_type: 'email' | 'whatsapp' | 'both';
  predefined_message?: string;
  created_at: string;
  campaign_resellers: {
    resellers: Reseller;
  }[];
}

const Resellers = () => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [campaigns, setCampaigns] = useState<PromoCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddResellerDialog, setShowAddResellerDialog] = useState(false);
  const [showPromoDialog, setShowPromoDialog] = useState(false);

  // Add reseller form state
  const [newReseller, setNewReseller] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // Promo campaign state
  const [promoStep, setPromoStep] = useState(1);
  const [selectedResellers, setSelectedResellers] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [communicationType, setCommunicationType] = useState<'email' | 'whatsapp' | 'both'>('email');
  const [campaignName, setCampaignName] = useState('');
  const [predefinedMessage, setPredefinedMessage] = useState('');

  useEffect(() => {
    if (profile) {
      fetchResellers();
      fetchCampaigns();
    }
  }, [profile]);

  const fetchResellers = async () => {
    try {
      console.log('Fetching resellers...');
      const { data, error } = await supabase
        .from('resellers')
        .select('*')
        .order('name');

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Resellers fetched successfully:', data);
      setResellers(data || []);
    } catch (error) {
      console.error('Error fetching resellers:', error);
      toast({
        title: "Error",
        description: `Failed to fetch resellers: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('promo_campaigns')
        .select(`
          *,
          campaign_resellers(
            resellers(*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  const validateAlgerianPhone = (phone: string): boolean => {
    return /^0[567][0-9]{8}$/.test(phone);
  };

  const addReseller = async () => {
    try {
      if (!validateAlgerianPhone(newReseller.phone)) {
        toast({
          title: "Error",
          description: "Phone number must start with 05, 06, or 07",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('resellers')
        .insert({
          name: newReseller.name,
          email: newReseller.email,
          phone_number: newReseller.phone
        });

      if (error) throw error;

      toast({
        title: "Successfully Added",
        description: "New reseller has been added",
      });

      setShowAddResellerDialog(false);
      setNewReseller({ name: '', email: '', phone: '' });
      fetchResellers();

    } catch (error: any) {
      toast({
        title: "Error Adding Reseller",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const toggleResellerSelection = (resellerId: string) => {
    setSelectedResellers(prev => 
      prev.includes(resellerId)
        ? prev.filter(id => id !== resellerId)
        : [...prev, resellerId]
    );
  };

  const selectAllResellers = () => {
    setSelectedResellers(resellers.map(r => r.id));
  };

  const clearSelection = () => {
    setSelectedResellers([]);
  };

  const launchCampaign = async () => {
    try {
      if (!selectedFile) {
        toast({
          title: "Error",
          description: "Please select an Excel file",
          variant: "destructive",
        });
        return;
      }

      if (selectedResellers.length === 0) {
        toast({
          title: "Error",
          description: "Please select at least one reseller",
          variant: "destructive",
        });
        return;
      }

      // Upload Excel file
      const fileName = `campaigns/${Date.now()}-${selectedFile.name}`;
      const { data: fileData, error: fileError } = await supabase.storage
        .from('excel-files')
        .upload(fileName, selectedFile);

      if (fileError) throw fileError;

      const { data: publicUrl } = supabase.storage
        .from('excel-files')
        .getPublicUrl(fileName);

      // Create campaign
      const { data: campaignData, error: campaignError } = await supabase
        .from('promo_campaigns')
        .insert({
          employee_id: profile?.user_id || '',
          campaign_name: campaignName,
          excel_file_url: publicUrl.publicUrl,
          communication_type: communicationType,
          predefined_message: predefinedMessage || null
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Link resellers to campaign
      const campaignResellersData = selectedResellers.map(resellerId => ({
        campaign_id: campaignData.id,
        reseller_id: resellerId
      }));

      const { error: linkError } = await supabase
        .from('campaign_resellers')
        .insert(campaignResellersData);

      if (linkError) throw linkError;

      // Send the actual campaign
      await sendCampaignMessages(campaignData.id, selectedResellers, publicUrl.publicUrl);

      // Reset form
      setShowPromoDialog(false);
      setPromoStep(1);
      setSelectedResellers([]);
      setSelectedFile(null);
      setCommunicationType('email');
      setCampaignName('');
      setPredefinedMessage('');
      
      fetchCampaigns();

    } catch (error: any) {
      toast({
        title: "Error Launching Campaign",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const sendCampaignMessages = async (campaignId: string, resellerIds: string[], excelFileUrl: string) => {
    try {
      console.log('Preparing campaign for local email/WhatsApp clients...');
      
      // Get selected resellers data
      const selectedResellersData = resellers.filter(reseller => 
        resellerIds.includes(reseller.id)
      );

      if (selectedResellersData.length === 0) {
        throw new Error("No resellers selected");
      }

      // Create email and WhatsApp URLs
      const emailAddresses = selectedResellersData.map(reseller => reseller.email).join(', ');
      const phoneNumbers = selectedResellersData.map(reseller => reseller.phone_number).join(', ');

      // Create email subject and body
      const emailSubject = `Campaign: ${campaignName}`;
      const emailBody = `${predefinedMessage}\n\nExcel file: ${excelFileUrl}`;
      
      // Create mailto URL for Outlook
      const mailtoUrl = `mailto:${emailAddresses}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      
      // Create WhatsApp URL
      const whatsappMessage = `${predefinedMessage}\n\nExcel file: ${excelFileUrl}`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

      // Open email client (Outlook)
      if (communicationType === 'email' || communicationType === 'both') {
        console.log('Opening Outlook with campaign data...');
        
        // Download Excel file for easy attachment
        try {
          const link = document.createElement('a');
          link.href = excelFileUrl;
          link.download = `campaign-${campaignName}-${Date.now()}.xlsx`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (downloadError) {
          console.warn('Could not auto-download file:', downloadError);
        }
        
        // Open email client
        window.open(mailtoUrl, '_blank');
        
        toast({
          title: "Outlook Opened",
          description: `Email client opened with ${selectedResellersData.length} resellers. Excel file downloaded for attachment.`,
        });
      }

      // Open WhatsApp
      if (communicationType === 'whatsapp' || communicationType === 'both') {
        console.log('Opening WhatsApp with campaign data...');
        
        // For WhatsApp, we'll open the first contact and show instructions for others
        if (selectedResellersData.length > 0) {
          const firstReseller = selectedResellersData[0];
          const firstWhatsappUrl = `https://wa.me/${firstReseller.phone_number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappMessage)}`;
          window.open(firstWhatsappUrl, '_blank');
          
          if (selectedResellersData.length > 1) {
            toast({
              title: "WhatsApp Opened",
              description: `WhatsApp opened for first reseller. You have ${selectedResellersData.length - 1} more resellers to contact.`,
            });
          } else {
            toast({
              title: "WhatsApp Opened",
              description: `WhatsApp opened with message for the reseller.`,
            });
          }
        }
      }

      // Show success message with reseller details
      let successMessage = `Campaign prepared successfully!\n`;
      successMessage += `Resellers: ${selectedResellersData.length}\n`;
      successMessage += `Communication: ${communicationType}\n`;
      successMessage += `Excel file: ${excelFileUrl}`;

      // If WhatsApp is selected, show reseller phone numbers for manual sending
      if (communicationType === 'whatsapp' || communicationType === 'both') {
        console.log('Reseller phone numbers for manual WhatsApp sending:', phoneNumbers);
        successMessage += `\n\nReseller phone numbers: ${phoneNumbers}`;
      }

      toast({
        title: "Campaign Ready",
        description: successMessage,
      });

    } catch (error: any) {
      console.error('Campaign preparation error:', error);
      toast({
        title: "Campaign Preparation Failed",
        description: `Failed to prepare campaign: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const getCommunicationTypeBadge = (type: string) => {
    switch (type) {
      case 'email':
        return <Badge className="bg-blue-500">Email</Badge>;
      case 'whatsapp':
        return <Badge className="bg-green-500">WhatsApp</Badge>;
      case 'both':
        return <Badge className="bg-purple-500">Email & WhatsApp</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getSelectedResellersNames = () => {
    return resellers
      .filter(r => selectedResellers.includes(r.id))
      .map(r => r.name)
      .join(', ');
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
        <h1 className="text-3xl font-bold gradient-text">Reseller Management</h1>
        <div className="flex gap-2">
          <Dialog open={showAddResellerDialog} onOpenChange={setShowAddResellerDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Reseller
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Reseller</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="resellerName">Reseller Name</Label>
                  <Input
                    id="resellerName"
                    value={newReseller.name}
                    onChange={(e) => setNewReseller(prev => ({...prev, name: e.target.value}))}
                    placeholder="Enter reseller name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="resellerEmail">Email Address</Label>
                  <Input
                    id="resellerEmail"
                    type="email"
                    value={newReseller.email}
                    onChange={(e) => setNewReseller(prev => ({...prev, email: e.target.value}))}
                    placeholder="example@email.com"
                  />
                </div>
                
                <div>
                  <Label htmlFor="resellerPhone">Phone Number</Label>
                  <Input
                    id="resellerPhone"
                    value={newReseller.phone}
                    onChange={(e) => setNewReseller(prev => ({...prev, phone: e.target.value}))}
                    placeholder="05xxxxxxxx"
                  />
                </div>
                
                <Button onClick={addReseller} className="w-full bg-gradient-primary">
                  Add Reseller
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showPromoDialog} onOpenChange={setShowPromoDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary">
                <Send className="w-4 h-4 mr-2" />
                Launch Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Launch Promotional Campaign</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Step Indicator */}
                <div className="flex items-center justify-center space-x-4">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                        ${promoStep >= step ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}
                      `}>
                        {step}
                      </div>
                      {step < 3 && <div className="w-12 h-0.5 bg-muted mx-2" />}
                    </div>
                  ))}
                </div>
                
                {/* Step 1: Upload Excel File */}
                {promoStep === 1 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Step 1: Upload Excel File</CardTitle>
                      <CardDescription>Choose the file containing products and offers</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="campaignName">Campaign Name</Label>
                        <Input
                          id="campaignName"
                          value={campaignName}
                          onChange={(e) => setCampaignName(e.target.value)}
                          placeholder="Enter campaign name"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="excel-file">Excel File</Label>
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
                      
                      <Button 
                        onClick={() => setPromoStep(2)}
                        disabled={!selectedFile || !campaignName}
                        className="w-full bg-gradient-primary"
                      >
                        Next
                      </Button>
                    </CardContent>
                  </Card>
                )}
                
                {/* Step 2: Select Resellers */}
                {promoStep === 2 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Step 2: Select Resellers</CardTitle>
                      <CardDescription>Choose resellers to send the campaign to</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={selectAllResellers}>
                          Select All
                        </Button>
                        <Button variant="outline" onClick={clearSelection}>
                          Clear Selection
                        </Button>
                        <div className="text-sm text-muted-foreground flex items-center">
                          Selected: {selectedResellers.length} of {resellers.length}
                        </div>
                      </div>
                      
                      <div className="max-h-60 overflow-y-auto border rounded-lg p-4">
                        {resellers.map((reseller) => (
                          <div key={reseller.id} className="flex items-center space-x-2 py-2">
                            <Checkbox
                              id={`reseller-${reseller.id}`}
                              checked={selectedResellers.includes(reseller.id)}
                              onCheckedChange={() => toggleResellerSelection(reseller.id)}
                            />
                            <Label htmlFor={`reseller-${reseller.id}`} className="flex-1 cursor-pointer">
                              <div className="font-medium">{reseller.name}</div>
                              <div className="text-sm text-muted-foreground">{reseller.email}</div>
                            </Label>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setPromoStep(1)}>
                          Previous
                        </Button>
                        <Button 
                          onClick={() => setPromoStep(3)}
                          disabled={selectedResellers.length === 0}
                          className="bg-gradient-primary"
                        >
                          Next
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Step 3: Choose Communication Method */}
                {promoStep === 3 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Step 3: Choose Communication Method</CardTitle>
                      <CardDescription>Select how to send the campaign to resellers</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Communication Method</Label>
                        <div className="grid grid-cols-3 gap-4 mt-2">
                          <Card 
                            className={`cursor-pointer transition-colors ${communicationType === 'email' ? 'border-primary bg-primary/10' : ''}`}
                            onClick={() => setCommunicationType('email')}
                          >
                            <CardContent className="p-4 text-center">
                              <Mail className="w-8 h-8 mx-auto mb-2" />
                              <div className="font-medium">Email</div>
                            </CardContent>
                          </Card>
                          
                          <Card 
                            className={`cursor-pointer transition-colors ${communicationType === 'whatsapp' ? 'border-primary bg-primary/10' : ''}`}
                            onClick={() => setCommunicationType('whatsapp')}
                          >
                            <CardContent className="p-4 text-center">
                              <MessageSquare className="w-8 h-8 mx-auto mb-2" />
                              <div className="font-medium">WhatsApp</div>
                            </CardContent>
                          </Card>
                          
                          <Card 
                            className={`cursor-pointer transition-colors ${communicationType === 'both' ? 'border-primary bg-primary/10' : ''}`}
                            onClick={() => setCommunicationType('both')}
                          >
                            <CardContent className="p-4 text-center">
                              <div className="flex justify-center mb-2">
                                <Mail className="w-6 h-6 mr-1" />
                                <MessageSquare className="w-6 h-6" />
                              </div>
                              <div className="font-medium">Both</div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="predefinedMessage">Predefined Message (Optional)</Label>
                        <Textarea
                          id="predefinedMessage"
                          value={predefinedMessage}
                          onChange={(e) => setPredefinedMessage(e.target.value)}
                          placeholder="Enter a message to include with the campaign..."
                          rows={4}
                        />
                      </div>
                      
                      <div className="bg-muted p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Campaign Summary:</h4>
                        <ul className="text-sm space-y-1">
                          <li><strong>File:</strong> {selectedFile?.name}</li>
                          <li><strong>Number of Resellers:</strong> {selectedResellers.length}</li>
                          <li><strong>Resellers:</strong> {getSelectedResellersNames()}</li>
                          <li><strong>Communication Method:</strong> {
                            communicationType === 'email' ? 'Email' :
                            communicationType === 'whatsapp' ? 'WhatsApp' : 'Email & WhatsApp'
                          }</li>
                        </ul>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setPromoStep(2)}>
                          Previous
                        </Button>
                        <Button onClick={launchCampaign} className="bg-gradient-primary">
                          Launch Campaign
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="resellers" className="space-y-6">
        <TabsList>
          <TabsTrigger value="resellers">Resellers</TabsTrigger>
          <TabsTrigger value="campaigns">Campaign History</TabsTrigger>
        </TabsList>

        <TabsContent value="resellers">
          <Card>
            <CardHeader>
              <CardTitle>All Resellers</CardTitle>
              <CardDescription>Manage reseller database</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Date Added</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resellers.map((reseller) => (
                    <TableRow key={reseller.id}>
                      <TableCell className="font-medium">{reseller.name}</TableCell>
                      <TableCell>{reseller.email}</TableCell>
                      <TableCell>{reseller.phone_number}</TableCell>
                      <TableCell>
                        {new Date(reseller.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>Campaign History</CardTitle>
              <CardDescription>View all promotional campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Number of Resellers</TableHead>
                    <TableHead>Communication Method</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.campaign_name}</TableCell>
                      <TableCell>
                        {new Date(campaign.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="link" 
                          className="p-0 h-auto"
                          onClick={() => window.open(campaign.excel_file_url, '_blank')}
                        >
                          <Upload className="w-4 h-4 mr-1" />
                          View File
                        </Button>
                      </TableCell>
                      <TableCell>{campaign.campaign_resellers?.length || 0}</TableCell>
                      <TableCell>
                        {getCommunicationTypeBadge(campaign.communication_type)}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <History className="w-4 h-4" />
                        </Button>
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

export default Resellers;