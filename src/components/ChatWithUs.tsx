import { useState, useRef, useEffect } from "react";
import { X, Send, Loader2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import ct1Logo from "@/assets/ct1-round-logo-new.png";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-with-us`;

export function ChatWithUsBubble({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-2 cursor-pointer transition-all duration-300 hover:scale-105"
      aria-label="Chat with us"
    >
      {/* Speech bubble with tail pointing left */}
      <div className="relative bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl rounded-bl-sm shadow-[0_8px_30px_rgba(220,38,38,0.5),0_2px_8px_rgba(0,0,0,0.3)] font-semibold text-sm whitespace-nowrap transition-all duration-300 group-hover:shadow-primary/40">
        Chat with us
        {/* Tail pointing left */}
        <div className="absolute bottom-1 -left-2 w-0 h-0 border-t-[6px] border-t-transparent border-r-[10px] border-r-primary border-b-[6px] border-b-transparent" />
      </div>
      {/* Logo circle */}
      <div className="h-12 w-12 rounded-full bg-background shadow-[0_8px_30px_rgba(220,38,38,0.4),0_2px_8px_rgba(0,0,0,0.3)] border-2 border-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0 transition-all duration-300 group-hover:border-primary/50">
        <img src={ct1Logo} alt="CT1" className="h-10 w-10 object-contain" />
      </div>
    </button>
  );
}

export function ChatWithUsPanel({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi there! 👋 Welcome to CT1. I'm here to answer any questions about our platform, or help you schedule an introductory call with our team. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!resp.ok || !resp.body) {
        throw new Error("Failed to get response");
      }

      const reader = resp.body.getReader();
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
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment, or reach out to us at contact@myct1.com.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-20 right-6 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-xl font-semibold text-sm hover:scale-105 transition-all"
        >
          <img src={ct1Logo} alt="CT1" className="h-6 w-6 rounded-full" />
          Chat with us
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[380px] animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-background border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh]">
        {/* Header */}
        <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={ct1Logo} alt="CT1" className="h-8 w-8 rounded-full bg-background/10 p-0.5" />
            <div>
              <p className="font-semibold text-sm">Chat with CT1</p>
              <p className="text-xs opacity-80">We're here to help</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => setIsMinimized(true)}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 min-h-0 max-h-[50vh]">
          <div ref={scrollRef} className="p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert [&>p]:m-0 [&>ul]:mt-1 [&>ol]:mt-1">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="bg-muted text-foreground px-3.5 py-2.5 rounded-2xl rounded-bl-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t border-border p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 rounded-full text-sm h-10"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              className="h-10 w-10 rounded-full flex-shrink-0"
              disabled={isLoading || !input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
