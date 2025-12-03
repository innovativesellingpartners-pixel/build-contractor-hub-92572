import { Briefcase, FileText, Users, Calendar, DollarSign, Phone, Mail } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface MobileLandingPageProps {
  onNavigateToJobs: () => void;
  onNavigateToEstimates: () => void;
  onNavigateToCustomers: () => void;
  onNavigateToEmails: () => void;
  onNavigateToCalendar: () => void;
  onNavigateToAccounting: () => void;
  onNavigateToCalls: () => void;
}

const mobileModules = [
  {
    id: 'calendar',
    title: 'Calendar',
    description: 'Schedule & tasks',
    icon: Calendar,
    gradient: 'from-yellow-500 via-amber-600 to-orange-600',
  },
  { 
    id: 'jobs',
    title: 'Jobs',
    description: 'Manage active jobs',
    icon: Briefcase,
    gradient: 'from-purple-500 via-purple-600 to-purple-700',
  },
  { 
    id: 'estimates',
    title: 'Estimates',
    description: 'Create & send quotes',
    icon: FileText,
    gradient: 'from-green-500 via-green-600 to-green-700',
  },
  { 
    id: 'customers',
    title: 'Customers',
    description: 'Contact management',
    icon: Users,
    gradient: 'from-blue-500 via-blue-600 to-blue-700',
  },
  {
    id: 'accounting',
    title: 'Accounting',
    description: 'Payments & expenses',
    icon: DollarSign,
    gradient: 'from-emerald-500 via-emerald-600 to-emerald-700',
  },
  {
    id: 'calls',
    title: 'Calls',
    description: 'Call history & logs',
    icon: Phone,
    gradient: 'from-indigo-500 via-indigo-600 to-indigo-700',
  },
  {
    id: 'emails',
    title: 'Emails',
    description: 'Inbox & follow-ups',
    icon: Mail,
    gradient: 'from-orange-500 via-orange-600 to-orange-700',
  },
];

export function MobileLandingPage({ 
  onNavigateToJobs, 
  onNavigateToEstimates, 
  onNavigateToCustomers,
  onNavigateToEmails,
  onNavigateToCalendar,
  onNavigateToAccounting,
  onNavigateToCalls,
}: MobileLandingPageProps) {
  
  const handleModuleClick = (id: string) => {
    switch (id) {
      case 'calendar':
        onNavigateToCalendar();
        break;
      case 'jobs':
        onNavigateToJobs();
        break;
      case 'estimates':
        onNavigateToEstimates();
        break;
      case 'customers':
        onNavigateToCustomers();
        break;
      case 'accounting':
        onNavigateToAccounting();
        break;
      case 'calls':
        onNavigateToCalls();
        break;
      case 'emails':
        onNavigateToEmails();
        break;
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto overflow-x-hidden pb-20 bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="p-4 sm:p-6 pt-16 w-full max-w-lg mx-auto">
        {/* Grid of Module Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
          {mobileModules.map((module) => (
            <Card 
              key={module.id}
              onClick={() => handleModuleClick(module.id)}
              className={`
                aspect-square 
                flex flex-col items-center justify-center gap-2 sm:gap-3 
                p-3 sm:p-4 cursor-pointer 
                hover:scale-105 active:scale-95 
                transition-all duration-200
                bg-gradient-to-br ${module.gradient}
                text-white border-0 shadow-xl hover:shadow-2xl
                relative overflow-hidden
              `}
            >
              {/* Decorative Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 bg-white rounded-full -translate-y-8 sm:-translate-y-10 translate-x-8 sm:translate-x-10" />
                <div className="absolute bottom-0 left-0 w-12 sm:w-16 h-12 sm:h-16 bg-white rounded-full translate-y-6 sm:translate-y-8 -translate-x-6 sm:-translate-x-8" />
              </div>
              
              {/* Content */}
              <div className="relative z-10 flex flex-col items-center gap-2 sm:gap-3">
                <module.icon className="h-10 w-10 sm:h-12 sm:w-12 drop-shadow-lg" strokeWidth={2} />
                <div className="text-center">
                  <h3 className="font-bold text-sm sm:text-base leading-tight mb-0.5 sm:mb-1">
                    {module.title}
                  </h3>
                  <p className="text-[10px] sm:text-xs opacity-90 font-medium">
                    {module.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
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
