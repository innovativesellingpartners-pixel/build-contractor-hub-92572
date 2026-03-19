import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Building2 } from 'lucide-react';

interface ContractorAccountSetupProps {
  isOpen: boolean;
  userId: string;
  onClose?: () => void;
}

export function ContractorAccountSetup({ isOpen, userId, onClose }: ContractorAccountSetupProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    ct1ContractorNumber: '',
    phone: '',
  });

  const handleSkip = () => {
    navigate('/dashboard');
    onClose?.();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ct1_contractor_number: formData.ct1ContractorNumber,
          phone: formData.phone,
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Contractor account created!',
        description: 'Your contractor profile has been set up successfully.',
      });

      navigate('/dashboard');
      onClose?.();
    } catch (error: any) {
      toast({
        title: 'Setup failed',
        description: error.message || 'Failed to create contractor account. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle>Create Your Contractor Account</DialogTitle>
            </div>
          </div>
          <DialogDescription>
            Set up your contractor profile to access the full contractor portal and hub features.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="ct1ContractorNumber">CT1 Contractor Number</Label>
            <Input
              id="ct1ContractorNumber"
              placeholder="Enter your CT1 contractor number"
              value={formData.ct1ContractorNumber}
              onChange={(e) => setFormData({ ...formData, ct1ContractorNumber: e.target.value })}
              className="border-2 focus:border-primary transition-colors"
            />
            <p className="text-xs text-muted-foreground">
              This will be assigned to you after signup
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              required
              placeholder="(555) 123-4567"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="border-2 focus:border-primary transition-colors"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleSkip}
              className="flex-1"
              disabled={loading}
            >
              Skip for Now
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting Up...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </div>
        </form>

        <p className="text-xs text-center text-muted-foreground">
          You can complete this setup later from your profile settings
        </p>
      </DialogContent>
    </Dialog>
  );
}
