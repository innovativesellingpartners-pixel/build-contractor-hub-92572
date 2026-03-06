import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, Loader2, Lock, Sparkles, X, Minimize2, Download, GripVertical, Mic, MicOff, MessageCircle, Headphones } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ct1Logo from "@/assets/ct1-round-logo-new.png";
import { SalesCoachMode } from "./SalesCoachMode";
import { ChatJobDataCard, type ExtractedJobData } from "./ChatJobDataCard";
import { ChatProductCard, type ProductResult } from "./ChatProductCard";

interface Message {
  role: "user" | "assistant";
  content: string;
  pdfData?: string;
  fileName?: string;
  jobData?: ExtractedJobData;
  products?: ProductResult[];
}

const MAX_FREE_PROMPTS = 3;
const SUBSCRIPTION_PRICE = 10;

interface FloatingPocketAgentProps {
  onClose: () => void;
  onPositionChange?: (position: string) => void;
  initialPosition?: { x: number; y: number };
}

export function FloatingPocketAgent({ onClose, onPositionChange, initialPosition }: FloatingPocketAgentProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm your CT1 Pocket Agent assistant. I'm here to help you with trades, business, sales training and development, project management, and estimating. How can I help you today?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasFullAccess, setHasFullAccess] = useState(false);
  const [promptCount, setPromptCount] = useState(() => {
    const saved = localStorage.getItem('ct1_pocket_agent_prompts');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [showPaywall, setShowPaywall] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'sales-coach'>('chat');
  const [position, setPosition] = useState(() => {
    // If initialPosition provided (from button location), position dialog near the button
    if (initialPosition) {
      const isMobile = window.innerWidth < 768;
      const cardWidth = isMobile ? window.innerWidth - 32 : 380;
      const cardHeight = 500; // Approximate height
      
      // Position dialog above and to the left of the button
      let x = initialPosition.x - cardWidth + 60; // Offset to align with button
      let y = initialPosition.y - cardHeight - 20; // Position above the button
      
      // Ensure within viewport
      x = Math.max(16, Math.min(x, window.innerWidth - cardWidth - 16));
      y = Math.max(16, Math.min(y, window.innerHeight - cardHeight - 16));
      
      // If there's not enough space above, position below
      if (y < 16) {
        y = initialPosition.y + 80; // Position below the button
      }
      
      return { x, y };
    }
    
    const saved = localStorage.getItem('ct1_pocket_agent_position');
    const isMobile = window.innerWidth < 768;
    const cardWidth = isMobile ? window.innerWidth - 32 : 360;
    const cardHeight = 450;
    const bottomNavHeight = isMobile ? 80 : 0; // Account for mobile bottom nav
    const safeAreaBottom = 16;
    
    // Default to bottom-right corner, above mobile bottom nav
    let defaultPosition = { 
      x: isMobile ? 16 : window.innerWidth - cardWidth - 16, 
      y: window.innerHeight - cardHeight - bottomNavHeight - safeAreaBottom
    };
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Validate that saved position is still within viewport
        const maxX = window.innerWidth - cardWidth;
        const maxY = window.innerHeight - cardHeight - bottomNavHeight - safeAreaBottom;
        
        // If saved position is valid, use it; otherwise use default
        if (parsed.x >= 0 && parsed.x <= maxX && parsed.y >= 0 && parsed.y <= maxY) {
          defaultPosition = parsed;
        }
      } catch {
        // Keep default position on parse error
      }
    }
    
    return defaultPosition;
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const checkFullAccess = async () => {
      if (!user?.id) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('pocketbot_full_access, pocketbot_access_type')
        .eq('user_id', user.id)
        .single();
      
      setHasFullAccess(data?.pocketbot_full_access || data?.pocketbot_access_type === 'free_full' || data?.pocketbot_access_type === 'paid' || false);
    };
    
    checkFullAccess();
  }, [user?.id]);

  // Reset prompt counter when user gains full access
  useEffect(() => {
    if (hasFullAccess) {
      setPromptCount(0);
      localStorage.removeItem('ct1_pocket_agent_prompts');
    }
  }, [hasFullAccess]);

  useEffect(() => {
    // Initialize position on mount
    if (onPositionChange) {
      onPositionChange(`${position.y}px`);
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !cardRef.current) return;
      
      const cardWidth = cardRef.current.offsetWidth;
      const cardHeight = cardRef.current.offsetHeight;
      
      // Calculate new position
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Constrain within viewport bounds
      const minX = 0;
      const maxX = window.innerWidth - cardWidth;
      const minY = 0;
      const maxY = window.innerHeight - cardHeight;
      
      const constrainedX = Math.max(minX, Math.min(newX, maxX));
      const constrainedY = Math.max(minY, Math.min(newY, maxY));
      
      const newPosition = { x: constrainedX, y: constrainedY };
      setPosition(newPosition);
      localStorage.setItem('ct1_pocket_agent_position', JSON.stringify(newPosition));
      
      if (onPositionChange) {
        onPositionChange(`${constrainedY}px`);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, onPositionChange]);

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || !cardRef.current) return;
      e.preventDefault();
      
      const touch = e.touches[0];
      const cardWidth = cardRef.current.offsetWidth;
      const cardHeight = cardRef.current.offsetHeight;
      
      // Calculate new position
      const newX = touch.clientX - dragOffset.x;
      const newY = touch.clientY - dragOffset.y;
      
      // Constrain within viewport bounds
      const minX = 0;
      const maxX = window.innerWidth - cardWidth;
      const minY = 0;
      const maxY = window.innerHeight - cardHeight;
      
      const constrainedX = Math.max(minX, Math.min(newX, maxX));
      const constrainedY = Math.max(minY, Math.min(newY, maxY));
      
      const newPosition = { x: constrainedX, y: constrainedY };
      setPosition(newPosition);
      localStorage.setItem('ct1_pocket_agent_position', JSON.stringify(newPosition));
      
      if (onPositionChange) {
        onPositionChange(`${constrainedY}px`);
      }
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, dragOffset, onPositionChange]);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!cardRef.current) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const rect = cardRef.current.getBoundingClientRect();
    
    setDragOffset({
      x: clientX - rect.left,
      y: clientY - rect.top
    });
    setIsDragging(true);
  };

  const handleSubscribe = () => {
    toast({
      title: "Subscription Coming Soon",
      description: `CT1 Pocket Agent subscription for $${SUBSCRIPTION_PRICE}/month will be available soon!`,
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Microphone Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    // Prevent double transcription
    if (isTranscribing) {
      console.log('Already transcribing, skipping duplicate call');
      return;
    }
    
    setIsTranscribing(true);
    let hasProcessed = false; // Guard against multiple onloadend calls
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to use voice input.",
          variant: "destructive"
        });
        setIsTranscribing(false);
        return;
      }

      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        // Guard against multiple calls
        if (hasProcessed) {
          console.log('Already processed this audio, skipping');
          return;
        }
        hasProcessed = true;
        
        try {
          const base64Audio = (reader.result as string).split(',')[1];
          
          console.log('Sending audio for transcription, length:', base64Audio?.length);
          
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-to-text`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({ audio: base64Audio }),
            }
          );

          if (!response.ok) {
            throw new Error("Failed to transcribe audio");
          }

          const data = await response.json();
          console.log('Transcription result:', data.text);
          
          if (data.text) {
            // Replace input entirely instead of appending to prevent doubling
            setInput(data.text);
          }
        } catch (error) {
          console.error("Transcription error:", error);
          toast({
            title: "Transcription Error",
            description: "Failed to transcribe audio. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsTranscribing(false);
        }
      };
    } catch (error) {
      console.error("Transcription error:", error);
      toast({
        title: "Transcription Error",
        description: "Failed to transcribe audio. Please try again.",
        variant: "destructive",
      });
      setIsTranscribing(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    if (!hasFullAccess && promptCount >= MAX_FREE_PROMPTS) {
      setShowPaywall(true);
      return;
    }

    const userMessage = input.trim();
    setInput("");
    
    if (!hasFullAccess) {
      const newPromptCount = promptCount + 1;
      setPromptCount(newPromptCount);
      localStorage.setItem('ct1_pocket_agent_prompts', newPromptCount.toString());
      
      if (newPromptCount === MAX_FREE_PROMPTS) {
        const newMessages = [...messages, { role: "user" as const, content: userMessage }];
        setMessages(newMessages);
        setIsLoading(false);
        setMessages([...newMessages, {
          role: "assistant",
          content: "You've reached your free prompt limit. Subscribe for $10/month to continue using CT1 Pocket Agent!"
        }]);
        setShowPaywall(true);
        return;
      }
    }
    
    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Ensure user is authenticated and get their access token
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (sessionError || !accessToken) {
        throw new Error("You must be signed in to use CT1 Pocket Agent.");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pocketbot-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ messages: newMessages }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please wait a moment and try again.");
        }
        if (response.status === 402) {
          throw new Error("AI usage limit reached. Please contact support.");
        }
        throw new Error("Failed to get response from AI");
      }

      // Check if response is JSON (PDF/task/job_data response) or streaming
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const jsonResponse = await response.json();
        if (jsonResponse.type === "pdf") {
          setMessages([...newMessages, {
            role: "assistant",
            content: jsonResponse.content,
            pdfData: jsonResponse.pdfData,
            fileName: jsonResponse.fileName
          }]);
          setIsLoading(false);
          return;
        }
        if (jsonResponse.type === "job_data_extracted") {
          setMessages([...newMessages, {
            role: "assistant",
            content: jsonResponse.content,
            jobData: jsonResponse.jobData
          }]);
          setIsLoading(false);
          return;
        }
        // Handle task_added and other JSON types
        if (jsonResponse.content) {
          setMessages([...newMessages, {
            role: "assistant",
            content: jsonResponse.content
          }]);
          setIsLoading(false);
          return;
        }
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let assistantMessage = "";
      let textBuffer = "";
      let streamDone = false;

      setMessages([...newMessages, { role: "assistant", content: "" }]);

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantMessage += content;
              setMessages([...newMessages, { role: "assistant", content: assistantMessage }]);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantMessage += content;
              setMessages([...newMessages, { role: "assistant", content: assistantMessage }]);
            }
          } catch { /* ignore */ }
        }
      }

    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
      setMessages(newMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleSend();
  };

  if (isMinimized) {
    return (
      <Card 
        ref={cardRef} 
        className="w-80 shadow-2xl border-2 border-primary/20 fixed z-50"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          touchAction: 'none'
        }}
      >
        <div 
          className="bg-gradient-to-r from-primary/10 to-primary/5 p-3 flex items-center justify-between border-b border-primary/20 cursor-move"
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground mr-1" />
            <img src={ct1Logo} alt="CT1" className="h-6 w-6" />
            <span className="font-semibold text-sm">CT1 Pocket Agent</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsMinimized(false)}>
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      ref={cardRef} 
      className="flex flex-col shadow-2xl border-2 border-primary/20 fixed z-50 rounded-2xl"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        height: '450px',
        maxHeight: `min(450px, calc(100vh - ${window.innerWidth < 768 ? '100px' : '32px'}))`,
        width: window.innerWidth < 768 ? 'calc(100vw - 32px)' : '360px',
        touchAction: 'none'
      }}
    >
      {/* Header */}
      <div 
        className="bg-gradient-to-r from-primary/10 to-primary/5 p-3 md:p-4 border-b border-primary/20 flex-shrink-0 cursor-move"
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
      >
        <div className="flex justify-center mb-2">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        
        {/* Signup Banner - only show for non-full-access users */}
        {!hasFullAccess && (
          <div className="mb-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-lg p-2 text-center">
            <p className="text-xs font-semibold mb-1">Upgrade for $20/mo — Unlimited access!</p>
            <Button 
              variant="secondary" 
              size="sm" 
              className="h-7 text-xs px-3 w-full"
              disabled={isLoading}
              onClick={async () => {
                try {
                  setIsLoading(true);
                  const { data, error } = await supabase.functions.invoke('pocketbot-checkout');
                  if (error) throw error;
                  if (data?.checkout_url) {
                    window.location.href = data.checkout_url;
                  } else {
                    toast({ title: "Error", description: data?.message || "Could not start checkout", variant: "destructive" });
                  }
                } catch (err: any) {
                  toast({ title: "Error", description: err.message || "Checkout failed", variant: "destructive" });
                } finally {
                  setIsLoading(false);
                }
              }}
            >
              {isLoading ? "Processing..." : "Add Pocket Agent — $20/mo"}
            </Button>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={ct1Logo} alt="CT1" className="h-6 w-6 md:h-8 md:w-8" />
            <div>
              <div className="flex items-center gap-1">
                <h3 className="font-bold text-sm md:text-base">CT1 Pocket Agent</h3>
                <Sparkles className="h-3 w-3 md:h-4 md:w-4 text-primary" />
              </div>
              <Badge 
                variant={hasFullAccess ? "default" : (promptCount >= MAX_FREE_PROMPTS ? "destructive" : "secondary")}
                className="text-xs mt-0.5"
              >
                {hasFullAccess ? "Full Version" : `${promptCount}/${MAX_FREE_PROMPTS} Free`}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsMinimized(true)}>
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tab Toggle */}
      <div className="flex border-b border-border/50 flex-shrink-0">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
            activeTab === 'chat'
              ? 'text-primary border-b-2 border-primary bg-primary/5'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Chat
        </button>
        <button
          onClick={() => setActiveTab('sales-coach')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
            activeTab === 'sales-coach'
              ? 'text-primary border-b-2 border-primary bg-primary/5'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Headphones className="h-3.5 w-3.5" />
          Sales Coach
        </button>
      </div>

      {activeTab === 'sales-coach' ? (
        <SalesCoachMode />
      ) : (!hasFullAccess && showPaywall) ? (
        <CardContent className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
          <div className="text-center space-y-4 max-w-sm w-full">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center border-2 border-primary/30">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Choose Your Plan</h3>
              <p className="text-sm text-muted-foreground">
                You've used all {MAX_FREE_PROMPTS} free prompts. Choose a plan to continue.
              </p>
            </div>
            
            {/* Pocket Agent Only Option */}
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-5 rounded-xl border-2 border-primary/20 hover:border-primary/40 transition-colors">
              <p className="text-xs font-semibold text-muted-foreground mb-1">POCKET AGENT ONLY</p>
              <p className="text-3xl font-bold mb-2">
                ${SUBSCRIPTION_PRICE}
                <span className="text-sm font-normal text-muted-foreground">/month</span>
              </p>
              <p className="text-xs text-muted-foreground mb-3">Unlimited Pocket Agent prompts</p>
              <Button onClick={handleSubscribe} className="w-full" size="sm">
                <Sparkles className="mr-2 h-4 w-4" />
                Subscribe to Pocket Agent
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            {/* Full Access Option */}
            <div className="bg-gradient-to-br from-primary/5 to-transparent p-5 rounded-xl border-2 border-border hover:border-primary/40 transition-colors">
              <p className="text-xs font-semibold text-primary mb-1">FULL ACCESS</p>
              <p className="text-lg font-bold mb-2">Choose Your Tier</p>
              <p className="text-xs text-muted-foreground mb-3">
                Get unlimited Pocket Agent + Training + CRM + Marketplace + Monthly Coaching
              </p>
              <Button 
                onClick={() => window.location.href = '/pricing'} 
                variant="outline" 
                className="w-full"
                size="sm"
              >
                View All Tiers
              </Button>
            </div>
          </div>
        </CardContent>
      ) : (
        <>
          <ScrollArea className="flex-1 p-3 md:p-4" ref={scrollRef}>
            <div className="space-y-3">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-2 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/30">
                      <img src={ct1Logo} alt="CT1" className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-xl p-2.5 text-sm ${
                      message.role === "user"
                        ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    {message.pdfData && message.fileName && (
                      <Button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = message.pdfData!;
                          link.download = message.fileName!;
                          link.click();
                        }}
                        variant="outline"
                        size="sm"
                        className="mt-2 w-full text-xs"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download PDF
                      </Button>
                    )}
                    {message.jobData && (
                      <ChatJobDataCard
                        data={message.jobData}
                        onActionComplete={(msg) => {
                          setMessages(prev => [...prev, { role: "assistant", content: msg }]);
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex gap-2 justify-start">
                  <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/30">
                    <img src={ct1Logo} alt="CT1" className="h-4 w-4" />
                  </div>
                  <div className="bg-muted rounded-xl p-2.5">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="border-t border-primary/10 p-3 flex-shrink-0">
            <form className="flex gap-2" onSubmit={handleChatSubmit}>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSend();
                  }
                }}
                placeholder="Ask me anything..."
                disabled={isTranscribing}
                className="flex-1 text-sm"
              />
              <Button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isLoading || isTranscribing}
                size="icon"
                variant={isRecording ? "destructive" : "outline"}
                className={isRecording ? 'animate-pulse' : ''}
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
              <Button
                type="submit"
                disabled={isLoading || !input.trim() || isTranscribing}
                size="icon"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </>
      )}
    </Card>
  );
}
