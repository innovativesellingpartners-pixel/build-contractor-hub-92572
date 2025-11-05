import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users, 
  Phone, 
  Mail, 
  Calendar,
  DollarSign,
  FileText,
  TrendingUp,
  Upload,
  Briefcase,
  Plus
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ct1Logo from "@/assets/ct1-logo-main.png";

interface Lead {
  id: string;
  name: string;
  project: string;
  value: number;
  stage: 'qualification' | 'discovery_lwe' | 'demo' | 'proposal' | 'negotiation' | 'closing' | 'psfw';
  date: string;
  phone?: string;
  email?: string;
}

export function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [addLeadDialogOpen, setAddLeadDialogOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const { toast } = useToast();

  // New lead form state
  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    phone: '',
    project: '',
    value: '',
    stage: 'qualification' as Lead['stage'],
    notes: ''
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a CSV file",
          variant: "destructive",
        });
        return;
      }
      setUploadedFile(file);
    }
  };

  const handleImport = async () => {
    if (!uploadedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a CSV file to import",
        variant: "destructive",
      });
      return;
    }

    // Simulate import - in real implementation, this would parse CSV and add to database
    toast({
      title: "Import Started",
      description: `Processing ${uploadedFile.name}...`,
    });

    // Simulate processing delay
    setTimeout(() => {
      toast({
        title: "Import Successful",
        description: "Your leads have been imported successfully",
      });
      setImportDialogOpen(false);
      setUploadedFile(null);
    }, 1500);
  };

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
      stage: newLead.stage,
      date: new Date().toISOString().split('T')[0]
    };

    setLeads([lead, ...leads]);

    toast({
      title: "Lead Added",
      description: `${lead.name} has been added to your pipeline`,
    });

    // Reset form and close dialog
    setNewLead({
      name: '',
      email: '',
      phone: '',
      project: '',
      value: '',
      stage: 'qualification',
      notes: ''
    });
    setAddLeadDialogOpen(false);
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'qualification': return 'bg-blue-500 hover:bg-blue-600';
      case 'discovery_lwe': return 'bg-cyan-500 hover:bg-cyan-600';
      case 'demo': return 'bg-purple-500 hover:bg-purple-600';
      case 'proposal': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'negotiation': return 'bg-orange-500 hover:bg-orange-600';
      case 'closing': return 'bg-green-500 hover:bg-green-600';
      case 'psfw': return 'bg-emerald-500 hover:bg-emerald-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getStageLabel = (stage: string) => {
    switch (stage) {
      case 'qualification': return 'Qualification';
      case 'discovery_lwe': return 'Discovery/LWE';
      case 'demo': return 'Demo';
      case 'proposal': return 'Proposal';
      case 'negotiation': return 'Negotiation';
      case 'closing': return 'Closing';
      case 'psfw': return 'PSFW';
      default: return stage;
    }
  };

  const stages: Lead['stage'][] = ['qualification', 'discovery_lwe', 'demo', 'proposal', 'negotiation', 'closing', 'psfw'];

  const totalValue = leads.reduce((sum, lead) => sum + lead.value, 0);
  const newLeads = leads.filter(l => l.stage === 'qualification').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b">
        <div className="flex items-center gap-4">
          <img src={ct1Logo} alt="CT1 Logo" className="h-12 w-12" />
          <div>
            <h2 className="text-3xl font-bold mb-1">CRM & Jobs Hub</h2>
            <p className="text-muted-foreground">Manage leads, jobs, and customer relationships</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={addLeadDialogOpen} onOpenChange={setAddLeadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
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
                  <Label htmlFor="stage">Stage</Label>
                  <Select
                    value={newLead.stage}
                    onValueChange={(value) => setNewLead({ ...newLead, stage: value as Lead['stage'] })}
                  >
                    <SelectTrigger id="stage">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="qualification">Qualification</SelectItem>
                      <SelectItem value="discovery_lwe">Discovery/LWE</SelectItem>
                      <SelectItem value="demo">Demo</SelectItem>
                      <SelectItem value="proposal">Proposal</SelectItem>
                      <SelectItem value="negotiation">Negotiation</SelectItem>
                      <SelectItem value="closing">Closing</SelectItem>
                      <SelectItem value="psfw">PSFW</SelectItem>
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
                      stage: 'qualification',
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

          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Import CSV
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Import Leads from CSV</DialogTitle>
              <DialogDescription>
                Upload a CSV file containing your leads data. The file should include columns for name, email, phone, project, and value.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="csv-file">CSV File</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                {uploadedFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {uploadedFile.name}
                  </p>
                )}
              </div>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">CSV Format Example:</p>
                <code className="text-xs block bg-background p-2 rounded">
                  name,email,phone,project,value,status<br/>
                  John Doe,john@email.com,(555)123-4567,Kitchen,25000,new
                </code>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setImportDialogOpen(false);
                  setUploadedFile(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={!uploadedFile}
                className="flex-1"
              >
                Import Leads
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>

      <Tabs defaultValue="vocallink" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="vocallink" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">VocalLink CRM</span>
            <span className="sm:hidden">CRM</span>
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Opportunity Pipeline</span>
            <span className="sm:hidden">Pipeline</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="mt-6 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Pipeline Value</p>
                    <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Opportunities</p>
                    <p className="text-2xl font-bold">{leads.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">In Qualification</p>
                    <p className="text-2xl font-bold">{newLeads}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pipeline Stages */}
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {stages.map((stage) => {
                const stageLeads = leads.filter(lead => lead.stage === stage);
                const stageValue = stageLeads.reduce((sum, lead) => sum + lead.value, 0);
                
                return (
                  <Card key={stage} className="flex-shrink-0 w-80">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold">
                          {getStageLabel(stage)}
                        </CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          {stageLeads.length}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs">
                        ${stageValue.toLocaleString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
                      {stageLeads.map((lead) => (
                        <Card key={lead.id} className="p-3 border-2 hover:border-primary/50 transition-colors cursor-pointer">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-semibold text-sm line-clamp-1">{lead.name}</h4>
                              <Badge className={`${getStageColor(stage)} text-white text-xs flex-shrink-0`}>
                                ${(lead.value / 1000).toFixed(0)}K
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">{lead.project}</p>
                            <div className="flex flex-col gap-1 text-xs">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Phone className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{lead.phone}</span>
                              </div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Mail className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{lead.email}</span>
                              </div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Calendar className="h-3 w-3 flex-shrink-0" />
                                <span>{new Date(lead.date).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="flex gap-1 pt-1">
                              <Button variant="outline" size="sm" className="h-7 flex-1 text-xs">
                                <Phone className="h-3 w-3 mr-1" />
                                Call
                              </Button>
                              <Button variant="outline" size="sm" className="h-7 flex-1 text-xs">
                                <Mail className="h-3 w-3 mr-1" />
                                Email
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                      {stageLeads.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          No opportunities in this stage
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="vocallink" className="mt-6 space-y-6">
          {/* Call Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Call Analytics
              </CardTitle>
              <CardDescription>Overview of your call activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Total Calls</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Incoming</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Outgoing</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Missed</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Avg Duration</p>
                  <p className="text-2xl font-bold">0m</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contractor Call Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Contractor Call Activity</CardTitle>
              <CardDescription>Recent call history and recordings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No Call Activity</p>
                <p className="text-sm">Your call history will appear here once you start making or receiving calls</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
