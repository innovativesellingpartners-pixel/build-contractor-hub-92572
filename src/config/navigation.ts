import {
  LayoutDashboard,
  ClipboardList,
  Briefcase,
  Users,
  Phone,
  Calendar,
  Mail,
  FileText,
  BarChart2,
  DollarSign,
  LayoutTemplate,
  CreditCard,
  Receipt,
  Building2,
  Contact,
  Link as LinkIcon,
  Shield,
  BookOpen,
  Bot,
  Store,
  User,
  HelpCircle,
  Award,
  Mic,
  BarChart3,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ── CRM Section Navigation ──────────────────────────────────────────

export type CRMSection =
  | "dashboard"
  | "leads"
  | "jobs"
  | "customers"
  | "calls"
  | "calendar"
  | "emails"
  | "estimates"
  | "reporting"
  | "financials"
  | "more"
  | "payments"
  | "accounting"
  | "invoices"
  | "templates"
  | "gc"
  | "contacts"
  | "help"
  | "portal"
  | "ai-report"
  | "crews"
  | "documents"
  | "network"
  | "team";

export interface NavItem<T extends string = string> {
  id: T;
  label: string;
  icon: LucideIcon;
  feature?: string;
}

/** Full CRM sidebar nav — used in CT1CRM desktop sidebar */
export const crmNavItems: NavItem<CRMSection>[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "leads", label: "Leads", icon: ClipboardList },
  { id: "jobs", label: "Jobs", icon: Briefcase },
  { id: "estimates", label: "Estimates", icon: FileText },
  { id: "emails", label: "Emails", icon: Mail },
  { id: "calls", label: "Calls", icon: Phone },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "invoices", label: "Invoices", icon: Receipt },
  { id: "accounting", label: "Accounting", icon: DollarSign },
  { id: "templates", label: "Estimate Templates", icon: LayoutTemplate },
  { id: "reporting", label: "Reporting", icon: BarChart2 },
  { id: "customers", label: "Customers", icon: Users },
  { id: "gc", label: "General Contractors", icon: Building2 },
  { id: "contacts", label: "Contacts", icon: Contact },
  { id: "portal", label: "Customer Portal", icon: LinkIcon },
  { id: "crews", label: "Crews", icon: Shield },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "network", label: "Contractor Network", icon: Users },
  { id: "team", label: "Team", icon: Users },
];

/** Compact CRM nav for the UnifiedHubSidebar (no templates, gc, contacts, etc.) */
export const crmNavItemsCompact: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "leads", label: "Leads", icon: ClipboardList },
  { id: "estimates", label: "Estimates", icon: FileText },
  { id: "invoices", label: "Invoices", icon: Receipt },
  { id: "jobs", label: "Jobs", icon: Briefcase },
  { id: "calls", label: "Calls", icon: Phone },
  { id: "emails", label: "Emails", icon: Mail },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "accounting", label: "Accounting", icon: DollarSign },
  { id: "customers", label: "Customers", icon: Users },
  { id: "reporting", label: "Reporting", icon: BarChart3 },
];

/** Compact CRM nav for CRMSidebarNav (mobile sheet) */
export const crmNavItemsMobile: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "leads", label: "Leads", icon: ClipboardList },
  { id: "jobs", label: "Jobs", icon: Briefcase },
  { id: "estimates", label: "Estimates", icon: FileText },
  { id: "customers", label: "Customers", icon: Users },
  { id: "invoices", label: "Invoices", icon: Receipt },
  { id: "calls", label: "Calls", icon: Phone },
  { id: "emails", label: "Emails", icon: Mail },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "accounting", label: "Accounting", icon: DollarSign },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "reporting", label: "Reporting", icon: BarChart3 },
];

// ── Hub Section Navigation ──────────────────────────────────────────

export type HubSection =
  | "training"
  | "crm"
  | "marketplace"
  | "leads"
  | "insurance"
  | "account"
  | "voiceai"
  | "reporting"
  | "tasks"
  | "help"
  | "connections"
  | "crews"
  | "reviews"
  | "subs"
  | "team";

export interface TierFeatures {
  trainingHub: boolean;
  crm: boolean;
  monthlyCall: boolean;
  insurance: boolean;
  podcast: boolean;
  standards: boolean;
  myAccount: boolean;
  home: boolean;
  leads: boolean;
  aiAssistant: boolean;
  marketplace: boolean;
}

/** Hub nav items shown below the CRM section in the unified sidebar */
export const hubNavItems: NavItem<HubSection>[] = [
  { id: "training", label: "5-Star Training", icon: BookOpen, feature: "trainingHub" },
  { id: "voiceai", label: "Voice AI", icon: Bot, feature: "aiAssistant" },
  { id: "marketplace", label: "Marketplace", icon: Store, feature: "marketplace" },
  { id: "crews", label: "Crews", icon: Users },
  { id: "subs", label: "Subs & Vendors", icon: Building2 },
  { id: "team", label: "Team", icon: Users },
  { id: "tasks", label: "My Tasks", icon: ClipboardList },
  { id: "insurance", label: "Insurance", icon: Shield, feature: "insurance" },
  { id: "account", label: "My Account", icon: User, feature: "myAccount" },
  { id: "help", label: "Help Center", icon: HelpCircle },
];

/** Hub items shown inside CRM sidebar (CT1CRM component) */
export const hubNavItemsCRM: { id: string; label: string; icon: LucideIcon; feature: string | null }[] = [
  { id: "training", label: "5-Star Training", icon: BookOpen, feature: "trainingHub" },
  { id: "voiceai", label: "Voice AI", icon: Bot, feature: "aiAssistant" },
  { id: "marketplace", label: "Marketplace", icon: Store, feature: "marketplace" },
  { id: "tasks", label: "My Tasks", icon: ClipboardList, feature: null },
  { id: "insurance", label: "Insurance", icon: Shield, feature: "insurance" },
  { id: "account", label: "My Account", icon: User, feature: "myAccount" },
  { id: "help", label: "Help Center", icon: HelpCircle, feature: null },
];

/** Sidebar nav items (non-CRM sidebar used in SidebarNav) */
export const sidebarHubNavItems: NavItem<HubSection>[] = [
  { id: "leads", label: "CT1 CRM", icon: Briefcase, feature: "leads" },
  { id: "training", label: "5-Star Training", icon: BookOpen, feature: "trainingHub" },
  { id: "voiceai", label: "Voice AI", icon: Bot, feature: "aiAssistant" },
  { id: "marketplace", label: "Marketplace", icon: Store, feature: "marketplace" },
  { id: "reporting", label: "Reporting", icon: BarChart3 },
  { id: "crews", label: "Crews", icon: Users },
  { id: "tasks", label: "My Tasks", icon: ClipboardList },
  { id: "insurance", label: "Insurance", icon: Shield, feature: "insurance" },
  { id: "account", label: "My Account", icon: User, feature: "myAccount" },
];

/** Extra items at the bottom of SidebarNav */
export const sidebarBottomItems = [
  { id: "standards", label: "CT1 Standards", icon: Award, feature: "standards", href: "/core-values" },
  { id: "podcast", label: "CT1 Podcast", icon: Mic, feature: "podcast", href: "/blog-podcast" },
  { id: "home", label: "CT1 Home", icon: Building2, feature: "home", href: "/" },
];
