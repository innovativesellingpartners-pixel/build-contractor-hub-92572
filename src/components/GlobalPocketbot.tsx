import { useState } from "react";
import { Bot } from "lucide-react";
import { FloatingPocketbot } from "@/components/contractor/FloatingPocketbot";
import { Button } from "@/components/ui/button";

export function GlobalPocketbot() {
  const [showPocketbot, setShowPocketbot] = useState(false);

  return (
    <>
      {/* Pocketbot Trigger Button - positioned to avoid footer overlap */}
      <div className="fixed top-4 right-4 z-40">
        <Button
          onClick={() => setShowPocketbot(true)}
          className="bg-foreground/95 backdrop-blur-md text-background hover:bg-foreground hover:text-background h-10 min-w-[140px] px-4 rounded-full font-semibold shadow-xl hover:shadow-primary/50 transition-all duration-300 hover:scale-105"
        >
          <Bot className="h-4 w-4 text-primary" />
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
