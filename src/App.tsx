import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LandingPage } from "@/components/LandingPage";
import { Dashboard } from "@/components/Dashboard";
import { Marketplace } from "@/components/Marketplace";
import { TrainingHub } from "@/components/TrainingHub";
import { CoursePlayer } from "@/components/CoursePlayer";
import Subscribe from "./pages/Subscribe";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { UserManagement } from "@/components/admin/UserManagement";
import { TrainingManagement } from "@/components/admin/TrainingManagement";
import { MarketplaceManagement } from "@/components/admin/MarketplaceManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/subscribe" element={<Subscribe />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
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
              <Route path="/dashboard/training/course/:courseId" element={
                <ProtectedRoute>
                  <CoursePlayer />
                </ProtectedRoute>
              } />
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<UserManagement />} />
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
