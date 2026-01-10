import { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Loader2, Sparkles, Play, Pause, Trash2, FileText } from 'lucide-react';
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
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
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
  }, [toast]);

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
        description: "Click 'Transcribe' to convert your recording to text.",
      });
    }
  }, [isRecording, toast]);

  const transcribeRecording = useCallback(async () => {
    if (!audioBlob) return;
    
    setIsTranscribing(true);
    try {
      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      
      const { data, error } = await supabase.functions.invoke('voice-to-text', {
        body: { 
          audio: base64Audio,
          mimeType: audioBlob.type
        }
      });
      
      if (error) throw error;
      
      if (data?.text) {
        // Append transcribed text to existing notes
        const newNotes = notes 
          ? `${notes}\n\n--- AI Scope Recording ---\n${data.text}`
          : `--- AI Scope Recording ---\n${data.text}`;
        onNotesChange(newNotes);
        
        toast({
          title: "Transcription complete",
          description: "Your recording has been converted to text.",
        });
      }
    } catch (error: any) {
      console.error('Error transcribing:', error);
      toast({
        title: "Transcription failed",
        description: error.message || "Failed to transcribe the recording.",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  }, [audioBlob, notes, onNotesChange, toast]);

  const summarizeNotes = useCallback(async () => {
    if (!notes.trim()) {
      toast({
        title: "No notes to summarize",
        description: "Please add some notes or record a scope conversation first.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSummarizing(true);
    try {
      const { data, error } = await supabase.functions.invoke('summarize-scope-notes', {
        body: { notes }
      });
      
      if (error) throw error;
      
      if (data?.summary) {
        onNotesChange(data.summary);
        
        toast({
          title: "Notes summarized",
          description: "Your notes have been organized into bullet points.",
        });
      }
    } catch (error: any) {
      console.error('Error summarizing:', error);
      toast({
        title: "Summarization failed",
        description: error.message || "Failed to summarize the notes.",
        variant: "destructive",
      });
    } finally {
      setIsSummarizing(false);
    }
  }, [notes, onNotesChange, toast]);

  const playRecording = useCallback(() => {
    if (!audioBlob) return;
    
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    } else {
      const audio = new Audio(URL.createObjectURL(audioBlob));
      audioRef.current = audio;
      audio.onended = () => setIsPlaying(false);
      audio.play();
      setIsPlaying(true);
    }
  }, [audioBlob, isPlaying]);

  const deleteRecording = useCallback(() => {
    setAudioBlob(null);
    audioRef.current = null;
    setRecordingDuration(0);
  }, []);

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
              className="gap-2"
            >
              {isRecording ? (
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
            
            {/* Audio playback controls */}
            {audioBlob && !isRecording && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={playRecording}
                  className="gap-2"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {formatDuration(recordingDuration)}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={transcribeRecording}
                  disabled={isTranscribing}
                  className="gap-2"
                >
                  {isTranscribing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  Transcribe
                </Button>
                
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={deleteRecording}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
            
            {/* Summarize button */}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={summarizeNotes}
              disabled={isSummarizing || !notes.trim()}
              className="gap-2 ml-auto"
            >
              {isSummarizing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Summarize Notes
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground mt-2">
            Record your walk-around conversation with the customer, then transcribe and summarize into organized notes.
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
