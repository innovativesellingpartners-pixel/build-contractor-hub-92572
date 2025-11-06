import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText } from 'lucide-react';

export default function EstimatesSection() {
  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Estimates</h1>
            <p className="text-muted-foreground">Create and manage project estimates</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Estimate
          </Button>
        </div>

        <div className="grid gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                No estimates yet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Create your first estimate to get started. Estimates help you provide
                professional quotes to customers and track project profitability.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
