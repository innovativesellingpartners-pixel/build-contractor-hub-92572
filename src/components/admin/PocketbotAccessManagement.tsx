import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Bot, Search, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface UserAccess {
  id: string;
  user_id: string;
  company_name: string | null;
  contact_name: string | null;
  subscription_tier: string | null;
  pocketbot_full_access: boolean;
  pocketbot_access_type: string | null;
}

export const PocketAgentAccessManagement = () => {
  const [users, setUsers] = useState<UserAccess[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredUsers(
        users.filter(
          (user) =>
            user.company_name?.toLowerCase().includes(term) ||
            user.contact_name?.toLowerCase().includes(term) ||
            user.user_id.toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, company_name, contact_name, subscription_tier, pocketbot_full_access, pocketbot_access_type')
        .order('company_name');

      if (error) throw error;
      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (error: any) {
      toast.error('Failed to load users: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const setAccessType = async (userId: string, accessType: string) => {
    setUpdating(userId);
    try {
      const isFull = accessType !== 'none';
      const { error } = await supabase
        .from('profiles')
        .update({ pocketbot_access_type: accessType, pocketbot_full_access: isFull })
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(
        users.map((user) =>
          user.user_id === userId
            ? { ...user, pocketbot_access_type: accessType, pocketbot_full_access: isFull }
            : user
        )
      );

      const labels: Record<string, string> = { none: 'revoked', free_full: 'granted (free)', paid: 'granted (paid $20/mo)' };
      toast.success(`Pocket Agent access ${labels[accessType] || 'updated'} successfully`);
    } catch (error: any) {
      toast.error('Failed to update access: ' + error.message);
    } finally {
      setUpdating(null);
    }
  };

  const grantAccessToAll = async () => {
    if (!confirm('Grant Pocket Agent access to ALL users? This action cannot be undone easily.')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ pocketbot_full_access: true })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all

      if (error) throw error;

      toast.success('Pocket Agent access granted to all users');
      fetchUsers();
    } catch (error: any) {
      toast.error('Failed to grant access: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Pocket Agent Access Management
            </CardTitle>
            <CardDescription>
              Manage which users have full access to CT1 Pocket Agent
            </CardDescription>
          </div>
          <Button onClick={grantAccessToAll} variant="outline" size="sm">
            Grant Access to All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by company name, contact, or user ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={fetchUsers} variant="outline" size="sm">
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company/Contact</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Access Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {user.company_name || 'No Company Name'}
                          </div>
                          {user.contact_name && (
                            <div className="text-sm text-muted-foreground">
                              {user.contact_name}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground font-mono mt-1">
                            {user.user_id.slice(0, 8)}...
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.subscription_tier ? (
                          <Badge variant="secondary" className="capitalize">
                            {user.subscription_tier}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">No subscription</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {user.pocketbot_full_access ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                Full Access
                              </span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                Limited Access
                              </span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Switch
                            checked={user.pocketbot_full_access}
                            onCheckedChange={() =>
                              toggleAccess(user.user_id, user.pocketbot_full_access)
                            }
                            disabled={updating === user.user_id}
                          />
                          {updating === user.user_id && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Automatic Access Rules
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Users with active subscriptions automatically receive full Pocket Agent access</li>
            <li>• Access can be manually granted or revoked using the toggles above</li>
            <li>• Changes take effect immediately for the user's next session</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
