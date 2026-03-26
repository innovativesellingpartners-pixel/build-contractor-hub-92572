import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, ClipboardList } from 'lucide-react';
import SubcontractorDirectory from './SubcontractorDirectory';
import SubAssignments from './SubAssignments';

interface SubVendorPortalProps {
  onBack?: () => void;
}

export default function SubVendorPortal({ onBack }: SubVendorPortalProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Subs & Vendors</h2>
        <p className="text-sm text-muted-foreground">Manage subcontractors, assignments, and bids</p>
      </div>
      <Tabs defaultValue="directory" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="directory" className="flex items-center gap-1.5">
            <Building2 className="w-4 h-4" /> Directory
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-1.5">
            <ClipboardList className="w-4 h-4" /> Assignments
          </TabsTrigger>
        </TabsList>
        <TabsContent value="directory" className="mt-4">
          <SubcontractorDirectory />
        </TabsContent>
        <TabsContent value="assignments" className="mt-4">
          <SubAssignments />
        </TabsContent>
      </Tabs>
    </div>
  );
}
