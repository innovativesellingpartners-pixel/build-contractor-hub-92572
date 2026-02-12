import { useState, useRef } from "react";
import { Bot } from "lucide-react";
import { FloatingPocketbot } from "@/components/contractor/FloatingPocketbot";
import { Button } from "@/components/ui/button";
import { ChatWithUsBubble, ChatWithUsPanel } from "@/components/ChatWithUs";

export function GlobalPocketbot() {
  const [showPocketbot, setShowPocketbot] = useState(false);
  const [showChatWithUs, setShowChatWithUs] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      {/* Chat With Us Bubble - bottom right */}
      <div className="fixed bottom-6 right-6 z-40 pb-safe">
        <div className="flex flex-col items-end gap-3">
          {/* Pocketbot Button */}
          <Button
            ref={buttonRef}
            onClick={() => setShowPocketbot(true)}
            className="bg-foreground/95 backdrop-blur-md text-background hover:bg-foreground hover:text-background h-12 min-w-[160px] px-5 rounded-full font-semibold shadow-xl hover:shadow-primary/50 transition-all duration-300 hover:scale-105"
          >
            <Bot className="h-5 w-5 text-primary" />
            Pocketbot
          </Button>

          {/* Chat With Us Bubble */}
          {!showChatWithUs && (
            <ChatWithUsBubble onClick={() => setShowChatWithUs(true)} />
          )}
        </div>
      </div>

      {/* Pocketbot Modal */}
      {showPocketbot && (
        <FloatingPocketbot onClose={() => setShowPocketbot(false)} />
      )}

      {/* Chat With Us Panel */}
      {showChatWithUs && (
        <ChatWithUsPanel onClose={() => setShowChatWithUs(false)} />
      )}
    </>
  );
}
