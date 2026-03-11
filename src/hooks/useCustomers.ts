import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Customer {
  id: string;
  user_id: string;
  customer_number?: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  notes?: string;
  customer_type: 'residential' | 'commercial';
  created_at: string;
  updated_at: string;
  lifetime_value?: number;
}

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCustomers = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .is('archived_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers((data || []) as Customer[]);
    } catch (error: any) {
      toast({
        title: 'Error fetching customers',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const archiveCustomer = async (id: string) => {
    try {
      const { error } = await supabase
        .from('customers')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setCustomers(customers.filter(customer => customer.id !== id));
      toast({
        title: 'Customer archived',
        description: 'Customer has been archived successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error archiving customer',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [user]);

  const addCustomer = async (customerData: Omit<Customer, 'id' | 'user_id' | 'customer_number' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      // Generate customer number
      const { data: customerNumber } = await supabase.rpc('generate_customer_number');
      
      const { data, error } = await supabase
        .from('customers')
        .insert([{ ...customerData, user_id: user.id, customer_number: customerNumber }])
        .select()
        .single();

      if (error) throw error;

      setCustomers([data as Customer, ...customers]);
      toast({
        title: 'Customer added',
        description: 'New customer has been added successfully',
      });
      return data as Customer;
    } catch (error: any) {
      toast({
        title: 'Error adding customer',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setCustomers(customers.map(customer => customer.id === id ? data as Customer : customer));
      toast({
        title: 'Customer updated',
        description: 'Customer has been updated successfully',
      });
      return data as Customer;
    } catch (error: any) {
      toast({
        title: 'Error updating customer',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCustomers(customers.filter(customer => customer.id !== id));
      toast({
        title: 'Customer deleted',
        description: 'Customer has been deleted successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error deleting customer',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    customers,
    loading,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    archiveCustomer,
    refreshCustomers: fetchCustomers,
  };
};
