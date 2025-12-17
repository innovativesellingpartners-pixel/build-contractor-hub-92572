import { useState } from "react";
import { Bot } from "lucide-react";
import { FloatingPocketbot } from "@/components/contractor/FloatingPocketbot";
import { Button } from "@/components/ui/button";

export function GlobalPocketbot() {
  const [showPocketbot, setShowPocketbot] = useState(false);

  return (
    <>
      {/* Pocketbot Trigger Button */}
      <div className="fixed top-28 right-4 z-50">
        <Button
          onClick={() => setShowPocketbot(true)}
          className="bg-foreground/95 backdrop-blur-md text-background hover:bg-foreground hover:text-background h-12 min-w-[160px] px-6 rounded-full font-semibold shadow-2xl hover:shadow-primary/50 transition-all duration-300 hover:scale-105"
        >
          <Bot className="h-4 w-4 text-primary" />
          Try Pocketbot
        </Button>
      </div>

      {/* Pocketbot Modal */}
      {showPocketbot && (
        <FloatingPocketbot onClose={() => setShowPocketbot(false)} />
      )}
    </>
  );
}
