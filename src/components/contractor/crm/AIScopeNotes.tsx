import { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Loader2, Sparkles, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AIScopeNotesProps {
  notes: string;
  onNotesChange: (notes: string) => void;
  placeholder?: string;
  label?: string;
}

export function AIScopeNotes({ 
  notes, 
  onNotesChange, 
  placeholder = "Any additional information about this project",
  label = "Additional Notes"
}: AIScopeNotesProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const transcribeAndSummarize = useCallback(async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      
      toast({
        title: "Transcribing...",
        description: "Converting your recording to text.",
      });

      // Step 1: Transcribe
      const { data: transcribeData, error: transcribeError } = await supabase.functions.invoke('voice-to-text', {
        body: { 
          audio: base64Audio,
          mimeType: audioBlob.type
        }
      });
      
      if (transcribeError) throw transcribeError;
      
      if (!transcribeData?.text) {
        throw new Error('No transcription returned');
      }

      const transcribedText = transcribeData.text;
      
      toast({
        title: "Summarizing...",
        description: "Organizing your notes into bullet points.",
      });

      // Step 2: Summarize the transcribed text
      const { data: summarizeData, error: summarizeError } = await supabase.functions.invoke('summarize-scope-notes', {
        body: { notes: transcribedText }
      });
      
      if (summarizeError) throw summarizeError;
      
      const finalText = summarizeData?.summary || transcribedText;
      
      // Append to existing notes
      const newNotes = notes 
        ? `${notes}\n\n--- AI Scope Recording ---\n${finalText}`
        : `--- AI Scope Recording ---\n${finalText}`;
      onNotesChange(newNotes);
      
      toast({
        title: "Recording processed!",
        description: "Your walk-around notes have been transcribed and summarized.",
      });
    } catch (error: any) {
      console.error('Error processing recording:', error);
      toast({
        title: "Processing failed",
        description: error.message || "Failed to process the recording.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [notes, onNotesChange, toast]);

  const startRecording = useCallback(async () => {
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
        }
      };
      
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
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
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      toast({
        title: "Recording stopped",
        description: "Processing your recording...",
      });
    }
  }, [isRecording, toast]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
      <Card className="border-dashed">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Record Button */}
            <Button
              type="button"
              variant={isRecording ? "destructive" : "outline"}
              size="sm"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              className="gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : isRecording ? (
                <>
                  <MicOff className="h-4 w-4" />
                  Stop ({formatDuration(recordingDuration)})
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  Record Walk-Around
                </>
              )}
            </Button>
            
            {/* Recording indicator */}
            {isRecording && (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs text-muted-foreground">Recording...</span>
              </div>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground mt-2">
            Record your walk-around conversation. It will automatically transcribe and summarize when you stop.
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
