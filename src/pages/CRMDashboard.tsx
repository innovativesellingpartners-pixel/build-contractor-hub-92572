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

type Section = 'dashboard' | 'profile' | 'leads' | 'opportunities' | 'jobs' | 'customers' | 'contractors' | 'calls' | 'calendar' | 'emails';

export function CRMDashboard() {
  const [activeSection, setActiveSection] = useState<Section>('leads');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [addLeadDialogOpen, setAddLeadDialogOpen] = useState(false);
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
                <Dialog open={addLeadDialogOpen} onOpenChange={setAddLeadDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="gap-2">
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

          {activeSection !== 'leads' && (
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
