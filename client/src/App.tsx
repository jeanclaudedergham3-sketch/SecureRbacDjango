import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ThemeProvider } from "@/hooks/use-theme";
import { MainLayout } from "@/components/layout/main-layout";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Users from "@/pages/users";
import Roles from "@/pages/roles";

import Technicians from "@/pages/technicians";
import TechnicianMap from "@/pages/technician-map";
import WorkOrders from "@/pages/work-orders";
import Proposals from "@/pages/proposals";
import PartsRequests from "@/pages/parts-requests";
import PaymentManager from "@/pages/payment-manager";
import TechnicianPayments from "@/pages/technician-payments";
import Invoices from "@/pages/invoices";
import FinancialAnalysis from "@/pages/financial-analysis";
import Analytics from "@/pages/analytics";
import DataImport from "@/pages/data-import";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return (
    <MainLayout>
      <Component />
    </MainLayout>
  );
}

function PublicRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Redirect to="/dashboard" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={() => <PublicRoute component={Login} />} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/users" component={() => <ProtectedRoute component={Users} />} />
      <Route path="/roles" component={() => <ProtectedRoute component={Roles} />} />

      <Route path="/technicians" component={() => <ProtectedRoute component={Technicians} />} />
      <Route path="/technician-map" component={() => <ProtectedRoute component={TechnicianMap} />} />
      <Route path="/work-orders" component={() => <ProtectedRoute component={WorkOrders} />} />
      <Route path="/proposals" component={() => <ProtectedRoute component={Proposals} />} />
      <Route path="/parts-requests" component={() => <ProtectedRoute component={PartsRequests} />} />
      <Route path="/payment-manager" component={() => <ProtectedRoute component={PaymentManager} />} />
      <Route path="/technician-payments" component={() => <ProtectedRoute component={TechnicianPayments} />} />
      <Route path="/invoices" component={() => <ProtectedRoute component={Invoices} />} />
      <Route path="/financial-analysis" component={() => <ProtectedRoute component={FinancialAnalysis} />} />
      <Route path="/analytics" component={() => <ProtectedRoute component={Analytics} />} />
      <Route path="/data-import" component={() => <ProtectedRoute component={DataImport} />} />
      <Route path="/" component={() => <Redirect to="/dashboard" />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Router />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
