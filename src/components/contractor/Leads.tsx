import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
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
  BriefcaseBusiness,
  Plus,
  CheckCircle2
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ct1Logo from "@/assets/ct1-round-logo-new.png";

interface Opportunity {
  id: string;
  name: string;
  project: string;
  value: number;
  stage: 'qualification' | 'discovery' | 'demo' | 'proposal' | 'negotiation' | 'closing' | 'psfw';
  date: string;
  phone?: string;
  email?: string;
}

const STAGE_LABELS = {
  qualification: 'Qualification',
  discovery: 'Discovery/LWE',
  demo: 'Demo',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  closing: 'Closing',
  psfw: 'PSFW'
};

export function Leads() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [addOpportunityDialogOpen, setAddOpportunityDialogOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [vocallinkLoading, setVocallinkLoading] = useState(true);
  const [vocallinkUrl, setVocallinkUrl] = useState("https://vocallink-pro.lovable.app/admin");
  const [debugInfo, setDebugInfo] = useState<{ hasToken: boolean; hasRefresh: boolean; email: string }>({ hasToken: false, hasRefresh: false, email: '' });
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const getVocallinkUrl = async () => {
      if (user) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          // Pass auth tokens and user email to VocalLink for auto-login
          const params = new URLSearchParams({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token ?? '',
            email: user.email || '',
            auto_login: 'true'
          });
          setVocallinkUrl(`https://vocallink-pro.lovable.app/admin?${params.toString()}`);
          
          // Set debug info
          setDebugInfo({
            hasToken: !!data.session.access_token,
            hasRefresh: !!data.session.refresh_token,
            email: user.email || ''
          });
        }
      }
    };
    getVocallinkUrl();
  }, [user]);

  // New opportunity form state
  const [newOpportunity, setNewOpportunity] = useState({
    name: '',
    email: '',
    phone: '',
    project: '',
    value: '',
    stage: 'qualification' as Opportunity['stage'],
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
        description: "Your opportunities have been imported successfully",
      });
      setImportDialogOpen(false);
      setUploadedFile(null);
    }, 1500);
  };

  const handleAddOpportunity = () => {
    // Validate required fields
    if (!newOpportunity.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter the contact's name",
        variant: "destructive",
      });
      return;
    }

    if (!newOpportunity.email.trim() || !newOpportunity.email.includes('@')) {
      toast({
        title: "Valid Email Required",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (!newOpportunity.phone.trim()) {
      toast({
        title: "Phone Required",
        description: "Please enter a phone number",
        variant: "destructive",
      });
      return;
    }

    if (!newOpportunity.project.trim()) {
      toast({
        title: "Project Required",
        description: "Please enter the project description",
        variant: "destructive",
      });
      return;
    }

    if (!newOpportunity.value || parseFloat(newOpportunity.value) <= 0) {
      toast({
        title: "Valid Value Required",
        description: "Please enter a valid project value",
        variant: "destructive",
      });
      return;
    }

    // Create new opportunity
    const opportunity: Opportunity = {
      id: Date.now().toString(),
      name: newOpportunity.name.trim(),
      email: newOpportunity.email.trim(),
      phone: newOpportunity.phone.trim(),
      project: newOpportunity.project.trim(),
      value: parseFloat(newOpportunity.value),
      stage: newOpportunity.stage,
      date: new Date().toISOString().split('T')[0]
    };

    setOpportunities([opportunity, ...opportunities]);

    toast({
      title: "Opportunity Added",
      description: `${opportunity.name} has been added to your pipeline`,
    });

    // Reset form and close dialog
    setNewOpportunity({
      name: '',
      email: '',
      phone: '',
      project: '',
      value: '',
      stage: 'qualification',
      notes: ''
    });
    setAddOpportunityDialogOpen(false);
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'qualification': return 'bg-blue-500 hover:bg-blue-600';
      case 'discovery': return 'bg-purple-500 hover:bg-purple-600';
      case 'demo': return 'bg-cyan-500 hover:bg-cyan-600';
      case 'proposal': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'negotiation': return 'bg-orange-500 hover:bg-orange-600';
      case 'closing': return 'bg-green-500 hover:bg-green-600';
      case 'psfw': return 'bg-emerald-500 hover:bg-emerald-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const totalValue = opportunities.reduce((sum, opp) => sum + opp.value, 0);
  const activeOpportunities = opportunities.length;

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
          <Dialog open={addOpportunityDialogOpen} onOpenChange={setAddOpportunityDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Opportunity
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Opportunity</DialogTitle>
                <DialogDescription>
                  Enter the details of your new opportunity to add it to your pipeline.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label htmlFor="name">Contact Name *</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={newOpportunity.name}
                    onChange={(e) => setNewOpportunity({ ...newOpportunity, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={newOpportunity.email}
                    onChange={(e) => setNewOpportunity({ ...newOpportunity, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={newOpportunity.phone}
                    onChange={(e) => setNewOpportunity({ ...newOpportunity, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project">Project Description *</Label>
                  <Input
                    id="project"
                    placeholder="Kitchen Remodel"
                    value={newOpportunity.project}
                    onChange={(e) => setNewOpportunity({ ...newOpportunity, project: e.target.value })}
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
                    value={newOpportunity.value}
                    onChange={(e) => setNewOpportunity({ ...newOpportunity, value: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stage">Stage</Label>
                  <Select
                    value={newOpportunity.stage}
                    onValueChange={(value) => setNewOpportunity({ ...newOpportunity, stage: value as Opportunity['stage'] })}
                  >
                    <SelectTrigger id="stage">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="qualification">Qualification</SelectItem>
                      <SelectItem value="discovery">Discovery/LWE</SelectItem>
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
                    placeholder="Additional information about the opportunity..."
                    value={newOpportunity.notes}
                    onChange={(e) => setNewOpportunity({ ...newOpportunity, notes: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setAddOpportunityDialogOpen(false);
                    setNewOpportunity({
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
                <Button onClick={handleAddOpportunity} className="flex-1">
                  Add Opportunity
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
              <DialogTitle>Import Opportunities from CSV</DialogTitle>
              <DialogDescription>
                Upload a CSV file containing your opportunities data. The file should include columns for name, email, phone, project, value, and stage.
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
                  name,email,phone,project,value,stage<br/>
                  John Doe,john@email.com,(555)123-4567,Kitchen,25000,qualification
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
                Import Opportunities
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

        <TabsContent value="vocallink" className="mt-6">
          <Card className="border-0">
            <CardContent className="p-0">
              {/* Debug Info Panel */}
              <div className="mb-4 p-4 bg-muted/50 rounded-lg border border-border">
                <h4 className="font-semibold mb-2 text-sm">🔍 Auto-Login Debug Info</h4>
                <div className="space-y-1 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className={debugInfo.hasToken ? 'text-green-600' : 'text-red-600'}>
                      {debugInfo.hasToken ? '✓' : '✗'}
                    </span>
                    <span>Access Token: {debugInfo.hasToken ? 'Present' : 'Missing'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={debugInfo.hasRefresh ? 'text-green-600' : 'text-red-600'}>
                      {debugInfo.hasRefresh ? '✓' : '✗'}
                    </span>
                    <span>Refresh Token: {debugInfo.hasRefresh ? 'Present' : 'Missing'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={debugInfo.email ? 'text-green-600' : 'text-red-600'}>
                      {debugInfo.email ? '✓' : '✗'}
                    </span>
                    <span>Email: {debugInfo.email || 'Missing'}</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-border text-muted-foreground">
                    💡 If tokens are present but login still required, VocalLink may use a different backend
                  </div>
                </div>
              </div>
              
              <div className="relative w-full" style={{ height: 'calc(100vh - 380px)', minHeight: '500px' }}>
                {vocallinkLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background">
                    <div className="space-y-4 w-full max-w-md p-8">
                      <Skeleton className="h-8 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <div className="pt-4 space-y-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                      </div>
                    </div>
                  </div>
                )}
                <iframe
                  src={vocallinkUrl}
                  className="w-full h-full border-0 rounded-lg"
                  title="VocalLink Pro CRM"
                  onLoad={() => setVocallinkLoading(false)}
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>



        <TabsContent value="pipeline" className="mt-6 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <p className="text-sm text-muted-foreground">Active Opportunities</p>
                    <p className="text-2xl font-bold">{activeOpportunities}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sales Process Stages */}
          <div className="space-y-4">
            {(['qualification', 'discovery', 'demo', 'proposal', 'negotiation', 'closing', 'psfw'] as const).map((stage) => {
              const stageOpportunities = opportunities.filter(opp => opp.stage === stage);
              const stageValue = stageOpportunities.reduce((sum, opp) => sum + opp.value, 0);
              
              return (
                <Card key={stage}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className={`${getStageColor(stage)} text-white`}>
                          {STAGE_LABELS[stage]}
                        </Badge>
                        <div>
                          <CardTitle className="text-lg">{stageOpportunities.length} {stageOpportunities.length === 1 ? 'Opportunity' : 'Opportunities'}</CardTitle>
                          <CardDescription>${stageValue.toLocaleString()} Total Value</CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  {stageOpportunities.length > 0 && (
                    <CardContent>
                      <div className="space-y-3">
                        {stageOpportunities.map((opportunity) => (
                          <div key={opportunity.id} className="flex flex-col md:flex-row md:items-center md:justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-4">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold mb-1">{opportunity.name}</h4>
                              <p className="text-sm text-muted-foreground mb-2">{opportunity.project}</p>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  <span className="break-all">{opportunity.phone}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  <span className="break-all">{opportunity.email}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{new Date(opportunity.date).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between md:justify-end gap-4">
                              <div className="text-left md:text-right">
                                <p className="text-sm text-muted-foreground">Value</p>
                                <p className="font-bold text-lg">${opportunity.value.toLocaleString()}</p>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                  <Phone className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Mail className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm">
                                  <FileText className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
