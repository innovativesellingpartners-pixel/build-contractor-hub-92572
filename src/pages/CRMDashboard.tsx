import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  LayoutDashboard,
  User,
  ClipboardList,
  Target,
  Briefcase,
  Users,
  Building2,
  Phone,
  Calendar as CalendarIcon,
  Mail,
  Plus,
  LogOut
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import ct1Logo from "@/assets/ct1-logo-circle.png";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  project: string;
  value: number;
  status: 'new' | 'contacted' | 'quoted' | 'won' | 'lost';
  notes?: string;
  date: string;
}

interface Product {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface OpportunityNote {
  id: string;
  content: string;
  createdAt: string;
}

interface Opportunity {
  id: string;
  name: string;
  accountName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  value: number;
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
  probability: number;
  closeDate: string;
  description: string;
  products: Product[];
  notes: OpportunityNote[];
  createdAt: string;
  updatedAt: string;
}

type Section = 'dashboard' | 'profile' | 'leads' | 'opportunities' | 'jobs' | 'customers' | 'contractors' | 'calls' | 'calendar' | 'emails';

export function CRMDashboard() {
  const [activeSection, setActiveSection] = useState<Section>('leads');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [addLeadDialogOpen, setAddLeadDialogOpen] = useState(false);
  const [addOpportunityDialogOpen, setAddOpportunityDialogOpen] = useState(false);
  const [editOpportunityDialogOpen, setEditOpportunityDialogOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [newNote, setNewNote] = useState('');
  const [newProduct, setNewProduct] = useState({ name: '', quantity: 1, unitPrice: 0 });
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    phone: '',
    project: '',
    value: '',
    status: 'new' as Lead['status'],
    notes: ''
  });

  const [newOpportunity, setNewOpportunity] = useState({
    name: '',
    accountName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    value: '',
    stage: 'prospecting' as Opportunity['stage'],
    probability: 10,
    closeDate: '',
    description: ''
  });

  const handleAddLead = () => {
    // Validate required fields
    if (!newLead.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter the lead's name",
        variant: "destructive",
      });
      return;
    }

    if (!newLead.email.trim() || !newLead.email.includes('@')) {
      toast({
        title: "Valid Email Required",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (!newLead.phone.trim()) {
      toast({
        title: "Phone Required",
        description: "Please enter a phone number",
        variant: "destructive",
      });
      return;
    }

    if (!newLead.project.trim()) {
      toast({
        title: "Project Required",
        description: "Please enter the project description",
        variant: "destructive",
      });
      return;
    }

    if (!newLead.value || parseFloat(newLead.value) <= 0) {
      toast({
        title: "Valid Value Required",
        description: "Please enter a valid project value",
        variant: "destructive",
      });
      return;
    }

    // Create new lead
    const lead: Lead = {
      id: Date.now().toString(),
      name: newLead.name.trim(),
      email: newLead.email.trim(),
      phone: newLead.phone.trim(),
      project: newLead.project.trim(),
      value: parseFloat(newLead.value),
      status: newLead.status,
      notes: newLead.notes,
      date: new Date().toISOString().split('T')[0]
    };

    setLeads([lead, ...leads]);

    toast({
      title: "Lead Added Successfully",
      description: `${lead.name} has been added to your pipeline`,
    });

    // Reset form and close dialog
    setNewLead({
      name: '',
      email: '',
      phone: '',
      project: '',
      value: '',
      status: 'new',
      notes: ''
    });
    setAddLeadDialogOpen(false);
  };

  const handleAddOpportunity = () => {
    if (!newOpportunity.name.trim() || !newOpportunity.accountName.trim() || !newOpportunity.value || !newOpportunity.closeDate) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const opportunity: Opportunity = {
      id: Date.now().toString(),
      name: newOpportunity.name.trim(),
      accountName: newOpportunity.accountName.trim(),
      contactName: newOpportunity.contactName.trim(),
      contactEmail: newOpportunity.contactEmail.trim(),
      contactPhone: newOpportunity.contactPhone.trim(),
      value: parseFloat(newOpportunity.value),
      stage: newOpportunity.stage,
      probability: newOpportunity.probability,
      closeDate: newOpportunity.closeDate,
      description: newOpportunity.description.trim(),
      products: [],
      notes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setOpportunities([opportunity, ...opportunities]);
    toast({
      title: "Opportunity Created",
      description: `${opportunity.name} has been added to your pipeline`,
    });

    setNewOpportunity({
      name: '',
      accountName: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      value: '',
      stage: 'prospecting',
      probability: 10,
      closeDate: '',
      description: ''
    });
    setAddOpportunityDialogOpen(false);
  };

  const handleUpdateOpportunity = (updatedOpp: Opportunity) => {
    setOpportunities(opportunities.map(opp => 
      opp.id === updatedOpp.id ? { ...updatedOpp, updatedAt: new Date().toISOString() } : opp
    ));
    setSelectedOpportunity(updatedOpp);
    toast({
      title: "Opportunity Updated",
      description: "Changes have been saved",
    });
  };

  const handleAddNote = () => {
    if (!selectedOpportunity || !newNote.trim()) return;

    const note: OpportunityNote = {
      id: Date.now().toString(),
      content: newNote.trim(),
      createdAt: new Date().toISOString()
    };

    const updated = {
      ...selectedOpportunity,
      notes: [note, ...selectedOpportunity.notes]
    };

    handleUpdateOpportunity(updated);
    setNewNote('');
  };

  const handleAddProduct = () => {
    if (!selectedOpportunity || !newProduct.name.trim()) return;

    const product: Product = {
      id: Date.now().toString(),
      name: newProduct.name.trim(),
      quantity: newProduct.quantity,
      unitPrice: newProduct.unitPrice,
      total: newProduct.quantity * newProduct.unitPrice
    };

    const updated = {
      ...selectedOpportunity,
      products: [...selectedOpportunity.products, product]
    };

    handleUpdateOpportunity(updated);
    setNewProduct({ name: '', quantity: 1, unitPrice: 0 });
  };

  const handleRemoveProduct = (productId: string) => {
    if (!selectedOpportunity) return;
    
    const updated = {
      ...selectedOpportunity,
      products: selectedOpportunity.products.filter(p => p.id !== productId)
    };
    
    handleUpdateOpportunity(updated);
  };

  const getStageColor = (stage: Opportunity['stage']) => {
    const colors = {
      'prospecting': 'bg-slate-100 text-slate-700 border-slate-300',
      'qualification': 'bg-blue-100 text-blue-700 border-blue-300',
      'proposal': 'bg-purple-100 text-purple-700 border-purple-300',
      'negotiation': 'bg-orange-100 text-orange-700 border-orange-300',
      'closed-won': 'bg-green-100 text-green-700 border-green-300',
      'closed-lost': 'bg-red-100 text-red-700 border-red-300'
    };
    return colors[stage];
  };

  const navItems = [
    { id: 'dashboard' as Section, icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'profile' as Section, icon: User, label: 'Profile' },
    { id: 'leads' as Section, icon: ClipboardList, label: 'Leads' },
    { id: 'opportunities' as Section, icon: Target, label: 'Opportunities' },
    { id: 'jobs' as Section, icon: Briefcase, label: 'Jobs' },
    { id: 'customers' as Section, icon: Users, label: 'Customers' },
    { id: 'contractors' as Section, icon: Building2, label: 'Contractors' },
    { id: 'calls' as Section, icon: Phone, label: 'Calls' },
    { id: 'calendar' as Section, icon: CalendarIcon, label: 'Calendar' },
    { id: 'emails' as Section, icon: Mail, label: 'Emails' },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center gap-3">
          <img src={ct1Logo} alt="CT1" className="h-8 w-8" />
          <h1 className="text-xl font-bold">Contractor CRM</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User section at bottom */}
        <div className="p-3 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3"
            onClick={signOut}
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{user?.email}</span>
          </div>
          <Button variant="outline" onClick={signOut}>
            Sign Out
          </Button>
        </header>

        {/* Content Area */}
        <div className="p-6">
          {activeSection === 'leads' && (
            <div className="space-y-6">
              {/* Leads Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">Leads</h1>
                  <p className="text-muted-foreground mt-1">Manage and assign leads to contractors</p>
                </div>
                <div className="flex items-center gap-3">
                  <Dialog open={addLeadDialogOpen} onOpenChange={setAddLeadDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="lg" className="gap-2 bg-[#C94A3C] hover:bg-[#B43F31] text-white">
                        <Plus className="h-5 w-5" />
                        Add Lead
                      </Button>
                    </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Add New Lead</DialogTitle>
                      <DialogDescription>
                        Enter the details of your new lead to add them to your pipeline.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          placeholder="John Doe"
                          value={newLead.name}
                          onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="john@example.com"
                          value={newLead.email}
                          onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="(555) 123-4567"
                          value={newLead.phone}
                          onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="project">Project Description *</Label>
                        <Input
                          id="project"
                          placeholder="Kitchen Remodel"
                          value={newLead.project}
                          onChange={(e) => setNewLead({ ...newLead, project: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="value">Project Value ($) *</Label>
                        <Input
                          id="value"
                          type="number"
                          min="0"
                          step="100"
                          placeholder="25000"
                          value={newLead.value}
                          onChange={(e) => setNewLead({ ...newLead, value: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={newLead.status}
                          onValueChange={(value) => setNewLead({ ...newLead, status: value as Lead['status'] })}
                        >
                          <SelectTrigger id="status">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="quoted">Quoted</SelectItem>
                            <SelectItem value="won">Won</SelectItem>
                            <SelectItem value="lost">Lost</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea
                          id="notes"
                          placeholder="Additional information about the lead..."
                          value={newLead.notes}
                          onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                          rows={3}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setAddLeadDialogOpen(false);
                          setNewLead({
                            name: '',
                            email: '',
                            phone: '',
                            project: '',
                            value: '',
                            status: 'new',
                            notes: ''
                          });
                        }}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleAddLead} className="flex-1">
                        Add Lead
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => {
                    toast({
                      title: "Import CSV",
                      description: "CSV import functionality coming soon",
                    });
                  }}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Import CSV
                </Button>
                </div>
              </div>

              {/* Leads Content */}
              {leads.length === 0 ? (
                <div className="border border-dashed rounded-lg p-12 text-center">
                  <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-lg">
                    No leads found. Create your first lead to get started.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {leads.map((lead) => (
                    <div key={lead.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-semibold text-lg">{lead.name}</h3>
                          <p className="text-sm text-muted-foreground">{lead.project}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {lead.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {lead.phone}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">${lead.value.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground capitalize">{lead.status}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSection === 'opportunities' && (
            <div className="space-y-6">
              {/* Opportunities Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">Opportunities</h1>
                  <p className="text-muted-foreground mt-1">Manage your sales pipeline</p>
                </div>
                <Dialog open={addOpportunityDialogOpen} onOpenChange={setAddOpportunityDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="gap-2">
                      <Plus className="h-5 w-5" />
                      Add Opportunity
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Opportunity</DialogTitle>
                      <DialogDescription>
                        Enter the details for this sales opportunity
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="opp-name">Opportunity Name *</Label>
                          <Input
                            id="opp-name"
                            placeholder="New Website Project"
                            value={newOpportunity.name}
                            onChange={(e) => setNewOpportunity({ ...newOpportunity, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="account">Account Name *</Label>
                          <Input
                            id="account"
                            placeholder="Acme Corp"
                            value={newOpportunity.accountName}
                            onChange={(e) => setNewOpportunity({ ...newOpportunity, accountName: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="contact-name">Contact Name</Label>
                          <Input
                            id="contact-name"
                            placeholder="John Smith"
                            value={newOpportunity.contactName}
                            onChange={(e) => setNewOpportunity({ ...newOpportunity, contactName: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contact-email">Contact Email</Label>
                          <Input
                            id="contact-email"
                            type="email"
                            placeholder="john@acme.com"
                            value={newOpportunity.contactEmail}
                            onChange={(e) => setNewOpportunity({ ...newOpportunity, contactEmail: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contact-phone">Contact Phone</Label>
                          <Input
                            id="contact-phone"
                            type="tel"
                            placeholder="(555) 123-4567"
                            value={newOpportunity.contactPhone}
                            onChange={(e) => setNewOpportunity({ ...newOpportunity, contactPhone: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="opp-value">Opportunity Value ($) *</Label>
                          <Input
                            id="opp-value"
                            type="number"
                            min="0"
                            step="100"
                            placeholder="50000"
                            value={newOpportunity.value}
                            onChange={(e) => setNewOpportunity({ ...newOpportunity, value: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="close-date">Expected Close Date *</Label>
                          <Input
                            id="close-date"
                            type="date"
                            value={newOpportunity.closeDate}
                            onChange={(e) => setNewOpportunity({ ...newOpportunity, closeDate: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="opp-stage">Stage</Label>
                          <Select
                            value={newOpportunity.stage}
                            onValueChange={(value) => setNewOpportunity({ ...newOpportunity, stage: value as Opportunity['stage'] })}
                          >
                            <SelectTrigger id="opp-stage">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="prospecting">Prospecting</SelectItem>
                              <SelectItem value="qualification">Qualification</SelectItem>
                              <SelectItem value="proposal">Proposal</SelectItem>
                              <SelectItem value="negotiation">Negotiation</SelectItem>
                              <SelectItem value="closed-won">Closed Won</SelectItem>
                              <SelectItem value="closed-lost">Closed Lost</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="probability">Probability (%): {newOpportunity.probability}%</Label>
                          <Input
                            id="probability"
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={newOpportunity.probability}
                            onChange={(e) => setNewOpportunity({ ...newOpportunity, probability: parseInt(e.target.value) })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="opp-description">Description</Label>
                        <Textarea
                          id="opp-description"
                          placeholder="Describe the opportunity..."
                          value={newOpportunity.description}
                          onChange={(e) => setNewOpportunity({ ...newOpportunity, description: e.target.value })}
                          rows={3}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setAddOpportunityDialogOpen(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleAddOpportunity} className="flex-1">
                        Create Opportunity
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Opportunities List */}
              {opportunities.length === 0 ? (
                <div className="border border-dashed rounded-lg p-12 text-center">
                  <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-lg">
                    No opportunities yet. Create your first opportunity to start building your pipeline.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {opportunities.map((opp) => (
                    <div
                      key={opp.id}
                      className="border rounded-lg p-6 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedOpportunity(opp);
                        setEditOpportunityDialogOpen(true);
                      }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-xl">{opp.name}</h3>
                          <p className="text-sm text-muted-foreground">{opp.accountName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-2xl">${opp.value.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">{opp.probability}% probability</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStageColor(opp.stage)}`}>
                          {opp.stage.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Close: {new Date(opp.closeDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Edit Opportunity Dialog */}
              <Dialog open={editOpportunityDialogOpen} onOpenChange={setEditOpportunityDialogOpen}>
                <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                  {selectedOpportunity && (
                    <>
                      <DialogHeader>
                        <DialogTitle>{selectedOpportunity.name}</DialogTitle>
                        <DialogDescription>{selectedOpportunity.accountName}</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6 py-4">
                        {/* Stage and Value */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Stage</Label>
                            <Select
                              value={selectedOpportunity.stage}
                              onValueChange={(value) => handleUpdateOpportunity({ 
                                ...selectedOpportunity, 
                                stage: value as Opportunity['stage'] 
                              })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="prospecting">Prospecting</SelectItem>
                                <SelectItem value="qualification">Qualification</SelectItem>
                                <SelectItem value="proposal">Proposal</SelectItem>
                                <SelectItem value="negotiation">Negotiation</SelectItem>
                                <SelectItem value="closed-won">Closed Won</SelectItem>
                                <SelectItem value="closed-lost">Closed Lost</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Value ($)</Label>
                            <Input
                              type="number"
                              value={selectedOpportunity.value}
                              onChange={(e) => handleUpdateOpportunity({ 
                                ...selectedOpportunity, 
                                value: parseFloat(e.target.value) 
                              })}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Probability (%): {selectedOpportunity.probability}%</Label>
                          <Input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={selectedOpportunity.probability}
                            onChange={(e) => handleUpdateOpportunity({ 
                              ...selectedOpportunity, 
                              probability: parseInt(e.target.value) 
                            })}
                          />
                        </div>

                        {/* Products Section */}
                        <div className="space-y-3">
                          <Label className="text-lg font-semibold">Products</Label>
                          {selectedOpportunity.products.length > 0 && (
                            <div className="border rounded-lg overflow-hidden">
                              <table className="w-full">
                                <thead className="bg-muted">
                                  <tr>
                                    <th className="text-left p-2">Product</th>
                                    <th className="text-right p-2">Qty</th>
                                    <th className="text-right p-2">Unit Price</th>
                                    <th className="text-right p-2">Total</th>
                                    <th className="w-10"></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {selectedOpportunity.products.map((product) => (
                                    <tr key={product.id} className="border-t">
                                      <td className="p-2">{product.name}</td>
                                      <td className="text-right p-2">{product.quantity}</td>
                                      <td className="text-right p-2">${product.unitPrice.toLocaleString()}</td>
                                      <td className="text-right p-2">${product.total.toLocaleString()}</td>
                                      <td className="p-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleRemoveProduct(product.id)}
                                        >
                                          ×
                                        </Button>
                                      </td>
                                    </tr>
                                  ))}
                                  <tr className="border-t font-bold">
                                    <td colSpan={3} className="text-right p-2">Total:</td>
                                    <td className="text-right p-2">
                                      ${selectedOpportunity.products.reduce((sum, p) => sum + p.total, 0).toLocaleString()}
                                    </td>
                                    <td></td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Input
                              placeholder="Product name"
                              value={newProduct.name}
                              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                            />
                            <Input
                              type="number"
                              placeholder="Qty"
                              className="w-24"
                              value={newProduct.quantity}
                              onChange={(e) => setNewProduct({ ...newProduct, quantity: parseInt(e.target.value) || 1 })}
                            />
                            <Input
                              type="number"
                              placeholder="Price"
                              className="w-32"
                              value={newProduct.unitPrice}
                              onChange={(e) => setNewProduct({ ...newProduct, unitPrice: parseFloat(e.target.value) || 0 })}
                            />
                            <Button onClick={handleAddProduct}>Add</Button>
                          </div>
                        </div>

                        {/* Notes Section */}
                        <div className="space-y-3">
                          <Label className="text-lg font-semibold">Notes</Label>
                          {selectedOpportunity.notes.map((note) => (
                            <div key={note.id} className="border rounded-lg p-3 bg-muted/50">
                              <p className="text-sm mb-1">{note.content}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(note.createdAt).toLocaleString()}
                              </p>
                            </div>
                          ))}
                          <div className="flex gap-2">
                            <Textarea
                              placeholder="Add a note..."
                              value={newNote}
                              onChange={(e) => setNewNote(e.target.value)}
                              rows={2}
                            />
                            <Button onClick={handleAddNote}>Add Note</Button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          )}

          {activeSection !== 'leads' && activeSection !== 'opportunities' && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)} section coming soon...
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
