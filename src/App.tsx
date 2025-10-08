import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Login from "./pages/Login";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import PartsOrders from "./pages/PartsOrders";
import RepairOrders from "./pages/RepairOrders";
import ClientVisits from "./pages/ClientVisits";
import Resellers from "./pages/Resellers";
import VnDashboard from "./pages/VnDashboard";
import VnOrders from "./pages/VnOrders";
import VnOrderDetail from "./pages/VnOrderDetail";
import VnNewOrder from "./pages/VnNewOrder";
import VnOrderEdit from "./pages/VnOrderEdit";
import VnOrderDocuments from "./pages/VnOrderDocuments";
import Accessories from "./pages/Accessories";
import AccessoriesOrders from "./pages/AccessoriesOrders";
import OrdersWithAccessories from "./pages/OrdersWithAccessories";
import OrderAccessoriesDetail from "./pages/OrderAccessoriesDetail";
import SupportTickets from "./pages/SupportTickets";
import AdminTickets from "./pages/AdminTickets";
import Users from "./pages/Users";
import DebugUserRole from "./pages/DebugUserRole";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="parts-orders" element={
                <ProtectedRoute allowedRoles={['sys_admin', 'director', 'magasin']}>
                  <PartsOrders />
                </ProtectedRoute>
              } />
              <Route path="repair-orders" element={
                <ProtectedRoute allowedRoles={['sys_admin', 'director', 'apv']}>
                  <RepairOrders />
                </ProtectedRoute>
              } />
              <Route path="client-visits" element={
                <ProtectedRoute allowedRoles={['sys_admin', 'director']}>
                  <ClientVisits />
                </ProtectedRoute>
              } />
              <Route path="resellers" element={
                <ProtectedRoute allowedRoles={['sys_admin', 'director', 'magasin']}>
                  <Resellers />
                </ProtectedRoute>
              } />
              <Route path="vn" element={
                <ProtectedRoute allowedRoles={['sys_admin', 'director', 'cdv', 'commercial', 'ged', 'adv', 'livraison', 'immatriculation']}>
                  <VnDashboard />
                </ProtectedRoute>
              } />
              <Route path="vn/orders" element={
                <ProtectedRoute allowedRoles={['sys_admin', 'director', 'cdv', 'commercial', 'ged', 'adv', 'livraison', 'immatriculation']}>
                  <VnOrders />
                </ProtectedRoute>
              } />
              <Route path="vn/orders/new" element={
                <ProtectedRoute allowedRoles={['sys_admin', 'director', 'cdv', 'commercial']}>
                  <VnNewOrder />
                </ProtectedRoute>
              } />
              <Route path="vn/orders/:id" element={
                <ProtectedRoute allowedRoles={['sys_admin', 'director', 'cdv', 'commercial', 'ged', 'adv', 'livraison', 'immatriculation']}>
                  <VnOrderDetail />
                </ProtectedRoute>
              } />
              <Route path="vn/orders/:id/edit" element={
                <ProtectedRoute allowedRoles={['sys_admin', 'director', 'cdv', 'commercial']}>
                  <VnOrderEdit />
                </ProtectedRoute>
              } />
              <Route path="vn/orders/:id/documents" element={
                <ProtectedRoute allowedRoles={['sys_admin', 'director', 'cdv', 'commercial', 'ged', 'adv', 'livraison', 'immatriculation']}>
                  <VnOrderDocuments />
                </ProtectedRoute>
              } />
              <Route path="accessories" element={
                <ProtectedRoute allowedRoles={['sys_admin', 'director', 'magasin']}>
                  <Accessories />
                </ProtectedRoute>
              } />
              <Route path="accessories-orders" element={
                <ProtectedRoute allowedRoles={['sys_admin', 'director', 'cdv', 'commercial']}>
                  <AccessoriesOrders />
                </ProtectedRoute>
              } />
              <Route path="orders-with-accessories" element={
                <ProtectedRoute allowedRoles={['sys_admin', 'director', 'cdv', 'commercial', 'magasin']}>
                  <OrdersWithAccessories />
                </ProtectedRoute>
              } />
              <Route path="orders-with-accessories/:id" element={
                <ProtectedRoute allowedRoles={['sys_admin', 'director', 'cdv', 'commercial', 'magasin']}>
                  <OrderAccessoriesDetail />
                </ProtectedRoute>
              } />
              <Route path="support-tickets" element={
                <ProtectedRoute>
                  <SupportTickets />
                </ProtectedRoute>
              } />
              <Route path="admin-tickets" element={
                <ProtectedRoute allowedRoles={['sys_admin', 'director']}>
                  <AdminTickets />
                </ProtectedRoute>
              } />
              <Route path="users" element={
                <ProtectedRoute allowedRoles={['sys_admin']}>
                  <Users />
                </ProtectedRoute>
              } />
              <Route path="debug-role" element={
                <ProtectedRoute>
                  <DebugUserRole />
                </ProtectedRoute>
              } />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
