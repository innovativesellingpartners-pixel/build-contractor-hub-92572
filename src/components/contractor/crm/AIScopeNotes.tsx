import { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Loader2, Sparkles, FileText, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface AIScopeNotesProps {
  notes: string;
  onNotesChange: (notes: string) => void;
  placeholder?: string;
  label?: string;
}

type ProcessingState = 'idle' | 'recording' | 'uploading' | 'transcribing' | 'summarizing' | 'success' | 'error';

export function AIScopeNotes({ 
  notes, 
  onNotesChange, 
  placeholder = "Any additional information about this project",
  label = "Additional Notes"
}: AIScopeNotesProps) {
  const [processingState, setProcessingState] = useState<ProcessingState>('idle');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastAudioBlob, setLastAudioBlob] = useState<Blob | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const isRecording = processingState === 'recording';
  const isProcessing = ['uploading', 'transcribing', 'summarizing'].includes(processingState);

  const transcribeAndSummarize = useCallback(async (audioBlob: Blob) => {
    setLastAudioBlob(audioBlob);
    setErrorMessage(null);
    
    try {
      // Step 1: Upload/Convert to base64
      setProcessingState('uploading');
      
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      
      console.log('Audio blob size:', audioBlob.size, 'type:', audioBlob.type);
      
      // Step 2: Transcribe
      setProcessingState('transcribing');
      
      const { data: transcribeData, error: transcribeError } = await supabase.functions.invoke('voice-to-text', {
        body: { 
          audio: base64Audio,
          mimeType: audioBlob.type
        }
      });
      
      if (transcribeError) {
        console.error('Transcription error:', transcribeError);
        throw new Error(transcribeError.message || 'Failed to transcribe audio');
      }
      
      if (transcribeData?.error) {
        throw new Error(transcribeData.error);
      }
      
      if (!transcribeData?.text) {
        throw new Error('No transcription returned');
      }

      const transcribedText = transcribeData.text;
      console.log('Transcribed text:', transcribedText.substring(0, 100) + '...');

      // Step 3: Summarize the transcribed text
      setProcessingState('summarizing');
      
      const { data: summarizeData, error: summarizeError } = await supabase.functions.invoke('summarize-scope-notes', {
        body: { notes: transcribedText }
      });
      
      if (summarizeError) {
        console.error('Summarization error:', summarizeError);
        throw new Error(summarizeError.message || 'Failed to summarize notes');
      }
      
      if (summarizeData?.error) {
        throw new Error(summarizeData.error);
      }
      
      const finalText = summarizeData?.summary || transcribedText;
      
      // Append to existing notes
      const newNotes = notes 
        ? `${notes}\n\n--- AI Scope Recording ---\n${finalText}`
        : `--- AI Scope Recording ---\n${finalText}`;
      onNotesChange(newNotes);
      
      setProcessingState('success');
      toast({
        title: "Recording processed!",
        description: "Your walk-around notes have been transcribed and summarized.",
      });
      
      // Reset to idle after success message
      setTimeout(() => {
        setProcessingState('idle');
      }, 2000);
      
    } catch (error: any) {
      console.error('Error processing recording:', error);
      setErrorMessage(error.message || "Failed to process the recording.");
      setProcessingState('error');
      toast({
        title: "Processing failed",
        description: error.message || "Failed to process the recording.",
        variant: "destructive",
      });
    }
  }, [notes, onNotesChange, toast]);

  const retryProcessing = useCallback(() => {
    if (lastAudioBlob) {
      transcribeAndSummarize(lastAudioBlob);
    }
  }, [lastAudioBlob, transcribeAndSummarize]);

  const startRecording = useCallback(async () => {
    setErrorMessage(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      
      streamRef.current = stream;
      
      // Determine supported mime type
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        }
      }
      
      console.log('Using mimeType:', mimeType);
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        // Create audio blob from chunks
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        // Auto-transcribe and summarize
        if (audioBlob.size > 0) {
          await transcribeAndSummarize(audioBlob);
        } else {
          setErrorMessage('No audio recorded. Please try again.');
          setProcessingState('error');
        }
      };
      
      mediaRecorder.start(1000); // Collect data every second
      setProcessingState('recording');
      setRecordingDuration(0);
      
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
      toast({
        title: "Recording started",
        description: "Speak clearly about the scope of work and site conditions.",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      setErrorMessage('Please allow microphone access to record scope notes.');
      setProcessingState('error');
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to record scope notes.",
        variant: "destructive",
      });
    }
  }, [toast, transcribeAndSummarize]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setProcessingState('idle');
    setErrorMessage(null);
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStateMessage = () => {
    switch (processingState) {
      case 'recording':
        return 'Recording...';
      case 'uploading':
        return 'Preparing audio...';
      case 'transcribing':
        return 'Transcribing speech...';
      case 'summarizing':
        return 'Organizing notes...';
      case 'success':
        return 'Notes added!';
      case 'error':
        return errorMessage || 'An error occurred';
      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label htmlFor="notes" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          {label}
        </Label>
        <Badge variant="outline" className="text-xs">
          <Sparkles className="h-3 w-3 mr-1" />
          AI Scope Notes
        </Badge>
      </div>
      
      {/* Voice Recording Controls */}
      <Card className={cn(
        "border-dashed transition-colors",
        isRecording && "border-red-500 bg-red-50/50 dark:bg-red-950/20",
        processingState === 'success' && "border-green-500 bg-green-50/50 dark:bg-green-950/20",
        processingState === 'error' && "border-destructive bg-destructive/5"
      )}>
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Main Action Button */}
            {processingState === 'idle' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={startRecording}
                className="gap-2"
              >
                <Mic className="h-4 w-4" />
                Record Walk-Around
              </Button>
            )}
            
            {isRecording && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={stopRecording}
                className="gap-2"
              >
                <MicOff className="h-4 w-4" />
                Stop ({formatDuration(recordingDuration)})
              </Button>
            )}
            
            {isProcessing && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled
                className="gap-2"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                {getStateMessage()}
              </Button>
            )}
            
            {processingState === 'success' && (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">{getStateMessage()}</span>
              </div>
            )}
            
            {processingState === 'error' && (
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive">{errorMessage}</span>
                {lastAudioBlob && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={retryProcessing}
                    className="gap-1 ml-2"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Retry
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setProcessingState('idle')}
                >
                  Dismiss
                </Button>
              </div>
            )}
            
            {/* Recording indicator */}
            {isRecording && (
              <div className="flex items-center gap-2 ml-2">
                <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs text-muted-foreground">Recording...</span>
              </div>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground mt-2">
            {isRecording 
              ? "Speaking clearly? Describe site conditions, scope of work, and any special requirements."
              : "Record your walk-around conversation. It will automatically transcribe and summarize when you stop."
            }
          </p>
        </CardContent>
      </Card>
      
      {/* Notes Textarea */}
      <Textarea
        id="notes"
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        rows={6}
        placeholder={placeholder}
        className="min-h-[150px]"
      />
    </div>
  );
}
