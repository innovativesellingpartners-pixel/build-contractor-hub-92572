import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ChangePasswordCard() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast({ title: "Password too short", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", description: "New password and confirmation must match.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast({ title: "Password updated", description: "Your password has been changed successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsOpen(false);
    } catch (err: any) {
      toast({ title: "Failed to update password", description: err.message || "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <div 
        className="group flex items-center justify-between bg-card border border-border rounded-xl p-4 hover:shadow-md hover:border-primary/40 transition-all cursor-pointer"
        onClick={() => setIsOpen(true)}
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold">Change Password</h3>
            <p className="text-sm text-muted-foreground">Update your login password</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}>
          Change
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-card to-muted/20 border border-border/50 rounded-xl shadow-md overflow-hidden">
      <div className="bg-primary/5 px-6 py-4 border-b border-border/50 flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary" />
          Change Password
        </h3>
        <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>Cancel</Button>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="new-pw">New Password</Label>
          <div className="relative">
            <Input
              id="new-pw"
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              required
              minLength={6}
              className="pr-10"
            />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowNew(!showNew)}>
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-pw">Confirm New Password</Label>
          <div className="relative">
            <Input
              id="confirm-pw"
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              minLength={6}
              className="pr-10"
            />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowConfirm(!showConfirm)}>
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {confirmPassword && newPassword === confirmPassword && (
            <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Passwords match</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={loading || !newPassword || !confirmPassword}>
          {loading ? "Updating..." : "Update Password"}
        </Button>
      </form>
    </div>
  );
}
