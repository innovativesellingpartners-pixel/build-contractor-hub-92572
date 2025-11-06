import { useState } from 'react';
import { useCustomers } from '@/hooks/useCustomers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Phone, Mail, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import AddCustomerDialog from '../AddCustomerDialog';

export default function CustomersSection() {
  const { customers, loading } = useCustomers();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  if (loading) {
    return <div className="p-6">Loading customers...</div>;
  }

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground">Manage your customer database</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {customers.map((customer) => (
          <Card key={customer.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">{customer.name}</CardTitle>
                  {customer.company && (
                    <p className="text-sm text-muted-foreground truncate">{customer.company}</p>
                  )}
                </div>
                <Badge variant={customer.customer_type === 'commercial' ? 'default' : 'secondary'} className="shrink-0">
                  {customer.customer_type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {customer.phone && (
                <div className="flex items-center gap-2 text-sm min-w-0">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <a href={`tel:${customer.phone}`} className="hover:underline truncate">
                    {customer.phone}
                  </a>
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-2 text-sm min-w-0">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <a href={`mailto:${customer.email}`} className="hover:underline truncate">
                    {customer.email}
                  </a>
                </div>
              )}
              {customer.address && (
                <div className="flex items-start gap-2 text-sm min-w-0">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <span className="line-clamp-2">
                    {customer.address}
                    {customer.city && `, ${customer.city}`}
                    {customer.state && `, ${customer.state}`}
                  </span>
                </div>
              )}
            </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <AddCustomerDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen}
      />
    </div>
  );
}
