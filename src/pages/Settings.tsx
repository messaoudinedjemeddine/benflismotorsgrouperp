import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  Palette,
  Globe,
  Database,
  Key,
  Trash2
} from "lucide-react";

const Settings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: false,
      desktop: true,
      marketing: false,
    },
    privacy: {
      profileVisible: true,
      activityVisible: false,
      analyticsEnabled: true,
    },
    preferences: {
      language: "en",
      timezone: "UTC-8",
      dateFormat: "MM/DD/YYYY",
    },
  });

  const handleSave = () => {
    toast({
      title: "Paramètres sauvegardés",
      description: "Vos préférences ont été mises à jour avec succès.",
    });
  };

  const handleReset = () => {
    toast({
      title: "Paramètres réinitialisés",
      description: "Tous les paramètres ont été réinitialisés aux valeurs par défaut.",
      variant: "destructive",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Paramètres</h1>
        <p className="text-muted-foreground mt-2">
          Gérez les paramètres de votre compte et les préférences de l'application.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Notifications */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle>Notifications</CardTitle>
              </div>
              <CardDescription>Configurez comment vous recevez les notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Notifications Email</Label>
                  <div className="text-sm text-muted-foreground">
                    Recevoir les notifications par email
                  </div>
                </div>
                <Switch
                  checked={settings.notifications.email}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, email: checked },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Notifications Push</Label>
                  <div className="text-sm text-muted-foreground">
                    Recevoir les notifications push sur votre appareil
                  </div>
                </div>
                <Switch
                  checked={settings.notifications.push}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, push: checked },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Notifications Bureau</Label>
                  <div className="text-sm text-muted-foreground">
                    Afficher les notifications dans votre navigateur
                  </div>
                </div>
                <Switch
                  checked={settings.notifications.desktop}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, desktop: checked },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Emails Marketing</Label>
                  <div className="text-sm text-muted-foreground">
                    Recevoir des mises à jour sur les nouvelles fonctionnalités et offres
                  </div>
                </div>
                <Switch
                  checked={settings.notifications.marketing}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, marketing: checked },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle>Confidentialité et Sécurité</CardTitle>
              </div>
              <CardDescription>Contrôlez vos paramètres de confidentialité et de sécurité</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Profil Public</Label>
                  <div className="text-sm text-muted-foreground">
                    Rendre votre profil visible aux autres utilisateurs
                  </div>
                </div>
                <Switch
                  checked={settings.privacy.profileVisible}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      privacy: { ...settings.privacy, profileVisible: checked },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Statut d'Activité</Label>
                  <div className="text-sm text-muted-foreground">
                    Afficher quand vous êtes en ligne ou actif
                  </div>
                </div>
                <Switch
                  checked={settings.privacy.activityVisible}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      privacy: { ...settings.privacy, activityVisible: checked },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Analytiques</Label>
                  <div className="text-sm text-muted-foreground">
                    Aider à améliorer notre service en partageant les données d'utilisation
                  </div>
                </div>
                <Switch
                  checked={settings.privacy.analyticsEnabled}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      privacy: { ...settings.privacy, analyticsEnabled: checked },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Palette className="h-5 w-5 text-primary" />
                <CardTitle>Préférences</CardTitle>
              </div>
              <CardDescription>Personnalisez votre expérience d'application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="language">Langue</Label>
                  <Select
                    value={settings.preferences.language}
                    onValueChange={(value) =>
                      setSettings({
                        ...settings,
                        preferences: { ...settings.preferences, language: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">Anglais</SelectItem>
                      <SelectItem value="es">Espagnol</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Allemand</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Fuseau Horaire</Label>
                  <Select
                    value={settings.preferences.timezone}
                    onValueChange={(value) =>
                      setSettings({
                        ...settings,
                        preferences: { ...settings.preferences, timezone: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC-8">Heure du Pacifique (UTC-8)</SelectItem>
                      <SelectItem value="UTC-5">Heure de l'Est (UTC-5)</SelectItem>
                      <SelectItem value="UTC+0">UTC</SelectItem>
                      <SelectItem value="UTC+1">Heure d'Europe Centrale (UTC+1)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateFormat">Format de Date</Label>
                <Select
                  value={settings.preferences.dateFormat}
                  onValueChange={(value) =>
                    setSettings({
                      ...settings,
                      preferences: { ...settings.preferences, dateFormat: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Actions Rapides</CardTitle>
              <CardDescription>Tâches de paramètres courantes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleSave} className="w-full bg-gradient-primary">
                Sauvegarder Tous les Paramètres
              </Button>
              <Button onClick={handleReset} variant="outline" className="w-full">
                Réinitialiser aux Valeurs par Défaut
              </Button>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
            <CardTitle>Sécurité</CardTitle>
            <CardDescription>Gérez la sécurité de votre compte</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start">
                <Key className="h-4 w-4 mr-2" />
                Changer le Mot de Passe
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Shield className="h-4 w-4 mr-2" />
                Authentification à Deux Facteurs
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Database className="h-4 w-4 mr-2" />
                Exporter les Données
              </Button>
              <Separator />
              <Button variant="destructive" className="w-full justify-start">
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer le Compte
              </Button>
            </CardContent>
          </Card>

          {/* System Info */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Informations Système</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version</span>
                <span>2.1.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dernière Mise à Jour</span>
                <span>15 Déc 2024</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Statut</span>
                <span className="text-accent">Actif</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;