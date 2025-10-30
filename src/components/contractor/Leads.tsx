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
  BriefcaseBusiness
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import ct1Logo from "@/assets/ct1-logo-main.png";

interface Lead {
  id: string;
  name: string;
  project: string;
  value: number;
  status: 'new' | 'contacted' | 'quoted' | 'won' | 'lost';
  date: string;
  phone?: string;
  email?: string;
}

export function Leads() {
  const [leads] = useState<Lead[]>([
    { 
      id: '1', 
      name: 'Sarah Johnson', 
      project: 'Kitchen Remodel', 
      value: 25000, 
      status: 'new', 
      date: '2024-01-15',
      phone: '(555) 123-4567',
      email: 'sarah.j@email.com'
    },
    { 
      id: '2', 
      name: 'Mike Chen', 
      project: 'Bathroom Addition', 
      value: 18000, 
      status: 'contacted', 
      date: '2024-01-14',
      phone: '(555) 234-5678',
      email: 'mike.c@email.com'
    },
    { 
      id: '3', 
      name: 'Lisa Rodriguez', 
      project: 'Deck Installation', 
      value: 12000, 
      status: 'quoted', 
      date: '2024-01-13',
      phone: '(555) 345-6789',
      email: 'lisa.r@email.com'
    }
  ]);

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [vocallinkLoading, setVocallinkLoading] = useState(true);
  const [provenjobsLoading, setProvenjobsLoading] = useState(true);
  const { toast } = useToast();

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500 hover:bg-blue-600';
      case 'contacted': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'quoted': return 'bg-orange-500 hover:bg-orange-600';
      case 'won': return 'bg-green-500 hover:bg-green-600';
      case 'lost': return 'bg-red-500 hover:bg-red-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const totalValue = leads.reduce((sum, lead) => sum + lead.value, 0);
  const newLeads = leads.filter(l => l.status === 'new').length;

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
        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Import Leads
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

      <Tabs defaultValue="pipeline" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pipeline" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Leads Pipeline</span>
            <span className="sm:hidden">Leads</span>
          </TabsTrigger>
          <TabsTrigger value="vocallink" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">VocalLink CRM</span>
            <span className="sm:hidden">CRM</span>
          </TabsTrigger>
          <TabsTrigger value="provenjobs" className="flex items-center gap-2">
            <BriefcaseBusiness className="h-4 w-4" />
            <span className="hidden sm:inline">ProvenJobs</span>
            <span className="sm:hidden">Jobs</span>
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
                    <p className="text-sm text-muted-foreground">Total Leads</p>
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
                    <p className="text-sm text-muted-foreground">New This Week</p>
                    <p className="text-2xl font-bold">{newLeads}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Leads Table */}
          <Card>
            <CardHeader>
              <CardTitle>Active Leads</CardTitle>
              <CardDescription>Track and manage your sales pipeline</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leads.map((lead) => (
                  <div key={lead.id} className="flex flex-col md:flex-row md:items-center md:justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h4 className="font-semibold">{lead.name}</h4>
                        <Badge className={`${getStatusColor(lead.status)} text-white`}>
                          {lead.status.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{lead.project}</p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span className="break-all">{lead.phone}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span className="break-all">{lead.email}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(lead.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between md:justify-end gap-4">
                      <div className="text-left md:text-right">
                        <p className="text-sm text-muted-foreground">Value</p>
                        <p className="font-bold text-lg">${lead.value.toLocaleString()}</p>
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
          </Card>
        </TabsContent>

        <TabsContent value="vocallink" className="mt-6">
          <Card className="border-0">
            <CardContent className="p-0">
              <div className="relative w-full" style={{ height: 'calc(100vh - 280px)', minHeight: '600px' }}>
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
                  src="https://vocallink-pro.lovable.app/admin"
                  className="w-full h-full border-0 rounded-lg"
                  title="VocalLink Pro CRM"
                  onLoad={() => setVocallinkLoading(false)}
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="provenjobs" className="mt-6">
          <Card className="border-0">
            <CardContent className="p-0">
              <div className="relative w-full" style={{ height: 'calc(100vh - 280px)', minHeight: '600px' }}>
                {provenjobsLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background">
                    <div className="space-y-4 w-full max-w-md p-8">
                      <Skeleton className="h-8 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <div className="pt-4 space-y-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                      </div>
                    </div>
                  </div>
                )}
                <iframe
                  src="https://www.psaweblogin.com/"
                  className="w-full h-full border-0 rounded-lg"
                  title="ProvenJobs Portal"
                  onLoad={() => setProvenjobsLoading(false)}
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
