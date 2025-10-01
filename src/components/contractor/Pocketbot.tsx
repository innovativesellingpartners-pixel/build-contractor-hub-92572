import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, Loader2, Lock, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import ct1Logo from "@/assets/ct1-logo-main.png";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const MAX_FREE_PROMPTS = 3;
const SUBSCRIPTION_PRICE = 10;

export function Pocketbot() {
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

    // Check if user has exceeded free prompts
    if (promptCount >= MAX_FREE_PROMPTS) {
      setShowPaywall(true);
      return;
    }

    const userMessage = input.trim();
    setInput("");
    
    // Increment prompt count
    const newPromptCount = promptCount + 1;
    setPromptCount(newPromptCount);
    localStorage.setItem('ct1_pocketbot_prompts', newPromptCount.toString());
    
    // Add user message
    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    // Check if this is the 3rd prompt
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

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let assistantMessage = "";
      let textBuffer = "";
      let streamDone = false;

      // Add empty assistant message that will be updated
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

      // Final flush
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
      // Remove the empty assistant message on error
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

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header with Logo */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-primary/20 p-4 md:p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl"></div>
              <div className="relative bg-gradient-to-br from-primary/20 to-primary/10 p-2 md:p-3 rounded-2xl border-2 border-primary/30">
                <img src={ct1Logo} alt="CT1" className="h-8 w-8 md:h-12 md:w-12" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  CT1 Pocketbot
                </h2>
                <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-primary animate-pulse" />
              </div>
              <p className="text-xs md:text-sm text-muted-foreground font-medium hidden sm:block">
                Your AI-powered assistant for trades, business, sales training, project management, and estimating
              </p>
            </div>
          </div>
          <div className="text-right">
            <Badge 
              variant={promptCount >= MAX_FREE_PROMPTS ? "destructive" : "secondary"}
              className="text-xs md:text-sm px-2 md:px-4 py-1 md:py-2"
            >
              {promptCount}/{MAX_FREE_PROMPTS} Free
            </Badge>
          </div>
        </div>
      </div>

      {showPaywall ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-md w-full border-2 border-primary/20 shadow-2xl">
            <CardContent className="text-center space-y-6 p-8">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center border-2 border-primary/30 shadow-lg">
                <Lock className="h-10 w-10 text-primary" />
              </div>
              <div>
                <h3 className="text-3xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Unlock Unlimited Access
                </h3>
                <p className="text-muted-foreground text-base">
                  You've used all {MAX_FREE_PROMPTS} free prompts. Subscribe to continue getting expert guidance for your contracting business.
                </p>
              </div>
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-8 rounded-xl border border-primary/20">
                <p className="text-4xl font-bold mb-2">
                  ${SUBSCRIPTION_PRICE}
                  <span className="text-lg font-normal text-muted-foreground">/month</span>
                </p>
                <p className="text-sm text-muted-foreground font-medium">Unlimited prompts & expert advice</p>
              </div>
              <Button onClick={handleSubscribe} size="lg" className="w-full text-base py-6">
                <Sparkles className="mr-2 h-5 w-5" />
                Subscribe Now
              </Button>
              <p className="text-xs text-muted-foreground">
                Cancel anytime. Questions? Contact our support team.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden m-4">
          <Card className="flex-1 flex flex-col overflow-hidden border-2 border-primary/10 shadow-xl">
            <ScrollArea className="flex-1 p-6" ref={scrollRef}>
              <div className="space-y-6 max-w-4xl mx-auto">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-2 md:gap-3 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    } animate-in fade-in slide-in-from-bottom-2 duration-500`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/30">
                        <img src={ct1Logo} alt="CT1" className="h-5 w-5 md:h-6 md:w-6" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] md:max-w-[75%] rounded-2xl p-3 md:p-4 shadow-md ${
                        message.role === "user"
                          ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground border border-primary/20"
                          : "bg-gradient-to-br from-muted/50 to-muted border border-border"
                      }`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-[15px]">{message.content}</p>
                    </div>
                    {message.role === "user" && (
                      <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-primary/30 to-primary/20 flex items-center justify-center border border-primary/40">
                        <span className="text-primary-foreground font-bold text-xs md:text-sm">You</span>
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex gap-2 md:gap-3 justify-start animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/30">
                      <img src={ct1Logo} alt="CT1" className="h-5 w-5 md:h-6 md:w-6" />
                    </div>
                    <div className="bg-gradient-to-br from-muted/50 to-muted border border-border rounded-2xl p-3 md:p-4 shadow-md">
                      <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin text-primary" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="border-t border-primary/10 p-4 bg-gradient-to-r from-background via-primary/5 to-background backdrop-blur-sm">
              <div className="flex gap-3 max-w-4xl mx-auto">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about your contracting business..."
                  disabled={isLoading}
                  className="flex-1 text-base py-6 rounded-xl border-primary/20 focus:border-primary/40"
                />
                <Button 
                  onClick={handleSend} 
                  disabled={isLoading || !input.trim()}
                  size="lg"
                  className="px-6 rounded-xl"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
