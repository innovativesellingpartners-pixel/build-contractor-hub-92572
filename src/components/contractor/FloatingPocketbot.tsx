import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, Loader2, Lock, Sparkles, X, Minimize2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import ct1Logo from "@/assets/ct1-logo-main.png";

interface Message {
  role: "user" | "assistant";
  content: string;
  pdfData?: string;
  fileName?: string;
}

const MAX_FREE_PROMPTS = 3;
const SUBSCRIPTION_PRICE = 10;

interface FloatingPocketbotProps {
  onClose: () => void;
}

export function FloatingPocketbot({ onClose }: FloatingPocketbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm your CT1 Pocketbot assistant. I'm here to help you with trades, business, sales training and development, project management, and estimating. How can I help you today?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [promptCount, setPromptCount] = useState(() => {
    const saved = localStorage.getItem('ct1_pocketbot_prompts');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [showPaywall, setShowPaywall] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubscribe = () => {
    toast({
      title: "Subscription Coming Soon",
      description: `CT1 Pocketbot subscription for $${SUBSCRIPTION_PRICE}/month will be available soon!`,
    });
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    if (promptCount >= MAX_FREE_PROMPTS) {
      setShowPaywall(true);
      return;
    }

    const userMessage = input.trim();
    setInput("");
    
    const newPromptCount = promptCount + 1;
    setPromptCount(newPromptCount);
    localStorage.setItem('ct1_pocketbot_prompts', newPromptCount.toString());
    
    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    if (newPromptCount === MAX_FREE_PROMPTS) {
      setIsLoading(false);
      setMessages([...newMessages, {
        role: "assistant",
        content: "You've reached your free prompt limit. Subscribe for $10/month to continue using CT1 Pocketbot!"
      }]);
      setShowPaywall(true);
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pocketbot-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
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

      // Check if response is JSON (PDF response) or streaming
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const pdfResponse = await response.json();
        if (pdfResponse.type === "pdf") {
          setMessages([...newMessages, {
            role: "assistant",
            content: pdfResponse.content,
            pdfData: pdfResponse.pdfData,
            fileName: pdfResponse.fileName
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isMinimized) {
    return (
      <Card className="w-80 shadow-2xl border-2 border-primary/20">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-3 flex items-center justify-between border-b border-primary/20">
          <div className="flex items-center gap-2">
            <img src={ct1Logo} alt="CT1" className="h-6 w-6" />
            <span className="font-semibold text-sm">CT1 Pocketbot</span>
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
    <Card className="h-full flex flex-col shadow-2xl border-2 border-primary/20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-3 md:p-4 border-b border-primary/20 flex-shrink-0">
        {/* Signup Banner */}
        <div className="mb-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-lg p-2 text-center">
          <p className="text-xs font-semibold mb-1">Want unlimited access?</p>
          <Button 
            variant="secondary" 
            size="sm" 
            className="h-7 text-xs px-3 w-full"
            onClick={() => window.location.href = '/bot-signup'}
          >
            Sign up today
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={ct1Logo} alt="CT1" className="h-6 w-6 md:h-8 md:w-8" />
            <div>
              <div className="flex items-center gap-1">
                <h3 className="font-bold text-sm md:text-base">CT1 Pocketbot</h3>
                <Sparkles className="h-3 w-3 md:h-4 md:w-4 text-primary" />
              </div>
              <Badge 
                variant={promptCount >= MAX_FREE_PROMPTS ? "destructive" : "secondary"}
                className="text-xs mt-0.5"
              >
                {promptCount}/{MAX_FREE_PROMPTS} Free
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

      {showPaywall ? (
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
            
            {/* Pocketbot Only Option */}
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-5 rounded-xl border-2 border-primary/20 hover:border-primary/40 transition-colors">
              <p className="text-xs font-semibold text-muted-foreground mb-1">POCKETBOT ONLY</p>
              <p className="text-3xl font-bold mb-2">
                ${SUBSCRIPTION_PRICE}
                <span className="text-sm font-normal text-muted-foreground">/month</span>
              </p>
              <p className="text-xs text-muted-foreground mb-3">Unlimited Pocketbot prompts</p>
              <Button onClick={handleSubscribe} className="w-full" size="sm">
                <Sparkles className="mr-2 h-4 w-4" />
                Subscribe to Pocketbot
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
                Get unlimited Pocketbot + Training + CRM + Marketplace + Monthly Coaching
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
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                disabled={isLoading}
                className="flex-1 text-sm"
              />
              <Button 
                onClick={handleSend} 
                disabled={isLoading || !input.trim()}
                size="icon"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
