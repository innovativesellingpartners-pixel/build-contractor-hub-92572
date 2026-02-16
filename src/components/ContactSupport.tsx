import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ContactSupportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactSupport({ open, onOpenChange }: ContactSupportProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    business_name: "",
    phone_number: "",
    email: user?.email || "",
    reason: "",
    ticket_category: "",
    description: "",
  });

  const ticketCategories = [
    "Dashboard Issues",
    "Training Access",
    "CRM/Jobs Hub",
    "QuickBooks Integration",
    "Pocket Agent/AI Assistant",
    "Billing & Payments",
    "VoiceAI",
    "Insurance Portal",
    "Marketplace",
    "Account Settings",
    "Other",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.full_name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your full name",
        variant: "destructive",
      });
      return;
    }

    if (!formData.phone_number.trim()) {
      toast({
        title: "Phone Required",
        description: "Please enter your phone number",
        variant: "destructive",
      });
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast({
        title: "Valid Email Required",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (!formData.reason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please select a reason for contacting",
        variant: "destructive",
      });
      return;
    }

    if (!formData.description.trim()) {
      toast({
        title: "Description Required",
        description: "Please provide a description of your issue",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Save ticket to database
      const { error: dbError } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user?.id,
          full_name: formData.full_name.trim(),
          business_name: formData.business_name.trim() || null,
          phone_number: formData.phone_number.trim(),
          email: formData.email.trim(),
          reason: formData.reason,
          ticket_category: formData.ticket_category || null,
          description: formData.description.trim(),
          status: 'open',
          priority: 'medium',
        });

      if (dbError) {
        console.error("Database error:", dbError);
        throw new Error("Failed to create support ticket");
      }

      // Send email notification
      const { error: emailError } = await supabase.functions.invoke('send-support-email', {
        body: formData,
      });

      if (emailError) {
        console.error("Email error:", emailError);
        // Don't fail the whole operation if email fails
      }

      toast({
        title: "Support Ticket Created",
        description: "Your support ticket has been submitted. We'll get back to you soon!",
      });

      // Reset form
      setFormData({
        full_name: "",
        business_name: "",
        phone_number: "",
        email: user?.email || "",
        reason: "",
        ticket_category: "",
        description: "",
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting support ticket:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit support ticket",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Contact Support</DialogTitle>
          <DialogDescription>
            Fill out this form to create a support ticket. Our team will get back to you as soon as possible.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_name">Business Name</Label>
              <Input
                id="business_name"
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                placeholder="Your Business LLC"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number *</Label>
              <Input
                id="phone_number"
                type="tel"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                placeholder="(555) 123-4567"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Contact *</Label>
            <Select
              value={formData.reason}
              onValueChange={(value) => setFormData({ ...formData, reason: value })}
            >
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Technical Support">Technical Support</SelectItem>
                <SelectItem value="Billing Question">Billing Question</SelectItem>
                <SelectItem value="Feature Request">Feature Request</SelectItem>
                <SelectItem value="Bug Report">Bug Report</SelectItem>
                <SelectItem value="Training/Onboarding">Training/Onboarding</SelectItem>
                <SelectItem value="Account Access">Account Access</SelectItem>
                <SelectItem value="General Inquiry">General Inquiry</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticket_category">Category (Optional)</Label>
            <Select
              value={formData.ticket_category}
              onValueChange={(value) => setFormData({ ...formData, ticket_category: value })}
            >
              <SelectTrigger id="ticket_category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {ticketCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Please describe your issue or inquiry in detail..."
              rows={5}
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Create Support Ticket"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
