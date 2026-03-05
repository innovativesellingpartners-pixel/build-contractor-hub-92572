import { useState } from "react";
import { FloatingPocketAgent } from "@/components/contractor/FloatingPocketbot";
import ct1Logo from "@/assets/ct1-round-logo-new.png";

export function DashboardPocketAgent() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating AI Help Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-foreground/95 backdrop-blur-md text-background hover:bg-foreground h-12 px-5 rounded-full font-semibold shadow-[0_6px_24px_rgba(0,0,0,0.3),0_2px_8px_rgba(0,0,0,0.15)] transition-all duration-300 hover:scale-105 md:bottom-6 md:right-6 bottom-20 right-4"
        aria-label="Open Pocket Agent"
      >
        <img src={ct1Logo} alt="CT1" className="h-5 w-5" />
        <span className="hidden sm:inline">Pocket Agent</span>
      </button>

      {open && <FloatingPocketAgent onClose={() => setOpen(false)} />}
    </>
  );
}
