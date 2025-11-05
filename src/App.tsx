import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import PaymentSuccess from "./pages/PaymentSuccess";
import PayBill from "./pages/PayBill";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { UserManagement } from "@/components/admin/UserManagement";
import { TrainingManagement } from "@/components/admin/TrainingManagement";
import { MarketplaceManagement } from "@/components/admin/MarketplaceManagement";
import { SupportTickets } from "@/components/admin/SupportTickets";
import { BusinessSuite } from "@/pages/BusinessSuite";
import { Training } from "@/pages/features/Training";
import { CRM } from "@/pages/features/CRM";
import { Leads } from "@/pages/features/Leads";
import { QuickBooks } from "@/pages/features/QuickBooks";
import { Insurance } from "@/pages/features/Insurance";
import { TrialSignup } from "@/pages/TrialSignup";
import { BotSignup } from "@/pages/BotSignup";
import Savings from "./pages/Savings";
import Platform from "./pages/Platform";
import ForConsumers from "./pages/ForConsumers";
import { CRMDashboard } from "@/pages/CRMDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/about" element={<About />} />
          <Route path="/what-we-do" element={<WhatWeDo />} />
          <Route path="/core-values" element={<CoreValues />} />
          <Route path="/network-map" element={<NetworkMap />} />
            <Route path="/trades-we-serve" element={<TradesWeServe />} />
            <Route path="/blog-podcast" element={<BlogPodcast />} />
            <Route path="/legal/terms" element={<Terms />} />
            <Route path="/legal/privacy" element={<Privacy />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/auth" element={<Auth />} />
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
            <Route path="/crm" element={
              <ProtectedRoute>
                <CRMDashboard />
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
              <Route index element={<UserManagement />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="support" element={<SupportTickets />} />
              <Route path="training" element={<TrainingManagement />} />
              <Route path="marketplace" element={<MarketplaceManagement />} />
              <Route path="analytics" element={<div>Analytics coming soon...</div>} />
              <Route path="settings" element={<div>Settings coming soon...</div>} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
