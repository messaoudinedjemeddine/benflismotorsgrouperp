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
        title: "Erreur",
        description: `Échec de la récupération des revendeurs : ${error.message}`,
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
        title: "Erreur",
        description: "Le numéro de téléphone doit commencer par 05, 06 ou 07",
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
        title: "Ajouté avec Succès",
        description: "Le nouveau revendeur a été ajouté",
      });

      setShowAddResellerDialog(false);
      setNewReseller({ name: '', email: '', phone: '' });
      fetchResellers();

    } catch (error: any) {
      toast({
        title: "Erreur lors de l'Ajout",
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
        title: "Erreur",
        description: "Veuillez sélectionner un fichier Excel",
        variant: "destructive",
        });
        return;
      }

      if (selectedResellers.length === 0) {
        toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins un revendeur",
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
        title: "Erreur lors du Lancement",
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
        title: "Outlook Ouvert",
        description: `Client email ouvert avec ${selectedResellersData.length} revendeurs. Fichier Excel téléchargé pour pièce jointe.`,
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
              title: "WhatsApp Ouvert",
              description: `WhatsApp ouvert pour le premier revendeur. Vous avez ${selectedResellersData.length - 1} autres revendeurs à contacter.`,
            });
          } else {
            toast({
              title: "WhatsApp Ouvert",
              description: `WhatsApp ouvert avec message pour le revendeur.`,
            });
          }
        }
      }

      // Show success message with reseller details
      let successMessage = `Campagne préparée avec succès !\n`;
      successMessage += `Revendeurs : ${selectedResellersData.length}\n`;
      successMessage += `Communication : ${communicationType}\n`;
      successMessage += `Fichier Excel : ${excelFileUrl}`;

      // If WhatsApp is selected, show reseller phone numbers for manual sending
      if (communicationType === 'whatsapp' || communicationType === 'both') {
        console.log('Reseller phone numbers for manual WhatsApp sending:', phoneNumbers);
        successMessage += `\n\nNuméros de téléphone des revendeurs : ${phoneNumbers}`;
      }

      toast({
        title: "Campagne Prête",
        description: successMessage,
      });

    } catch (error: any) {
      console.error('Campaign preparation error:', error);
      toast({
        title: "Échec de la Préparation",
        description: `Échec de la préparation de la campagne : ${error.message}`,
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
        <h1 className="text-3xl font-bold gradient-text">Gestion des Revendeurs</h1>
        <div className="flex gap-2">
          <Dialog open={showAddResellerDialog} onOpenChange={setShowAddResellerDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <UserPlus className="w-4 h-4 mr-2" />
                Ajouter un Revendeur
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un Nouveau Revendeur</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="resellerName">Nom du Revendeur</Label>
                  <Input
                    id="resellerName"
                    value={newReseller.name}
                    onChange={(e) => setNewReseller(prev => ({...prev, name: e.target.value}))}
                    placeholder="Entrez le nom du revendeur"
                  />
                </div>
                
                <div>
                  <Label htmlFor="resellerEmail">Adresse Email</Label>
                  <Input
                    id="resellerEmail"
                    type="email"
                    value={newReseller.email}
                    onChange={(e) => setNewReseller(prev => ({...prev, email: e.target.value}))}
                    placeholder="exemple@email.com"
                  />
                </div>
                
                <div>
                  <Label htmlFor="resellerPhone">Numéro de Téléphone</Label>
                  <Input
                    id="resellerPhone"
                    value={newReseller.phone}
                    onChange={(e) => setNewReseller(prev => ({...prev, phone: e.target.value}))}
                    placeholder="05xxxxxxxx"
                  />
                </div>
                
                <Button onClick={addReseller} className="w-full bg-gradient-primary">
                  Ajouter le Revendeur
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showPromoDialog} onOpenChange={setShowPromoDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary">
                <Send className="w-4 h-4 mr-2" />
                Lancer une Campagne
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Lancer une Campagne Promotionnelle</DialogTitle>
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
                    <CardTitle>Étape 1 : Télécharger le Fichier Excel</CardTitle>
                    <CardDescription>Choisissez le fichier contenant les produits et offres</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="campaignName">Nom de la Campagne</Label>
                        <Input
                          id="campaignName"
                          value={campaignName}
                          onChange={(e) => setCampaignName(e.target.value)}
                          placeholder="Entrez le nom de la campagne"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="excel-file">Fichier Excel</Label>
                        <Input
                          id="excel-file"
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={handleFileUpload}
                          className="mt-2"
                        />
                        {selectedFile && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            Fichier sélectionné : {selectedFile.name}
                          </div>
                        )}
                      </div>
                      
                      <Button 
                        onClick={() => setPromoStep(2)}
                        disabled={!selectedFile || !campaignName}
                        className="w-full bg-gradient-primary"
                      >
                        Suivant
                      </Button>
                    </CardContent>
                  </Card>
                )}
                
                {/* Step 2: Select Resellers */}
                {promoStep === 2 && (
                  <Card>
                    <CardHeader>
                    <CardTitle>Étape 2 : Sélectionner les Revendeurs</CardTitle>
                    <CardDescription>Choisissez les revendeurs à qui envoyer la campagne</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={selectAllResellers}>
                          Tout Sélectionner
                        </Button>
                        <Button variant="outline" onClick={clearSelection}>
                          Effacer la Sélection
                        </Button>
                        <div className="text-sm text-muted-foreground flex items-center">
                          Sélectionnés : {selectedResellers.length} sur {resellers.length}
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
                          Précédent
                        </Button>
                        <Button 
                          onClick={() => setPromoStep(3)}
                          disabled={selectedResellers.length === 0}
                          className="bg-gradient-primary"
                        >
                          Suivant
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Step 3: Choose Communication Method */}
                {promoStep === 3 && (
                  <Card>
                    <CardHeader>
                    <CardTitle>Étape 3 : Choisir la Méthode de Communication</CardTitle>
                    <CardDescription>Sélectionnez comment envoyer la campagne aux revendeurs</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Méthode de Communication</Label>
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
                              <div className="font-medium">Les Deux</div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="predefinedMessage">Message Pré-défini (Optionnel)</Label>
                        <Textarea
                          id="predefinedMessage"
                          value={predefinedMessage}
                          onChange={(e) => setPredefinedMessage(e.target.value)}
                          placeholder="Entrez un message à inclure avec la campagne..."
                          rows={4}
                        />
                      </div>
                      
                      <div className="bg-muted p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Résumé de la Campagne :</h4>
                        <ul className="text-sm space-y-1">
                          <li><strong>Fichier :</strong> {selectedFile?.name}</li>
                          <li><strong>Nombre de Revendeurs :</strong> {selectedResellers.length}</li>
                          <li><strong>Revendeurs :</strong> {getSelectedResellersNames()}</li>
                          <li><strong>Méthode de Communication :</strong> {
                            communicationType === 'email' ? 'Email' :
                            communicationType === 'whatsapp' ? 'WhatsApp' : 'Email & WhatsApp'
                          }</li>
                        </ul>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setPromoStep(2)}>
                          Précédent
                        </Button>
                        <Button onClick={launchCampaign} className="bg-gradient-primary">
                          Lancer la Campagne
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
          <TabsTrigger value="resellers">Revendeurs</TabsTrigger>
          <TabsTrigger value="campaigns">Historique des Campagnes</TabsTrigger>
        </TabsList>

        <TabsContent value="resellers">
          <Card>
            <CardHeader>
              <CardTitle>Tous les Revendeurs</CardTitle>
              <CardDescription>Gérer la base de données des revendeurs</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Numéro de Téléphone</TableHead>
                    <TableHead>Date d'Ajout</TableHead>
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
                          Modifier
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
              <CardTitle>Historique des Campagnes</CardTitle>
              <CardDescription>Voir toutes les campagnes promotionnelles</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom de la Campagne</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Fichier</TableHead>
                    <TableHead>Nombre de Revendeurs</TableHead>
                    <TableHead>Méthode de Communication</TableHead>
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
                          Voir le Fichier
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