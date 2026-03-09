import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { GlobalPocketAgent } from "@/components/GlobalPocketbot";
import { DashboardPocketAgent } from "@/components/DashboardPocketAgent";
import { usePWABackNavigation } from "@/hooks/usePWABackNavigation";
import { HomeRedirect } from "@/components/HomeRedirect";
import { NewLandingPage } from "@/components/NewLandingPage";
import { About } from "@/pages/About";
import { Contact } from "@/pages/Contact";
import { Auth } from "@/pages/Auth";
import { Pricing } from "@/pages/Pricing";
import { WhatWeDo } from "@/pages/WhatWeDo";
import { CoreValues } from "@/pages/CoreValues";
import { TradesWeServe } from "@/pages/TradesWeServe";
import { BlogPodcast } from "@/pages/BlogPodcast";
import { ContractorCRMGuide } from "@/pages/blog/ContractorCRMGuide";
import { ContractorCrmSoftware } from "@/pages/ContractorCrmSoftware";
import { ContractorEstimatingSoftware } from "@/pages/ContractorEstimatingSoftware";
import { AiAnsweringServiceForContractors } from "@/pages/AiAnsweringServiceForContractors";
import { ForgeAiInvoiceAssistant } from "@/pages/ForgeAiInvoiceAssistant";
import CrmForTrade from "@/pages/CrmForTrade";
import ContractorBusinessResources from "@/pages/ContractorBusinessResources";
import FeaturePage from "@/pages/FeaturePage";
import BlogPost from "@/pages/BlogPost";
import TradesDirectory from "@/pages/TradesDirectory";
import CitiesDirectory from "@/pages/CitiesDirectory";
import FeaturesDirectory from "@/pages/FeaturesDirectory";
import BlogDirectory from "@/pages/BlogDirectory";
import { Privacy } from "@/pages/Privacy";
import { Terms } from "@/pages/Terms";
import { Dashboard } from "@/components/Dashboard";
import { Marketplace } from "@/components/Marketplace";
import { TrainingHub } from "@/components/TrainingHub";
import { TrainingModulePage } from "@/components/TrainingModulePage";
import { CoursePlayer } from "@/components/CoursePlayer";
import Subscribe from "./pages/Subscribe";
import NotFound from "./pages/NotFound";
import NetworkMap from "./pages/NetworkMap";
import NationwideNetwork from "./pages/NationwideNetwork";
import PaymentSuccess from "./pages/PaymentSuccess";
import PayBill from "./pages/PayBill";
import ProfileEdit from "./pages/ProfileEdit";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { UserManagement } from "@/components/admin/UserManagement";
import { UserDetailPage } from "@/components/admin/UserDetailPage";
import { TrainingManagement } from "@/components/admin/TrainingManagement";
import { MarketplaceManagement } from "@/components/admin/MarketplaceManagement";
import { SupportTickets } from "@/components/admin/SupportTickets";
import { AdminLeads } from "@/components/admin/AdminLeads";
import { AdminEstimates } from "@/components/admin/AdminEstimates";
import { AdminInvoices } from "@/components/admin/AdminInvoices";
import { AdminJobs } from "@/components/admin/AdminJobs";
import { AdminCustomers } from "@/components/admin/AdminCustomers";
import { AdminGCContacts } from "@/components/admin/AdminGCContacts";
import { AdminSettings } from "@/components/admin/AdminSettings";
import { PocketAgentAccessManagement } from "@/components/admin/PocketbotAccessManagement";
import { HelpAdmin } from "@/components/admin/HelpAdmin";
import { ContractorOnboarding } from "@/components/admin/ContractorOnboarding";
import ArchiveManagement from "@/components/admin/ArchiveManagement";
import AdminCatalogImport from "@/pages/admin/AdminCatalogImport";
import AdminProductForm from "@/pages/admin/AdminProductForm";
import AdminUserProfileEdit from "@/pages/AdminUserProfileEdit";
import { BusinessSuite } from "@/pages/BusinessSuite";
import { Training } from "@/pages/features/Training";
import { CRM } from "@/pages/features/CRM";
import { Leads } from "@/pages/features/Leads";
import { QuickBooks } from "@/pages/features/QuickBooks";
import { Insurance } from "@/pages/features/Insurance";
import Estimating from "@/pages/features/Estimating";
import Jobs from "@/pages/features/Jobs";
import VoiceAI from "@/pages/features/VoiceAI";
import ReportingFeature from "@/pages/features/Reporting";
import AccountingFeature from "@/pages/features/Accounting";
import Communication from "@/pages/features/Communication";
import { TrialSignup } from "@/pages/TrialSignup";
import { BotSignup } from "@/pages/BotSignup";
import Savings from "./pages/Savings";
import Platform from "./pages/Platform";
import ForConsumers from "./pages/ForConsumers";
import { CRMDashboard } from "@/pages/CRMDashboard";
import PublicEstimate from "./pages/PublicEstimate";
import PublicChangeOrder from "./pages/PublicChangeOrder";
import PublicReview from "./pages/PublicReview";
import CustomerPortal from "./pages/CustomerPortal";
import PublicInvoice from "./pages/PublicInvoice";
import Reporting from "./pages/Reporting";
import AppInstall from "./pages/AppInstall";
import Accounting from "./pages/Accounting";
import PocketAgentProduct from "./pages/products/PocketbotProduct";
import VoiceAIProduct from "./pages/products/VoiceAIProduct";
import TierLaunch from "./pages/products/TierLaunch";
import TierGrowth from "./pages/products/TierGrowth";
import TierMarket from "./pages/products/TierMarket";
import PublicHelpCenter from "./pages/PublicHelpCenter";
import PublicSupport from "./pages/PublicSupport";
import DashboardHelpCenter from "./pages/DashboardHelpCenter";

const queryClient = new QueryClient();

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
  const excludedPaths = ['/auth', '/admin', '/estimate/', '/p/estimate/', '/app-install'];
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <PWABackHandler />
          <PocketAgentWrapper />
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/home" element={<NewLandingPage />} />
            <Route path="/savings" element={<Savings />} />
            <Route path="/platform" element={<Platform />} />
            <Route path="/for-consumers" element={<ForConsumers />} />
            <Route path="/business-suite" element={<BusinessSuite />} />
            <Route path="/business-suite/training" element={<Training />} />
            <Route path="/business-suite/crm" element={<CRM />} />
            <Route path="/business-suite/leads" element={<Leads />} />
            <Route path="/business-suite/quickbooks" element={<QuickBooks />} />
            <Route path="/business-suite/insurance" element={<Insurance />} />
            <Route path="/business-suite/accounting" element={<AccountingFeature />} />
            <Route path="/business-suite/estimating" element={<Estimating />} />
            <Route path="/business-suite/jobs" element={<Jobs />} />
            <Route path="/business-suite/communication" element={<Communication />} />
            <Route path="/business-suite/voice-ai" element={<VoiceAI />} />
            <Route path="/business-suite/reporting" element={<ReportingFeature />} />
            <Route path="/features/training" element={<Training />} />
            <Route path="/features/crm" element={<CRM />} />
            <Route path="/features/estimating" element={<Estimating />} />
            <Route path="/features/jobs" element={<Jobs />} />
            <Route path="/features/voice-ai" element={<VoiceAI />} />
            <Route path="/features/reporting" element={<ReportingFeature />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/about" element={<About />} />
          <Route path="/what-we-do" element={<WhatWeDo />} />
          <Route path="/core-values" element={<CoreValues />} />
          <Route path="/network-map" element={<NetworkMap />} />
            <Route path="/nationwide-network" element={<NationwideNetwork />} />
            <Route path="/trades-we-serve" element={<TradesWeServe />} />
            {/* Redirect /business-suite/* feature pages to /features/* to consolidate SEO */}
            <Route path="/business-suite/crm" element={<Navigate to="/features/crm" replace />} />
            <Route path="/business-suite/estimating" element={<Navigate to="/features/estimating" replace />} />
            <Route path="/business-suite/jobs" element={<Navigate to="/features/jobs" replace />} />
            <Route path="/business-suite/voice-ai" element={<Navigate to="/features/voice-ai" replace />} />
            <Route path="/business-suite/reporting" element={<Navigate to="/features/reporting" replace />} />
            <Route path="/business-suite/training" element={<Navigate to="/features/training" replace />} />
            <Route path="/blog-podcast" element={<BlogPodcast />} />
            <Route path="/blog/contractor-crm-guide" element={<ContractorCRMGuide />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/products/pocket-agent" element={<PocketAgentProduct />} />
            <Route path="/products/pocketbot" element={<Navigate to="/products/pocket-agent" replace />} />
            <Route path="/products/voice-ai" element={<VoiceAIProduct />} />
            <Route path="/products/tier-launch" element={<TierLaunch />} />
            <Route path="/products/tier-growth" element={<TierGrowth />} />
            <Route path="/products/tier-market" element={<TierMarket />} />
            <Route path="/legal/terms" element={<Terms />} />
            <Route path="/legal/privacy" element={<Privacy />} />
            <Route path="/privacy" element={<Navigate to="/legal/privacy" replace />} />
            <Route path="/terms" element={<Navigate to="/legal/terms" replace />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/help" element={<PublicHelpCenter />} />
            <Route path="/support" element={<PublicSupport />} />
            <Route path="/auth" element={<Auth />} />
          <Route path="/estimate/:token" element={<PublicEstimate />} />
          <Route path="/p/estimate/:token" element={<PublicEstimate />} />
          <Route path="/invoice/:token" element={<PublicInvoice />} />
          <Route path="/change-order/:token" element={<PublicChangeOrder />} />
          <Route path="/review/:jobId" element={<PublicReview />} />
          <Route path="/portal/:token" element={<CustomerPortal />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/contractor-crm-software" element={<ContractorCrmSoftware />} />
            <Route path="/contractor-estimating-software" element={<ContractorEstimatingSoftware />} />
            <Route path="/ai-answering-service-for-contractors" element={<AiAnsweringServiceForContractors />} />
            <Route path="/contractor-business-resources" element={<ContractorBusinessResources />} />
            <Route path="/trades" element={<TradesDirectory />} />
            <Route path="/cities" element={<CitiesDirectory />} />
            <Route path="/features" element={<FeaturesDirectory />} />
            <Route path="/blog" element={<BlogDirectory />} />
            <Route path="/crm-for-:tradeSlug" element={<CrmForTrade />} />
            <Route path="/features/:slug" element={<FeaturePage />} />
            <Route path="/trial-signup" element={<TrialSignup />} />
            <Route path="/bot-signup" element={<BotSignup />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/pay-bill" element={
              <ProtectedRoute>
                <PayBill />
              </ProtectedRoute>
            } />
            <Route path="/subscribe" element={<Subscribe />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/helpcenter" element={
              <ProtectedRoute>
                <DashboardHelpCenter />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/profile" element={
              <ProtectedRoute>
                <ProfileEdit />
              </ProtectedRoute>
            } />
            <Route path="/app-install" element={<AppInstall />} />
            <Route path="/crm" element={
              <ProtectedRoute>
                <Navigate to="/dashboard" replace />
              </ProtectedRoute>
            } />
            <Route path="/reporting" element={
              <ProtectedRoute>
                <Reporting />
              </ProtectedRoute>
            } />
            <Route path="/accounting" element={
              <ProtectedRoute>
                <Accounting />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/marketplace" element={
              <ProtectedRoute>
                <Marketplace />
              </ProtectedRoute>
            } />
              <Route path="/dashboard/training" element={
                <ProtectedRoute>
                  <TrainingHub />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/training/module/:moduleId" element={
                <ProtectedRoute>
                  <TrainingModulePage />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/training/course/:courseId" element={
                <ProtectedRoute>
                  <CoursePlayer />
                </ProtectedRoute>
              } />
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="users/:userId" element={<UserDetailPage />} />
              <Route path="users/:userId/edit" element={<AdminUserProfileEdit />} />
              <Route path="leads" element={<AdminLeads />} />
              <Route path="estimates" element={<AdminEstimates />} />
              <Route path="invoices" element={<AdminInvoices />} />
              <Route path="jobs" element={<AdminJobs />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="gc-contacts" element={<AdminGCContacts />} />
              <Route path="archive" element={<ArchiveManagement />} />
              <Route path="onboarding" element={<ContractorOnboarding />} />
              <Route path="support" element={<SupportTickets />} />
              <Route path="marketplace" element={<MarketplaceManagement />} />
              <Route path="help" element={<HelpAdmin />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="catalog-import" element={<AdminCatalogImport />} />
              <Route path="product-form" element={<AdminProductForm />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
