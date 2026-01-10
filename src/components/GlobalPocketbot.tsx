import { useState } from "react";
import { Bot } from "lucide-react";
import { FloatingPocketbot } from "@/components/contractor/FloatingPocketbot";
import { Button } from "@/components/ui/button";

export function GlobalPocketbot() {
  const [showPocketbot, setShowPocketbot] = useState(false);

  return (
    <>
      {/* Pocketbot Trigger Button - top right corner of homepage */}
      <div className="fixed top-28 right-6 z-50">
        <Button
          onClick={() => setShowPocketbot(true)}
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
