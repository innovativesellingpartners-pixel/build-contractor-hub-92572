import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Calendar,
  Bell,
  Settings,
  FileText,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  LogOut,
  User
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Lead {
  id: string;
  name: string;
  project: string;
  value: number;
  status: 'new' | 'contacted' | 'quoted' | 'won' | 'lost';
  date: string;
}

interface Job {
  id: string;
  client: string;
  project: string;
  status: 'scheduled' | 'in-progress' | 'completed';
  progress: number;
  dueDate: string;
}

export function Dashboard() {
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  
  const [leads] = useState<Lead[]>([
    { id: '1', name: 'Sarah Johnson', project: 'Kitchen Remodel', value: 25000, status: 'new', date: '2024-01-15' },
    { id: '2', name: 'Mike Chen', project: 'Bathroom Addition', value: 18000, status: 'contacted', date: '2024-01-14' },
    { id: '3', name: 'Lisa Rodriguez', project: 'Deck Installation', value: 12000, status: 'quoted', date: '2024-01-13' },
    { id: '4', name: 'John Smith', project: 'Basement Finish', value: 35000, status: 'won', date: '2024-01-12' },
  ]);

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  const [jobs] = useState<Job[]>([
    { id: '1', client: 'Johnson Residence', project: 'Kitchen Remodel', status: 'in-progress', progress: 65, dueDate: '2024-02-15' },
    { id: '2', client: 'Chen Property', project: 'Bathroom Addition', status: 'scheduled', progress: 0, dueDate: '2024-02-20' },
    { id: '3', client: 'Smith Home', project: 'Basement Finish', status: 'in-progress', progress: 30, dueDate: '2024-03-01' },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500';
      case 'contacted': return 'bg-yellow-500';
      case 'quoted': return 'bg-orange-500';
      case 'won': return 'bg-green-500';
      case 'lost': return 'bg-red-500';
      case 'scheduled': return 'bg-blue-500';
      case 'in-progress': return 'bg-yellow-500';
      case 'completed': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const totalRevenue = jobs.reduce((sum, job) => {
    const matchingLead = leads.find(lead => lead.name === job.client.replace(' Residence', '').replace(' Property', '').replace(' Home', ''));
    const leadValue = matchingLead?.value || 20000; // Default value if no match
    return sum + (job.status === 'completed' ? leadValue : 0);
  }, 0);

  const activeJobs = jobs.filter(job => job.status !== 'completed').length;
  const totalLeads = leads.length;
  const conversionRate = Math.round((leads.filter(lead => lead.status === 'won').length / totalLeads) * 100);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground border-construction pl-4">Business <span className="accent-orange">Overview</span></h1>
            <p className="text-muted-foreground mt-2 pl-4">
              Welcome back, {profile?.company_name || user?.email}! Here's your business snapshot.
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <div className="flex items-center gap-2 mr-4">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{user?.email}</span>
            </div>
            <Button variant="outline" size="icon">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="card-industrial">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-construction-orange" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="card-industrial">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <Calendar className="h-4 w-4 text-construction-orange" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeJobs}</div>
              <p className="text-xs text-muted-foreground">
                2 starting this week
              </p>
            </CardContent>
          </Card>

          <Card className="card-industrial">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-construction-orange" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalLeads}</div>
              <p className="text-xs text-muted-foreground">
                +3 this week
              </p>
            </CardContent>
          </Card>

          <Card className="card-industrial">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-construction-orange" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{conversionRate}%</div>
              <p className="text-xs text-muted-foreground">
                +5% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Lead Tracker */}
          <Card className="card-industrial">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl border-construction pl-4">Lead <span className="accent-orange">Tracker</span></CardTitle>
                <Button variant="outline" size="sm">
                  <ChevronRight className="h-4 w-4 ml-1" />
                  View All
                </Button>
              </div>
              <CardDescription>
                Manage your sales pipeline and track lead progress
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {leads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{lead.name}</h4>
                      <Badge className={`${getStatusColor(lead.status)} text-white text-xs`}>
                        {lead.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{lead.project}</p>
                    <p className="text-sm font-medium text-primary">${lead.value.toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Phone className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Mail className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Active Projects */}
          <Card className="card-industrial">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Active Projects</CardTitle>
                <Button variant="outline" size="sm">
                  <ChevronRight className="h-4 w-4 ml-1" />
                  View All
                </Button>
              </div>
              <CardDescription>
                Track project progress and upcoming deadlines
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className="p-3 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{job.client}</h4>
                    <Badge className={`${getStatusColor(job.status)} text-white text-xs`}>
                      {job.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{job.project}</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>Progress</span>
                      <span>{job.progress}%</span>
                    </div>
                    <Progress value={job.progress} className="h-2" />
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Due: {new Date(job.dueDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <Card className="card-industrial">
            <CardHeader>
              <CardTitle className="text-xl">Quick Actions</CardTitle>
              <CardDescription>
                Access key features and marketplace services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="contractor" className="h-auto flex-col p-4" asChild>
                  <Link to="/dashboard/marketplace">
                    <Star className="h-6 w-6 mb-2" />
                    <span className="text-sm">Marketplace</span>
                  </Link>
                </Button>
                <Button variant="contractor" className="h-auto flex-col p-4" asChild>
                  <Link to="/dashboard/training">
                    <FileText className="h-6 w-6 mb-2" />
                    <span className="text-sm">Training Hub</span>
                  </Link>
                </Button>
                <Button variant="contractor" className="h-auto flex-col p-4" asChild>
                  <Link to="/dashboard/leads">
                    <Users className="h-6 w-6 mb-2" />
                    <span className="text-sm">Manage Leads</span>
                  </Link>
                </Button>
                <Button variant="contractor" className="h-auto flex-col p-4" asChild>
                  <Link to="/dashboard/profile">
                    <Settings className="h-6 w-6 mb-2" />
                    <span className="text-sm">Profile</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}