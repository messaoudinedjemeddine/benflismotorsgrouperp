import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Check, Circle, AlertCircle, Upload, Calendar, Eye, FileText, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { useVnOrderStageAccess } from "@/hooks/useVnOrderStageAccess";

type OrderStatus = "INSCRIPTION" | "PROFORMA" | "COMMANDE" | "VALIDATION" | "ACCUSÉ" | "FACTURATION" | "ARRIVAGE" | "CARTE_JAUNE" | "LIVRAISON" | "DOSSIER_DAIRA";

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_id_number: string;
  customer_address: string;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_vin: string;
  vehicle_color: string;
  vehicle_avaries: string;
  vehicle_features: string[];
  total_price: number;
  advance_payment: number;
  remaining_balance: number;
  trop_percu: number;
  invoice_number: string;
  payment_status: string;
  status: OrderStatus;
  location: string;
  created_at: string;
  stage_completion_dates: any;
}

const orderStages = [
  { name: "INSCRIPTION", label: "Inscription", icon: "📝", color: "bg-gray-500" },
  { name: "PROFORMA", label: "Proforma", icon: "📄", color: "bg-blue-500" },
  { name: "COMMANDE", label: "Commande", icon: "🛒", color: "bg-yellow-500" },
  { name: "VALIDATION", label: "Validation", icon: "✅", color: "bg-purple-500" },
  { name: "ACCUSÉ", label: "Accusé", icon: "📬", color: "bg-indigo-500" },
  { name: "FACTURATION", label: "Facturation", icon: "💰", color: "bg-pink-500" },
  { name: "ARRIVAGE", label: "Arrivage", icon: "🚢", color: "bg-orange-500" },
  { name: "CARTE_JAUNE", label: "Carte Jaune", icon: "🟨", color: "bg-yellow-600" },
  { name: "LIVRAISON", label: "Livraison", icon: "🚚", color: "bg-green-500" },
  { name: "DOSSIER_DAIRA", label: "Dossier Daira", icon: "📁", color: "bg-emerald-600" },
];

const VnOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { canAccessStage, canCompleteAnyStage, canBypassStageValidation } = useVnOrderStageAccess();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [stageData, setStageData] = useState<Record<string, any>>({});
  const [documents, setDocuments] = useState<Record<string, any[]>>({});

  useEffect(() => {
    if (id && user) {
      fetchOrder();
      fetchDocuments();
    }
  }, [id, user]);

  const fetchOrder = async () => {
    try {
      const { data, error } = await supabase
        .from("vn_orders")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setOrder(data);
      
      // Load existing stage data from the order
      if (data.stage_completion_dates) {
        const loadedStageData: Record<string, any> = {};
        Object.keys(data.stage_completion_dates).forEach(stage => {
          const stageInfo = data.stage_completion_dates[stage];
          if (stageInfo && stageInfo.data) {
            loadedStageData[stage] = stageInfo.data;
          }
        });
        setStageData(loadedStageData);
        console.log("Loaded stage data:", loadedStageData);
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from("vn_order_documents")
        .select("*")
        .eq("order_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      console.log("Fetched documents:", data);

      // Group documents by stage - map document types to stage names
      const groupedDocs: Record<string, any[]> = {};
      (data || []).forEach(doc => {
        // Map document types to stage names
        let stageName = '';
        switch(doc.document_type) {
          case 'PROFORMA_INVOICE':
            stageName = 'proforma';
            break;
          case 'PURCHASE_ORDER':
            stageName = 'commande';
            break;
          case 'CUSTOMER_ID':
            stageName = 'validation';
            break;
          case 'DELIVERY_NOTE':
            stageName = 'livraison';
            break;
          case 'FINAL_INVOICE':
            stageName = 'facturation';
            break;
          case 'OTHER':
            // Try to determine stage from file name or use a default
            if (doc.document_name.toLowerCase().includes('proforma')) {
              stageName = 'proforma';
            } else if (doc.document_name.toLowerCase().includes('commande')) {
              stageName = 'commande';
            } else if (doc.document_name.toLowerCase().includes('validation')) {
              stageName = 'validation';
            } else if (doc.document_name.toLowerCase().includes('accusé') || doc.document_name.toLowerCase().includes('accuse')) {
              stageName = 'accusé';
            } else if (doc.document_name.toLowerCase().includes('arrivage')) {
              stageName = 'arrivage';
            } else if (doc.document_name.toLowerCase().includes('carte') || doc.document_name.toLowerCase().includes('jaune')) {
              stageName = 'carte_jaune';
            } else if (doc.document_name.toLowerCase().includes('livraison')) {
              stageName = 'livraison';
            } else if (doc.document_name.toLowerCase().includes('daira')) {
              stageName = 'dossier_daira';
            } else {
              stageName = 'other';
            }
            break;
          default:
            stageName = 'other';
        }

        if (!groupedDocs[stageName]) {
          groupedDocs[stageName] = [];
        }
        groupedDocs[stageName].push(doc);
      });

      console.log("Grouped documents:", groupedDocs);
      setDocuments(groupedDocs);
    } catch (error: any) {
      console.error("Error fetching documents:", error);
    }
  };

  const uploadDocument = async (file: File, documentType: string, stageName: string) => {
    try {
      // Validate file type
      const allowedTypes = ['pdf', 'png', 'jpg', 'jpeg'];
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      
      if (!fileExt || !allowedTypes.includes(fileExt)) {
        toast({
        title: "Type de fichier invalide",
        description: "Seuls les fichiers PDF, PNG, JPG et JPEG sont autorisés",
          variant: "destructive",
        });
        return false;
      }

      const fileName = `${id}/${stageName}/${documentType}_${Date.now()}.${fileExt}`;
      
      console.log("Uploading file:", fileName);
      console.log("File size:", file.size, "bytes");
      console.log("File type:", file.type);
      
      // Use a simple approach - try to create the bucket first, then upload
      let bucketName = 'vn-order-documents';
      let publicUrl = null;

      try {
        // First, try to create the bucket if it doesn't exist
        const { error: createBucketError } = await supabase.storage.createBucket('vn-order-documents', {
          public: true,
          allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'],
          fileSizeLimit: 52428800 // 50MB
        });
        
        if (createBucketError) {
          console.log("Bucket creation failed (might already exist):", createBucketError);
        } else {
          console.log("Bucket created successfully");
        }
      } catch (error) {
        console.log("Bucket creation attempt failed:", error);
      }

      // Now try to upload
      const { error: uploadError } = await supabase.storage
        .from('vn-order-documents')
        .upload(fileName, file);

      if (uploadError) {
        console.log("vn-order-documents bucket failed:", uploadError);
        
        // Fallback: Use a different approach - store file data in database
        console.log("Falling back to database storage...");
        
        // Convert file to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        
        const base64Data = await base64Promise;
        
        // Store in database with file data
        const { error: dbError } = await supabase.from('vn_order_documents').insert([{
          order_id: id as string,
          document_type: 'OTHER' as any,
          document_name: file.name,
          document_url: base64Data, // Store as base64 data URL
          uploaded_by: (await supabase.auth.getUser()).data.user?.id
        }]);
        
        if (dbError) {
          console.error("Database storage failed:", dbError);
          throw dbError;
        }
        
        console.log("File stored in database as base64");
        publicUrl = base64Data; // Use base64 data as URL
        bucketName = 'database';
        
      } else {
        const { data: { publicUrl: url } } = supabase.storage
          .from('vn-order-documents')
          .getPublicUrl(fileName);
        publicUrl = url;
        console.log("Successfully uploaded to vn-order-documents bucket");
      }

      const { data: userData } = await supabase.auth.getUser();
      
      // Map document types to database enum values
      let dbDocumentType = 'OTHER';
      switch(documentType) {
        case 'proforma':
          dbDocumentType = 'PROFORMA_INVOICE';
          break;
        case 'purchase_order':
          dbDocumentType = 'PURCHASE_ORDER';
          break;
        case 'validation':
          dbDocumentType = 'CUSTOMER_ID';
          break;
        case 'acknowledgement':
          dbDocumentType = 'OTHER';
          break;
        case 'route_sheet':
          dbDocumentType = 'OTHER';
          break;
        case 'invoice_scan':
          dbDocumentType = 'FINAL_INVOICE';
          break;
        case 'yellow_card':
          dbDocumentType = 'OTHER';
          break;
        case 'delivery_note':
          dbDocumentType = 'DELIVERY_NOTE';
          break;
        case 'daira_document':
          dbDocumentType = 'OTHER';
          break;
        default:
          dbDocumentType = 'OTHER';
      }
      
      const { error: insertError } = await supabase.from('vn_order_documents').insert([{
        order_id: id as string,
        document_type: dbDocumentType as any,
        document_name: file.name,
        document_url: publicUrl,
        uploaded_by: userData.user?.id
      }]);

      if (insertError) {
        console.error("Insert error:", insertError);
        throw insertError;
      }

      console.log("Document uploaded successfully:", publicUrl);

      toast({
        title: "Succès",
        description: "Document téléchargé avec succès",
      });

      // Refresh documents list
      await fetchDocuments();
      return true;
    } catch (error: any) {
      console.error("Upload failed:", error);
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const updateStageData = (stage: string, field: string, value: any) => {
    const newStageData = {
      ...stageData[stage],
      [field]: value
    };
    
    setStageData(prev => ({
      ...prev,
      [stage]: newStageData
    }));
    
    // Auto-save stage data
    saveStageDataImmediately(stage, newStageData);
  };

  const saveStageDataImmediately = async (stageName: string, data: any) => {
    try {
      const newStageData = {
        ...order?.stage_completion_dates,
        [stageName]: {
          ...order?.stage_completion_dates?.[stageName],
          data: data
        }
      };

      const { error } = await supabase
        .from("vn_orders")
        .update({ stage_completion_dates: newStageData })
        .eq("id", id);

      if (error) {
        console.error("Error saving stage data:", error);
      } else {
        console.log("Stage data saved:", stageName, data);
      }
    } catch (error: any) {
      console.error("Error saving stage data:", error);
    }
  };

  const saveStageData = async (stageName: string, data: any) => {
    try {
      const updates: any = {};
      
      // Save specific fields to main table columns (only for fields that exist)
      if (stageName === "FACTURATION") {
        if (data.vehicle_vin) updates.vehicle_vin = data.vehicle_vin;
        if (data.tropPercuAmount !== undefined) updates.trop_percu = data.tropPercuAmount;
      }
      
      if (stageName === "ARRIVAGE") {
        if (data.location) updates.location = data.location;
        if (data.avariesNote !== undefined) updates.vehicle_avaries = data.avariesNote;
        if (data.position) updates.position = data.position;
      }

      // Save stage data to JSONB column
      const newStageData = {
        ...order?.stage_completion_dates,
        [stageName]: {
          ...order?.stage_completion_dates?.[stageName],
          data: data
        }
      };
      updates.stage_completion_dates = newStageData;

      const { error } = await supabase
        .from("vn_orders")
        .update(updates)
        .eq("id", id);

      if (error) {
        console.error("Error saving stage data:", error);
        throw error;
      }
      
      console.log(`Stage data saved for ${stageName}:`, data);
    } catch (error: any) {
      console.error("Error saving stage data:", error);
      toast({
        title: "Erreur",
        description: `Failed to save ${stageName} data: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const canCompleteStage = (stageName: string): boolean => {
    // Admin override: sys_admin and director can complete any stage
    if (canBypassStageValidation()) {
      return true;
    }

    const data = stageData[stageName] || {};
    
    switch(stageName) {
      case "INSCRIPTION":
        return !!data.callResult;
      case "PROFORMA":
      case "COMMANDE":
      case "VALIDATION":
      case "ACCUSÉ":
        return !!data.documentUploaded;
      case "FACTURATION":
        return !!order?.vehicle_vin && data.tropPercu !== undefined;
      case "ARRIVAGE":
        return !!data.documentUploaded && data.avaries !== undefined && !!data.location;
      case "CARTE_JAUNE":
        return !!data.scanFacture && !!data.carteJaune;
      case "LIVRAISON":
        return !!data.documentUploaded && !!data.deliveryDate;
      case "DOSSIER_DAIRA":
        return !!data.documentUploaded;
      default:
        return false;
    }
  };

  const completeStage = async (currentStageIndex: number) => {
    if (!canCompleteStage(orderStages[currentStageIndex].name)) {
      toast({
        title: "Impossible de terminer l'étape",
        description: "Veuillez remplir toutes les informations requises",
        variant: "destructive",
      });
      return;
    }

    const nextStage = orderStages[currentStageIndex + 1];
    if (!nextStage) return;

    try {
      const updates: any = { status: nextStage.name };
      
      // Save all stage data based on current stage
      const currentStageName = orderStages[currentStageIndex].name;
      const currentStageData = stageData[currentStageName] || {};
      
      // Update specific fields based on stage (only for columns that exist)
      if (currentStageName === "FACTURATION") {
        if (order?.vehicle_vin) updates.vehicle_vin = order.vehicle_vin;
        if (currentStageData.tropPercuAmount !== undefined) updates.trop_percu = currentStageData.tropPercuAmount;
      }
      
      if (currentStageName === "ARRIVAGE") {
        if (currentStageData.location) updates.location = currentStageData.location;
        if (currentStageData.avariesNote) updates.vehicle_avaries = currentStageData.avariesNote;
        if (currentStageData.position) updates.position = currentStageData.position;
      }

      // Save stage completion data
      const newStageData = {
        ...order?.stage_completion_dates,
        [currentStageName]: {
          completed_at: new Date().toISOString(),
          data: currentStageData
        }
      };
      updates.stage_completion_dates = newStageData;

      const { error } = await supabase
        .from("vn_orders")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: `Étape ${orderStages[currentStageIndex].label} terminée et données sauvegardées`,
      });

      fetchOrder();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateCompletionDate = async (stage: string, date: Date) => {
    try {
      const newDates = {
        ...order?.stage_completion_dates,
        [stage]: date.toISOString()
      };

      const { error } = await supabase
        .from("vn_orders")
        .update({ stage_completion_dates: newDates })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Date de fin mise à jour",
      });

      fetchOrder();
    } catch (error: any) {
      toast({
        title: "Erreur",
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

  const getRequiredDocuments = (stageName: string): string[] => {
    switch(stageName) {
      case "PROFORMA": return ["Proforma Invoice"];
      case "COMMANDE": return ["Purchase Order"];
      case "VALIDATION": return ["Validation Certificate"];
      case "ACCUSÉ": return ["Acknowledgement Receipt"];
      case "ARRIVAGE": return ["Route Sheet"];
      case "CARTE_JAUNE": return ["Invoice Scan", "Yellow Card"];
      case "LIVRAISON": return ["Delivery Note"];
      case "DOSSIER_DAIRA": return ["Document Scan"];
      default: return [];
    }
  };

  const ViewDocumentsDialog = ({ stageName, documents }: { stageName: string, documents: any[] }) => {
    // Map stage names to document keys
    let stageKey = '';
    switch(stageName.toLowerCase()) {
      case 'proforma':
        stageKey = 'proforma';
        break;
      case 'commande':
        stageKey = 'commande';
        break;
      case 'validation':
        stageKey = 'validation';
        break;
      case 'accusé':
        stageKey = 'accusé';
        break;
      case 'facturation':
        stageKey = 'facturation';
        break;
      case 'arrivage':
        stageKey = 'arrivage';
        break;
      case 'carte_jaune':
        stageKey = 'carte_jaune';
        break;
      case 'livraison':
        stageKey = 'livraison';
        break;
      case 'dossier_daira':
        stageKey = 'dossier_daira';
        break;
      default:
        stageKey = stageName.toLowerCase();
    }
    
    const stageDocs = documents[stageKey] || [];
    console.log(`Documents for ${stageName} (${stageKey}):`, stageDocs);
    
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            <Eye className="h-4 w-4 mr-2" />
            Voir les documents ({stageDocs.length})
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Documents pour l'étape {stageName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {stageDocs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Aucun document téléchargé pour le moment</p>
            ) : (
              stageDocs.map((doc, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-8 w-8 text-blue-500" />
                        <div>
                          <p className="font-medium">{doc.document_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(doc.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (doc.document_url.startsWith('data:')) {
                              // Base64 data URL - open directly
                              window.open(doc.document_url, '_blank');
                            } else {
                              // Regular URL - open in new tab
                              window.open(doc.document_url, '_blank');
                            }
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Voir
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (doc.document_url.startsWith('data:')) {
                              // Base64 data URL - download directly
                              const link = document.createElement('a');
                              link.href = doc.document_url;
                              link.download = doc.document_name;
                              link.click();
                            } else {
                              // Regular URL - download via link
                              const link = document.createElement('a');
                              link.href = doc.document_url;
                              link.download = doc.document_name;
                              link.click();
                            }
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Télécharger
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const renderStageContent = (stage: typeof orderStages[0], index: number) => {
    const isCurrent = index === currentStageIndex;
    const isCompleted = index < currentStageIndex;
    const hasAccess = canAccessStage(stage.name as any);

    if (!hasAccess) {
      return (
        <Card className="ml-16 mb-6 opacity-50">
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">Vous n'avez pas accès à cette étape</p>
          </CardContent>
        </Card>
      );
    }

    // Always show stage content for admin users or if it's the current stage
    if (!canBypassStageValidation() && !isCurrent && !isCompleted) {
      return null;
    }

    return (
      <Card className="ml-16 mb-6">
        <CardContent className="pt-6 space-y-4">
          {/* INSCRIPTION */}
          {stage.name === "INSCRIPTION" && (
            <div className="space-y-4">
              <div>
                <Label>Résultat de l'appel</Label>
                <Select
                  value={stageData.INSCRIPTION?.callResult}
                  onValueChange={async (value) => {
                    updateStageData("INSCRIPTION", "callResult", value);
                    await saveStageData("INSCRIPTION", { ...stageData.INSCRIPTION, callResult: value });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le résultat de l'appel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="injoignable">Injoignable</SelectItem>
                    <SelectItem value="ok_pour_venir">OK pour venir</SelectItem>
                    <SelectItem value="hesitant">Hésitant</SelectItem>
                    <SelectItem value="faux_numero">Faux numéro</SelectItem>
                    <SelectItem value="pas_pret">Pas prêt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* PROFORMA */}
          {stage.name === "PROFORMA" && (
            <div className="space-y-4">
              <div>
                <Label>Télécharger la facture proforma</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const success = await uploadDocument(file, "proforma", stage.name);
                        if (success) updateStageData(stage.name, "documentUploaded", true);
                      }
                    }}
                    className="flex-1"
                  />
                  <ViewDocumentsDialog stageName={stage.name} documents={documents} />
                </div>
              </div>
            </div>
          )}

          {/* COMMANDE */}
          {stage.name === "COMMANDE" && (
            <div className="space-y-4">
              <div>
                <Label>Télécharger le bon de commande</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const success = await uploadDocument(file, "purchase_order", stage.name);
                        if (success) updateStageData(stage.name, "documentUploaded", true);
                      }
                    }}
                    className="flex-1"
                  />
                  <ViewDocumentsDialog stageName={stage.name} documents={documents} />
                </div>
              </div>
            </div>
          )}

          {/* VALIDATION */}
          {stage.name === "VALIDATION" && (
            <div className="space-y-4">
              <div>
                <Label>Télécharger le certificat de validation</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const success = await uploadDocument(file, "validation", stage.name);
                        if (success) updateStageData(stage.name, "documentUploaded", true);
                      }
                    }}
                    className="flex-1"
                  />
                  <ViewDocumentsDialog stageName={stage.name} documents={documents} />
                </div>
              </div>
            </div>
          )}

          {/* ACCUSÉ */}
          {stage.name === "ACCUSÉ" && (
            <div className="space-y-4">
              <div>
                <Label>Télécharger le reçu d'accusé de réception</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const success = await uploadDocument(file, "acknowledgement", stage.name);
                        if (success) updateStageData(stage.name, "documentUploaded", true);
                      }
                    }}
                    className="flex-1"
                  />
                  <ViewDocumentsDialog stageName={stage.name} documents={documents} />
                </div>
              </div>
            </div>
          )}

          {/* FACTURATION */}
          {stage.name === "FACTURATION" && (
            <div className="space-y-4">
              <div>
                <Label>Numéro VIN</Label>
                <Input
                  value={order?.vehicle_vin || ""}
                  onChange={async (e) => {
                    setOrder(prev => prev ? {...prev, vehicle_vin: e.target.value} : null);
                    await saveStageData("FACTURATION", { 
                      ...stageData.FACTURATION, 
                      vehicle_vin: e.target.value 
                    });
                  }}
                  placeholder="Saisir le VIN"
                />
              </div>
              <div>
                <Label>Trop Perçu</Label>
                <RadioGroup
                  value={stageData.FACTURATION?.tropPercu}
                  onValueChange={async (value) => {
                    updateStageData("FACTURATION", "tropPercu", value);
                    await saveStageData("FACTURATION", { 
                      ...stageData.FACTURATION, 
                      tropPercu: value 
                    });
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="non" id="trop-non" />
                    <Label htmlFor="trop-non">NON</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="oui" id="trop-oui" />
                    <Label htmlFor="trop-oui">OUI</Label>
                  </div>
                </RadioGroup>
              </div>
              {stageData.FACTURATION?.tropPercu === "oui" && (
                <div>
                  <Label>Montant Trop Perçu (DZD)</Label>
                  <Input
                    type="number"
                    value={stageData.FACTURATION?.tropPercuAmount || ""}
                    onChange={async (e) => {
                      const value = parseFloat(e.target.value);
                      updateStageData("FACTURATION", "tropPercuAmount", value);
                      await saveStageData("FACTURATION", { 
                        ...stageData.FACTURATION, 
                        tropPercuAmount: value 
                      });
                    }}
                    placeholder="Saisir le montant"
                  />
                </div>
              )}
            </div>
          )}

          {/* ARRIVAGE */}
          {stage.name === "ARRIVAGE" && (
            <div className="space-y-4">
              <div>
                <Label>Télécharger la feuille de route</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const success = await uploadDocument(file, "route_sheet", stage.name);
                        if (success) updateStageData(stage.name, "documentUploaded", true);
                      }
                    }}
                    className="flex-1"
                  />
                  <ViewDocumentsDialog stageName={stage.name} documents={documents} />
                </div>
              </div>
              <div>
                <Label>Avaries</Label>
                <RadioGroup
                  value={stageData.ARRIVAGE?.avaries}
                  onValueChange={(value) => updateStageData("ARRIVAGE", "avaries", value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ras" id="avaries-ras" />
                    <Label htmlFor="avaries-ras">RAS</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="oui" id="avaries-oui" />
                    <Label htmlFor="avaries-oui">OUI</Label>
                  </div>
                </RadioGroup>
              </div>
              {stageData.ARRIVAGE?.avaries === "oui" && (
                <div>
                  <Label>Note sur les avaries</Label>
                  <Textarea
                    value={stageData.ARRIVAGE?.avariesNote || ""}
                    onChange={(e) => updateStageData("ARRIVAGE", "avariesNote", e.target.value)}
                    placeholder="Décrire les dommages"
                  />
                </div>
              )}
              <div>
                <Label>Emplacement</Label>
                <Select
                  value={stageData.ARRIVAGE?.location}
                  onValueChange={(value) => updateStageData("ARRIVAGE", "location", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner l'emplacement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PARC1">PARC1</SelectItem>
                    <SelectItem value="PARC2">PARC2</SelectItem>
                    <SelectItem value="SHOWROOM">SHOWROOM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Position (Optionnel)</Label>
                <Input
                  value={stageData.ARRIVAGE?.position || ""}
                  onChange={(e) => updateStageData("ARRIVAGE", "position", e.target.value)}
                  placeholder="ex. A1, B13"
                />
              </div>
            </div>
          )}

          {/* CARTE_JAUNE */}
          {stage.name === "CARTE_JAUNE" && (
            <div className="space-y-4">
              <div>
                <Label>Télécharger le scan de facture</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const success = await uploadDocument(file, "invoice_scan", stage.name);
                        if (success) updateStageData(stage.name, "scanFacture", true);
                      }
                    }}
                    className="flex-1"
                  />
                  <ViewDocumentsDialog stageName={stage.name} documents={documents} />
                </div>
              </div>
              <div>
                <Label>Télécharger la carte jaune</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const success = await uploadDocument(file, "yellow_card", stage.name);
                        if (success) updateStageData(stage.name, "carteJaune", true);
                      }
                    }}
                    className="flex-1"
                  />
                  <ViewDocumentsDialog stageName={stage.name} documents={documents} />
                </div>
              </div>
            </div>
          )}

          {/* LIVRAISON */}
          {stage.name === "LIVRAISON" && (
            <div className="space-y-4">
              <div>
                <Label>Télécharger le bon de livraison</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const success = await uploadDocument(file, "delivery_note", stage.name);
                        if (success) updateStageData(stage.name, "documentUploaded", true);
                      }
                    }}
                    className="flex-1"
                  />
                  <ViewDocumentsDialog stageName={stage.name} documents={documents} />
                </div>
              </div>
              <div>
                <Label>Date de livraison provisoire</Label>
                <Input
                  type="date"
                  value={stageData.LIVRAISON?.deliveryDate || ""}
                  onChange={(e) => updateStageData("LIVRAISON", "deliveryDate", e.target.value)}
                />
              </div>
            </div>
          )}

          {/* DOSSIER_DAIRA */}
          {stage.name === "DOSSIER_DAIRA" && (
            <div className="space-y-4">
              <div>
                <Label>Télécharger le scan du document</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const success = await uploadDocument(file, "daira_document", stage.name);
                        if (success) updateStageData(stage.name, "documentUploaded", true);
                      }
                    }}
                    className="flex-1"
                  />
                  <ViewDocumentsDialog stageName={stage.name} documents={documents} />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const currentStageIndex = orderStages.findIndex((s) => s.name === order?.status);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;
  }

  if (!order) {
    return <div className="flex items-center justify-center min-h-screen">Commande non trouvée</div>;
  }

  return (
    <TooltipProvider>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/vn/orders")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h2 className="text-3xl font-bold tracking-tight">Détails de la commande</h2>
            <p className="text-muted-foreground">{order.order_number}</p>
            {canBypassStageValidation() && (
              <p className="text-sm text-blue-600 font-medium">🔧 Mode Admin : Accès complet aux étapes activé</p>
            )}
          </div>
          <Button variant="outline" onClick={() => navigate(`/dashboard/vn/orders/${id}/edit`)}>
            Modifier la commande
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Client</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{order.customer_name}</p>
                <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Véhicule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">
                  {order.vehicle_brand} {order.vehicle_model}
                </p>
                <p className="text-sm text-muted-foreground">
                  {order.vehicle_color} • {order.vehicle_year}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Financier</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-xl font-bold">{formatCurrency(order.total_price)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Restant</p>
                  <p className="text-lg text-orange-600">
                    {formatCurrency(order.remaining_balance)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vertical Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Progrès de la commande</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {orderStages.map((stage, index) => {
                const isCompleted = index < currentStageIndex;
                const isCurrent = index === currentStageIndex;
                const stageCompletionData = order.stage_completion_dates?.[stage.name];
                const completionDate = stageCompletionData?.completed_at || stageCompletionData;
                const isLast = index === orderStages.length - 1;
                const requiredDocs = getRequiredDocuments(stage.name);

                return (
                  <div key={stage.name}>
                    <div className="flex items-start gap-4 relative">
                      {/* Vertical Line */}
                      {!isLast && (
                        <div 
                          className={`absolute left-6 top-12 w-0.5 transition-all ${
                            isCompleted ? 'bg-green-500' : 'bg-border'
                          }`}
                          style={{ height: isCurrent ? 'calc(100% + 300px)' : 'calc(100% + 24px)' }}
                        />
                      )}
                      
                      {/* Circle */}
                      <div
                        className={`relative z-10 w-12 h-12 rounded-full border-4 flex items-center justify-center transition-all flex-shrink-0 ${
                          isCompleted
                            ? "bg-green-500 border-green-500"
                            : isCurrent
                            ? "bg-primary border-primary animate-pulse"
                            : "bg-background border-border"
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="h-6 w-6 text-white" />
                        ) : isCurrent ? (
                          <Circle className="h-6 w-6 text-white fill-white" />
                        ) : (
                          <Circle className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      
                      {/* Stage Info */}
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2">
                          <div className={`font-medium text-lg ${isCompleted || isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {stage.label}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => completeStage(index)}
                              disabled={isCompleted || !canCompleteStage(stage.name) || (!canBypassStageValidation() && index === orderStages.length - 1)}
                              className="h-8"
                              variant={canBypassStageValidation() ? "default" : "outline"}
                            >
                              {isCompleted ? 'Terminé' : canBypassStageValidation() ? 'Terminer (Admin)' : 'Terminer'}
                            </Button>
                              {requiredDocs.length > 0 && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <AlertCircle className="h-5 w-5 text-orange-500" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="space-y-1">
                                      <p className="font-semibold">Documents requis :</p>
                                      {requiredDocs.map((doc, i) => (
                                        <p key={i} className="text-sm">• {doc}</p>
                                      ))}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                        </div>
                        {completionDate && (() => {
                          try {
                            const date = new Date(completionDate);
                            if (isNaN(date.getTime())) {
                              return null; // Invalid date, don't show
                            }
                            return (
                              <div className="text-xs text-muted-foreground mt-1">
                                Terminé le : {date.toLocaleDateString()}
                              </div>
                            );
                          } catch (error) {
                            return null; // Error parsing date, don't show
                          }
                        })()}
                      </div>
                    </div>
                    
                    {/* Stage Content */}
                    {renderStageContent(stage, index)}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};

export default VnOrderDetail;
