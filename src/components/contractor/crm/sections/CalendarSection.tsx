import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Home } from 'lucide-react';

interface CalendarSectionProps {
  onSectionChange?: (section: string) => void;
}

export default function CalendarSection({ onSectionChange }: CalendarSectionProps) {
  return (
    <div className="w-full h-full overflow-y-auto overflow-x-hidden pb-20 bg-background">
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full sm:max-w-7xl sm:mx-auto">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-muted-foreground">Schedule and manage your appointments</p>
        </div>

        <Card className="p-12 text-center">
          <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">Calendar View</h3>
          <p className="text-muted-foreground">
            Calendar and scheduling features coming soon
          </p>
        </Card>
      </div>
    </div>
  );
}
