import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import ct1Logo from "@/assets/ct1-round-logo-new.png";
import {
  Share,
  PlusSquare,
  BadgePlus,
  MoreVertical,
  Download,
  CheckCircle,
  Monitor,
  Menu,
  Plus,
  type LucideIcon,
} from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Platform = "ios" | "android" | "mac-safari" | "desktop";

interface Step {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string; // tailwind bg class
}

function detectPlatform(): Platform {
  const ua = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  if (isIOS) return "ios";
  if (/android/.test(ua)) return "android";
  const isMac = /macintosh|mac os x/.test(ua);
  const isSafari = /safari/.test(ua) && !/chrome/.test(ua);
  if (isMac && isSafari) return "mac-safari";
  return "desktop";
}

const stepsMap: Record<Platform, { label: string; steps: Step[] }> = {
  ios: {
    label: "iPhone / iPad (Safari)",
    steps: [
      {
        icon: Share,
        title: 'Tap the Share button',
        description: 'Tap the share icon (square with an arrow) at the bottom of Safari.',
        color: 'bg-blue-500',
      },
      {
        icon: PlusSquare,
        title: '"Add to Home Screen"',
        description: 'Scroll down in the share menu and tap "Add to Home Screen".',
        color: 'bg-emerald-500',
      },
      {
        icon: BadgePlus,
        title: 'Tap "Add"',
        description: 'Tap "Add" in the top-right corner to confirm.',
        color: 'bg-orange-500',
      },
    ],
  },
  android: {
    label: "Android (Chrome)",
    steps: [
      {
        icon: MoreVertical,
        title: "Tap the menu icon",
        description: "Tap the three-dot menu icon in the top-right corner of Chrome.",
        color: "bg-blue-500",
      },
      {
        icon: Download,
        title: '"Install app"',
        description: 'Tap "Install app" or "Add to Home screen" from the menu.',
        color: "bg-emerald-500",
      },
      {
        icon: CheckCircle,
        title: 'Tap "Install"',
        description: 'Confirm by tapping "Install" in the dialog.',
        color: "bg-orange-500",
      },
    ],
  },
  desktop: {
    label: "Desktop (Chrome / Edge)",
    steps: [
      {
        icon: Monitor,
        title: "Look for the install icon",
        description: "In the address bar you'll see an install icon (monitor with an arrow).",
        color: "bg-blue-500",
      },
      {
        icon: Download,
        title: 'Click "Install"',
        description: 'Click the "Install" button in the dialog that appears.',
        color: "bg-emerald-500",
      },
      {
        icon: CheckCircle,
        title: "You're all set!",
        description: "CT1 will open as a standalone desktop app.",
        color: "bg-orange-500",
      },
    ],
  },
  "mac-safari": {
    label: "Mac (Safari)",
    steps: [
      {
        icon: Menu,
        title: "Click File in the menu bar",
        description: 'Open the "File" menu at the top of your screen.',
        color: "bg-blue-500",
      },
      {
        icon: Plus,
        title: '"Add to Dock"',
        description: 'Click "Add to Dock" from the File menu.',
        color: "bg-emerald-500",
      },
      {
        icon: CheckCircle,
        title: "You're all set!",
        description: "CT1 will appear in your Dock for quick access.",
        color: "bg-orange-500",
      },
    ],
  },
};

export default function AppInstall() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<Platform>("desktop");

  useEffect(() => {
    setPlatform(detectPlatform());

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  const { label, steps } = useMemo(() => stepsMap[platform], [platform]);

  return (
    <div className="min-h-screen bg-background flex items-start justify-center px-4 py-8 sm:py-16">
      <div className="w-full max-w-lg space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <img src={ct1Logo} alt="CT1 Logo" className="h-20 w-20 mx-auto" />
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Add CT1 to Your Home Screen
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            You can use CT1 like a regular app. Follow these quick and easy steps below:
          </p>
          <p className="text-xs text-muted-foreground/70 font-medium uppercase tracking-wide">
            {label}
          </p>
        </div>

        {/* Already installed */}
        {isInstalled ? (
          <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-6 text-center space-y-2">
            <CheckCircle className="h-10 w-10 text-green-500 mx-auto" />
            <p className="font-semibold text-green-600 dark:text-green-400">CT1 is already installed!</p>
            <p className="text-sm text-muted-foreground">
              You can access it from your home screen or app menu.
            </p>
          </div>
        ) : (
          <>
            {/* Native install button when available */}
            {deferredPrompt && (
              <Button size="lg" className="w-full text-base" onClick={handleInstallClick}>
                Install CT1 App
              </Button>
            )}

            {/* Step cards */}
            <div className="space-y-4">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-4 rounded-xl border border-border bg-card p-4 shadow-sm"
                  >
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${step.color} text-white`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="space-y-0.5 pt-1">
                      <p className="font-semibold text-foreground leading-tight">
                        <span className="text-muted-foreground mr-1.5">{idx + 1}.</span>
                        {step.title}
                      </p>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Done message */}
            <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <CheckCircle className="h-6 w-6 shrink-0 text-primary" />
              <p className="text-sm font-medium text-foreground">
                Done! You can now open <span className="font-bold">CT1</span> anytime from your Home Screen.
              </p>
            </div>
          </>
        )}

        {/* Got it button */}
        <Button
          size="lg"
          className="w-full text-base"
          onClick={() => navigate("/contractor")}
        >
          Got it
        </Button>
      </div>
    </div>
  );
}
