import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { MainDashboardLayout } from "@/components/MainDashboardLayout";
import { HRModuleLayout } from "@/components/HRModuleLayout";
import { PayrollModuleLayout } from "@/components/PayrollModuleLayout";
import { FinanceModuleLayout } from "@/components/FinanceModuleLayout";
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
import HRDepartments from "@/pages/company-admin/hr/departments";
import NewDepartment from "@/pages/company-admin/hr/departments/new";
import DepartmentHierarchy from "@/pages/company-admin/hr/departments/hierarchy";
import DepartmentDetails from "@/pages/company-admin/hr/departments/[id]";
import EditDepartment from "@/pages/company-admin/hr/departments/[id]/edit";
import DepartmentEmployeeAssignment from "@/pages/company-admin/hr/departments/[id]/employees";
import HRDocuments from "@/pages/company-admin/hr/documents";
import HRLeave from "@/pages/company-admin/hr/leave";
import HRAttendance from "@/pages/company-admin/hr/attendance";
import HRProbation from "@/pages/company-admin/hr/probation";
import EmployeeList from "@/pages/company-admin/employees/EmployeeList";
import AddEmployee from "@/pages/company-admin/employees/AddEmployee";
import EmployeeProfile from "@/pages/company-admin/employees/EmployeeProfile";
import EditEmployee from "@/pages/company-admin/employees/EditEmployee";
import SigninPage from "@/pages/auth/signin";
import ChangePasswordPage from "@/pages/auth/change-password";
import NotFound from "@/pages/not-found";

// Payroll Module Pages
import PayrollDashboard from "@/pages/payroll/dashboard";
import SalaryProcessing from "@/pages/payroll/salary-processing";
import Payslips from "@/pages/payroll/payslips";
import TaxManagement from "@/pages/payroll/tax-management";

// Finance Module Pages
import FinanceDashboard from "@/pages/finance/dashboard";
import Expenses from "@/pages/finance/expenses";
import Budgets from "@/pages/finance/budgets";
import FinanceReports from "@/pages/finance/reports";

// Type for the /api/resolve/me response
type UserSlugsResponse = {
  role: string;
  companySlugs: string[];
  employeeSlug?: string;
};

// Simple redirect component for SPA navigation
function Redirect({ to }: { to: string }) {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation(to);
  }, [to, setLocation]);
  return null;
}

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

// Main Dashboard Routes with Main Dashboard Sidebar
function MainDashboardRoutes() {
  return (
    <MainDashboardLayout>
      <Switch>
        {/* Main Dashboard routes only - no employee management */}
        <Route path="/:companySlug/dashboard" component={CompanyAdminDashboard} />
        <Route path="/:companySlug/analytics" component={Home} />
        <Route path="/:companySlug/settings" component={Home} />
        <Route path="/dashboard" component={CompanyAdminDashboard} />
        <Route path="/analytics" component={Home} />
        <Route path="/settings" component={Home} />
        
        {/* Fallback routes for legacy/direct paths */}
        <Route path="/company-admin/dashboard" component={CompanyAdminDashboard} />
        <Route path="/company-admin/analytics" component={Home} />
        <Route path="/company-admin/settings" component={Home} />
      </Switch>
    </MainDashboardLayout>
  );
}

// HR Module Routes with HR-specific sidebar
function HRRoutes() {
  return (
    <HRModuleLayout>
      <Switch>
        {/* HR Dashboard */}
        <Route path="/hr/dashboard" component={HRDashboard} />
        
        {/* Employee Management */}
        <Route path="/hr/employees" component={EmployeeList} />
        <Route path="/hr/employees/new" component={AddEmployee} />
        <Route path="/hr/employees/:employeeSlug/edit" component={EditEmployee} />
        <Route path="/hr/employees/:employeeSlug" component={EmployeeProfile} />
        
        {/* Department Management */}
        <Route path="/hr/departments" component={HRDepartments} />
        <Route path="/hr/departments/new" component={NewDepartment} />
        <Route path="/hr/departments/:id/employees" component={DepartmentEmployeeAssignment} />
        <Route path="/hr/departments/:id/edit" component={EditDepartment} />
        <Route path="/hr/departments/:id" component={DepartmentDetails} />
        
        {/* HR Operations */}
        <Route path="/hr/documents" component={HRDocuments} />
        <Route path="/hr/leave-management" component={HRLeave} />
        <Route path="/hr/attendance" component={HRAttendance} />
        <Route path="/hr/probation-tracking" component={HRProbation} />
        
        {/* Company-scoped HR routes */}
        <Route path="/:companySlug/hr/dashboard" component={HRDashboard} />
        <Route path="/:companySlug/hr/employees" component={EmployeeList} />
        <Route path="/:companySlug/hr/employees/new" component={AddEmployee} />
        <Route path="/:companySlug/hr/employees/:employeeSlug/edit" component={EditEmployee} />
        <Route path="/:companySlug/hr/employees/:employeeSlug" component={EmployeeProfile} />
        <Route path="/:companySlug/hr/departments" component={HRDepartments} />
        <Route path="/:companySlug/hr/departments/new" component={NewDepartment} />
        <Route path="/:companySlug/hr/departments/hierarchy" component={DepartmentHierarchy} />
        <Route path="/:companySlug/hr/departments/:id/employees" component={DepartmentEmployeeAssignment} />
        <Route path="/:companySlug/hr/departments/:id/edit" component={EditDepartment} />
        <Route path="/:companySlug/hr/departments/:id" component={DepartmentDetails} />
        <Route path="/:companySlug/hr/documents" component={HRDocuments} />
        <Route path="/:companySlug/hr/leave-management" component={HRLeave} />
        <Route path="/:companySlug/hr/attendance" component={HRAttendance} />
        <Route path="/:companySlug/hr/probation-tracking" component={HRProbation} />
        
        {/* Legacy fallback routes */}
        <Route path="/company-admin/hr/dashboard" component={HRDashboard} />
        <Route path="/company-admin/hr/employees" component={EmployeeList} />
        <Route path="/company-admin/hr/employees/new" component={AddEmployee} />
        <Route path="/company-admin/hr/employees/:employeeSlug/edit" component={EditEmployee} />
        <Route path="/company-admin/hr/employees/:employeeSlug" component={EmployeeProfile} />
        <Route path="/company-admin/hr/departments" component={HRDepartments} />
        <Route path="/company-admin/hr/departments/new" component={NewDepartment} />
        <Route path="/company-admin/hr/departments/hierarchy" component={DepartmentHierarchy} />
        <Route path="/company-admin/hr/departments/:id/employees" component={DepartmentEmployeeAssignment} />
        <Route path="/company-admin/hr/departments/:id/edit" component={EditDepartment} />
        <Route path="/company-admin/hr/departments/:id" component={DepartmentDetails} />
        <Route path="/company-admin/hr/documents" component={HRDocuments} />
        <Route path="/company-admin/hr/leave" component={HRLeave} />
        <Route path="/company-admin/hr/attendance" component={HRAttendance} />
        <Route path="/company-admin/hr/probation" component={HRProbation} />
      </Switch>
    </HRModuleLayout>
  );
}

// Payroll Module Routes with Payroll-specific sidebar
function PayrollRoutes() {
  return (
    <PayrollModuleLayout>
      <Switch>
        {/* Payroll routes - absolute paths for proper routing */}
        <Route path="/payroll/dashboard" component={PayrollDashboard} />
        <Route path="/payroll/salary-processing" component={SalaryProcessing} />
        <Route path="/payroll/payslips" component={Payslips} />
        <Route path="/payroll/tax-management" component={TaxManagement} />
        
        {/* Company-scoped Payroll routes */}
        <Route path="/:companySlug/payroll/dashboard" component={PayrollDashboard} />
        <Route path="/:companySlug/payroll/salary-processing" component={SalaryProcessing} />
        <Route path="/:companySlug/payroll/payslips" component={Payslips} />
        <Route path="/:companySlug/payroll/tax-management" component={TaxManagement} />
        
        {/* Legacy fallback routes */}
        <Route path="/company-admin/payroll/dashboard" component={PayrollDashboard} />
        <Route path="/company-admin/payroll/salary-processing" component={SalaryProcessing} />
        <Route path="/company-admin/payroll/payslips" component={Payslips} />
        <Route path="/company-admin/payroll/tax-management" component={TaxManagement} />
      </Switch>
    </PayrollModuleLayout>
  );
}

// Finance Module Routes with Finance-specific sidebar
function FinanceRoutes() {
  return (
    <FinanceModuleLayout>
      <Switch>
        {/* Finance routes - absolute paths for proper routing */}
        <Route path="/finance/dashboard" component={FinanceDashboard} />
        <Route path="/finance/expenses" component={Expenses} />
        <Route path="/finance/budgets" component={Budgets} />
        <Route path="/finance/reports" component={FinanceReports} />
        
        {/* Company-scoped Finance routes */}
        <Route path="/:companySlug/finance/dashboard" component={FinanceDashboard} />
        <Route path="/:companySlug/finance/expenses" component={Expenses} />
        <Route path="/:companySlug/finance/budgets" component={Budgets} />
        <Route path="/:companySlug/finance/reports" component={FinanceReports} />
        
        {/* Legacy fallback routes */}
        <Route path="/company-admin/finance/dashboard" component={FinanceDashboard} />
        <Route path="/company-admin/finance/expenses" component={Expenses} />
        <Route path="/company-admin/finance/budgets" component={Budgets} />
        <Route path="/company-admin/finance/reports" component={FinanceReports} />
      </Switch>
    </FinanceModuleLayout>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Public auth routes */}
      <Route path="/auth/signin" component={SigninPage} />
      <Route path="/login" component={SigninPage} />
      <Route path="/auth/change-password" component={ChangePasswordPage} />
      
      {/* Home and authenticated routes */}
      {isLoading ? (
        <div className="min-h-screen flex items-center justify-center">
          <div>Loading...</div>
        </div>
      ) : !isAuthenticated ? (
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
        </>
      )}

      {/* Module index redirects */}
      <Route path="/hr" component={() => <Redirect to="/hr/dashboard" />} />
      <Route path="/payroll" component={() => <Redirect to="/payroll/dashboard" />} />
      <Route path="/finance" component={() => <Redirect to="/finance/dashboard" />} />
      
      {/* Top-level HR routes (must come before slug-capturing routes) */}
      <Route path="/hr/*" component={HRRoutes} />
      
      {/* Top-level Payroll routes */}
      <Route path="/payroll/*" component={PayrollRoutes} />
      
      {/* Top-level Finance routes */}
      <Route path="/finance/*" component={FinanceRoutes} />
      
      {/* Company routes - accessible when authenticated or redirects to login */}
      <Route path="/:companySlug/dashboard" component={MainDashboardRoutes} />
      <Route path="/:companySlug/analytics" component={MainDashboardRoutes} />
      <Route path="/:companySlug/settings" component={MainDashboardRoutes} />
      
      {/* Employee routes redirect to HR module */}
      <Route path="/:companySlug/employees" component={(params) => <Redirect to={`/${params.companySlug}/hr/employees`} />} />
      <Route path="/:companySlug/employees/new" component={(params) => <Redirect to={`/${params.companySlug}/hr/employees/new`} />} />
      <Route path="/:companySlug/employees/:employeeSlug" component={(params) => <Redirect to={`/${params.companySlug}/hr/employees/${params.employeeSlug}`} />} />
      <Route path="/:companySlug/employees/:employeeSlug/edit" component={(params) => <Redirect to={`/${params.companySlug}/hr/employees/${params.employeeSlug}/edit`} />} />
      <Route path="/:companySlug/hr/*" component={HRRoutes} />
      <Route path="/:companySlug/payroll/*" component={PayrollRoutes} />
      <Route path="/:companySlug/finance/*" component={FinanceRoutes} />
      
      {/* Fallback routes */}
      <Route path="/company-admin/dashboard" component={MainDashboardRoutes} />
      <Route path="/company-admin/analytics" component={MainDashboardRoutes} />
      <Route path="/company-admin/settings" component={MainDashboardRoutes} />
      <Route path="/company-admin/employees/*" component={MainDashboardRoutes} />
      <Route path="/company-admin/hr/*" component={HRRoutes} />
      <Route path="/company-admin/payroll/*" component={PayrollRoutes} />
      <Route path="/company-admin/finance/*" component={FinanceRoutes} />

      {/* Employee Self-Service Portal - slug-based */}
      <Route path="/:companySlug/:employeeSlug/dashboard" component={EmployeeDashboard} />
      <Route path="/:companySlug/:employeeSlug/attendance" component={EmployeeDashboard} />
      <Route path="/:companySlug/:employeeSlug/documents" component={EmployeeDashboard} />
      <Route path="/:companySlug/:employeeSlug/leave" component={EmployeeDashboard} />
      <Route path="/:companySlug/:employeeSlug/*" component={EmployeeDashboard} />
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
