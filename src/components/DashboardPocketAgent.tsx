import { useState } from "react";
import { FloatingPocketAgent } from "@/components/contractor/FloatingPocketbot";
import ct1ChatBubble from "@/assets/ct1-chat-bubble.png";

export function DashboardPocketAgent() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating AI Help Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-6 z-40 h-14 w-14 rounded-full hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center"
        aria-label="Open Pocket Agent"
      >
        <img src={ct1ChatBubble} alt="CT1 Chat" className="h-14 w-14 object-contain" />
      </button>

      {open && <FloatingPocketAgent onClose={() => setOpen(false)} />}
    </>
  );
}
