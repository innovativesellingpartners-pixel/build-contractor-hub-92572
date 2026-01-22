import { useState } from 'react';
import { ArrowLeft, Send, Bug, Lightbulb, HelpCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useSubmitSupportRequest, useSubmitFeedback } from '@/hooks/useHelpCenter';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface HelpSupportFormProps {
  onBack: () => void;
  initialType?: 'bug' | 'feature' | 'support' | 'feedback';
  chatbotTranscript?: string;
}

const requestTypes = [
  { id: 'bug', label: 'Report a Bug', icon: Bug, description: 'Something isn\'t working correctly' },
  { id: 'feature', label: 'Request a Feature', icon: Lightbulb, description: 'Suggest a new feature or improvement' },
  { id: 'support', label: 'Get Help', icon: HelpCircle, description: 'I need assistance with something' },
  { id: 'feedback', label: 'General Feedback', icon: AlertTriangle, description: 'Share your thoughts with us' },
];

const categories = [
  'Account & Profile',
  'Leads',
  'Estimates',
  'Jobs',
  'Invoices & Payments',
  'Calendar & Scheduling',
  'Phone & Calls',
  'QuickBooks',
  'Bank Connection',
  'Reports',
  'Mobile App',
  'Other',
];

const priorities = [
  { value: 'low', label: 'Low - Nice to have' },
  { value: 'normal', label: 'Normal - Impacts my work' },
  { value: 'high', label: 'High - Urgent issue' },
  { value: 'urgent', label: 'Urgent - Can\'t use CT1' },
];

export function HelpSupportForm({ onBack, initialType = 'support', chatbotTranscript }: HelpSupportFormProps) {
  const { toast } = useToast();
  const { profile } = useAuth();
  const submitRequest = useSubmitSupportRequest();
  const submitFeedback = useSubmitFeedback();
  
  const [requestType, setRequestType] = useState(initialType);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState(profile?.phone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim() || !description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (requestType === 'feedback') {
        await submitFeedback.mutateAsync({
          feedback_type: 'other',
          comment: `${subject}\n\n${description}`,
          contact_email: contactEmail || undefined,
        });
      } else {
        await submitRequest.mutateAsync({
          subject: `[${requestType.toUpperCase()}] ${subject}`,
          description,
          category: category || undefined,
          priority: requestType === 'bug' ? priority : 'normal',
          contact_email: contactEmail || undefined,
          contact_phone: contactPhone || undefined,
          chatbot_transcript: chatbotTranscript || undefined,
        });
      }

      toast({
        title: "Request Submitted!",
        description: "We've received your request and will get back to you soon.",
      });

      onBack();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Help Center
      </Button>

      <div>
        <h1 className="text-2xl font-bold mb-2">Contact Support</h1>
        <p className="text-muted-foreground">
          Tell us how we can help you
        </p>
      </div>

      {/* Request Type Selection */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {requestTypes.map((type) => {
          const Icon = type.icon;
          return (
            <Card
              key={type.id}
              className={cn(
                "cursor-pointer transition-all",
                requestType === type.id
                  ? "border-primary bg-primary/5 shadow-md"
                  : "hover:border-primary/50"
              )}
              onClick={() => setRequestType(type.id as any)}
            >
              <CardContent className="p-4 text-center">
                <Icon className={cn(
                  "h-6 w-6 mx-auto mb-2",
                  requestType === type.id ? "text-primary" : "text-muted-foreground"
                )} />
                <p className="font-medium text-sm">{type.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {requestTypes.find(t => t.id === requestType)?.label}
            </CardTitle>
            <CardDescription>
              {requestTypes.find(t => t.id === requestType)?.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={
                  requestType === 'bug' 
                    ? "Brief description of the bug"
                    : requestType === 'feature'
                    ? "What feature would you like?"
                    : "What do you need help with?"
                }
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {requestType === 'bug' && (
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  requestType === 'bug'
                    ? "What happened? What did you expect to happen? Steps to reproduce..."
                    : requestType === 'feature'
                    ? "Describe the feature and how it would help you..."
                    : "Please provide as much detail as possible..."
                }
                rows={6}
                required
              />
            </div>

            {requestType === 'bug' && (
              <div className="bg-muted/50 rounded-lg p-4 text-sm">
                <p className="font-medium mb-2">Helpful information to include:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>What you were trying to do</li>
                  <li>The exact error message (if any)</li>
                  <li>Steps to reproduce the issue</li>
                  <li>Your browser and device</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
            <CardDescription>
              How can we reach you? (Optional)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chatbot Transcript Notice */}
        {chatbotTranscript && (
          <Card className="bg-blue-500/5 border-blue-500/20">
            <CardContent className="p-4">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                ℹ️ Your conversation with our Help Bot will be included to help our team understand your issue.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Submit */}
        <div className="flex items-center justify-between">
          <Button type="button" variant="ghost" onClick={onBack}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            {isSubmitting ? (
              <>Submitting...</>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit Request
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
