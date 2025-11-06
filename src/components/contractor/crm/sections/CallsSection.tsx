import { Card } from '@/components/ui/card';
import { Phone } from 'lucide-react';

export default function CallsSection() {
  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold">Calls</h1>
          <p className="text-muted-foreground">Manage your call history and schedule calls</p>
        </div>

        <Card className="p-12 text-center">
          <Phone className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">Call Management</h3>
          <p className="text-muted-foreground">
            Call tracking and management features coming soon
          </p>
        </Card>
      </div>
    </div>
  );
}
