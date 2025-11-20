import { Briefcase, FileText, Users, Phone, Mail, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface MobileLandingPageProps {
  onNavigateToJobs: () => void;
  onNavigateToEstimates: () => void;
  onNavigateToCustomers: () => void;
  onNavigateToLeads: () => void;
  onNavigateToCalls?: () => void;
  onNavigateToEmails?: () => void;
  onNavigateToSchedule?: () => void;
  onNavigateToFinancials?: () => void;
}

const mobileModules = [
  { 
    id: 'estimates',
    title: 'Estimates',
    description: 'Create & send quotes',
    icon: FileText,
    gradient: 'from-green-500 via-green-600 to-green-700',
  },
  { 
    id: 'jobs',
    title: 'Jobs',
    description: 'Manage active jobs',
    icon: Briefcase,
    gradient: 'from-purple-500 via-purple-600 to-purple-700',
  },
  { 
    id: 'customers',
    title: 'Customers',
    description: 'Contact management',
    icon: Users,
    gradient: 'from-blue-500 via-blue-600 to-blue-700',
  },
  { 
    id: 'calls',
    title: 'Calls',
    description: 'Call history & logs',
    icon: Phone,
    gradient: 'from-pink-500 via-pink-600 to-pink-700',
  },
  { 
    id: 'emails',
    title: 'Emails',
    description: 'Email communications',
    icon: Mail,
    gradient: 'from-cyan-500 via-cyan-600 to-cyan-700',
  },
  { 
    id: 'schedule',
    title: 'Schedule',
    description: 'Calendar & events',
    icon: Calendar,
    gradient: 'from-indigo-500 via-indigo-600 to-indigo-700',
  },
];

export function MobileLandingPage({ 
  onNavigateToJobs, 
  onNavigateToEstimates, 
  onNavigateToCustomers, 
  onNavigateToLeads,
  onNavigateToCalls,
  onNavigateToEmails,
  onNavigateToSchedule,
  onNavigateToFinancials,
}: MobileLandingPageProps) {
  
  const handleModuleClick = (id: string) => {
    switch (id) {
      case 'estimates':
        onNavigateToEstimates();
        break;
      case 'jobs':
        onNavigateToJobs();
        break;
      case 'customers':
        onNavigateToCustomers();
        break;
      case 'calls':
        onNavigateToCalls?.();
        break;
      case 'emails':
        onNavigateToEmails?.();
        break;
      case 'schedule':
        onNavigateToSchedule?.();
        break;
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto overflow-x-hidden pb-20 bg-gradient-to-br from-background via-muted/30 to-background pt-safe">
      <div className="p-4 sm:p-6 space-y-6 w-full max-w-lg mx-auto mt-4">
        {/* Grid of Module Cards */}
        <div className="grid grid-cols-2 gap-4 w-full">
          {mobileModules.map((module) => (
            <Card 
              key={module.id}
              onClick={() => handleModuleClick(module.id)}
              className={`
                aspect-square 
                flex flex-col items-center justify-center gap-3 
                p-4 cursor-pointer 
                hover:scale-105 active:scale-95 
                transition-all duration-200
                bg-gradient-to-br ${module.gradient}
                text-white border-0 shadow-xl hover:shadow-2xl
                relative overflow-hidden
              `}
            >
              {/* Decorative Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white rounded-full -translate-y-10 translate-x-10" />
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-white rounded-full translate-y-8 -translate-x-8" />
              </div>
              
              {/* Content */}
              <div className="relative z-10 flex flex-col items-center gap-3">
                <module.icon className="h-12 w-12 drop-shadow-lg" strokeWidth={2} />
                <div className="text-center">
                  <h3 className="font-bold text-base leading-tight mb-1">
                    {module.title}
                  </h3>
                  <p className="text-xs opacity-90 font-medium">
                    {module.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Quick Actions Section */}
        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-semibold text-foreground px-1">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onNavigateToLeads()}
              className="p-3 bg-card rounded-lg border shadow-sm hover:shadow-md transition-shadow text-left"
            >
              <p className="text-xs font-medium text-foreground">New Lead</p>
              <p className="text-xs text-muted-foreground mt-0.5">Add opportunity</p>
            </button>
            <button
              onClick={() => onNavigateToEstimates()}
              className="p-3 bg-card rounded-lg border shadow-sm hover:shadow-md transition-shadow text-left"
            >
              <p className="text-xs font-medium text-foreground">Create Estimate</p>
              <p className="text-xs text-muted-foreground mt-0.5">Send quote</p>
            </button>
            <button
              onClick={() => onNavigateToCustomers()}
              className="p-3 bg-card rounded-lg border shadow-sm hover:shadow-md transition-shadow text-left"
            >
              <p className="text-xs font-medium text-foreground">Add Customer</p>
              <p className="text-xs text-muted-foreground mt-0.5">New contact</p>
            </button>
            <button
              onClick={() => onNavigateToJobs()}
              className="p-3 bg-card rounded-lg border shadow-sm hover:shadow-md transition-shadow text-left"
            >
              <p className="text-xs font-medium text-foreground">View Jobs</p>
              <p className="text-xs text-muted-foreground mt-0.5">Active projects</p>
            </button>
          </div>
        </div>

        {/* Tip Section */}
        <div className="mt-4 p-4 bg-card rounded-lg border shadow-sm">
          <p className="text-xs text-center text-muted-foreground">
            💡 Tip: Use the bottom navigation to access more features
          </p>
        </div>
      </div>
    </div>
  );
}
