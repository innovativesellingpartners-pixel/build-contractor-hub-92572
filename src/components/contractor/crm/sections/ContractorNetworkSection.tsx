import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CrmNavHeader } from '../CrmNavHeader';
import { Search, Building2, MapPin, Briefcase, Send, Loader2, Users, ArrowLeft, X, MessageSquare, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ContractorProfile {
  id: string;
  company_name: string | null;
  contact_name: string | null;
  trade: string | null;
  city: string | null;
  state: string | null;
  network_bio: string | null;
  logo_url: string | null;
  website_url: string | null;
}

type Section = 'dashboard' | 'leads' | 'jobs' | 'customers' | 'estimates' | 'reporting' | 'financials' | 'calls' | 'calendar' | 'emails' | 'payments' | 'accounting' | 'help' | 'network';

interface Props {
  onSectionChange: (section: Section) => void;
}

const TRADES = [
  'General Contractor', 'Plumbing', 'Electrical', 'HVAC', 'Roofing',
  'Painting', 'Concrete', 'Landscaping', 'Flooring', 'Carpentry',
  'Masonry', 'Drywall', 'Insulation', 'Siding', 'Windows & Doors',
  'Fencing', 'Demolition', 'Excavation', 'Fire Protection', 'Solar',
  'Pool & Spa', 'Tile & Stone', 'Waterproofing', 'Welding', 'Other',
];

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
];

export default function ContractorNetworkSection({ onSectionChange }: Props) {
  const { user } = useAuth();
  const [contractors, setContractors] = useState<ContractorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tradeFilter, setTradeFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [selectedContractor, setSelectedContractor] = useState<ContractorProfile | null>(null);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchContractors();
  }, []);

  const fetchContractors = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, company_name, contact_name, trade, city, state, network_bio, logo_url, website_url')
        .eq('network_visible', true)
        .neq('id', user?.id || '');

      if (error) throw error;
      setContractors((data as ContractorProfile[]) || []);
    } catch (err) {
      console.error('Error fetching contractors:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return contractors.filter(c => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || 
        c.company_name?.toLowerCase().includes(q) ||
        c.trade?.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q) ||
        c.state?.toLowerCase().includes(q) ||
        c.contact_name?.toLowerCase().includes(q);
      
      const matchesTrade = tradeFilter === 'all' || 
        c.trade?.toLowerCase().includes(tradeFilter.toLowerCase());
      
      const matchesState = stateFilter === 'all' || 
        c.state?.toUpperCase() === stateFilter;

      return matchesSearch && matchesTrade && matchesState;
    });
  }, [contractors, searchQuery, tradeFilter, stateFilter]);

  const handleSendInquiry = async () => {
    if (!contactMessage.trim() || !selectedContractor) return;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-network-inquiry', {
        body: {
          recipientId: selectedContractor.id,
          message: contactMessage.trim(),
        }
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to send');
      
      toast.success('Message sent! They\'ll receive an email notification.');
      setShowContactDialog(false);
      setContactMessage('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="w-full pb-20 bg-background">
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full sm:max-w-7xl sm:mx-auto">
        <CrmNavHeader
          back
          dashboard
          onBack={() => onSectionChange('dashboard')}
          onDashboard={() => onSectionChange('dashboard')}
          sectionLabel="Contractor Network"
        />

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <Users className="h-7 w-7 text-primary" />
            Contractor Network
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Discover and connect with fellow contractors in the CT1 network
          </p>
        </div>

        {/* Search & Filters */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, trade, or location..."
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[140px]">
                <Select value={tradeFilter} onValueChange={setTradeFilter}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="All Trades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Trades</SelectItem>
                    {TRADES.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[120px]">
                <Select value={stateFilter} onValueChange={setStateFilter}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="All States" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {US_STATES.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {(tradeFilter !== 'all' || stateFilter !== 'all' || searchQuery) && (
                <Button variant="ghost" size="sm" onClick={() => { setSearchQuery(''); setTradeFilter('all'); setStateFilter('all'); }}>
                  <X className="h-4 w-4 mr-1" /> Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results count */}
        <p className="text-sm text-muted-foreground">
          {loading ? 'Loading...' : `${filtered.length} contractor${filtered.length !== 1 ? 's' : ''} found`}
        </p>

        {/* Contractor Grid */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-40" />
              <h3 className="font-semibold text-lg mb-2">No contractors found</h3>
              <p className="text-muted-foreground text-sm">
                {searchQuery || tradeFilter !== 'all' || stateFilter !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'No contractors have opted into the network yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((contractor) => (
              <Card
                key={contractor.id}
                className="cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all duration-200 group"
                onClick={() => setSelectedContractor(contractor)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {contractor.logo_url ? (
                      <img
                        src={contractor.logo_url}
                        alt={contractor.company_name || ''}
                        className="w-14 h-14 rounded-xl object-cover border-2 border-border shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border-2 border-primary/20">
                        <Building2 className="h-7 w-7 text-primary" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-base truncate group-hover:text-primary transition-colors">
                        {contractor.company_name || 'Unnamed Business'}
                      </h3>
                      {contractor.trade && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          <Briefcase className="h-3 w-3 mr-1" />
                          {contractor.trade}
                        </Badge>
                      )}
                      {(contractor.city || contractor.state) && (
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {[contractor.city, contractor.state].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                  {contractor.network_bio && (
                    <p className="text-sm text-muted-foreground mt-3 line-clamp-2 leading-relaxed">
                      {contractor.network_bio}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Profile Detail Dialog */}
      <Dialog open={!!selectedContractor && !showContactDialog} onOpenChange={() => setSelectedContractor(null)}>
        <DialogContent className="max-w-lg">
          {selectedContractor && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-4">
                  {selectedContractor.logo_url ? (
                    <img
                      src={selectedContractor.logo_url}
                      alt={selectedContractor.company_name || ''}
                      className="w-16 h-16 rounded-xl object-cover border-2 border-border"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                      <Building2 className="h-8 w-8 text-primary" />
                    </div>
                  )}
                  <div>
                    <DialogTitle className="text-xl">
                      {selectedContractor.company_name || 'Unnamed Business'}
                    </DialogTitle>
                    {selectedContractor.contact_name && (
                      <p className="text-sm text-muted-foreground mt-1">{selectedContractor.contact_name}</p>
                    )}
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {selectedContractor.trade && (
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Trade / Specialty</p>
                      <p className="text-sm font-medium">{selectedContractor.trade}</p>
                    </div>
                  </div>
                )}

                {(selectedContractor.city || selectedContractor.state) && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Service Area</p>
                      <p className="text-sm font-medium">{[selectedContractor.city, selectedContractor.state].filter(Boolean).join(', ')}</p>
                    </div>
                  </div>
                )}

                {selectedContractor.website_url && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Website</p>
                      <a
                        href={selectedContractor.website_url.startsWith('http') ? selectedContractor.website_url : `https://${selectedContractor.website_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {selectedContractor.website_url}
                      </a>
                    </div>
                  </div>
                )}

                {selectedContractor.network_bio && (
                  <div className="bg-muted/50 rounded-lg p-4 border">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">About</p>
                    <p className="text-sm leading-relaxed">{selectedContractor.network_bio}</p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedContractor(null)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setShowContactDialog(true);
                  setContactMessage('');
                }}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Contact Dialog */}
      <Dialog open={showContactDialog} onOpenChange={(open) => {
        setShowContactDialog(open);
        if (!open) setSelectedContractor(null);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Connect with {selectedContractor?.company_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Send a message to introduce yourself. They'll receive an email with your business info and message.
            </p>
            <div className="space-y-2">
              <Label htmlFor="inquiry-message">Your Message</Label>
              <Textarea
                id="inquiry-message"
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="Hi! I'm interested in connecting regarding potential collaboration opportunities..."
                rows={5}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground text-right">{contactMessage.length}/1000</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowContactDialog(false); setSelectedContractor(null); }}>
              Cancel
            </Button>
            <Button onClick={handleSendInquiry} disabled={sending || !contactMessage.trim()}>
              {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              {sending ? 'Sending...' : 'Send Message'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
