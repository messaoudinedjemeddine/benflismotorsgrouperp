import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Users, 
  Eye, 
  Clock,
  Globe,
  Smartphone
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";

const Analytics = () => {
  const trafficData = [
    { date: "Jan 1", sessions: 1240, pageviews: 3420, users: 820 },
    { date: "Jan 2", sessions: 1180, pageviews: 3200, users: 780 },
    { date: "Jan 3", sessions: 1320, pageviews: 3680, users: 920 },
    { date: "Jan 4", sessions: 1450, pageviews: 4100, users: 1050 },
    { date: "Jan 5", sessions: 1680, pageviews: 4650, users: 1200 },
    { date: "Jan 6", sessions: 1520, pageviews: 4200, users: 1100 },
    { date: "Jan 7", sessions: 1750, pageviews: 4850, users: 1280 },
  ];

  const sourceData = [
    { source: "Organic Search", visitors: 45, color: "hsl(var(--primary))" },
    { source: "Direct", visitors: 25, color: "hsl(var(--accent))" },
    { source: "Social Media", visitors: 15, color: "hsl(var(--warning))" },
    { source: "Referral", visitors: 10, color: "hsl(var(--muted-foreground))" },
    { source: "Email", visitors: 5, color: "hsl(var(--destructive))" },
  ];

  const deviceData = [
    { device: "Desktop", sessions: 2340, percentage: 65 },
    { device: "Mobile", sessions: 1260, percentage: 35 },
    { device: "Tablet", sessions: 200, percentage: 5 },
  ];

  const topPages = [
    { page: "/dashboard", views: 12580, bounce: "23%", time: "4:32" },
    { page: "/analytics", views: 8420, bounce: "18%", time: "6:15" },
    { page: "/profile", views: 6240, bounce: "35%", time: "2:48" },
    { page: "/settings", views: 4180, bounce: "42%", time: "3:22" },
    { page: "/login", views: 3850, bounce: "65%", time: "1:15" },
  ];

  const metrics = [
    {
      title: "Sessions Totales",
      value: "48,592",
      change: "+12.5%",
      icon: Eye,
    },
    {
      title: "Utilisateurs Uniques",
      value: "23,847",
      change: "+8.2%",
      icon: Users,
    },
    {
      title: "Durée Moyenne de Session",
      value: "4m 32s",
      change: "+15.3%",
      icon: Clock,
    },
    {
      title: "Taux de Rebond",
      value: "24.8%",
      change: "-3.1%",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytiques</h1>
        <p className="text-muted-foreground mt-2">
          Aperçus détaillés sur les performances de votre site web et le comportement des utilisateurs.
        </p>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          const isPositive = metric.change.startsWith('+');
          
          return (
            <Card key={index} className="border-border/50 bg-card/50 backdrop-blur-sm animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{metric.value}</span>
                  <Badge variant={isPositive ? "default" : "destructive"} className={isPositive ? "bg-accent text-accent-foreground" : ""}>
                    {metric.change}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Analytics tabs */}
      <Tabs defaultValue="traffic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
          <TabsTrigger value="traffic">Trafic</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="devices">Appareils</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
        </TabsList>

        <TabsContent value="traffic" className="space-y-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Trafic du Site Web</CardTitle>
              <CardDescription>Sessions, pages vues et utilisateurs dans le temps</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={trafficData}>
                  <defs>
                    <linearGradient id="sessions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="pageviews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sessions"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#sessions)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="pageviews"
                    stroke="hsl(var(--accent))"
                    fillOpacity={1}
                    fill="url(#pageviews)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Sources de Trafic</CardTitle>
                <CardDescription>D'où viennent vos visiteurs</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={sourceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="visitors"
                      label={({ name, value }) => `${name}: ${value}%`}
                      labelLine={false}
                    >
                      {sourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Répartition des Sources</CardTitle>
                <CardDescription>Métriques détaillées des sources de trafic</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {sourceData.map((source, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: source.color }}
                      />
                      <span className="text-sm font-medium">{source.source}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold">{source.visitors}%</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="devices" className="space-y-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Utilisation des Appareils</CardTitle>
              <CardDescription>Sessions par type d'appareil</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={deviceData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis 
                    dataKey="device" 
                    type="category" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    width={80}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                  />
                  <Bar 
                    dataKey="sessions" 
                    fill="hsl(var(--primary))" 
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pages" className="space-y-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Pages Principales</CardTitle>
              <CardDescription>Pages les plus visitées de votre site</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topPages.map((page, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted/20 border border-border/50">
                    <div className="flex-1">
                      <p className="font-medium">{page.page}</p>
                      <p className="text-sm text-muted-foreground">{page.views.toLocaleString()} views</p>
                    </div>
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="text-center">
                        <p className="text-muted-foreground">Taux de Rebond</p>
                        <p className="font-medium">{page.bounce}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">Temps Moyen</p>
                        <p className="font-medium">{page.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;