import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { 
  Users, 
  Phone, 
  Mail, 
  Calendar,
  DollarSign,
  FileText,
  TrendingUp,
  ExternalLink
} from "lucide-react";
import { useState } from "react";

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

export function ContractorCRM() {
  const [crmDialogOpen, setCrmDialogOpen] = useState(true);
  
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">CT1 ZCRM</h2>
          <p className="text-muted-foreground">Manage your leads and customer relationships</p>
        </div>
        <Dialog open={crmDialogOpen} onOpenChange={setCrmDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <ExternalLink className="h-4 w-4 mr-2" />
              Open CRM
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl h-[90vh] p-0">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b">
                <div>
                  <h3 className="text-lg font-semibold">CT1/PSA CRM Login</h3>
                  <p className="text-sm text-muted-foreground">Login to access your CRM within CT1</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setCrmDialogOpen(false)}
                >
                  Close
                </Button>
              </div>
              <div className="flex-1 overflow-hidden">
                <iframe 
                  src="https://psarcweb.com/front/account/login.aspx/1000"
                  className="w-full h-full border-0"
                  title="CT1 CRM Login"
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

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
    </div>
  );
}