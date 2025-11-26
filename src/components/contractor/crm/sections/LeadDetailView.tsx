import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lead } from '@/hooks/useLeads';
import { useEstimates } from '@/hooks/useEstimates';
import { useCustomers } from '@/hooks/useCustomers';
import { DollarSign, Mail, Phone, MapPin, Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface LeadDetailViewProps {
  lead: Lead;
  onConvertToCustomer: () => void;
  onClose: () => void;
}

export function LeadDetailView({ lead, onConvertToCustomer, onClose }: LeadDetailViewProps) {
  const { estimates } = useEstimates();
  const { customers } = useCustomers();

  const leadEstimates = estimates?.filter(e => e.lead_id === lead.id) || [];
  const linkedCustomer = lead.customer_id ? customers?.find(c => c.id === lead.customer_id) : null;

  const getStatusColor = (status: string) => {
    const colors = {
      new: 'bg-blue-500',
      contacted: 'bg-yellow-500',
      qualified: 'bg-purple-500',
      quoted: 'bg-orange-500',
      won: 'bg-green-500',
      lost: 'bg-red-500',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{lead.name}</h2>
          <Badge className={getStatusColor(lead.status)}>
            {lead.status}
          </Badge>
        </div>
        <div className="flex gap-2">
          {!lead.converted_to_customer && (
            <Button onClick={onConvertToCustomer}>
              Convert to Customer
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {/* Linked Customer */}
      {linkedCustomer && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Converted to Customer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{linkedCustomer.name}</p>
                <p className="text-sm text-muted-foreground">
                  Lifetime Value: ${linkedCustomer.lifetime_value?.toFixed(2) || '0.00'}
                </p>
              </div>
              <Badge variant="secondary">Customer</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {lead.email && (
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span>{lead.email}</span>
            </div>
          )}
          {lead.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>{lead.phone}</span>
            </div>
          )}
          {(lead.address || lead.city || lead.state) && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span>
                {[lead.address, lead.city, lead.state, lead.zip_code]
                  .filter(Boolean)
                  .join(', ')}
              </span>
            </div>
          )}
          {lead.value && (
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span>Estimated Value: ${lead.value.toFixed(2)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estimates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Estimates ({leadEstimates.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leadEstimates.length === 0 ? (
            <p className="text-muted-foreground text-sm">No estimates yet</p>
          ) : (
            <div className="space-y-3">
              {leadEstimates.map((estimate) => (
                <div
                  key={estimate.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{estimate.title}</p>
                    <p className="text-sm text-muted-foreground">
                      ${estimate.total_amount?.toFixed(2)}
                    </p>
                  </div>
                  <Badge variant={estimate.status === 'sold' ? 'default' : 'secondary'}>
                    {estimate.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Created</span>
            <span>{format(new Date(lead.created_at), 'MMM d, yyyy')}</span>
          </div>
          {lead.last_contact_date && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Last Contact</span>
              <span>{format(new Date(lead.last_contact_date), 'MMM d, yyyy')}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      {lead.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}