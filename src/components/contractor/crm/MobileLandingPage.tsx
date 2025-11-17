import { Briefcase, FileText, Users, Bot } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface MobileLandingPageProps {
  onNavigateToJobs: () => void;
  onNavigateToEstimates: () => void;
  onNavigateToCustomers: () => void;
  onOpenPocketbot: () => void;
}

const mobileModules = [
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
    id: 'pocketbot',
    title: 'CT1 Pocketbot',
    description: 'AI Assistant',
    icon: Bot,
    gradient: 'from-orange-500 via-orange-600 to-orange-700',
  },
];

export function MobileLandingPage({ 
  onNavigateToJobs, 
  onNavigateToEstimates, 
  onNavigateToCustomers, 
  onOpenPocketbot 
}: MobileLandingPageProps) {
  
  const handleModuleClick = (id: string) => {
    switch (id) {
      case 'jobs':
        onNavigateToJobs();
        break;
      case 'estimates':
        onNavigateToEstimates();
        break;
      case 'customers':
        onNavigateToCustomers();
        break;
      case 'pocketbot':
        onOpenPocketbot();
        break;
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto overflow-x-hidden pb-20 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="p-4 sm:p-6 space-y-6 w-full max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center py-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-2">
            CT1 Contractor Hub
          </h1>
          <p className="text-sm text-muted-foreground">
            Select a module to get started
          </p>
        </div>
        
        {/* 2x2 Grid of Module Cards */}
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

        {/* Quick Stats or Info Section */}
        <div className="mt-6 p-4 bg-card rounded-lg border shadow-sm">
          <p className="text-xs text-center text-muted-foreground">
            💡 Tip: Use the bottom navigation to access more features
          </p>
        </div>
      </div>
    </div>
  );
}
