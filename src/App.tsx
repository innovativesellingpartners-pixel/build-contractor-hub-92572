import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { GlobalPocketbot } from "@/components/GlobalPocketbot";
import { usePWABackNavigation } from "@/hooks/usePWABackNavigation";
import { NewLandingPage } from "@/components/NewLandingPage";
import { About } from "@/pages/About";
import { Contact } from "@/pages/Contact";
import { Auth } from "@/pages/Auth";
import { Pricing } from "@/pages/Pricing";
import { WhatWeDo } from "@/pages/WhatWeDo";
import { CoreValues } from "@/pages/CoreValues";
import { TradesWeServe } from "@/pages/TradesWeServe";
import { BlogPodcast } from "@/pages/BlogPodcast";
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
import { PocketbotAccessManagement } from "@/components/admin/PocketbotAccessManagement";
import { HelpAdmin } from "@/components/admin/HelpAdmin";
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
import { TrialSignup } from "@/pages/TrialSignup";
import { BotSignup } from "@/pages/BotSignup";
import Savings from "./pages/Savings";
import Platform from "./pages/Platform";
import ForConsumers from "./pages/ForConsumers";
import { CRMDashboard } from "@/pages/CRMDashboard";
import PublicEstimate from "./pages/PublicEstimate";
import PublicChangeOrder from "./pages/PublicChangeOrder";
import Reporting from "./pages/Reporting";
import AppInstall from "./pages/AppInstall";
import Accounting from "./pages/Accounting";
import PocketbotProduct from "./pages/products/PocketbotProduct";
import VoiceAIProduct from "./pages/products/VoiceAIProduct";
import TierLaunch from "./pages/products/TierLaunch";
import TierGrowth from "./pages/products/TierGrowth";
import TierMarket from "./pages/products/TierMarket";

const queryClient = new QueryClient();

// Wrapper to conditionally show Pocketbot on public pages only
function PocketbotWrapper() {
  const location = useLocation();
  const publicPaths = [
    '/', '/savings', '/platform', '/for-consumers', '/business-suite', 
    '/what-we-do', '/core-values', '/trades-we-serve', '/blog-podcast',
    '/pricing', '/contact', '/nationwide-network', '/network-map',
    '/features/', '/products/', '/legal/', '/about'
  ];
  
  const isPublicPage = publicPaths.some(path => 
    location.pathname === path || location.pathname.startsWith(path)
  );
  
  // Don't show on auth, dashboard, admin, or estimate pages
  const excludedPaths = ['/auth', '/dashboard', '/admin', '/crm', '/reporting', '/accounting', '/estimate/', '/p/estimate/'];
  const isExcluded = excludedPaths.some(path => location.pathname.startsWith(path));
  
  if (isPublicPage && !isExcluded) {
    return <GlobalPocketbot />;
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
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <PWABackHandler />
          <PocketbotWrapper />
          <Routes>
            <Route path="/" element={<NewLandingPage />} />
            <Route path="/savings" element={<Savings />} />
            <Route path="/platform" element={<Platform />} />
            <Route path="/for-consumers" element={<ForConsumers />} />
            <Route path="/business-suite" element={<BusinessSuite />} />
            <Route path="/business-suite/training" element={<Training />} />
            <Route path="/business-suite/crm" element={<CRM />} />
            <Route path="/business-suite/leads" element={<Leads />} />
            <Route path="/business-suite/quickbooks" element={<QuickBooks />} />
            <Route path="/business-suite/insurance" element={<Insurance />} />
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
            <Route path="/blog-podcast" element={<BlogPodcast />} />
            <Route path="/products/pocketbot" element={<PocketbotProduct />} />
            <Route path="/products/voice-ai" element={<VoiceAIProduct />} />
            <Route path="/products/tier-launch" element={<TierLaunch />} />
            <Route path="/products/tier-growth" element={<TierGrowth />} />
            <Route path="/products/tier-market" element={<TierMarket />} />
            <Route path="/legal/terms" element={<Terms />} />
            <Route path="/legal/privacy" element={<Privacy />} />
            <Route path="/privacy" element={<Navigate to="/legal/privacy" replace />} />
            <Route path="/terms" element={<Navigate to="/legal/terms" replace />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/auth" element={<Auth />} />
          <Route path="/estimate/:token" element={<PublicEstimate />} />
          <Route path="/p/estimate/:token" element={<PublicEstimate />} />
          <Route path="/change-order/:token" element={<PublicChangeOrder />} />
            <Route path="/pricing" element={<Pricing />} />
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
              <Route path="leads" element={<AdminLeads />} />
              <Route path="estimates" element={<AdminEstimates />} />
              <Route path="invoices" element={<AdminInvoices />} />
              <Route path="jobs" element={<AdminJobs />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="gc-contacts" element={<AdminGCContacts />} />
              <Route path="support" element={<SupportTickets />} />
              <Route path="marketplace" element={<MarketplaceManagement />} />
              <Route path="help" element={<HelpAdmin />} />
              <Route path="settings" element={<AdminSettings />} />
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
