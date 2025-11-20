import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Plug } from 'lucide-react';
import { toast } from 'sonner';

interface EmailsSectionProps {
  onSectionChange?: (section: string) => void;
}

export default function EmailsSection({ onSectionChange }: EmailsSectionProps) {
  const handleConnectEmail = () => {
    toast.info('Email integration coming soon');
  };

  return (
    <div className="w-full h-full overflow-y-auto overflow-x-hidden pb-20 bg-background">
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full sm:max-w-7xl sm:mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Emails</h1>
            <p className="text-muted-foreground">Manage your email communications</p>
          </div>
          <Button onClick={handleConnectEmail} className="gap-2">
            <Plug className="h-4 w-4" />
            Connect Email
          </Button>
        </div>

        <Card className="p-12 text-center">
          <Mail className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">Email Management</h3>
          <p className="text-muted-foreground mb-6">
            Connect your email account to manage communications directly from your CRM
          </p>
          <Button onClick={handleConnectEmail} size="lg" className="gap-2">
            <Plug className="h-5 w-5" />
            Connect Your Email
          </Button>
        </Card>
      </div>
    </div>
  );
}
