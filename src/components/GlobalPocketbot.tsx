import { useState } from "react";
import { Bot } from "lucide-react";
import { FloatingPocketbot } from "@/components/contractor/FloatingPocketbot";

export function GlobalPocketbot() {
  const [showPocketbot, setShowPocketbot] = useState(false);

  return (
    <>
      {/* Pocketbot Trigger Button */}
      <div className="fixed top-20 right-4 z-50">
        <div
          onClick={() => setShowPocketbot(true)}
          className="group relative cursor-pointer"
        >
          <div className="flex items-center gap-2 bg-foreground/95 backdrop-blur-md text-background px-6 py-3 rounded-full shadow-2xl hover:shadow-primary/50 transition-all duration-300 hover:scale-105">
            <Bot className="h-4 w-4 text-primary" />
            <span className="font-semibold">Try Pocketbot</span>
          </div>
        </div>
      </div>

      {/* Pocketbot Modal */}
      {showPocketbot && (
        <FloatingPocketbot onClose={() => setShowPocketbot(false)} />
      )}
    </>
  );
}
