import { useState, useRef } from "react";
import { FloatingPocketbot } from "@/components/contractor/FloatingPocketbot";
import { Button } from "@/components/ui/button";
import { ChatWithUsBubble, ChatWithUsPanel } from "@/components/ChatWithUs";
import ct1Logo from "@/assets/ct1-round-logo-new.png";

export function GlobalPocketbot() {
  const [showPocketbot, setShowPocketbot] = useState(false);
  const [showChatWithUs, setShowChatWithUs] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      {/* Mobile: Pocketbot button - top right, below header */}
      <div className="fixed top-28 right-4 z-50 md:hidden" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <Button
          ref={buttonRef}
          onClick={() => setShowPocketbot(true)}
          className="bg-foreground/95 backdrop-blur-md text-background hover:bg-foreground hover:text-background h-11 px-5 rounded-full font-semibold shadow-[0_6px_24px_rgba(0,0,0,0.5)] transition-all duration-300 hover:scale-105"
        >
          <img src={ct1Logo} alt="CT1" className="h-5 w-5 mr-2" />
          Pocketbot
        </Button>
      </div>

      {/* Desktop: Bottom right stack */}
      <div className="fixed bottom-6 right-6 z-40 pb-safe hidden md:block">
        <div className="flex flex-col items-end gap-3">
          {/* Pocketbot Button */}
          <Button
            onClick={() => setShowPocketbot(true)}
            className="bg-foreground/95 backdrop-blur-md text-background hover:bg-foreground hover:text-background h-12 min-w-[160px] px-5 rounded-full font-semibold shadow-[0_6px_24px_rgba(0,0,0,0.4)] transition-all duration-300 hover:scale-105"
          >
            <img src={ct1Logo} alt="CT1" className="h-5 w-5 mr-2" />
            Pocketbot
          </Button>

          {/* Chat With Us Bubble */}
          {!showChatWithUs && (
            <ChatWithUsBubble onClick={() => setShowChatWithUs(true)} />
          )}
        </div>
      </div>

      {/* Chat With Us Bubble - mobile bottom right */}
      <div className="fixed bottom-6 right-6 z-40 pb-safe md:hidden">
        {!showChatWithUs && (
          <ChatWithUsBubble onClick={() => setShowChatWithUs(true)} />
        )}
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
