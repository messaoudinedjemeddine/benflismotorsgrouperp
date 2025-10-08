import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Settings, Users, Store, BarChart3, Calendar, ArrowRight, Activity } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  partsOrders: {
    total: number;
    ready: number;
    notReady: number;
    canceled: number;
    totalValue: number;
  };
  repairOrders: {
    total: number;
    priceSet: number;
    priceNotSet: number;
    totalValue: number;
  };
  clientVisits: {
    total: number;
    lessThanMonth: number;
    moreThanYear: number;
  };
  resellers: {
    total: number;
  };
}

const Dashboard = () => {
  const { profile, userRole, hasRole } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    partsOrders: { total: 0, ready: 0, notReady: 0, canceled: 0, totalValue: 0 },
    repairOrders: { total: 0, priceSet: 0, priceNotSet: 0, totalValue: 0 },
    clientVisits: { total: 0, lessThanMonth: 0, moreThanYear: 0 },
    resellers: { total: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, [profile]);

  const fetchDashboardStats = async () => {
    try {
      const promises = [];

      // Fetch parts orders if user has access
      if (hasRole(['sys_admin', 'director', 'magasin'])) {
        promises.push(
          supabase
            .from('parts_orders')
            .select('status, total_amount')
        );
      } else {
        promises.push(Promise.resolve({ data: [] }));
      }

      // Fetch repair orders if user has access
      if (hasRole(['sys_admin', 'director', 'apv'])) {
        promises.push(
          supabase
            .from('repair_orders')
            .select('status, repair_price')
        );
      } else {
        promises.push(Promise.resolve({ data: [] }));
      }

      // Fetch client visits if user has access
      if (hasRole(['sys_admin', 'director'])) {
        promises.push(
          supabase
            .from('client_visits')
            .select('category')
        );
      } else {
        promises.push(Promise.resolve({ data: [] }));
      }

      // Fetch resellers if user has access
      if (hasRole(['sys_admin', 'director', 'magasin'])) {
        promises.push(
          supabase
            .from('resellers')
            .select('id')
        );
      } else {
        promises.push(Promise.resolve({ data: [] }));
      }

      const [partsResult, repairResult, visitsResult, resellersResult] = await Promise.all(promises);

      // Process parts orders stats
      const partsOrders = partsResult.data || [];
      const partsStats = {
        total: partsOrders.length,
        ready: partsOrders.filter((o: any) => o.status === 'ready').length,
        notReady: partsOrders.filter((o: any) => o.status === 'not_ready').length,
        canceled: partsOrders.filter((o: any) => o.status === 'canceled').length,
        totalValue: partsOrders.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0)
      };

      // Process repair orders stats
      const repairOrders = repairResult.data || [];
      const repairStats = {
        total: repairOrders.length,
        priceSet: repairOrders.filter((o: any) => o.status === 'price_set').length,
        priceNotSet: repairOrders.filter((o: any) => o.status === 'price_not_set').length,
        totalValue: repairOrders.reduce((sum: number, o: any) => sum + (o.repair_price || 0), 0)
      };

      // Process client visits stats
      const clientVisits = visitsResult.data || [];
      const visitsStats = {
        total: clientVisits.length,
        lessThanMonth: clientVisits.filter((v: any) => v.category === 'less_than_month').length,
        moreThanYear: clientVisits.filter((v: any) => v.category === 'more_than_year').length
      };

      // Process resellers stats
      const resellers = resellersResult.data || [];
      const resellersStats = {
        total: resellers.length
      };

      setStats({
        partsOrders: partsStats,
        repairOrders: repairStats,
        clientVisits: visitsStats,
        resellers: resellersStats
      });

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap = {
      'admin': 'System Administrator',
      'parts_employee': 'Parts Employee',
      'repair_creator': 'Repair Creator',
      'repair_pricer': 'Repair Pricer',
      'visit_manager': 'Visit Manager',
      'reseller_manager': 'Reseller Manager'
    };
    return roleMap[role as keyof typeof roleMap] || role;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center animate-pulse">
          <div className="w-8 h-8 bg-orange-500 rounded-full animate-bounce mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}!
            </h1>
            <p className="text-gray-600 flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
              {userRole ? getRoleDisplayName(userRole) : 'User'} • Benflis Motors Group ERP
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Today</p>
            <p className="text-lg font-semibold text-gray-900">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Modern Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Parts Orders Stats */}
        {hasRole(['sys_admin', 'director', 'magasin']) && (
          <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <Card className="card-blue card-hover h-40">
              <CardContent className="p-6 h-full flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <ShoppingBag className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">{stats.partsOrders.total}</p>
                    <p className="text-white/80 text-sm">Parts Orders</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-white/90 text-sm">
                  <span>Ready: {stats.partsOrders.ready}</span>
                  <span>Pending: {stats.partsOrders.notReady}</span>
                </div>
                <div className="text-white/80 text-xs">
                  {stats.partsOrders.totalValue.toLocaleString()} DA
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Repair Orders Stats */}
        {hasRole(['sys_admin', 'director', 'apv']) && (
          <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Card className="card-green card-hover h-40">
              <CardContent className="p-6 h-full flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Settings className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">{stats.repairOrders.total}</p>
                    <p className="text-white/80 text-sm">Repair Orders</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-white/90 text-sm">
                  <span>Priced: {stats.repairOrders.priceSet}</span>
                  <span>Pending: {stats.repairOrders.priceNotSet}</span>
                </div>
                <div className="text-white/80 text-xs">
                  {stats.repairOrders.totalValue.toLocaleString()} DA
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Client Visits Stats */}
        {hasRole(['sys_admin', 'director']) && (
          <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <Card className="card-coral card-hover h-40">
              <CardContent className="p-6 h-full flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">{stats.clientVisits.total}</p>
                    <p className="text-white/80 text-sm">Client Visits</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-white/90 text-sm">
                  <span>Recent: {stats.clientVisits.lessThanMonth}</span>
                  <span>Old: {stats.clientVisits.moreThanYear}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Resellers Stats */}
        {hasRole(['sys_admin', 'director', 'magasin']) && (
          <div className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <Card className="card-primary card-hover h-40">
              <CardContent className="p-6 h-full flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Store className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">{stats.resellers.total}</p>
                    <p className="text-white/80 text-sm">Active Resellers</p>
                  </div>
                </div>
                <div className="text-white/80 text-xs">
                  Total registered partners
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="animate-slide-up" style={{ animationDelay: '0.5s' }}>
        <h2 className="text-2xl font-bold text-foreground mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {hasRole(['sys_admin', 'director', 'magasin']) && (
            <Link to="/dashboard/parts-orders">
              <Card className="interactive-card group h-32">
                <CardContent className="p-6 h-full flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                      <ShoppingBag className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">Parts Orders</h3>
                      <p className="text-sm text-muted-foreground">Manage inventory</p>
                    </div>
                  </div>
                  <div className="flex items-center text-xs text-blue-600 font-medium group-hover:text-blue-700">
                    Open Module
                    <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}

          {hasRole(['sys_admin', 'director', 'apv']) && (
            <Link to="/dashboard/repair-orders">
              <Card className="interactive-card group h-32">
                <CardContent className="p-6 h-full flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                      <Settings className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">Repair Orders</h3>
                      <p className="text-sm text-muted-foreground">Vehicle repairs</p>
                    </div>
                  </div>
                  <div className="flex items-center text-xs text-green-600 font-medium group-hover:text-green-700">
                    Open Module
                    <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}

          {hasRole(['sys_admin', 'director']) && (
            <Link to="/dashboard/client-visits">
              <Card className="interactive-card group h-32">
                <CardContent className="p-6 h-full flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                      <Calendar className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">Client Visits</h3>
                      <p className="text-sm text-muted-foreground">Visit tracking</p>
                    </div>
                  </div>
                  <div className="flex items-center text-xs text-purple-600 font-medium group-hover:text-purple-700">
                    Open Module
                    <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}

          {hasRole(['sys_admin', 'director', 'magasin']) && (
            <Link to="/dashboard/resellers">
              <Card className="interactive-card group h-32">
                <CardContent className="p-6 h-full flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                      <Store className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">Resellers</h3>
                      <p className="text-sm text-muted-foreground">Partner network</p>
                    </div>
                  </div>
                  <div className="flex items-center text-xs text-orange-600 font-medium group-hover:text-orange-700">
                    Open Module
                    <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}
        </div>
      </div>

      {/* System Status */}
      <div className="animate-slide-up" style={{ animationDelay: '0.6s' }}>
        <Card className="card-modern">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-foreground" />
              <CardTitle className="text-lg">System Status</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-foreground">Database</p>
                  <p className="text-sm text-muted-foreground">Connected & Running</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-foreground">Authentication</p>
                  <p className="text-sm text-muted-foreground">Active & Secure</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-foreground">File Storage</p>
                  <p className="text-sm text-muted-foreground">Operational</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;