import { useState, useEffect } from 'react';
import { Building2, Mail, Phone, MapPin, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface GCContactWithUser {
  id: string;
  user_id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_name?: string;
}

export function AdminGCContacts() {
  const [gcContacts, setGCContacts] = useState<GCContactWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchGCContacts = async () => {
    setLoading(true);
    try {
      // Fetch all GC contacts
      const { data: contacts, error } = await supabase
        .from('gc_contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get unique user IDs
      const userIds = [...new Set(contacts?.map(c => c.user_id) || [])];

      // Fetch user profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, contact_name, company_name, business_email')
        .in('id', userIds);

      // Merge contacts with user info
      const contactsWithUsers = contacts?.map(contact => {
        const profile = profiles?.find(p => p.id === contact.user_id);
        return {
          ...contact,
          user_email: profile?.business_email,
          user_name: profile?.contact_name || profile?.company_name,
        };
      }) || [];

      setGCContacts(contactsWithUsers);
    } catch (error: any) {
      console.error('Error fetching GC contacts:', error);
      toast.error('Failed to load GC contacts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGCContacts();
  }, []);

  const filteredContacts = gcContacts.filter(gc => {
    const query = searchQuery.toLowerCase();
    return (
      gc.name.toLowerCase().includes(query) ||
      gc.company?.toLowerCase().includes(query) ||
      gc.email?.toLowerCase().includes(query) ||
      gc.user_email?.toLowerCase().includes(query) ||
      gc.user_name?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            GC Contacts
          </h1>
          <p className="text-muted-foreground">
            View all general contractor contacts across all users
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total GC Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{gcContacts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              With Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {gcContacts.filter(gc => gc.email).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unique Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {new Set(gcContacts.map(gc => gc.user_id)).size}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, company, email, or user..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : filteredContacts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {searchQuery ? 'No GC contacts match your search' : 'No GC contacts found'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact Info</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map((gc) => (
                    <TableRow key={gc.id}>
                      <TableCell className="font-medium">{gc.name}</TableCell>
                      <TableCell>
                        {gc.company ? (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            {gc.company}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {gc.email && (
                            <p className="text-sm flex items-center gap-1">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <a href={`mailto:${gc.email}`} className="text-primary hover:underline">
                                {gc.email}
                              </a>
                            </p>
                          )}
                          {gc.phone && (
                            <p className="text-sm flex items-center gap-1">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <a href={`tel:${gc.phone}`} className="text-primary hover:underline">
                                {gc.phone}
                              </a>
                            </p>
                          )}
                          {!gc.email && !gc.phone && (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            {gc.user_name || gc.user_email || 'Unknown'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(gc.created_at), 'MMM d, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
