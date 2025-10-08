import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Ticket } from "lucide-react";

export default function AdminTickets() {
  const { user, userRole, hasRole } = useAuth();
  const queryClient = useQueryClient();

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["admin-tickets", user?.id],
    queryFn: async () => {
      console.log('AdminTickets - Fetching tickets for user:', user);
      console.log('AdminTickets - User role:', userRole);
      console.log('AdminTickets - Has admin access:', hasRole(['sys_admin', 'director']));
      
      // Simple approach: fetch tickets first, then profiles separately
      const { data: tickets, error: ticketsError } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (ticketsError) {
        console.error('AdminTickets - Error fetching tickets:', ticketsError);
        throw ticketsError;
      }

      if (!tickets || tickets.length === 0) {
        return [];
      }

      // Get unique user IDs
      const userIds = [...new Set(tickets.map(ticket => ticket.user_id))];
      
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", userIds);
      
      if (profilesError) {
        console.error('AdminTickets - Error fetching profiles:', profilesError);
        throw profilesError;
      }

      // Join data
      return tickets.map(ticket => ({
        ...ticket,
        profiles: profiles?.find(p => p.user_id === ticket.user_id) || { 
          full_name: 'Unknown User', 
          email: 'unknown@example.com' 
        }
      }));
    },
    enabled: !!user && hasRole(['sys_admin', 'director']),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("support_tickets")
        .update({ status })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Ticket status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
    },
    onError: (error) => {
      toast.error("Failed to update status: " + error.message);
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-blue-500";
      case "in_progress": return "bg-yellow-500";
      case "closed": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500";
      case "medium": return "bg-orange-500";
      case "low": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  // Access control
  if (!user) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Required</h1>
          <p className="text-gray-600">Please log in to access this page.</p>
        </div>
      </div>
    );
  }

  if (!hasRole(['sys_admin', 'director'])) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <div className="text-sm text-gray-500">
            Debug Info: User={user ? 'Yes' : 'No'}, Role={userRole || 'None'}, HasAdmin={hasRole(['sys_admin', 'director']) ? 'Yes' : 'No'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Ticket className="w-8 h-8" />
          <div>
            <h1 className="text-3xl font-bold">Support Tickets Management</h1>
            <p className="text-muted-foreground">View and manage all user support tickets</p>
            <div className="text-sm text-gray-500 mt-2">
              Debug: User={user ? 'Yes' : 'No'}, Role={userRole || 'None'}, HasAdmin={hasRole(['sys_admin', 'director']) ? 'Yes' : 'No'}
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading tickets...</p>
            ) : tickets && tickets.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket: any) => (
                    <TableRow key={ticket.id}>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{ticket.profiles?.full_name || "Unknown"}</div>
                          <div className="text-muted-foreground">{ticket.profiles?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{ticket.subject}</TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate text-sm text-muted-foreground">
                          {ticket.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(ticket.status)}>
                          {ticket.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={ticket.status}
                          onValueChange={(value) => updateStatus.mutate({ id: ticket.id, status: value })}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center py-8 text-muted-foreground">No tickets found</p>
            )}
          </CardContent>
        </Card>
      </div>
  );
}
