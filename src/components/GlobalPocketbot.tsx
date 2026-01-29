import { useState, useRef } from "react";
import { Bot } from "lucide-react";
import { FloatingPocketbot } from "@/components/contractor/FloatingPocketbot";
import { Button } from "@/components/ui/button";

export function GlobalPocketbot() {
  const [showPocketbot, setShowPocketbot] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleOpenPocketbot = () => {
    setShowPocketbot(true);
  };

  return (
    <>
      {/* Pocketbot Trigger Button - bottom right corner, safe area for mobile */}
      <div className="fixed bottom-6 right-6 z-40 pb-safe">
        <Button
          ref={buttonRef}
          onClick={handleOpenPocketbot}
          className="bg-foreground/95 backdrop-blur-md text-background hover:bg-foreground hover:text-background h-12 min-w-[160px] px-5 rounded-full font-semibold shadow-xl hover:shadow-primary/50 transition-all duration-300 hover:scale-105"
        >
          <Bot className="h-5 w-5 text-primary" />
          Pocketbot
        </Button>
      </div>

      {/* Pocketbot Modal */}
      {showPocketbot && (
        <FloatingPocketbot onClose={() => setShowPocketbot(false)} />
      )}
    </>
  );
}
