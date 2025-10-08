import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DebugUserRole = () => {
  const { user, userRole, profile } = useAuth();
  const [userRoles, setUserRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserRoles();
    }
  }, [user]);

  const fetchUserRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error fetching user roles:', error);
      } else {
        setUserRoles(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const assignSysAdminRole = async () => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: user?.id,
          role: 'sys_admin'
        });

      if (error) {
        console.error('Error assigning role:', error);
        alert('Error: ' + error.message);
      } else {
        alert('sys_admin role assigned successfully!');
        fetchUserRoles();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error: ' + error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Debug User Role</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Current User Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <strong>User ID:</strong> {user?.id}
          </div>
          <div>
            <strong>Email:</strong> {user?.email}
          </div>
          <div>
            <strong>Profile Name:</strong> {profile?.full_name}
          </div>
          <div>
            <strong>Current Role (from context):</strong> {userRole || 'None'}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User Roles in Database</CardTitle>
        </CardHeader>
        <CardContent>
          {userRoles.length === 0 ? (
            <p>No roles found in database</p>
          ) : (
            <div className="space-y-2">
              {userRoles.map((role, index) => (
                <div key={index} className="p-2 bg-gray-100 rounded">
                  <strong>Role:</strong> {role.role} | <strong>Created:</strong> {new Date(role.created_at).toLocaleString()}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <button 
            onClick={assignSysAdminRole}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Assign sys_admin Role
          </button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DebugUserRole;
