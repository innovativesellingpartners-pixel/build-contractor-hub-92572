import React, { Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";
import { GlobalPocketAgent } from "@/components/GlobalPocketbot";
import { DashboardPocketAgent } from "@/components/DashboardPocketAgent";
import { usePWABackNavigation } from "@/hooks/usePWABackNavigation";
import { useLanguageSync } from "@/hooks/useLanguageSync";
import { HomeRedirect } from "@/components/HomeRedirect";
import { NewLandingPage } from "@/components/NewLandingPage";
import { Auth } from "@/pages/Auth";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";
import NotFound from "./pages/NotFound";

// PageLoader for Suspense fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// Lazy-loaded pages
const About = React.lazy(() => import("@/pages/About").then(m => ({ default: m.About })));
const Contact = React.lazy(() => import("@/pages/Contact").then(m => ({ default: m.Contact })));
const Pricing = React.lazy(() => import("@/pages/Pricing").then(m => ({ default: m.Pricing })));
const WhatWeDo = React.lazy(() => import("@/pages/WhatWeDo").then(m => ({ default: m.WhatWeDo })));
const CoreValues = React.lazy(() => import("@/pages/CoreValues").then(m => ({ default: m.CoreValues })));
const TradesWeServe = React.lazy(() => import("@/pages/TradesWeServe").then(m => ({ default: m.TradesWeServe })));
const BlogPodcast = React.lazy(() => import("@/pages/BlogPodcast").then(m => ({ default: m.BlogPodcast })));
const ContractorCRMGuide = React.lazy(() => import("@/pages/blog/ContractorCRMGuide").then(m => ({ default: m.ContractorCRMGuide })));
const ContractorCrmSoftware = React.lazy(() => import("@/pages/ContractorCrmSoftware").then(m => ({ default: m.ContractorCrmSoftware })));
const ContractorEstimatingSoftware = React.lazy(() => import("@/pages/ContractorEstimatingSoftware").then(m => ({ default: m.ContractorEstimatingSoftware })));
const AiAnsweringServiceForContractors = React.lazy(() => import("@/pages/AiAnsweringServiceForContractors").then(m => ({ default: m.AiAnsweringServiceForContractors })));
const ForgeAiInvoiceAssistant = React.lazy(() => import("@/pages/ForgeAiInvoiceAssistant").then(m => ({ default: m.ForgeAiInvoiceAssistant })));
const CrmForTrade = React.lazy(() => import("@/pages/CrmForTrade"));
const ContractorBusinessResources = React.lazy(() => import("@/pages/ContractorBusinessResources"));
const FeaturePage = React.lazy(() => import("@/pages/FeaturePage"));
const BlogPost = React.lazy(() => import("@/pages/BlogPost"));
const TradesDirectory = React.lazy(() => import("@/pages/TradesDirectory"));
const CitiesDirectory = React.lazy(() => import("@/pages/CitiesDirectory"));
const FeaturesDirectory = React.lazy(() => import("@/pages/FeaturesDirectory"));
const BlogDirectory = React.lazy(() => import("@/pages/BlogDirectory"));
const Privacy = React.lazy(() => import("@/pages/Privacy").then(m => ({ default: m.Privacy })));
const Terms = React.lazy(() => import("@/pages/Terms").then(m => ({ default: m.Terms })));
const Dashboard = React.lazy(() => import("@/components/Dashboard").then(m => ({ default: m.Dashboard })));
const Marketplace = React.lazy(() => import("@/components/Marketplace").then(m => ({ default: m.Marketplace })));
const TrainingHub = React.lazy(() => import("@/components/TrainingHub").then(m => ({ default: m.TrainingHub })));
const TrainingModulePage = React.lazy(() => import("@/components/TrainingModulePage").then(m => ({ default: m.TrainingModulePage })));
const CoursePlayer = React.lazy(() => import("@/components/CoursePlayer").then(m => ({ default: m.CoursePlayer })));
const Subscribe = React.lazy(() => import("./pages/Subscribe"));
const NetworkMap = React.lazy(() => import("./pages/NetworkMap"));
const NationwideNetwork = React.lazy(() => import("./pages/NationwideNetwork"));
const PaymentSuccess = React.lazy(() => import("./pages/PaymentSuccess"));
const PayBill = React.lazy(() => import("./pages/PayBill"));
const ProfileEdit = React.lazy(() => import("./pages/ProfileEdit"));
const AdminLayout = React.lazy(() => import("@/components/admin/AdminLayout").then(m => ({ default: m.AdminLayout })));
const AdminDashboard = React.lazy(() => import("@/components/admin/AdminDashboard").then(m => ({ default: m.AdminDashboard })));
const UserManagement = React.lazy(() => import("@/components/admin/UserManagement").then(m => ({ default: m.UserManagement })));
const UserDetailPage = React.lazy(() => import("@/components/admin/UserDetailPage").then(m => ({ default: m.UserDetailPage })));
const TrainingManagement = React.lazy(() => import("@/components/admin/TrainingManagement").then(m => ({ default: m.TrainingManagement })));
const MarketplaceManagement = React.lazy(() => import("@/components/admin/MarketplaceManagement").then(m => ({ default: m.MarketplaceManagement })));
const SupportTickets = React.lazy(() => import("@/components/admin/SupportTickets").then(m => ({ default: m.SupportTickets })));
const AdminLeads = React.lazy(() => import("@/components/admin/AdminLeads").then(m => ({ default: m.AdminLeads })));
const AdminEstimates = React.lazy(() => import("@/components/admin/AdminEstimates").then(m => ({ default: m.AdminEstimates })));
const AdminInvoices = React.lazy(() => import("@/components/admin/AdminInvoices").then(m => ({ default: m.AdminInvoices })));
const AdminJobs = React.lazy(() => import("@/components/admin/AdminJobs").then(m => ({ default: m.AdminJobs })));
const AdminCustomers = React.lazy(() => import("@/components/admin/AdminCustomers").then(m => ({ default: m.AdminCustomers })));
const AdminGCContacts = React.lazy(() => import("@/components/admin/AdminGCContacts").then(m => ({ default: m.AdminGCContacts })));
const AdminSettings = React.lazy(() => import("@/components/admin/AdminSettings").then(m => ({ default: m.AdminSettings })));
const PocketAgentAccessManagement = React.lazy(() => import("@/components/admin/PocketbotAccessManagement").then(m => ({ default: m.PocketAgentAccessManagement })));
const HelpAdmin = React.lazy(() => import("@/components/admin/HelpAdmin").then(m => ({ default: m.HelpAdmin })));
const ContractorOnboarding = React.lazy(() => import("@/components/admin/ContractorOnboarding").then(m => ({ default: m.ContractorOnboarding })));
const ArchiveManagement = React.lazy(() => import("@/components/admin/ArchiveManagement"));
const AdminCatalogImport = React.lazy(() => import("@/pages/admin/AdminCatalogImport"));
const AdminProductForm = React.lazy(() => import("@/pages/admin/AdminProductForm"));
const AssignmentAuditLog = React.lazy(() => import("@/components/admin/AssignmentAuditLog").then(m => ({ default: m.AssignmentAuditLog })));
const DemoWorkspace = React.lazy(() => import("@/components/admin/demo/DemoWorkspace").then(m => ({ default: m.DemoWorkspace })));
const DemoDashboard = React.lazy(() => import("@/components/admin/demo/DemoDashboard").then(m => ({ default: m.DemoDashboard })));
const DemoLiveSection = React.lazy(() => import("@/components/admin/demo/DemoLiveSection").then(m => ({ default: m.DemoLiveSection })));
const DemoResetPanel = React.lazy(() => import("@/components/admin/demo/DemoResetPanel").then(m => ({ default: m.DemoResetPanel })));
const DemoGuidedScenario = React.lazy(() => import("@/components/admin/demo/DemoGuidedScenario").then(m => ({ default: m.DemoGuidedScenario })));
const DemoAdminTools = React.lazy(() => import("@/components/admin/demo/DemoAdminTools").then(m => ({ default: m.DemoAdminTools })));
const AdminUserProfileEdit = React.lazy(() => import("@/pages/AdminUserProfileEdit"));
const BusinessSuite = React.lazy(() => import("@/pages/BusinessSuite").then(m => ({ default: m.BusinessSuite })));
const Training = React.lazy(() => import("@/pages/features/Training").then(m => ({ default: m.Training })));
const CRM = React.lazy(() => import("@/pages/features/CRM").then(m => ({ default: m.CRM })));
const Leads = React.lazy(() => import("@/pages/features/Leads").then(m => ({ default: m.Leads })));
const QuickBooks = React.lazy(() => import("@/pages/features/QuickBooks").then(m => ({ default: m.QuickBooks })));
const Insurance = React.lazy(() => import("@/pages/features/Insurance").then(m => ({ default: m.Insurance })));
const Estimating = React.lazy(() => import("@/pages/features/Estimating"));
const Jobs = React.lazy(() => import("@/pages/features/Jobs"));
const VoiceAI = React.lazy(() => import("@/pages/features/VoiceAI"));
const ReportingFeature = React.lazy(() => import("@/pages/features/Reporting"));
const AccountingFeature = React.lazy(() => import("@/pages/features/Accounting"));
const Communication = React.lazy(() => import("@/pages/features/Communication"));
const TrialSignup = React.lazy(() => import("@/pages/TrialSignup").then(m => ({ default: m.TrialSignup })));
const BotSignup = React.lazy(() => import("@/pages/BotSignup").then(m => ({ default: m.BotSignup })));
const Savings = React.lazy(() => import("./pages/Savings"));
const Platform = React.lazy(() => import("./pages/Platform"));
const ForConsumers = React.lazy(() => import("./pages/ForConsumers"));
const CRMDashboard = React.lazy(() => import("@/pages/CRMDashboard").then(m => ({ default: m.CRMDashboard })));
const PublicEstimate = React.lazy(() => import("./pages/PublicEstimate"));
const PublicChangeOrder = React.lazy(() => import("./pages/PublicChangeOrder"));
const PublicReview = React.lazy(() => import("./pages/PublicReview"));
const CustomerPortal = React.lazy(() => import("./pages/CustomerPortal"));
const PublicInvoice = React.lazy(() => import("./pages/PublicInvoice"));
const PublicPhotoGallery = React.lazy(() => import("./pages/PublicPhotoGallery"));
const Reporting = React.lazy(() => import("./pages/Reporting"));
const AppInstall = React.lazy(() => import("./pages/AppInstall"));
const Accounting = React.lazy(() => import("./pages/Accounting"));
const PocketAgentProduct = React.lazy(() => import("./pages/products/PocketbotProduct"));
const VoiceAIProduct = React.lazy(() => import("./pages/products/VoiceAIProduct"));
const TierLaunch = React.lazy(() => import("./pages/products/TierLaunch"));
const TierGrowth = React.lazy(() => import("./pages/products/TierGrowth"));
const TierMarket = React.lazy(() => import("./pages/products/TierMarket"));
const PublicHelpCenter = React.lazy(() => import("./pages/PublicHelpCenter"));
const PublicSupport = React.lazy(() => import("./pages/PublicSupport"));
const DashboardHelpCenter = React.lazy(() => import("./pages/DashboardHelpCenter"));
const StartingNewLLC = React.lazy(() => import("./pages/training/StartingNewLLC"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      gcTime: 300_000,
    },
  },
});

// Wrapper to conditionally show Pocket Agent on public pages or Dashboard AI help on authenticated pages
function PocketAgentWrapper() {
  const location = useLocation();
  const publicPaths = [
    '/', '/savings', '/platform', '/for-consumers', '/business-suite', 
    '/what-we-do', '/core-values', '/trades-we-serve', '/blog-podcast', '/blog/',
    '/pricing', '/contact', '/nationwide-network', '/network-map',
    '/features/', '/products/', '/legal/', '/about', '/help', '/support'
  ];
  
  const isPublicPage = publicPaths.some(path => 
    location.pathname === path || location.pathname.startsWith(path)
  );
  
  // Dashboard/CRM routes that get the DashboardPocketAgent - every authenticated page
  const dashboardAIPaths = ['/dashboard', '/reporting', '/accounting', '/crm', '/pay-bill'];
  const isDashboardAIPage = dashboardAIPaths.some(path => location.pathname.startsWith(path));
  
  if (isDashboardAIPage) {
    return <DashboardPocketAgent />;
  }
  
  // Don't show on auth, admin, or public estimate pages
  const excludedPaths = ['/auth', '/admin', '/estimate/', '/p/estimate/', '/app-install', '/photos/'];
  const isExcluded = excludedPaths.some(path => location.pathname.startsWith(path));
  
  if (isPublicPage && !isExcluded) {
    return <GlobalPocketAgent />;
  }
  return null;
}

// Component to handle PWA back navigation (must be inside BrowserRouter)
function PWABackHandler() {
  usePWABackNavigation();
  return null;
}

// Sync i18n language with user's profile preference
function LanguageSyncWrapper() {
  useLanguageSync();
  return null;
}

// Helper to wrap lazy components in Suspense
const Lazy = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ErrorBoundary>
          <BrowserRouter>
          <PWABackHandler />
          <LanguageSyncWrapper />
          <PocketAgentWrapper />
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/home" element={<NewLandingPage />} />
            <Route path="/savings" element={<Lazy><Savings /></Lazy>} />
            <Route path="/platform" element={<Lazy><Platform /></Lazy>} />
            <Route path="/for-consumers" element={<Lazy><ForConsumers /></Lazy>} />
            <Route path="/business-suite" element={<Lazy><BusinessSuite /></Lazy>} />
            {/* Redirect /business-suite/* to /features/* to consolidate SEO */}
            <Route path="/business-suite/training" element={<Navigate to="/features/training" replace />} />
            <Route path="/business-suite/crm" element={<Navigate to="/features/crm" replace />} />
            <Route path="/business-suite/leads" element={<Navigate to="/features/crm" replace />} />
            <Route path="/business-suite/quickbooks" element={<Navigate to="/features/crm" replace />} />
            <Route path="/business-suite/insurance" element={<Navigate to="/features/crm" replace />} />
            <Route path="/business-suite/accounting" element={<Navigate to="/features/crm" replace />} />
            <Route path="/business-suite/estimating" element={<Navigate to="/features/estimating" replace />} />
            <Route path="/business-suite/jobs" element={<Navigate to="/features/jobs" replace />} />
            <Route path="/business-suite/communication" element={<Navigate to="/features/crm" replace />} />
            <Route path="/business-suite/voice-ai" element={<Navigate to="/features/voice-ai" replace />} />
            <Route path="/business-suite/reporting" element={<Navigate to="/features/reporting" replace />} />
            <Route path="/features/training" element={<Lazy><Training /></Lazy>} />
            <Route path="/features/crm" element={<Lazy><CRM /></Lazy>} />
            <Route path="/features/leads" element={<Lazy><Leads /></Lazy>} />
            <Route path="/features/quickbooks" element={<Lazy><QuickBooks /></Lazy>} />
            <Route path="/features/insurance" element={<Lazy><Insurance /></Lazy>} />
            <Route path="/features/accounting" element={<Lazy><AccountingFeature /></Lazy>} />
            <Route path="/features/estimating" element={<Lazy><Estimating /></Lazy>} />
            <Route path="/features/jobs" element={<Lazy><Jobs /></Lazy>} />
            <Route path="/features/communication" element={<Lazy><Communication /></Lazy>} />
            <Route path="/features/voice-ai" element={<Lazy><VoiceAI /></Lazy>} />
            <Route path="/features/reporting" element={<Lazy><ReportingFeature /></Lazy>} />
            <Route path="/marketplace" element={<Lazy><Marketplace /></Lazy>} />
            <Route path="/about" element={<Lazy><About /></Lazy>} />
            <Route path="/what-we-do" element={<Lazy><WhatWeDo /></Lazy>} />
            <Route path="/core-values" element={<Lazy><CoreValues /></Lazy>} />
            <Route path="/network-map" element={<Lazy><NetworkMap /></Lazy>} />
            <Route path="/nationwide-network" element={<Lazy><NationwideNetwork /></Lazy>} />
            <Route path="/trades-we-serve" element={<Lazy><TradesWeServe /></Lazy>} />
            <Route path="/blog-podcast" element={<Lazy><BlogPodcast /></Lazy>} />
            <Route path="/blog/contractor-crm-guide" element={<Lazy><ContractorCRMGuide /></Lazy>} />
            <Route path="/blog/:slug" element={<Lazy><BlogPost /></Lazy>} />
            <Route path="/products/pocket-agent" element={<Lazy><PocketAgentProduct /></Lazy>} />
            <Route path="/products/pocketbot" element={<Navigate to="/products/pocket-agent" replace />} />
            <Route path="/products/voice-ai" element={<Lazy><VoiceAIProduct /></Lazy>} />
            <Route path="/products/tier-launch" element={<Lazy><TierLaunch /></Lazy>} />
            <Route path="/products/tier-growth" element={<Lazy><TierGrowth /></Lazy>} />
            <Route path="/products/tier-market" element={<Lazy><TierMarket /></Lazy>} />
            <Route path="/legal/terms" element={<Lazy><Terms /></Lazy>} />
            <Route path="/legal/privacy" element={<Lazy><Privacy /></Lazy>} />
            <Route path="/privacy" element={<Navigate to="/legal/privacy" replace />} />
            <Route path="/terms" element={<Navigate to="/legal/terms" replace />} />
            <Route path="/contact" element={<Lazy><Contact /></Lazy>} />
            <Route path="/help" element={<Lazy><PublicHelpCenter /></Lazy>} />
            <Route path="/support" element={<Lazy><PublicSupport /></Lazy>} />
            <Route path="/auth" element={<Auth />} />
          <Route path="/estimate/:token" element={<Lazy><PublicEstimate /></Lazy>} />
          <Route path="/p/estimate/:token" element={<Lazy><PublicEstimate /></Lazy>} />
          <Route path="/invoice/:token" element={<Lazy><PublicInvoice /></Lazy>} />
          <Route path="/change-order/:token" element={<Lazy><PublicChangeOrder /></Lazy>} />
          <Route path="/review/:jobId" element={<Lazy><PublicReview /></Lazy>} />
          <Route path="/photos/:token" element={<Lazy><PublicPhotoGallery /></Lazy>} />
          <Route path="/portal/:token" element={<Lazy><CustomerPortal /></Lazy>} />
            <Route path="/pricing" element={<Lazy><Pricing /></Lazy>} />
            <Route path="/contractor-crm-software" element={<Lazy><ContractorCrmSoftware /></Lazy>} />
            <Route path="/contractor-estimating-software" element={<Lazy><ContractorEstimatingSoftware /></Lazy>} />
            <Route path="/ai-answering-service-for-contractors" element={<Lazy><AiAnsweringServiceForContractors /></Lazy>} />
            <Route path="/contractor-business-resources" element={<Lazy><ContractorBusinessResources /></Lazy>} />
            {/* High-intent keyword redirects to existing feature pages */}
            <Route path="/contractor-job-management-software" element={<Navigate to="/features/jobs" replace />} />
            <Route path="/contractor-invoicing-software" element={<Navigate to="/features/invoice-automation" replace />} />
            <Route path="/customer-portal-for-contractors" element={<Navigate to="/features/customer-portal" replace />} />
            <Route path="/trades" element={<Lazy><TradesDirectory /></Lazy>} />
            <Route path="/cities" element={<Lazy><CitiesDirectory /></Lazy>} />
            <Route path="/features" element={<Lazy><FeaturesDirectory /></Lazy>} />
            <Route path="/blog" element={<Lazy><BlogDirectory /></Lazy>} />
            <Route path="/crm-for-:tradeSlug" element={<Lazy><CrmForTrade /></Lazy>} />
            <Route path="/features/:slug" element={<Lazy><FeaturePage /></Lazy>} />
            <Route path="/contractor-hub/training/getting-started/starting-a-new-llc" element={<Lazy><StartingNewLLC /></Lazy>} />
            <Route path="/trial-signup" element={<Lazy><TrialSignup /></Lazy>} />
            <Route path="/bot-signup" element={<Lazy><BotSignup /></Lazy>} />
            <Route path="/payment-success" element={<Lazy><PaymentSuccess /></Lazy>} />
            <Route path="/pay-bill" element={
              <ProtectedRoute>
                <Lazy><PayBill /></Lazy>
              </ProtectedRoute>
            } />
            <Route path="/subscribe" element={<Lazy><Subscribe /></Lazy>} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <RouteErrorBoundary>
                  <Lazy><Dashboard /></Lazy>
                </RouteErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/helpcenter" element={
              <ProtectedRoute>
                <Lazy><DashboardHelpCenter /></Lazy>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/profile" element={
              <ProtectedRoute>
                <Lazy><ProfileEdit /></Lazy>
              </ProtectedRoute>
            } />
            <Route path="/app-install" element={<Lazy><AppInstall /></Lazy>} />
            <Route path="/crm" element={
              <ProtectedRoute>
                <RouteErrorBoundary>
                  <Navigate to="/dashboard" replace />
                </RouteErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/reporting" element={
              <ProtectedRoute>
                <Lazy><Reporting /></Lazy>
              </ProtectedRoute>
            } />
            <Route path="/accounting" element={
              <ProtectedRoute>
                <Lazy><Accounting /></Lazy>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/marketplace" element={
              <ProtectedRoute>
                <Lazy><Marketplace /></Lazy>
              </ProtectedRoute>
            } />
              <Route path="/dashboard/training" element={
                <ProtectedRoute>
                  <Lazy><TrainingHub /></Lazy>
                </ProtectedRoute>
              } />
              <Route path="/dashboard/training/module/:moduleId" element={
                <ProtectedRoute>
                  <Lazy><TrainingModulePage /></Lazy>
                </ProtectedRoute>
              } />
              <Route path="/dashboard/training/course/:courseId" element={
                <ProtectedRoute>
                  <Lazy><CoursePlayer /></Lazy>
                </ProtectedRoute>
              } />
            {/* Admin Routes — role-gated */}
            <Route path="/admin" element={<AdminProtectedRoute />}>
              <Route element={<RouteErrorBoundary><Lazy><AdminLayout /></Lazy></RouteErrorBoundary>}>
                <Route index element={<Lazy><AdminDashboard /></Lazy>} />
                <Route path="users" element={<Lazy><UserManagement /></Lazy>} />
                <Route path="users/:userId" element={<Lazy><UserDetailPage /></Lazy>} />
                <Route path="users/:userId/edit" element={<Lazy><AdminUserProfileEdit /></Lazy>} />
                <Route path="leads" element={<Lazy><AdminLeads /></Lazy>} />
                <Route path="estimates" element={<Lazy><AdminEstimates /></Lazy>} />
                <Route path="invoices" element={<Lazy><AdminInvoices /></Lazy>} />
                <Route path="jobs" element={<Lazy><AdminJobs /></Lazy>} />
                <Route path="customers" element={<Lazy><AdminCustomers /></Lazy>} />
                <Route path="gc-contacts" element={<Lazy><AdminGCContacts /></Lazy>} />
                <Route path="archive" element={<Lazy><ArchiveManagement /></Lazy>} />
                <Route path="onboarding" element={<Lazy><ContractorOnboarding /></Lazy>} />
                <Route path="support" element={<Lazy><SupportTickets /></Lazy>} />
                <Route path="marketplace" element={<Lazy><MarketplaceManagement /></Lazy>} />
                <Route path="help" element={<Lazy><HelpAdmin /></Lazy>} />
                <Route path="settings" element={<Lazy><AdminSettings /></Lazy>} />
                <Route path="catalog-import" element={<Lazy><AdminCatalogImport /></Lazy>} />
                <Route path="product-form" element={<Lazy><AdminProductForm /></Lazy>} />
                <Route path="assignments" element={<Lazy><AssignmentAuditLog /></Lazy>} />
                <Route path="demo" element={<Lazy><DemoWorkspace /></Lazy>}>
                  <Route index element={<Lazy><DemoDashboard /></Lazy>} />
                  <Route path="crm" element={<Lazy><DemoLiveSection module="crm" /></Lazy>} />
                  <Route path="estimates" element={<Lazy><DemoLiveSection module="estimates" /></Lazy>} />
                  <Route path="jobs" element={<Lazy><DemoLiveSection module="jobs" /></Lazy>} />
                  <Route path="invoices" element={<Lazy><DemoLiveSection module="invoices" /></Lazy>} />
                  <Route path="reports" element={<Lazy><DemoLiveSection module="reports" /></Lazy>} />
                  <Route path="scenarios" element={<Lazy><DemoGuidedScenario /></Lazy>} />
                  <Route path="reset" element={<Lazy><DemoResetPanel /></Lazy>} />
                  <Route path="tools" element={<Lazy><DemoAdminTools /></Lazy>} />
                </Route>
              </Route>
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </ErrorBoundary>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
