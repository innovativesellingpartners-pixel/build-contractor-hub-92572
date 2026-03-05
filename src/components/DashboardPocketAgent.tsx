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
        className="fixed bottom-6 right-6 z-40 h-12 w-12 bg-primary hover:bg-primary/90 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center"
        aria-label="Open Pocket Agent"
      >
        <img src={ct1Logo} alt="CT1" className="h-7 w-7" />
      </button>

      {open && <FloatingPocketAgent onClose={() => setOpen(false)} />}
    </>
  );
}
