/**
 * FinancialConnectionsDropdown — Compact dropdown for managing financial connections.
 * Shows connection status summary and actions for Bank (Plaid/Teller), QuickBooks, Finix Payments.
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2, LinkIcon, ChevronDown, CreditCard, Loader2,
  Unlink, Wifi, WifiOff, PhoneCall
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface ConnectionStatus {
  bankConnected: boolean;
  qbConnected: boolean;
  stripeConnected: boolean;
}

interface FinancialConnectionsDropdownProps {
  connections: ConnectionStatus;
  onConnectBank: () => void;
  onConnectTeller?: () => void;
  tellerLoading?: boolean;
  onConnectionChange?: () => void;
}

export function FinancialConnectionsDropdown({
  connections,
  onConnectBank,
  onConnectTeller,
  tellerLoading,
  onConnectionChange,
}: FinancialConnectionsDropdownProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [qbLoading, setQbLoading] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [finixConnected, setFinixConnected] = useState(false);
  const [finixMerchantId, setFinixMerchantId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    const checkFinix = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('finix_merchant_id')
        .eq('id', user.id)
        .single();
      const connected = !!data?.finix_merchant_id;
      setFinixConnected(connected);
      setFinixMerchantId(data?.finix_merchant_id || null);
    };
    checkFinix();
  }, [user?.id]);

  const { bankConnected, qbConnected } = connections;
  const connectedCount = [bankConnected, qbConnected, finixConnected].filter(Boolean).length;

  const handleConnectQuickBooks = async () => {
    try {
      setQbLoading(true);
      const { data, error } = await supabase.functions.invoke("quickbooks-connect");
      if (error) {
        toast({ variant: "destructive", title: "Connection Failed", description: error.message });
        return;
      }
      if (data?.authUrl) window.location.href = data.authUrl;
    } catch (error: any) {
      toast({ variant: "destructive", title: "Connection Failed", description: error.message });
    } finally {
      setQbLoading(false);
    }
  };

  const handleConnectStripe = async () => {
    try {
      setStripeLoading(true);
      const { data, error } = await supabase.functions.invoke("stripe-connect-onboard");
      if (error) {
        toast({ variant: "destructive", title: "Connection Failed", description: error.message });
        return;
      }
      if (data?.url) window.location.href = data.url;
    } catch (error: any) {
      toast({ variant: "destructive", title: "Connection Failed", description: error.message });
    } finally {
      setStripeLoading(false);
    }
  };

  const handleDisconnectQuickBooks = async () => {
    try {
      setQbLoading(true);
      const { error } = await supabase.functions.invoke("quickbooks-disconnect");
      if (error) {
        toast({ variant: "destructive", title: "Disconnect Failed", description: error.message });
        return;
      }
      toast({ title: "Disconnected", description: "QuickBooks has been disconnected." });
      onConnectionChange?.();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Disconnect Failed", description: error.message });
    } finally {
      setQbLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs sm:text-sm">
          <LinkIcon className="h-4 w-4 mr-1 sm:mr-2" />
          Connections
          {connectedCount > 0 && (
            <Badge variant="default" className="ml-1.5 text-[10px] px-1.5 py-0 h-4 min-w-0">
              {connectedCount}
            </Badge>
          )}
          <ChevronDown className="h-3.5 w-3.5 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 bg-popover z-50">
        {/* Status summary */}
        <div className="px-3 py-2.5 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</p>
          <ConnectionRow label="Teller / Bank" connected={bankConnected} />
          <ConnectionRow label="QuickBooks" connected={qbConnected} />
          <ConnectionRow label="Finix Payments" connected={finixConnected} />
        </div>
        <DropdownMenuSeparator />

        {/* Connect actions */}
        {!bankConnected && (
          <>
            {onConnectTeller && (
              <DropdownMenuItem onClick={onConnectTeller} disabled={tellerLoading}>
                {tellerLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Building2 className="h-4 w-4 mr-2" />}
                Connect Bank (Teller)
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onConnectBank}>
              <Building2 className="h-4 w-4 mr-2" /> Connect Bank (Plaid)
            </DropdownMenuItem>
          </>
        )}
        {bankConnected && onConnectTeller && (
          <DropdownMenuItem onClick={onConnectTeller} disabled={tellerLoading}>
            {tellerLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Building2 className="h-4 w-4 mr-2" />}
            Add Another Account
          </DropdownMenuItem>
        )}
        {!qbConnected && (
          <>
            <DropdownMenuItem onClick={handleConnectQuickBooks} disabled={qbLoading}>
              {qbLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <LinkIcon className="h-4 w-4 mr-2" />}
              Connect QuickBooks
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.location.href = '/contact'}>
              <PhoneCall className="h-4 w-4 mr-2" />
              Don't have QuickBooks? Contact Sales
            </DropdownMenuItem>
          </>
        )}

        {/* Finix status */}
        {!finixConnected && (
          <DropdownMenuItem disabled className="text-muted-foreground">
            <CreditCard className="h-4 w-4 mr-2" />
            Finix — Contact admin to provision
          </DropdownMenuItem>
        )}
        {finixConnected && finixMerchantId && (
          <DropdownMenuItem disabled className="text-xs text-muted-foreground">
            <CreditCard className="h-4 w-4 mr-2" />
            Finix: {finixMerchantId.slice(0, 8)}…
          </DropdownMenuItem>
        )}

        {/* Disconnect */}
        {qbConnected && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDisconnectQuickBooks}
              disabled={qbLoading}
              className="text-destructive focus:text-destructive"
            >
              {qbLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Unlink className="h-4 w-4 mr-2" />}
              Disconnect QuickBooks
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ConnectionRow({ label, connected }: { label: string; connected: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      {connected ? (
        <span className="flex items-center gap-1.5 text-xs font-medium text-green-600">
          <Wifi className="h-3 w-3" /> Connected
        </span>
      ) : (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <WifiOff className="h-3 w-3" /> Not connected
        </span>
      )}
    </div>
  );
}
