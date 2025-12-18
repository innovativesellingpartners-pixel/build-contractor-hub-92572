import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
      <div className="flex items-center gap-3">
        {theme === "dark" ? (
          <Moon className="h-5 w-5 text-primary" />
        ) : (
          <Sun className="h-5 w-5 text-primary" />
        )}
        <div>
          <Label className="text-sm font-medium">Display Mode</Label>
          <p className="text-xs text-muted-foreground">
            Choose between light and dark theme
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme("light")}
          className={cn(
            "px-3 py-1.5 text-sm transition-all",
            theme === "light"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Sun className="h-4 w-4 mr-1.5" />
          Light
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme("dark")}
          className={cn(
            "px-3 py-1.5 text-sm transition-all",
            theme === "dark"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Moon className="h-4 w-4 mr-1.5" />
          Dark
        </Button>
      </div>
    </div>
  );
}
