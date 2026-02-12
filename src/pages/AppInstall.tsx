import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Monitor, Apple, Chrome } from "lucide-react";
import ct1Logo from '@/assets/ct1-round-logo-new.png';
import { Link } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function AppInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop" | "other">("other");

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isDesktop = !isIOS && !isAndroid;

    if (isIOS) setPlatform("ios");
    else if (isAndroid) setPlatform("android");
    else if (isDesktop) setPlatform("desktop");

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link to="/dashboard" className="text-primary hover:underline">
            ← Back to Dashboard
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <img src={ct1Logo} alt="CT1 Logo" className="h-16 w-16" />
            </div>
            <CardTitle className="text-3xl">Get the CT1 App</CardTitle>
            <CardDescription>
              Install CT1 on your device for quick access and a native app experience
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {isInstalled ? (
              <div className="text-center p-6 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-lg font-medium text-green-600 dark:text-green-400">
                  ✓ CT1 is already installed!
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  You can access it from your home screen or app menu.
                </p>
              </div>
            ) : (
              <>
                {/* Install button for supported browsers */}
                {deferredPrompt && (
                  <div className="text-center">
                    <Button 
                      size="lg" 
                      onClick={handleInstallClick}
                      className="w-full sm:w-auto"
                    >
                      Install CT1 App
                    </Button>
                  </div>
                )}

                {/* Platform-specific instructions */}
                <div className="space-y-4">
                  {platform === "ios" && (
                    <Card className="border-2">
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Apple className="h-5 w-5" />
                          <CardTitle className="text-lg">iPhone or iPad (Safari)</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ol className="list-decimal list-inside space-y-2 text-sm">
                          <li>Tap the <strong>Share</strong> button in Safari (the square with an arrow pointing up)</li>
                          <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                          <li>Tap <strong>"Add"</strong> in the top right corner</li>
                          <li>Find the CT1 icon on your home screen</li>
                        </ol>
                      </CardContent>
                    </Card>
                  )}

                  {platform === "android" && !deferredPrompt && (
                    <Card className="border-2">
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Chrome className="h-5 w-5" />
                          <CardTitle className="text-lg">Android (Chrome)</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ol className="list-decimal list-inside space-y-2 text-sm">
                          <li>Tap the <strong>menu</strong> button (three dots) in Chrome</li>
                          <li>Tap <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong></li>
                          <li>Tap <strong>"Add"</strong> or <strong>"Install"</strong></li>
                          <li>Find the CT1 icon on your home screen</li>
                        </ol>
                      </CardContent>
                    </Card>
                  )}

                  {platform === "desktop" && !deferredPrompt && (
                    <Card className="border-2">
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Monitor className="h-5 w-5" />
                          <CardTitle className="text-lg">Desktop (Chrome / Edge)</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ol className="list-decimal list-inside space-y-2 text-sm">
                          <li>Look for the <strong>install icon</strong> in the address bar (looks like a computer monitor or plus sign)</li>
                          <li>Click <strong>"Install"</strong></li>
                          <li>CT1 will open as a standalone app</li>
                        </ol>
                        <p className="mt-4 text-sm text-muted-foreground">
                          You can also fully use CT1 directly in your browser without installing.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Benefits section */}
                <div className="mt-8 p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Why Install?</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Quick access from your home screen</li>
                    <li>• Works offline for viewing saved data</li>
                    <li>• Full-screen experience without browser UI</li>
                    <li>• Faster launch times</li>
                  </ul>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
