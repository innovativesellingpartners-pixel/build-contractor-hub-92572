import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, Loader2, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

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
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Bot className="h-8 w-8 text-primary" />
              <h2 className="text-3xl font-bold">CT1 Pocketbot</h2>
            </div>
            <p className="text-muted-foreground">
              Your AI-powered assistant for trades, business, sales training, project management, and estimating
            </p>
          </div>
          <div className="text-right">
            <Badge variant={promptCount >= MAX_FREE_PROMPTS ? "destructive" : "secondary"}>
              {promptCount}/{MAX_FREE_PROMPTS} Free Prompts Used
            </Badge>
          </div>
        </div>
      </div>

      {showPaywall ? (
        <Card className="flex-1 flex items-center justify-center">
          <CardContent className="text-center max-w-md space-y-6 p-8">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">Unlock Unlimited Access</h3>
              <p className="text-muted-foreground mb-4">
                You've used all {MAX_FREE_PROMPTS} free prompts. Subscribe to continue getting expert guidance for your contracting business.
              </p>
            </div>
            <div className="bg-muted/50 p-6 rounded-lg">
              <p className="text-3xl font-bold mb-1">${SUBSCRIPTION_PRICE}<span className="text-lg font-normal text-muted-foreground">/month</span></p>
              <p className="text-sm text-muted-foreground">Unlimited prompts & expert advice</p>
            </div>
            <Button onClick={handleSubscribe} size="lg" className="w-full">
              Subscribe Now
            </Button>
            <p className="text-xs text-muted-foreground">
              Cancel anytime. Questions? Contact our support team.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your contracting business..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>
      )}
    </div>
  );
}
