import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Landmark,
  Calculator,
  Calendar,
  Mail,
  Shield,
  Mic,
  CreditCard,
  Link2,
  CheckCircle2,
  Circle,
  ExternalLink,
  Loader2,
} from "lucide-react";

interface ConnectionStatus {
  banking: boolean;
  quickbooks: boolean;
  googleCalendar: boolean;
  outlookCalendar: boolean;
  googleEmail: boolean;
  outlookEmail: boolean;
  insurance: boolean;
  voiceAi: boolean;
  payments: boolean;
}

interface ConnectionsHubProps {
  onNavigate: (section: string) => void;
}

const CONNECTION_CARDS = [
  {
    id: "banking",
    label: "Bank Account (Teller / Plaid)",
    description: "Link bank accounts for expense tracking and financial reporting.",
    icon: Landmark,
    navigateTo: "accounting",
    crmSection: "accounting",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    id: "quickbooks",
    label: "QuickBooks Online",
    description: "Sync invoices, payments, and expenses with your QuickBooks account.",
    icon: Calculator,
    navigateTo: "accounting",
    crmSection: "accounting",
    color: "text-green-600",
    bgColor: "bg-green-600/10",
  },
  {
    id: "googleCalendar",
    label: "Google Calendar",
    description: "Sync appointments, job schedules, and meetings from Google.",
    icon: Calendar,
    navigateTo: "calendar",
    crmSection: "calendar",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    id: "outlookCalendar",
    label: "Outlook Calendar",
    description: "Sync your Microsoft Outlook calendar events.",
    icon: Calendar,
    navigateTo: "calendar",
    crmSection: "calendar",
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
  },
  {
    id: "googleEmail",
    label: "Google Email",
    description: "Send estimates, invoices, and communications via Gmail.",
    icon: Mail,
    navigateTo: "emails",
    crmSection: "emails",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  {
    id: "outlookEmail",
    label: "Outlook Email",
    description: "Send communications via your Outlook email account.",
    icon: Mail,
    navigateTo: "emails",
    crmSection: "emails",
    color: "text-blue-600",
    bgColor: "bg-blue-600/10",
  },
  {
    id: "insurance",
    label: "Insurance Portal",
    description: "Upload and manage your insurance documents and certificates.",
    icon: Shield,
    navigateTo: "insurance",
    hubSection: "insurance",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    id: "voiceAi",
    label: "Voice AI (CT1 Forge)",
    description: "AI-powered call answering, lead capture, and appointment booking.",
    icon: Mic,
    navigateTo: "voiceai",
    hubSection: "voiceai",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    id: "payments",
    label: "Payment Processing (Finix)",
    description: "Accept credit cards, debit cards, and ACH transfers from customers.",
    icon: CreditCard,
    navigateTo: "accounting",
    crmSection: "accounting",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
];

export function ConnectionsHub({ onNavigate }: ConnectionsHubProps) {
  const { user } = useAuth();
  const [status, setStatus] = useState<ConnectionStatus>({
    banking: false,
    quickbooks: false,
    googleCalendar: false,
    outlookCalendar: false,
    googleEmail: false,
    outlookEmail: false,
    insurance: false,
    voiceAi: false,
    payments: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    checkConnections();
  }, [user?.id]);

  const checkConnections = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [
        bankRes,
        tellerRes,
        qbRes,
        calRes,
        emailRes,
        insuranceRes,
        voiceRes,
      ] = await Promise.all([
        supabase.from("bank_account_links").select("id").eq("user_id", user.id).limit(1),
        supabase.from("teller_connections").select("id").eq("user_id", user.id).eq("status", "active").limit(1),
        supabase.from("quickbooks_connections").select("id").eq("user_id", user.id).limit(1),
        supabase.from("calendar_connections").select("id, provider").eq("user_id", user.id),
        supabase.from("email_connections").select("id, provider").eq("user_id", user.id),
        supabase.from("contractor_documents").select("id").eq("user_id", user.id).eq("document_category", "insurance").limit(1),
        supabase.from("contractor_ai_profiles").select("ai_enabled").eq("contractor_id", user.id).limit(1),
        supabase.from("profiles").select("finix_merchant_id").eq("id", user.id).single(),
      ]);

      const calConnections = calRes.data || [];
      const emailConnections = emailRes.data || [];

      setStatus({
        banking: (bankRes.data?.length || 0) > 0 || (tellerRes.data?.length || 0) > 0,
        quickbooks: (qbRes.data?.length || 0) > 0,
        googleCalendar: calConnections.some((c: any) => c.provider === "google"),
        outlookCalendar: calConnections.some((c: any) => c.provider === "outlook"),
        googleEmail: emailConnections.some((c: any) => c.provider === "google"),
        outlookEmail: emailConnections.some((c: any) => c.provider === "outlook"),
        insurance: (insuranceRes.data?.length || 0) > 0,
        voiceAi: voiceRes.data?.[0]?.ai_enabled === true,
        payments: !!finixRes.data?.finix_merchant_id,
      });
    } catch (err) {
      console.error("Error checking connections:", err);
    } finally {
      setLoading(false);
    }
  };

  const connectedCount = Object.values(status).filter(Boolean).length;
  const totalCount = CONNECTION_CARDS.length;

  const handleConnect = (card: typeof CONNECTION_CARDS[0]) => {
    if (card.hubSection) {
      onNavigate(card.hubSection);
    } else if (card.crmSection) {
      // Navigate to CRM section
      sessionStorage.setItem("ct1CrmActiveSection", card.crmSection);
      sessionStorage.setItem("ct1CrmShowLanding", "false");
      onNavigate("leads");
    }
  };

  return (
    <div className="bg-gradient-to-br from-card to-muted/20 border border-border/50 rounded-xl shadow-md overflow-hidden">
      <div className="bg-primary/5 px-6 py-4 border-b border-border/50 flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" />
          Connections
        </h3>
        <Badge variant="outline" className="text-xs">
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            `${connectedCount}/${totalCount} connected`
          )}
        </Badge>
      </div>
      <div className="p-4 md:p-6">
        <p className="text-sm text-muted-foreground mb-4">
          Connect all your services in one place. Set up banking, calendars, email, and more to get the most out of CT1.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CONNECTION_CARDS.map((card) => {
            const isConnected = status[card.id as keyof ConnectionStatus];
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className="group relative flex flex-col gap-2 p-4 rounded-lg border border-border/50 hover:border-primary/30 hover:shadow-md transition-all bg-card"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg ${card.bgColor} flex items-center justify-center shrink-0`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{card.label}</p>
                      {isConnected ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{card.description}</p>
                  </div>
                </div>
                <Button
                  variant={isConnected ? "outline" : "default"}
                  size="sm"
                  className="w-full mt-auto text-xs"
                  onClick={() => handleConnect(card)}
                >
                  {isConnected ? (
                    <>
                      Manage <ExternalLink className="h-3 w-3 ml-1" />
                    </>
                  ) : (
                    "Connect"
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
