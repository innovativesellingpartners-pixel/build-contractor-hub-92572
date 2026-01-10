import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Bot, Sparkles, Loader2, Mic, MicOff, ArrowRight } from 'lucide-react';
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
  onNext?: () => void;
}

export function JobAIAssistant({ onJobDetailsExtracted, onNext }: JobAIAssistantProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [hasExtracted, setHasExtracted] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    if (isTranscribing) return;
    
    let hasProcessed = false;
    
    try {
      setIsTranscribing(true);
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        if (hasProcessed) return;
        hasProcessed = true;
        
        try {
          const base64Audio = reader.result?.toString().split(',')[1];
          if (!base64Audio) {
            setIsTranscribing(false);
            return;
          }

          const { data, error } = await supabase.functions.invoke('voice-to-text', {
            body: { audio: base64Audio }
          });

          if (error) throw error;
          
          if (data?.text) {
            setPrompt(prev => prev ? `${prev} ${data.text}` : data.text);
            toast.success('Voice transcribed successfully!');
          }
        } catch (error) {
          console.error('Transcription error:', error);
          toast.error('Could not transcribe audio. Please try again.');
        } finally {
          setIsTranscribing(false);
        }
      };
    } catch (error) {
      console.error('Transcription error:', error);
      toast.error('Could not transcribe audio. Please try again.');
      setIsTranscribing(false);
    }
  };

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
        toast.success('Job details extracted! Click Next to review and adjust.');
        setHasExtracted(true);
      }
    } catch (error: any) {
      console.error('AI extraction error:', error);
      toast.error('Failed to extract job details: ' + (error.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (onNext) {
      onNext();
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
          Describe your job in natural language or use voice input and let AI fill in the details
        </p>
        
        <div className="relative">
          <Textarea
            placeholder="Example: Kitchen remodel at 123 Main St, San Francisco. Client wants new cabinets, countertops, and flooring. Budget is around $25,000. Start date early next month."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className="resize-none pr-12"
            disabled={isRecording || isTranscribing}
          />
          <Button
            type="button"
            variant={isRecording ? "destructive" : "outline"}
            size="icon"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isLoading || isTranscribing}
            className="absolute right-2 top-2"
            title={isRecording ? "Stop recording" : "Start voice input"}
          >
            {isTranscribing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isRecording ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {isRecording && (
          <p className="text-sm text-destructive flex items-center gap-2">
            <span className="animate-pulse">●</span> Recording... Click the microphone to stop
          </p>
        )}
        
        {isTranscribing && (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" /> Transcribing your voice...
          </p>
        )}

        <div className="flex gap-2">
          {!hasExtracted ? (
            <Button
              onClick={handleExtractDetails}
              disabled={isLoading || !prompt.trim() || isRecording || isTranscribing}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Extracting Details...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Extract Job Details
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="flex-1"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Next
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
