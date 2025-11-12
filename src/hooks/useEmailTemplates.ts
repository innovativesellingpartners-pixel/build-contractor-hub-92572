import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface EmailTemplate {
  id: string;
  user_id: string;
  name: string;
  stage?: string;
  subject: string;
  body: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useEmailTemplates = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTemplates = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('stage', { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [user]);

  const sendEmail = async (
    opportunityId: string,
    templateId?: string,
    customSubject?: string,
    customBody?: string
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-stage-email', {
        body: {
          opportunityId,
          templateId,
          customSubject,
          customBody,
        },
      });

      if (error) throw error;

      toast({
        title: 'Email sent',
        description: 'Email has been sent successfully',
      });
      return data;
    } catch (error: any) {
      toast({
        title: 'Error sending email',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    templates,
    loading,
    sendEmail,
    refreshTemplates: fetchTemplates,
  };
}
