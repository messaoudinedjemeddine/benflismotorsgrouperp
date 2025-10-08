import { useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { 
  Home, 
  Package, 
  Wrench,
  UserCheck,
  LogOut,
  Bell,
  BarChart,
  Store,
  Settings,
  UserCog,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/contexts/AuthContext';
import benflisLogo from "@/assets/benflis-black-logo.png";

const DashboardLayout = () => {
  const [notifications] = useState(3);
  const { profile, userRole, signOut, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getNavigationItems = () => {
    const items = [];
    
    // Debug logging
    console.log('DashboardLayout - Current user role:', userRole);
    console.log('DashboardLayout - Profile:', profile);
    console.log('DashboardLayout - Has magasin role:', hasRole(['magasin']));

    // Dashboard - available to all
    items.push({ 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: Home,
      roles: ['sys_admin', 'director', 'cdv', 'commercial', 'magasin', 'apv', 'ged', 'adv', 'livraison', 'immatriculation']
    });

    // Parts Orders Section
    if (hasRole(['sys_admin', 'director', 'magasin'])) {
      items.push({ 
        name: 'Parts Orders', 
        href: '/dashboard/parts-orders', 
        icon: Package,
        roles: ['sys_admin', 'director', 'magasin']
      });
    }

    // Repair Orders Section
    if (hasRole(['sys_admin', 'director', 'apv'])) {
      items.push({ 
        name: 'Repair Orders', 
        href: '/dashboard/repair-orders', 
        icon: Wrench,
        roles: ['sys_admin', 'director', 'apv']
      });
    }

    // Resellers Section
    if (hasRole(['sys_admin', 'director', 'magasin'])) {
      items.push({ 
        name: 'Resellers', 
        href: '/dashboard/resellers', 
        icon: Store,
        roles: ['sys_admin', 'director', 'magasin']
      });
    }

    // VN Dashboard Section
    if (hasRole(['sys_admin', 'director', 'cdv', 'commercial', 'ged', 'adv', 'livraison', 'immatriculation'])) {
      items.push({ 
        name: 'VN Dashboard', 
        href: '/dashboard/vn', 
        icon: BarChart,
        roles: ['sys_admin', 'director', 'cdv', 'commercial', 'ged', 'adv', 'livraison', 'immatriculation']
      });
    }

    // Accessories Section
    if (hasRole(['sys_admin', 'director', 'magasin'])) {
      items.push({ 
        name: 'Accessories', 
        href: '/dashboard/accessories', 
        icon: Settings,
        roles: ['sys_admin', 'director', 'magasin']
      });
    }

    // Accessories Orders Section
    if (hasRole(['sys_admin', 'director', 'cdv', 'commercial'])) {
      items.push({ 
        name: 'Accessories Orders', 
        href: '/dashboard/accessories-orders', 
        icon: Package,
        roles: ['sys_admin', 'director', 'cdv', 'commercial']
      });
    }

    // Orders with Accessories Section
    if (hasRole(['sys_admin', 'director', 'cdv', 'commercial', 'magasin'])) {
      items.push({ 
        name: 'Orders with Accessories', 
        href: '/dashboard/orders-with-accessories', 
        icon: ShoppingCart,
        roles: ['sys_admin', 'director', 'cdv', 'commercial', 'magasin']
      });
    }

    // Support Tickets - available to all authenticated users
    items.push({ 
      name: 'Support Tickets', 
      href: '/dashboard/support-tickets', 
      icon: UserCheck,
      roles: ['sys_admin', 'director', 'cdv', 'commercial', 'magasin', 'apv', 'ged', 'adv', 'livraison', 'immatriculation']
    });

    // Admin Ticket Management
    if (hasRole(['sys_admin', 'director'])) {
      items.push({ 
        name: 'Manage Tickets', 
        href: '/dashboard/admin-tickets', 
        icon: Settings,
        roles: ['sys_admin', 'director']
      });
    }

    // User Management (sys_admin only)
    if (hasRole(['sys_admin'])) {
      items.push({ 
        name: 'User Management', 
        href: '/dashboard/users', 
        icon: UserCog,
        roles: ['sys_admin']
      });
    }

    return items;
  };

  const navigationItems = getNavigationItems();

  const getRoleDisplayName = (role: string) => {
    const roleMap = {
      'sys_admin': 'System Administrator',
      'director': 'Director',
      'cdv': 'CDV',
      'commercial': 'Commercial',
      'magasin': 'Magasin',
      'apv': 'APV',
      'ged': 'GED',
      'adv': 'ADV',
      'livraison': 'Livraison',
      'immatriculation': 'Immatriculation'
    };
    return roleMap[role as keyof typeof roleMap] || role;
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <Sidebar variant="inset" className="bg-sidebar-background border-r border-sidebar-border">
          <SidebarHeader className="border-b border-sidebar-border/50">
            <div className="flex items-center gap-3 px-4 py-4">
              <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm">
                <img src={benflisLogo} alt="Benflis Motors Group" className="w-full h-full object-contain" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-sidebar-foreground">Benflis Motors</span>
                <span className="truncate text-xs text-sidebar-foreground/70">ERP System</span>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent className="px-3">
            <SidebarMenu className="gap-1 py-2">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.href || 
                  (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
                
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild className={`${isActive ? 'bg-primary/90 text-primary-foreground shadow-lg border border-primary/20' : 'text-sidebar-foreground/80 hover:bg-primary/10 hover:text-primary hover:border hover:border-primary/20'} rounded-lg transition-all duration-300`}>
                      <Link to={item.href} className="flex items-center gap-3 px-3 py-2.5">
                        <item.icon className="size-4" />
                        <span className="font-medium">{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="border-t border-sidebar-border/50">
            <div className="px-4 py-3">
              <div className="text-sm mb-3">
                <p className="font-medium text-sidebar-foreground">{profile?.full_name}</p>
                <p className="text-xs text-sidebar-foreground/60">{userRole ? getRoleDisplayName(userRole) : ''}</p>
              </div>
            </div>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleSignOut} className="text-sidebar-foreground/80 hover:bg-destructive/10 hover:text-destructive hover:border hover:border-destructive/20 rounded-lg transition-all duration-300">
                  <LogOut className="size-4" />
                  <span>Sign Out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-gray-600 hover:text-gray-900" />
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-gray-900">Welcome Back</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="relative hover:bg-gray-100">
                <Bell className="size-5 text-gray-600" />
                {notifications > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-orange-500 hover:bg-orange-600">
                    {notifications}
                  </Badge>
                )}
              </Button>
              
              <Avatar className="h-8 w-8 ring-2 ring-orange-500/20">
                <AvatarImage src="" alt="User" />
                <AvatarFallback className="bg-orange-500 text-white text-sm font-medium">
                  {profile?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
          </header>

          <div className="flex-1 overflow-auto p-6 bg-gray-50">
            <div className="animate-fade-in">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;