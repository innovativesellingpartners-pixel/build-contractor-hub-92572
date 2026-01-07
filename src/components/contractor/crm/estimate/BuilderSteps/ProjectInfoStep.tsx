import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Building, MapPin, Phone, Mail, Briefcase } from 'lucide-react';
import { EstimateBuilderData } from '../../EstimateBuilder';

const TRADE_TYPES = [
  'General Remodel',
  'Roofing',
  'Plumbing',
  'Electrical',
  'Painting',
  'HVAC',
  'Flooring',
  'Landscaping',
  'Concrete',
  'Carpentry',
  'Drywall',
  'Windows & Doors',
  'Other',
];

const REFERRAL_SOURCES = [
  'Google',
  'Social Media',
  'CT1 Network',
  'Friend/Family',
  'Former Customer',
  'Home Advisor',
  'Angi',
  'Other',
];

interface ProjectInfoStepProps {
  data: EstimateBuilderData;
  onChange: (updates: Partial<EstimateBuilderData>) => void;
}

export default function ProjectInfoStep({ data, onChange }: ProjectInfoStepProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Project Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Project Details
          </CardTitle>
          <CardDescription>
            Basic information about the project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="title">Project Name / Title *</Label>
              <Input
                id="title"
                value={data.title || data.project_name}
                onChange={(e) => onChange({ title: e.target.value, project_name: e.target.value })}
                placeholder="e.g., Kitchen Remodel - Smith Residence"
                className="text-base"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="trade_type">Trade Type</Label>
              <Select
                value={data.trade_type}
                onValueChange={(value) => onChange({ trade_type: value })}
              >
                <SelectTrigger id="trade_type">
                  <SelectValue placeholder="Select trade type" />
                </SelectTrigger>
                <SelectContent>
                  {TRADE_TYPES.map((trade) => (
                    <SelectItem key={trade} value={trade}>{trade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="prepared_by">Prepared By</Label>
              <Input
                id="prepared_by"
                value={data.prepared_by}
                onChange={(e) => onChange({ prepared_by: e.target.value })}
                placeholder="Your name"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Client Information
          </CardTitle>
          <CardDescription>
            Contact details for the client
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="client_name">Client Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="client_name"
                  value={data.client_name}
                  onChange={(e) => onChange({ client_name: e.target.value })}
                  placeholder="John Smith"
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="client_phone">Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="client_phone"
                  type="tel"
                  value={data.client_phone}
                  onChange={(e) => onChange({ client_phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="client_email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="client_email"
                  type="email"
                  value={data.client_email}
                  onChange={(e) => onChange({ client_email: e.target.value })}
                  placeholder="john.smith@email.com"
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Required to send the estimate to the client
              </p>
            </div>
            
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="client_address">Client Address</Label>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea
                  id="client_address"
                  value={data.client_address}
                  onChange={(e) => onChange({ client_address: e.target.value })}
                  placeholder="123 Main St, City, State 12345"
                  className="pl-10 min-h-[80px]"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Site Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Job Site Location
          </CardTitle>
          <CardDescription>
            Where the work will be performed (if different from client address)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="site_address">Site Address</Label>
            <Textarea
              id="site_address"
              value={data.site_address}
              onChange={(e) => onChange({ site_address: e.target.value })}
              placeholder="Leave empty if same as client address"
              className="min-h-[80px]"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="referred_by">Referred By</Label>
            <Select
              value={data.referred_by}
              onValueChange={(value) => onChange({ referred_by: value })}
            >
              <SelectTrigger id="referred_by">
                <SelectValue placeholder="How did they find you?" />
              </SelectTrigger>
              <SelectContent>
                {REFERRAL_SOURCES.map((source) => (
                  <SelectItem key={source} value={source}>{source}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
