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
  Calendar as CalendarIcon,
  FileText,
  Briefcase,
  MessageSquare,
  DollarSign,
  Star,
  Plus,
  LogOut,
  Mail,
  Phone,
  ChevronRight,
  Upload,
  Home
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileEditDialog } from "@/components/contractor/ProfileEditDialog";
import ct1Logo from "@/assets/ct1-round-logo-new.png";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  project: string;
  value: number;
  status: 'new' | 'contacted' | 'site-visit-scheduled' | 'converted' | 'lost';
  notes?: string;
  date: string;
}

interface SiteVisit {
  id: string;
  leadId: string;
  leadName: string;
  scheduledDate: string;
  scheduledTime: string;
  address: string;
  notes: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'converted-to-estimate';
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface EstimateNote {
  id: string;
  content: string;
  createdAt: string;
}

interface Estimate {
  id: string;
  siteVisitId?: string;
  leadName: string;
  contactEmail: string;
  contactPhone: string;
  value: number;
  stage: 'draft' | 'sent' | 'follow-up' | 'accepted' | 'rejected';
  products: Product[];
  notes: EstimateNote[];
  createdAt: string;
  updatedAt: string;
}

interface Job {
  id: string;
  estimateId: string;
  projectName: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  startDate: string;
  endDate?: string;
  value: number;
  status: 'scheduled' | 'in-progress' | 'completed' | 'on-hold';
  address: string;
  notes: string;
  createdAt: string;
}

interface Communication {
  id: string;
  jobId: string;
  type: 'email' | 'sms' | 'call';
  direction: 'outbound' | 'inbound';
  subject: string;
  message: string;
  sentAt: string;
  recipientName: string;
}

interface Payment {
  id: string;
  jobId: string;
  amount: number;
  type: 'deposit' | 'progress' | 'final';
  status: 'pending' | 'paid' | 'overdue';
  dueDate: string;
  paidDate?: string;
  method?: string;
  notes: string;
}

interface Review {
  id: string;
  jobId: string;
  customerName: string;
  rating: number;
  comment: string;
  status: 'requested' | 'received' | 'published';
  requestedAt: string;
  receivedAt?: string;
}

type Section = 'dashboard' | 'leads' | 'site-visits' | 'estimates' | 'jobs' | 'communications' | 'payments' | 'reviews';

export function CRMDashboard() {
  // Persist active section in sessionStorage
  const getInitialSection = (): Section => {
    const saved = sessionStorage.getItem('crmActiveSection');
    return (saved as Section) || 'leads';
  };
  
  const [activeSection, setActiveSection] = useState<Section>(getInitialSection);
  
  // Save active section to sessionStorage whenever it changes
  const handleSectionChange = (section: Section) => {
    setActiveSection(section);
    sessionStorage.setItem('crmActiveSection', section);
  };
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [siteVisits, setSiteVisits] = useState<SiteVisit[]>([]);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  
  const [addLeadDialogOpen, setAddLeadDialogOpen] = useState(false);
  const [addSiteVisitDialogOpen, setAddSiteVisitDialogOpen] = useState(false);
  const [addEstimateDialogOpen, setAddEstimateDialogOpen] = useState(false);
  const [editEstimateDialogOpen, setEditEstimateDialogOpen] = useState(false);
  const [addJobDialogOpen, setAddJobDialogOpen] = useState(false);
  const [addCommunicationDialogOpen, setAddCommunicationDialogOpen] = useState(false);
  const [addPaymentDialogOpen, setAddPaymentDialogOpen] = useState(false);
  const [addReviewDialogOpen, setAddReviewDialogOpen] = useState(false);
  
  const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [newNote, setNewNote] = useState('');
  const [newProduct, setNewProduct] = useState({ name: '', quantity: 1, unitPrice: 0 });
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  // New state for form inputs
  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    phone: '',
    project: '',
    value: '',
    status: 'new' as Lead['status'],
    notes: ''
  });

  const [newSiteVisit, setNewSiteVisit] = useState({
    leadId: '',
    leadName: '',
    scheduledDate: '',
    scheduledTime: '',
    address: '',
    notes: ''
  });

  const [newEstimate, setNewEstimate] = useState({
    siteVisitId: '',
    leadName: '',
    contactEmail: '',
    contactPhone: '',
    value: '',
    stage: 'draft' as Estimate['stage']
  });

  const [newJob, setNewJob] = useState({
    estimateId: '',
    projectName: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    startDate: '',
    address: '',
    notes: '',
    value: ''
  });

  const [newCommunication, setNewCommunication] = useState({
    jobId: '',
    type: 'email' as Communication['type'],
    subject: '',
    message: '',
    recipientName: ''
  });

  const [newPayment, setNewPayment] = useState({
    jobId: '',
    amount: '',
    type: 'deposit' as Payment['type'],
    dueDate: '',
    notes: ''
  });

  const [newReview, setNewReview] = useState({
    jobId: '',
    customerName: ''
  });

  // Handlers
  const handleAddLead = () => {
    if (!newLead.name.trim() || !newLead.email.trim() || !newLead.phone.trim() || !newLead.project.trim() || !newLead.value) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

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

    setNewLead({ name: '', email: '', phone: '', project: '', value: '', status: 'new', notes: '' });
    setAddLeadDialogOpen(false);
  };

  const handleScheduleSiteVisit = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    setNewSiteVisit({
      leadId: lead.id,
      leadName: lead.name,
      scheduledDate: '',
      scheduledTime: '',
      address: '',
      notes: ''
    });
    setAddSiteVisitDialogOpen(true);
  };

  const handleAddSiteVisit = () => {
    if (!newSiteVisit.scheduledDate || !newSiteVisit.scheduledTime || !newSiteVisit.address.trim()) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const siteVisit: SiteVisit = {
      id: Date.now().toString(),
      leadId: newSiteVisit.leadId,
      leadName: newSiteVisit.leadName,
      scheduledDate: newSiteVisit.scheduledDate,
      scheduledTime: newSiteVisit.scheduledTime,
      address: newSiteVisit.address.trim(),
      notes: newSiteVisit.notes,
      status: 'scheduled',
      createdAt: new Date().toISOString()
    };

    setSiteVisits([siteVisit, ...siteVisits]);
    
    // Update lead status
    setLeads(leads.map(l => 
      l.id === newSiteVisit.leadId 
        ? { ...l, status: 'site-visit-scheduled' as Lead['status'] } 
        : l
    ));

    toast({
      title: "Site Visit Scheduled",
      description: `Site visit scheduled for ${siteVisit.leadName}`,
    });

    setNewSiteVisit({ leadId: '', leadName: '', scheduledDate: '', scheduledTime: '', address: '', notes: '' });
    setAddSiteVisitDialogOpen(false);
  };

  const handleConvertToEstimate = (siteVisitId: string) => {
    const siteVisit = siteVisits.find(sv => sv.id === siteVisitId);
    if (!siteVisit) return;

    const lead = leads.find(l => l.id === siteVisit.leadId);
    
    setNewEstimate({
      siteVisitId: siteVisit.id,
      leadName: siteVisit.leadName,
      contactEmail: lead?.email || '',
      contactPhone: lead?.phone || '',
      value: lead?.value.toString() || '',
      stage: 'draft'
    });
    setAddEstimateDialogOpen(true);
  };

  const handleAddEstimate = () => {
    if (!newEstimate.leadName.trim() || !newEstimate.value) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const estimate: Estimate = {
      id: Date.now().toString(),
      siteVisitId: newEstimate.siteVisitId,
      leadName: newEstimate.leadName.trim(),
      contactEmail: newEstimate.contactEmail.trim(),
      contactPhone: newEstimate.contactPhone.trim(),
      value: parseFloat(newEstimate.value),
      stage: newEstimate.stage,
      products: [],
      notes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setEstimates([estimate, ...estimates]);

    // Update site visit status if it was converted from one
    if (newEstimate.siteVisitId) {
      setSiteVisits(siteVisits.map(sv => 
        sv.id === newEstimate.siteVisitId 
          ? { ...sv, status: 'converted-to-estimate' as SiteVisit['status'] } 
          : sv
      ));
    }

    toast({
      title: "Estimate Created",
      description: `Estimate for ${estimate.leadName} has been created`,
    });

    setNewEstimate({ siteVisitId: '', leadName: '', contactEmail: '', contactPhone: '', value: '', stage: 'draft' });
    setAddEstimateDialogOpen(false);
  };

  const handleUpdateEstimate = (updatedEst: Estimate) => {
    setEstimates(estimates.map(est => 
      est.id === updatedEst.id ? { ...updatedEst, updatedAt: new Date().toISOString() } : est
    ));
    setSelectedEstimate(updatedEst);
    toast({
      title: "Estimate Updated",
      description: "Changes have been saved",
    });
  };

  const handleAddNote = () => {
    if (!selectedEstimate || !newNote.trim()) return;

    const note: EstimateNote = {
      id: Date.now().toString(),
      content: newNote.trim(),
      createdAt: new Date().toISOString()
    };

    const updated = {
      ...selectedEstimate,
      notes: [note, ...selectedEstimate.notes]
    };

    handleUpdateEstimate(updated);
    setNewNote('');
  };

  const handleAddProduct = () => {
    if (!selectedEstimate || !newProduct.name.trim()) return;

    const product: Product = {
      id: Date.now().toString(),
      name: newProduct.name.trim(),
      quantity: newProduct.quantity,
      unitPrice: newProduct.unitPrice,
      total: newProduct.quantity * newProduct.unitPrice
    };

    const updated = {
      ...selectedEstimate,
      products: [...selectedEstimate.products, product]
    };

    handleUpdateEstimate(updated);
    setNewProduct({ name: '', quantity: 1, unitPrice: 0 });
  };

  const handleRemoveProduct = (productId: string) => {
    if (!selectedEstimate) return;
    
    const updated = {
      ...selectedEstimate,
      products: selectedEstimate.products.filter(p => p.id !== productId)
    };
    
    handleUpdateEstimate(updated);
  };

  const handleConvertToJob = (estimateId: string) => {
    const estimate = estimates.find(e => e.id === estimateId);
    if (!estimate || estimate.stage !== 'accepted') {
      toast({
        title: "Cannot Convert",
        description: "Only accepted estimates can be converted to jobs",
        variant: "destructive",
      });
      return;
    }

    setNewJob({
      estimateId: estimate.id,
      projectName: estimate.leadName,
      customerName: estimate.leadName,
      customerPhone: estimate.contactPhone,
      customerEmail: estimate.contactEmail,
      startDate: '',
      address: '',
      notes: '',
      value: estimate.value.toString()
    });
    setAddJobDialogOpen(true);
  };

  const handleAddJob = () => {
    if (!newJob.projectName.trim() || !newJob.startDate || !newJob.address.trim()) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const job: Job = {
      id: Date.now().toString(),
      estimateId: newJob.estimateId,
      projectName: newJob.projectName.trim(),
      customerName: newJob.customerName.trim(),
      customerPhone: newJob.customerPhone.trim(),
      customerEmail: newJob.customerEmail.trim(),
      startDate: newJob.startDate,
      value: parseFloat(newJob.value),
      status: 'scheduled',
      address: newJob.address.trim(),
      notes: newJob.notes,
      createdAt: new Date().toISOString()
    };

    setJobs([job, ...jobs]);
    toast({
      title: "Job Created",
      description: `Job for ${job.projectName} has been scheduled`,
    });

    setNewJob({ estimateId: '', projectName: '', customerName: '', customerPhone: '', customerEmail: '', startDate: '', address: '', notes: '', value: '' });
    setAddJobDialogOpen(false);
  };

  const handleAddCommunication = () => {
    if (!newCommunication.jobId || !newCommunication.subject.trim() || !newCommunication.message.trim()) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const communication: Communication = {
      id: Date.now().toString(),
      jobId: newCommunication.jobId,
      type: newCommunication.type,
      direction: 'outbound',
      subject: newCommunication.subject.trim(),
      message: newCommunication.message.trim(),
      sentAt: new Date().toISOString(),
      recipientName: newCommunication.recipientName.trim()
    };

    setCommunications([communication, ...communications]);
    toast({
      title: "Communication Sent",
      description: `${newCommunication.type.toUpperCase()} sent successfully`,
    });

    setNewCommunication({ jobId: '', type: 'email', subject: '', message: '', recipientName: '' });
    setAddCommunicationDialogOpen(false);
  };

  const handleAddPayment = () => {
    if (!newPayment.jobId || !newPayment.amount || !newPayment.dueDate) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const payment: Payment = {
      id: Date.now().toString(),
      jobId: newPayment.jobId,
      amount: parseFloat(newPayment.amount),
      type: newPayment.type,
      status: 'pending',
      dueDate: newPayment.dueDate,
      notes: newPayment.notes
    };

    setPayments([payment, ...payments]);
    toast({
      title: "Payment Created",
      description: `${newPayment.type} payment of $${newPayment.amount} has been created`,
    });

    setNewPayment({ jobId: '', amount: '', type: 'deposit', dueDate: '', notes: '' });
    setAddPaymentDialogOpen(false);
  };

  const handleRequestReview = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job || job.status !== 'completed') {
      toast({
        title: "Cannot Request Review",
        description: "Only completed jobs can request reviews",
        variant: "destructive",
      });
      return;
    }

    setNewReview({
      jobId: job.id,
      customerName: job.customerName
    });
    setAddReviewDialogOpen(true);
  };

  const handleAddReview = () => {
    if (!newReview.jobId) {
      toast({
        title: "Required Fields Missing",
        description: "Please select a job",
        variant: "destructive",
      });
      return;
    }

    const review: Review = {
      id: Date.now().toString(),
      jobId: newReview.jobId,
      customerName: newReview.customerName,
      rating: 0,
      comment: '',
      status: 'requested',
      requestedAt: new Date().toISOString()
    };

    setReviews([review, ...reviews]);
    toast({
      title: "Review Requested",
      description: `Review request sent to ${review.customerName}`,
    });

    setNewReview({ jobId: '', customerName: '' });
    setAddReviewDialogOpen(false);
  };

  const getStageColor = (stage: Estimate['stage']) => {
    const colors = {
      'draft': 'bg-slate-100 text-slate-700 border-slate-300',
      'sent': 'bg-blue-100 text-blue-700 border-blue-300',
      'follow-up': 'bg-yellow-100 text-yellow-700 border-yellow-300',
      'accepted': 'bg-green-100 text-green-700 border-green-300',
      'rejected': 'bg-red-100 text-red-700 border-red-300'
    };
    return colors[stage];
  };

  const navItems = [
    { id: 'dashboard' as Section, icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'leads' as Section, icon: ClipboardList, label: '1. Leads' },
    { id: 'site-visits' as Section, icon: CalendarIcon, label: '2. Site Visits' },
    { id: 'estimates' as Section, icon: FileText, label: '3. Estimates' },
    { id: 'jobs' as Section, icon: Briefcase, label: '4. Jobs' },
    { id: 'communications' as Section, icon: MessageSquare, label: '5. Communications' },
    { id: 'payments' as Section, icon: DollarSign, label: '6. Payments' },
    { id: 'reviews' as Section, icon: Star, label: '7. Reviews' },
  ];

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden border-b border-border bg-card p-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={ct1Logo} alt="CT1" className="h-8 w-8" />
            <h1 className="text-xl font-bold">Contractor CRM</h1>
          </div>
          <ProfileEditDialog />
        </div>
        
        {/* Mobile Navigation Tabs */}
        <div className="mt-4 overflow-x-auto -mx-4 px-4">
          <div className="flex gap-2 min-w-max pb-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSectionChange(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-border bg-card flex-col">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <img src={ct1Logo} alt="CT1" className="h-8 w-8" />
          <h1 className="text-xl font-bold">Contractor CRM</h1>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
              return (
              <button
                key={item.id}
                onClick={() => handleSectionChange(item.id)}
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
        {/* Desktop Header */}
        <header className="hidden lg:flex border-b border-border bg-card px-4 lg:px-6 py-4 items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => handleSectionChange('dashboard')}>
              <Home className="h-4 w-4" />
              Home
            </Button>
            <span className="text-muted-foreground/40">|</span>
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{user?.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <ProfileEditDialog />
            <Button variant="outline" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </header>

        <div className="p-3 md:p-4 lg:p-6">
          {/* Dashboard */}
          {activeSection === 'dashboard' && (
            <div className="space-y-4 md:space-y-6">
              <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <div className="border rounded-lg p-4 md:p-6 bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <ClipboardList className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                    <span className="text-2xl md:text-3xl font-bold">{leads.length}</span>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground">Active Leads</p>
                </div>
                <div className="border rounded-lg p-4 md:p-6 bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <CalendarIcon className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                    <span className="text-2xl md:text-3xl font-bold">{siteVisits.filter(sv => sv.status === 'scheduled').length}</span>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground">Scheduled Site Visits</p>
                </div>
                <div className="border rounded-lg p-4 md:p-6 bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <FileText className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                    <span className="text-2xl md:text-3xl font-bold">{estimates.filter(e => ['draft', 'sent', 'follow-up'].includes(e.stage)).length}</span>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground">Open Estimates</p>
                </div>
                <div className="border rounded-lg p-4 md:p-6 bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <Briefcase className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                    <span className="text-2xl md:text-3xl font-bold">{jobs.filter(j => j.status !== 'completed').length}</span>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground">Active Jobs</p>
                </div>
              </div>
            </div>
          )}

          {/* Leads Section */}
          {activeSection === 'leads' && (
            <div className="space-y-4 lg:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold">Leads</h1>
                  <p className="text-muted-foreground mt-1 text-sm lg:text-base">Document and manage new leads</p>
                </div>
                <div className="flex items-center gap-2 lg:gap-3">
                  <Dialog open={addLeadDialogOpen} onOpenChange={setAddLeadDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="default" className="gap-2 bg-[#C94A3C] hover:bg-[#B43F31] text-white flex-1 sm:flex-none">
                        <Plus className="h-4 w-4 lg:h-5 lg:w-5" />
                        <span className="text-sm lg:text-base">Add Lead</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Add New Lead</DialogTitle>
                        <DialogDescription>
                          Enter the details of your new lead
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
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
                          <Label htmlFor="value">Estimated Value ($) *</Label>
                          <Input
                            id="value"
                            type="number"
                            min="0"
                            placeholder="25000"
                            value={newLead.value}
                            onChange={(e) => setNewLead({ ...newLead, value: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="notes">Notes</Label>
                          <Textarea
                            id="notes"
                            placeholder="Additional information..."
                            value={newLead.notes}
                            onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                            rows={3}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setAddLeadDialogOpen(false)} className="flex-1">
                          Cancel
                        </Button>
                        <Button onClick={handleAddLead} className="flex-1">
                          Add Lead
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button 
                    size="default" 
                    variant="outline" 
                    className="gap-2 flex-1 sm:flex-none"
                    onClick={() => toast({ title: "Import CSV", description: "CSV import coming soon" })}
                  >
                    <Upload className="h-4 w-4 lg:h-5 lg:w-5" />
                    <span className="hidden sm:inline text-sm lg:text-base">Import CSV</span>
                    <span className="sm:hidden text-sm">Import</span>
                  </Button>
                </div>
              </div>

              {leads.length === 0 ? (
                <div className="border border-dashed rounded-lg p-12 text-center">
                  <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-lg">
                    No leads yet. Create your first lead to get started.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 lg:space-y-4">
                  {leads.map((lead) => (
                    <div key={lead.id} className="border rounded-lg p-3 lg:p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <h3 className="font-semibold text-base lg:text-lg">{lead.name}</h3>
                          <p className="text-sm text-muted-foreground">{lead.project}</p>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
                            <span className="flex items-center gap-1 break-all">
                              <Mail className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{lead.email}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3 flex-shrink-0" />
                              {lead.phone}
                            </span>
                          </div>
                          {lead.notes && <p className="text-sm text-muted-foreground mt-2">{lead.notes}</p>}
                        </div>
                        <div className="text-right flex flex-col gap-2">
                          <p className="font-bold text-lg">${lead.value.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground capitalize">{lead.status.replace('-', ' ')}</p>
                          {lead.status === 'new' || lead.status === 'contacted' ? (
                            <Button 
                              size="sm" 
                              onClick={() => handleScheduleSiteVisit(lead.id)}
                              className="gap-1"
                            >
                              Schedule Visit
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Site Visits Section */}
          {activeSection === 'site-visits' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">Site Visits</h1>
                  <p className="text-muted-foreground mt-1">Schedule and manage site visits</p>
                </div>
              </div>

              {siteVisits.length === 0 ? (
                <div className="border border-dashed rounded-lg p-12 text-center">
                  <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-lg">
                    No site visits scheduled. Schedule a site visit from a lead to get started.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {siteVisits.map((visit) => (
                    <div key={visit.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <h3 className="font-semibold text-lg">{visit.leadName}</h3>
                          <p className="text-sm text-muted-foreground">{visit.address}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="h-3 w-3" />
                              {new Date(visit.scheduledDate).toLocaleDateString()} at {visit.scheduledTime}
                            </span>
                          </div>
                          {visit.notes && <p className="text-sm text-muted-foreground mt-2">{visit.notes}</p>}
                        </div>
                        <div className="text-right flex flex-col gap-2">
                          <p className="text-sm text-muted-foreground capitalize">{visit.status.replace('-', ' ')}</p>
                          {visit.status === 'scheduled' || visit.status === 'completed' ? (
                            <Button 
                              size="sm" 
                              onClick={() => handleConvertToEstimate(visit.id)}
                              className="gap-1"
                            >
                              Create Estimate
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Site Visit Dialog */}
              <Dialog open={addSiteVisitDialogOpen} onOpenChange={setAddSiteVisitDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Schedule Site Visit</DialogTitle>
                    <DialogDescription>
                      Schedule a site visit for {newSiteVisit.leadName}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={newSiteVisit.scheduledDate}
                        onChange={(e) => setNewSiteVisit({ ...newSiteVisit, scheduledDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time">Time *</Label>
                      <Input
                        id="time"
                        type="time"
                        value={newSiteVisit.scheduledTime}
                        onChange={(e) => setNewSiteVisit({ ...newSiteVisit, scheduledTime: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address *</Label>
                      <Input
                        id="address"
                        placeholder="123 Main St, City, ST 12345"
                        value={newSiteVisit.address}
                        onChange={(e) => setNewSiteVisit({ ...newSiteVisit, address: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="visit-notes">Notes</Label>
                      <Textarea
                        id="visit-notes"
                        placeholder="Additional information..."
                        value={newSiteVisit.notes}
                        onChange={(e) => setNewSiteVisit({ ...newSiteVisit, notes: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setAddSiteVisitDialogOpen(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button onClick={handleAddSiteVisit} className="flex-1">
                      Schedule Visit
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* Estimates Section */}
          {activeSection === 'estimates' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">Estimates</h1>
                  <p className="text-muted-foreground mt-1">Create and manage estimates</p>
                </div>
                <Dialog open={addEstimateDialogOpen} onOpenChange={setAddEstimateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="gap-2">
                      <Plus className="h-5 w-5" />
                      New Estimate
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Create Estimate</DialogTitle>
                      <DialogDescription>
                        Create a new estimate for a customer
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="est-name">Customer Name *</Label>
                        <Input
                          id="est-name"
                          placeholder="John Doe"
                          value={newEstimate.leadName}
                          onChange={(e) => setNewEstimate({ ...newEstimate, leadName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="est-email">Email</Label>
                        <Input
                          id="est-email"
                          type="email"
                          placeholder="john@example.com"
                          value={newEstimate.contactEmail}
                          onChange={(e) => setNewEstimate({ ...newEstimate, contactEmail: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="est-phone">Phone</Label>
                        <Input
                          id="est-phone"
                          type="tel"
                          placeholder="(555) 123-4567"
                          value={newEstimate.contactPhone}
                          onChange={(e) => setNewEstimate({ ...newEstimate, contactPhone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="est-value">Estimated Value ($) *</Label>
                        <Input
                          id="est-value"
                          type="number"
                          min="0"
                          placeholder="50000"
                          value={newEstimate.value}
                          onChange={(e) => setNewEstimate({ ...newEstimate, value: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setAddEstimateDialogOpen(false)} className="flex-1">
                        Cancel
                      </Button>
                      <Button onClick={handleAddEstimate} className="flex-1">
                        Create Estimate
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {estimates.length === 0 ? (
                <div className="border border-dashed rounded-lg p-12 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-lg">
                    No estimates yet. Create an estimate from a site visit or manually.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {estimates.map((est) => (
                    <div
                      key={est.id}
                      className="border rounded-lg p-6 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedEstimate(est);
                        setEditEstimateDialogOpen(true);
                      }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-xl">{est.leadName}</h3>
                          <p className="text-sm text-muted-foreground">{est.contactEmail}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-2xl">${est.value.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStageColor(est.stage)}`}>
                          {est.stage.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </span>
                        {est.stage === 'accepted' && (
                          <Button 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConvertToJob(est.id);
                            }}
                            className="gap-1"
                          >
                            Create Job
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Edit Estimate Dialog */}
              <Dialog open={editEstimateDialogOpen} onOpenChange={setEditEstimateDialogOpen}>
                <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                  {selectedEstimate && (
                    <>
                      <DialogHeader>
                        <DialogTitle>{selectedEstimate.leadName}</DialogTitle>
                        <DialogDescription>{selectedEstimate.contactEmail}</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Stage</Label>
                            <Select
                              value={selectedEstimate.stage}
                              onValueChange={(value) => handleUpdateEstimate({ 
                                ...selectedEstimate, 
                                stage: value as Estimate['stage'] 
                              })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="sent">Sent</SelectItem>
                                <SelectItem value="follow-up">Follow Up</SelectItem>
                                <SelectItem value="accepted">Accepted</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Value ($)</Label>
                            <Input
                              type="number"
                              value={selectedEstimate.value}
                              onChange={(e) => handleUpdateEstimate({ 
                                ...selectedEstimate, 
                                value: parseFloat(e.target.value) 
                              })}
                            />
                          </div>
                        </div>

                        {/* Products Section */}
                        <div className="space-y-3">
                          <Label className="text-lg font-semibold">Products/Services</Label>
                          {selectedEstimate.products.length > 0 && (
                            <div className="border rounded-lg overflow-hidden">
                              <table className="w-full">
                                <thead className="bg-muted">
                                  <tr>
                                    <th className="text-left p-2">Item</th>
                                    <th className="text-right p-2">Qty</th>
                                    <th className="text-right p-2">Unit Price</th>
                                    <th className="text-right p-2">Total</th>
                                    <th className="w-10"></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {selectedEstimate.products.map((product) => (
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
                                      ${selectedEstimate.products.reduce((sum, p) => sum + p.total, 0).toLocaleString()}
                                    </td>
                                    <td></td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Input
                              placeholder="Item name"
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
                          {selectedEstimate.notes.map((note) => (
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

          {/* Jobs Section */}
          {activeSection === 'jobs' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">Jobs</h1>
                  <p className="text-muted-foreground mt-1">Manage active and completed jobs</p>
                </div>
              </div>

              {jobs.length === 0 ? (
                <div className="border border-dashed rounded-lg p-12 text-center">
                  <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-lg">
                    No jobs yet. Convert an accepted estimate to create a job.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <div key={job.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <h3 className="font-semibold text-lg">{job.projectName}</h3>
                          <p className="text-sm text-muted-foreground">{job.customerName}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="h-3 w-3" />
                              Starts: {new Date(job.startDate).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {job.customerPhone}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{job.address}</p>
                        </div>
                        <div className="text-right flex flex-col gap-2">
                          <p className="font-bold text-lg">${job.value.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground capitalize">{job.status.replace('-', ' ')}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Job Dialog */}
              <Dialog open={addJobDialogOpen} onOpenChange={setAddJobDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create Job</DialogTitle>
                    <DialogDescription>
                      Schedule work start for this project
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="job-name">Project Name *</Label>
                      <Input
                        id="job-name"
                        value={newJob.projectName}
                        onChange={(e) => setNewJob({ ...newJob, projectName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="start-date">Start Date *</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={newJob.startDate}
                        onChange={(e) => setNewJob({ ...newJob, startDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="job-address">Address *</Label>
                      <Input
                        id="job-address"
                        placeholder="123 Main St, City, ST 12345"
                        value={newJob.address}
                        onChange={(e) => setNewJob({ ...newJob, address: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="job-notes">Notes</Label>
                      <Textarea
                        id="job-notes"
                        placeholder="Additional information..."
                        value={newJob.notes}
                        onChange={(e) => setNewJob({ ...newJob, notes: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setAddJobDialogOpen(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button onClick={handleAddJob} className="flex-1">
                      Create Job
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* Communications Section */}
          {activeSection === 'communications' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">Communications</h1>
                  <p className="text-muted-foreground mt-1">Track emails, texts, and calls</p>
                </div>
                <Dialog open={addCommunicationDialogOpen} onOpenChange={setAddCommunicationDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="gap-2">
                      <Plus className="h-5 w-5" />
                      New Communication
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Send Communication</DialogTitle>
                      <DialogDescription>
                        Send an email, SMS, or log a call
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="comm-job">Job *</Label>
                        <Select
                          value={newCommunication.jobId}
                          onValueChange={(value) => {
                            const job = jobs.find(j => j.id === value);
                            setNewCommunication({ 
                              ...newCommunication, 
                              jobId: value,
                              recipientName: job?.customerName || ''
                            });
                          }}
                        >
                          <SelectTrigger id="comm-job">
                            <SelectValue placeholder="Select a job" />
                          </SelectTrigger>
                          <SelectContent>
                            {jobs.map((job) => (
                              <SelectItem key={job.id} value={job.id}>
                                {job.projectName} - {job.customerName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="comm-type">Type *</Label>
                        <Select
                          value={newCommunication.type}
                          onValueChange={(value) => setNewCommunication({ ...newCommunication, type: value as Communication['type'] })}
                        >
                          <SelectTrigger id="comm-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="sms">SMS</SelectItem>
                            <SelectItem value="call">Call</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="comm-subject">Subject *</Label>
                        <Input
                          id="comm-subject"
                          placeholder="Project update..."
                          value={newCommunication.subject}
                          onChange={(e) => setNewCommunication({ ...newCommunication, subject: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="comm-message">Message *</Label>
                        <Textarea
                          id="comm-message"
                          placeholder="Your message..."
                          value={newCommunication.message}
                          onChange={(e) => setNewCommunication({ ...newCommunication, message: e.target.value })}
                          rows={4}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setAddCommunicationDialogOpen(false)} className="flex-1">
                        Cancel
                      </Button>
                      <Button onClick={handleAddCommunication} className="flex-1">
                        Send
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {communications.length === 0 ? (
                <div className="border border-dashed rounded-lg p-12 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-lg">
                    No communications yet. Send your first message to a customer.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {communications.map((comm) => (
                    <div key={comm.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs uppercase font-semibold px-2 py-1 rounded bg-muted">
                            {comm.type}
                          </span>
                          <span className="text-sm font-medium">{comm.recipientName}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comm.sentAt).toLocaleString()}
                        </span>
                      </div>
                      <h4 className="font-semibold mb-1">{comm.subject}</h4>
                      <p className="text-sm text-muted-foreground">{comm.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Payments Section */}
          {activeSection === 'payments' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">Payments</h1>
                  <p className="text-muted-foreground mt-1">Track project payments and collections</p>
                </div>
                <Dialog open={addPaymentDialogOpen} onOpenChange={setAddPaymentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="gap-2">
                      <Plus className="h-5 w-5" />
                      New Payment
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Create Payment</DialogTitle>
                      <DialogDescription>
                        Create a payment record for a job
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="payment-job">Job *</Label>
                        <Select
                          value={newPayment.jobId}
                          onValueChange={(value) => setNewPayment({ ...newPayment, jobId: value })}
                        >
                          <SelectTrigger id="payment-job">
                            <SelectValue placeholder="Select a job" />
                          </SelectTrigger>
                          <SelectContent>
                            {jobs.map((job) => (
                              <SelectItem key={job.id} value={job.id}>
                                {job.projectName} - {job.customerName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="payment-type">Payment Type *</Label>
                        <Select
                          value={newPayment.type}
                          onValueChange={(value) => setNewPayment({ ...newPayment, type: value as Payment['type'] })}
                        >
                          <SelectTrigger id="payment-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="deposit">Deposit</SelectItem>
                            <SelectItem value="progress">Progress Payment</SelectItem>
                            <SelectItem value="final">Final Payment</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="payment-amount">Amount ($) *</Label>
                        <Input
                          id="payment-amount"
                          type="number"
                          min="0"
                          placeholder="5000"
                          value={newPayment.amount}
                          onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="payment-due">Due Date *</Label>
                        <Input
                          id="payment-due"
                          type="date"
                          value={newPayment.dueDate}
                          onChange={(e) => setNewPayment({ ...newPayment, dueDate: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="payment-notes">Notes</Label>
                        <Textarea
                          id="payment-notes"
                          placeholder="Additional information..."
                          value={newPayment.notes}
                          onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                          rows={3}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setAddPaymentDialogOpen(false)} className="flex-1">
                        Cancel
                      </Button>
                      <Button onClick={handleAddPayment} className="flex-1">
                        Create Payment
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {payments.length === 0 ? (
                <div className="border border-dashed rounded-lg p-12 text-center">
                  <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-lg">
                    No payments yet. Create payment records for your jobs.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {payments.map((payment) => {
                    const job = jobs.find(j => j.id === payment.jobId);
                    return (
                      <div key={payment.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h3 className="font-semibold text-lg">{job?.projectName}</h3>
                            <p className="text-sm text-muted-foreground capitalize">{payment.type} Payment</p>
                            <p className="text-xs text-muted-foreground">
                              Due: {new Date(payment.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-xl">${payment.amount.toLocaleString()}</p>
                            <span className={`text-sm px-2 py-1 rounded ${
                              payment.status === 'paid' ? 'bg-green-100 text-green-700' :
                              payment.status === 'overdue' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {payment.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Reviews Section */}
          {activeSection === 'reviews' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">Reviews</h1>
                  <p className="text-muted-foreground mt-1">Request and manage customer reviews</p>
                </div>
              </div>

              {reviews.length === 0 ? (
                <div className="border border-dashed rounded-lg p-12 text-center">
                  <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-lg">
                    No reviews yet. Request reviews from completed jobs.
                  </p>
                  {jobs.filter(j => j.status === 'completed').length > 0 && (
                    <div className="mt-6">
                      <p className="text-sm text-muted-foreground mb-4">Completed jobs ready for review:</p>
                      <div className="space-y-2 max-w-md mx-auto">
                        {jobs.filter(j => j.status === 'completed').slice(0, 3).map((job) => (
                          <div key={job.id} className="flex items-center justify-between p-3 border rounded">
                            <span className="text-sm">{job.projectName}</span>
                            <Button size="sm" onClick={() => handleRequestReview(job.id)}>
                              Request Review
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => {
                    const job = jobs.find(j => j.id === review.jobId);
                    return (
                      <div key={review.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold">{review.customerName}</h3>
                            <p className="text-sm text-muted-foreground">{job?.projectName}</p>
                          </div>
                          <span className={`text-xs uppercase font-semibold px-2 py-1 rounded ${
                            review.status === 'received' ? 'bg-green-100 text-green-700' :
                            review.status === 'published' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {review.status.replace('-', ' ')}
                          </span>
                        </div>
                        {review.rating > 0 && (
                          <div className="flex items-center gap-1 mb-2">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                        )}
                        {review.comment && <p className="text-sm">{review.comment}</p>}
                        <p className="text-xs text-muted-foreground mt-2">
                          Requested: {new Date(review.requestedAt).toLocaleDateString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add Review Dialog */}
              <Dialog open={addReviewDialogOpen} onOpenChange={setAddReviewDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Request Review</DialogTitle>
                    <DialogDescription>
                      Send a review request to {newReview.customerName}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <p className="text-sm text-muted-foreground">
                      A review request will be sent to this customer via email and SMS.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setAddReviewDialogOpen(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button onClick={handleAddReview} className="flex-1">
                      Send Request
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
