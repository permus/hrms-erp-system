import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { CleanDashboardLayout } from "@/components/CleanDashboardLayout";
import { HRModuleLayout } from "@/components/HRModuleLayout";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import SuperAdminDashboard from "@/pages/super-admin/dashboard";
import CreateCompany from "@/pages/super-admin/create-company";
import ManageCompany from "@/pages/super-admin/manage-company";
import SuperAdminCompanies from "@/pages/super-admin/companies";
import SuperAdminEmployees from "@/pages/super-admin/employees";
import SuperAdminBin from "@/pages/super-admin/bin";
import CompanyAdminDashboard from "@/pages/company-admin/dashboard";
import EmployeeDashboard from "@/pages/employee/dashboard";
import HRDashboard from "@/pages/company-admin/hr/dashboard";
import EmployeeList from "@/pages/company-admin/employees/EmployeeList";
import AddEmployee from "@/pages/company-admin/employees/AddEmployee";
import EmployeeProfile from "@/pages/company-admin/employees/EmployeeProfile";
import EditEmployee from "@/pages/company-admin/employees/EditEmployee";
import SigninPage from "@/pages/auth/signin";
import ChangePasswordPage from "@/pages/auth/change-password";
import NotFound from "@/pages/not-found";

// Type for the /api/resolve/me response
type UserSlugsResponse = {
  role: string;
  companySlugs: string[];
  employeeSlug?: string;
};

function RoleBasedRedirect() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  
  // Fetch user's available slugs
  const { data: userSlugs, isLoading } = useQuery<UserSlugsResponse>({
    queryKey: ['/api/resolve/me'],
    enabled: isAuthenticated && !!user,
  });
  
  // Handle redirection based on role and available slugs using useEffect
  useEffect(() => {
    if (!isLoading && userSlugs && user) {
      // Check if user must change password first
      if ((user as any).mustChangePassword) {
        setLocation('/auth/change-password');
        return;
      }
      
      if ((user as any).role === 'SUPER_ADMIN') {
        setLocation('/super-admin/dashboard');
      } else if (['COMPANY_ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER'].includes((user as any).role || '')) {
        // Redirect to slug-based company admin URL
        if (userSlugs.companySlugs && userSlugs.companySlugs.length > 0) {
          setLocation(`/${userSlugs.companySlugs[0]}/dashboard`);
        } else {
          // Fallback to old route if no company slugs available
          setLocation('/company-admin/dashboard');
        }
      } else if ((user as any).role === 'EMPLOYEE') {
        // Redirect to slug-based employee URL
        if (userSlugs.companySlugs && userSlugs.companySlugs.length > 0 && userSlugs.employeeSlug) {
          setLocation(`/${userSlugs.companySlugs[0]}/${userSlugs.employeeSlug}/dashboard`);
        } else {
          // Fallback to old route if slugs not available
          setLocation('/employee/dashboard');
        }
      } else {
        window.location.href = '/api/login'; // Unknown role
      }
    }
  }, [isLoading, userSlugs, user, setLocation]);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-semibold mb-2">
          {isLoading ? 'Loading...' : 'Redirecting...'}
        </h2>
        <p className="text-muted-foreground">
          {isLoading ? 'Preparing your workspace' : 'Taking you to your workspace'}
        </p>
      </div>
    </div>
  );
}

// Main Dashboard Routes with Clean Layout (No Sidebar)
function MainDashboardRoutes() {
  return (
    <CleanDashboardLayout>
      <Switch>
        {/* Main Company Dashboard - slug-based */}
        <Route path="/:companySlug/dashboard" component={CompanyAdminDashboard} />
        <Route path="/:companySlug/analytics" component={Home} />
        <Route path="/:companySlug/settings" component={Home} />
        
        {/* Main Company Dashboard - fallback routes */}
        <Route path="/company-admin/dashboard" component={CompanyAdminDashboard} />
        <Route path="/company-admin/analytics" component={Home} />
        <Route path="/company-admin/settings" component={Home} />
      </Switch>
    </CleanDashboardLayout>
  );
}

// HR Module Routes with HR Sidebar
function HRModuleRoutes() {
  return (
    <HRModuleLayout>
      <Switch>
        {/* HR Module - slug-based routes */}
        <Route path="/:companySlug/hr/dashboard" component={HRDashboard} />
        <Route path="/:companySlug/hr/employees" component={EmployeeList} />
        <Route path="/:companySlug/hr/employees/new" component={AddEmployee} />
        <Route path="/:companySlug/hr/employees/:employeeSlug/edit" component={EditEmployee} />
        <Route path="/:companySlug/hr/employees/:employeeSlug" component={EmployeeProfile} />
        <Route path="/:companySlug/hr/departments" component={Home} />
        <Route path="/:companySlug/hr/documents" component={Home} />
        <Route path="/:companySlug/hr/leave" component={Home} />
        <Route path="/:companySlug/hr/attendance" component={Home} />
        <Route path="/:companySlug/hr/probation" component={Home} />
        
        {/* HR Module - fallback routes */}
        <Route path="/company-admin/hr/dashboard" component={HRDashboard} />
        <Route path="/company-admin/hr/employees" component={EmployeeList} />
        <Route path="/company-admin/hr/employees/new" component={AddEmployee} />
        <Route path="/company-admin/hr/employees/:employeeSlug/edit" component={EditEmployee} />
        <Route path="/company-admin/hr/employees/:employeeSlug" component={EmployeeProfile} />
        <Route path="/company-admin/hr/departments" component={Home} />
        <Route path="/company-admin/hr/documents" component={Home} />
        <Route path="/company-admin/hr/leave" component={Home} />
        <Route path="/company-admin/hr/attendance" component={Home} />
        <Route path="/company-admin/hr/probation" component={Home} />
      </Switch>
    </HRModuleLayout>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Public auth routes */}
      <Route path="/auth/signin" component={SigninPage} />
      <Route path="/auth/change-password" component={ChangePasswordPage} />
      
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          {/* Role-based default redirect */}
          <Route path="/" component={RoleBasedRedirect} />
          
          {/* Super Admin Portal */}
          <Route path="/super-admin/dashboard" component={SuperAdminDashboard} />
          <Route path="/super-admin/create-company" component={CreateCompany} />
          <Route path="/super-admin/companies/:companyId" component={ManageCompany} />
          <Route path="/super-admin/companies" component={SuperAdminCompanies} />
          <Route path="/super-admin/bin" component={SuperAdminBin} />
          <Route path="/super-admin/employees" component={SuperAdminEmployees} />
          
          {/* Main Dashboard Routes */}
          <Route path="/:companySlug/dashboard" component={MainDashboardRoutes} />
          <Route path="/:companySlug/analytics" component={MainDashboardRoutes} />
          <Route path="/:companySlug/settings" component={MainDashboardRoutes} />
          
          {/* HR Module Routes */}
          <Route path="/:companySlug/hr/*" component={HRModuleRoutes} />
          
          {/* Fallback routes */}
          <Route path="/company-admin/dashboard" component={MainDashboardRoutes} />
          <Route path="/company-admin/analytics" component={MainDashboardRoutes} />
          <Route path="/company-admin/settings" component={MainDashboardRoutes} />
          <Route path="/company-admin/hr/*" component={HRModuleRoutes} />

          {/* Employee Self-Service Portal - slug-based */}
          <Route path="/:companySlug/:employeeSlug/dashboard" component={EmployeeDashboard} />
          <Route path="/:companySlug/:employeeSlug/attendance" component={EmployeeDashboard} />
          <Route path="/:companySlug/:employeeSlug/documents" component={EmployeeDashboard} />
          <Route path="/:companySlug/:employeeSlug/leave" component={EmployeeDashboard} />
          <Route path="/:companySlug/:employeeSlug/*" component={EmployeeDashboard} />
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
