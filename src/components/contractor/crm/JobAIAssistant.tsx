import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Bot, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface JobAIAssistantProps {
  onJobDetailsExtracted: (details: {
    name?: string;
    description?: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    total_cost?: string;
    notes?: string;
  }) => void;
}

export function JobAIAssistant({ onJobDetailsExtracted }: JobAIAssistantProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleExtractDetails = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter some job details');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('extract-job-details', {
        body: { prompt }
      });

      if (error) throw error;

      if (data?.jobDetails) {
        onJobDetailsExtracted(data.jobDetails);
        toast.success('Job details extracted! Review and adjust as needed.');
        setPrompt('');
      }
    } catch (error: any) {
      console.error('AI extraction error:', error);
      toast.error('Failed to extract job details: ' + (error.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="h-5 w-5 text-primary" />
          AI Job Assistant
          <Sparkles className="h-4 w-4 text-primary ml-auto animate-pulse" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Describe your job in natural language and let AI fill in the details
        </p>
        <Textarea
          placeholder="Example: Kitchen remodel at 123 Main St, San Francisco. Client wants new cabinets, countertops, and flooring. Budget is around $25,000. Start date early next month."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          className="resize-none"
        />
        <Button
          onClick={handleExtractDetails}
          disabled={isLoading || !prompt.trim()}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Extracting Details...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Extract Job Details with AI
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
