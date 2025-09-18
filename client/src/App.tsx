import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import SuperAdminDashboard from "@/pages/super-admin/dashboard";
import CompanyAdminDashboard from "@/pages/company-admin/dashboard";
import EmployeeDashboard from "@/pages/employee/dashboard";
import NotFound from "@/pages/not-found";

function RoleBasedRedirect() {
  const { user } = useAuth();
  
  // Redirect to appropriate portal based on user role
  if (user?.role === 'SUPER_ADMIN') {
    window.location.href = '/super-admin/dashboard';
  } else if (['COMPANY_ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER'].includes(user?.role || '')) {
    window.location.href = '/company-admin/dashboard';
  } else if (user?.role === 'EMPLOYEE') {
    window.location.href = '/employee/dashboard';
  } else {
    // Fallback for users without proper roles
    window.location.href = '/api/login';
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-semibold mb-2">Redirecting...</h2>
        <p className="text-muted-foreground">Taking you to your portal</p>
      </div>
    </div>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          {/* Role-based default redirect */}
          <Route path="/" component={RoleBasedRedirect} />
          
          {/* Super Admin Portal */}
          <Route path="/super-admin/dashboard" component={SuperAdminDashboard} />
          <Route path="/super-admin/*" component={SuperAdminDashboard} />
          
          {/* Company Admin Portal */}
          <Route path="/company-admin/dashboard" component={CompanyAdminDashboard} />
          <Route path="/company-admin/employees" component={Home} />
          <Route path="/company-admin/*" component={CompanyAdminDashboard} />
          
          {/* Employee Self-Service Portal */}
          <Route path="/employee/dashboard" component={EmployeeDashboard} />
          <Route path="/employee/*" component={EmployeeDashboard} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
