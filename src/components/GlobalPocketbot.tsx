import { useState } from "react";
import { Bot } from "lucide-react";
import { FloatingPocketbot } from "@/components/contractor/FloatingPocketbot";
import { Button } from "@/components/ui/button";

export function GlobalPocketbot() {
  const [showPocketbot, setShowPocketbot] = useState(false);

  return (
    <>
      {/* Pocketbot Trigger Button - high z-index, positioned to avoid overlap */}
      <div className="fixed top-4 right-4 z-[9999]">
        <Button
          onClick={() => setShowPocketbot(true)}
          className="bg-foreground/95 backdrop-blur-md text-background hover:bg-foreground hover:text-background h-10 min-w-[120px] px-3 sm:px-4 rounded-full font-semibold shadow-xl hover:shadow-primary/50 transition-all duration-300 hover:scale-105"
        >
          <Bot className="h-4 w-4 text-primary" />
          <span className="hidden sm:inline ml-2">Pocketbot</span>
        </Button>
      </div>

      {/* Pocketbot Modal - high z-index for dragging over everything */}
      {showPocketbot && (
        <div className="fixed inset-0 z-[9998] pointer-events-none">
          <div className="pointer-events-auto">
            <FloatingPocketbot onClose={() => setShowPocketbot(false)} />
          </div>
        </div>
      )}
    </>
  );
}
