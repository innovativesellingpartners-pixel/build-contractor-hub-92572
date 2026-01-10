import { useState, useEffect } from 'react';
import { Plus, Users, Mail, Phone, MapPin, Edit2, Trash2, Search, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useGCContacts, GCContact } from '@/hooks/useGCContacts';
import { useCustomers } from '@/hooks/useCustomers';
import {
  BlueBackground,
  SectionHeader,
  InfoCard,
} from './ProvenJobsTheme';

interface ContactsSectionProps {
  onSectionChange?: (section: string) => void;
}

type ContactType = 'all' | 'gc' | 'customer' | 'vendor';

interface Contact {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  type: 'gc' | 'customer' | 'vendor';
  notes?: string;
}

export default function ContactsSection({ onSectionChange }: ContactsSectionProps) {
  const { gcContacts, loading: gcLoading, addGCContact, updateGCContact, deleteGCContact } = useGCContacts();
  const { customers, loading: customersLoading } = useCustomers();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<ContactType>('all');

  // Combine all contacts
  const allContacts: Contact[] = [
    ...gcContacts.map(gc => ({
      id: gc.id,
      name: gc.name,
      company: gc.company,
      email: gc.email,
      phone: gc.phone,
      address: gc.address,
      type: 'gc' as const,
      notes: gc.notes,
    })),
    ...customers.map(c => ({
      id: c.id,
      name: c.name,
      company: c.company,
      email: c.email,
      phone: c.phone,
      address: c.address ? `${c.address}${c.city ? `, ${c.city}` : ''}${c.state ? `, ${c.state}` : ''}` : undefined,
      type: 'customer' as const,
      notes: c.notes,
    })),
  ];

  const filteredContacts = allContacts.filter(contact => {
    const matchesSearch = searchQuery === '' || 
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = activeTab === 'all' || contact.type === activeTab;
    
    return matchesSearch && matchesTab;
  });

  const loading = gcLoading || customersLoading;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'gc': return 'bg-blue-100 text-blue-700';
      case 'customer': return 'bg-green-100 text-green-700';
      case 'vendor': return 'bg-purple-100 text-purple-700';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'gc': return 'GC';
      case 'customer': return 'Customer';
      case 'vendor': return 'Vendor';
      default: return type;
    }
  };

  return (
    <BlueBackground className="min-h-full">
      {/* Header */}
      <div className="bg-sky-600 text-white px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6" />
            <h1 className="text-xl font-bold">Contacts</h1>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ContactType)} className="px-4">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="all">All ({allContacts.length})</TabsTrigger>
          <TabsTrigger value="gc">GCs ({gcContacts.length})</TabsTrigger>
          <TabsTrigger value="customer">Customers ({customers.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* List */}
      <div className="space-y-0 pt-4">
        <SectionHeader>CONTACTS ({filteredContacts.length})</SectionHeader>
        
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : filteredContacts.length === 0 ? (
          <InfoCard className="m-4">
            <div className="p-8 text-center text-muted-foreground">
              {searchQuery ? 'No contacts match your search' : 'No contacts yet'}
            </div>
          </InfoCard>
        ) : (
          filteredContacts.map((contact) => (
            <Card key={`${contact.type}-${contact.id}`} className="mx-4 mb-2 p-4 rounded-lg border">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{contact.name}</h3>
                    <Badge className={getTypeColor(contact.type)} variant="secondary">
                      {getTypeLabel(contact.type)}
                    </Badge>
                  </div>
                  {contact.company && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Building2 className="h-3 w-3" />
                      {contact.company}
                    </p>
                  )}
                  {contact.email && (
                    <p className="text-sm text-sky-600 flex items-center gap-1 mt-1">
                      <Mail className="h-3 w-3" />
                      <a href={`mailto:${contact.email}`}>{contact.email}</a>
                    </p>
                  )}
                  {contact.phone && (
                    <p className="text-sm text-sky-600 flex items-center gap-1 mt-1">
                      <Phone className="h-3 w-3" />
                      <a href={`tel:${contact.phone}`}>{contact.phone}</a>
                    </p>
                  )}
                  {contact.address && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {contact.address}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </BlueBackground>
  );
}
