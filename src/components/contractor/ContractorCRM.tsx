import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

export function ContractorCRM() {
  
  
  const [leads] = useState<Lead[]>([]);

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
            <h2 className="text-3xl font-bold mb-1">CT1 ZCRM</h2>
            <p className="text-muted-foreground">Manage your leads and customer relationships</p>
          </div>
        </div>
          <Button size="lg" asChild>
            <a
              href="https://psarcweb.com/PSAWeb/Account/Login?ReturnUrl=%2fPSAWeb"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open ProvenJobs login in a new tab"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              ProvenJobs
            </a>
          </Button>
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