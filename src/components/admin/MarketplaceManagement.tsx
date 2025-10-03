import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ShoppingCart, Plus, Edit, Trash2, Star, MapPin } from 'lucide-react';
import { toast } from 'sonner';

type Service = {
  id: string;
  title: string;
  description?: string;
  category_id?: string;
  provider_name: string;
  provider_email?: string;
  provider_phone?: string;
  price_range?: string;
  location?: string;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  marketplace_categories?: { name: string } | null;
};

export const MarketplaceManagement = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const queryClient = useQueryClient();

  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ['adminServices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_services')
        .select(`
          *,
          marketplace_categories (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['marketplaceCategories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  const createServiceMutation = useMutation({
    mutationFn: async (serviceData: any) => {
      const { error } = await supabase
        .from('marketplace_services')
        .insert(serviceData);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminServices'] });
      setIsCreateOpen(false);
      toast.success('Service created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create service');
      console.error('Error creating service:', error);
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, ...serviceData }: any) => {
      const { error } = await supabase
        .from('marketplace_services')
        .update(serviceData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminServices'] });
      setEditingService(null);
      toast.success('Service updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update service');
      console.error('Error updating service:', error);
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      const { error } = await supabase
        .from('marketplace_services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminServices'] });
      toast.success('Service deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete service');
      console.error('Error deleting service:', error);
    },
  });

  const ServiceForm = ({ service, onSubmit }: { service?: Service | null; onSubmit: (data: any) => void }) => {
    const [formData, setFormData] = useState({
      title: service?.title || '',
      description: service?.description || '',
      category_id: service?.category_id || '',
      provider_name: service?.provider_name || '',
      provider_email: service?.provider_email || '',
      provider_phone: service?.provider_phone || '',
      price_range: service?.price_range || '',
      location: service?.location || '',
      is_featured: service?.is_featured || false,
      is_active: service?.is_active !== false,
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="title">Service Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category_id}
              onValueChange={(value) => setFormData({ ...formData, category_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="price_range">Price Range</Label>
            <Input
              id="price_range"
              value={formData.price_range}
              onChange={(e) => setFormData({ ...formData, price_range: e.target.value })}
              placeholder="e.g., $50-$100/hour"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="provider_name">Provider Name</Label>
          <Input
            id="provider_name"
            value={formData.provider_name}
            onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="provider_email">Provider Email</Label>
            <Input
              id="provider_email"
              type="email"
              value={formData.provider_email}
              onChange={(e) => setFormData({ ...formData, provider_email: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="provider_phone">Provider Phone</Label>
            <Input
              id="provider_phone"
              value={formData.provider_phone}
              onChange={(e) => setFormData({ ...formData, provider_phone: e.target.value })}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="City, State"
          />
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="featured"
              checked={formData.is_featured}
              onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
            />
            <Label htmlFor="featured">Featured</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="active">Active</Label>
          </div>
        </div>

        <Button type="submit" className="w-full">
          {service ? 'Update Service' : 'Create Service'}
        </Button>
      </form>
    );
  };

  if (servicesLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Marketplace Management</h2>
          <p className="text-muted-foreground">Manage marketplace services and providers</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Service</DialogTitle>
            </DialogHeader>
            <ServiceForm onSubmit={(data) => createServiceMutation.mutate(data)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Services ({services?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price Range</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services?.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {service.title}
                      {service.is_featured && <Star className="h-4 w-4 text-yellow-500" />}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{service.provider_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {service.provider_email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {(service as any).marketplace_categories?.name || 'Uncategorized'}
                  </TableCell>
                  <TableCell>{service.price_range || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {service.location || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Badge variant={service.is_active ? 'default' : 'secondary'}>
                        {service.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      {service.is_featured && (
                        <Badge variant="outline">Featured</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setEditingService(service)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Edit Service</DialogTitle>
                          </DialogHeader>
                          <ServiceForm 
                            service={editingService}
                            onSubmit={(data) => updateServiceMutation.mutate({ 
                              id: editingService?.id, 
                              ...data 
                            })} 
                          />
                        </DialogContent>
                      </Dialog>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => deleteServiceMutation.mutate(service.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};