import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import AuthPage from "@/pages/auth-page";
import Login from "@/pages/login";
import ResetPasswordPage from "@/pages/reset-password";
import Profile from "@/pages/profile";
import EmployeeDashboard from "@/pages/employee-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  console.log('Router state:', { isAuthenticated, isLoading, user: user ? 'exists' : 'null' });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Login} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/login" component={Login} />
          <Route path="/reset-password" component={ResetPasswordPage} />
          <Route path="/landing" component={Landing} />
        </>
      ) : (
        <>
          <Route path="/" exact>
            {user?.role === 'admin' ? <AdminDashboard /> : <EmployeeDashboard />}
          </Route>
          <Route path="/profile" component={Profile} />
          <Route path="/employee" component={EmployeeDashboard} />
          <Route path="/admin" component={AdminDashboard} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
