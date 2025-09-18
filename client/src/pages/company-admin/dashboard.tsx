import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  DollarSign, 
  CreditCard, 
  BarChart3, 
  FileText,
  Settings,
  ChevronRight,
  Building2,
  Calendar,
  Target,
  PieChart
} from "lucide-react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Link } from "wouter";
import type { Employee, Department, Position } from "@shared/schema";

export default function CompanyAdminDashboard() {
  const { user } = useAuth();
  const params = useParams<{ companySlug: string }>();
  const { companySlug } = params;

  // Update query keys to include company context for cache isolation
  const companyContext = companySlug || 'default';

  // Fetch company data with cache isolation per company
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees", companyContext],
    enabled: !!user && ['COMPANY_ADMIN', 'HR_MANAGER'].includes(user.role || '')
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments", companyContext],
    enabled: !!user && ['COMPANY_ADMIN', 'HR_MANAGER'].includes(user.role || '')
  });

  const { data: positions = [] } = useQuery<Position[]>({
    queryKey: ["/api/positions", companyContext],
    enabled: !!user && ['COMPANY_ADMIN', 'HR_MANAGER'].includes(user.role || '')
  });

  // Calculate company stats
  const stats = {
    totalEmployees: employees.length,
    activeDepartments: departments.length,
    openPositions: positions.length,
    pendingApprovals: 3, // TODO: implement approvals system
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (!user || !['COMPANY_ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER'].includes(user.role || '')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground">You don't have company admin privileges.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex">
      <Sidebar 
        userRole={user.role || 'COMPANY_ADMIN'} 
        companyName={companySlug || 'Unknown Company'}
      />
      
      <div className="flex-1 flex flex-col">
        <Header 
          user={{
            name: (user.firstName || '') + ' ' + (user.lastName || ''),
            email: user.email || '',
            role: user.role || 'COMPANY_ADMIN',
            companyName: companySlug || 'Unknown Company'
          }}
          onLogout={handleLogout}
          pendingNotifications={stats.pendingApprovals}
        />

        <main className="flex-1 overflow-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Company Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of {companySlug || 'your company'} operations
            </p>
          </div>
          
          {/* Company Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="hover-elevate" data-testid="card-total-employees">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary" data-testid="text-total-employees-count">
                  {stats.totalEmployees}
                </div>
                <p className="text-xs text-muted-foreground">
                  Active workforce
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-departments">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Departments</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600" data-testid="text-departments-count">
                  {stats.activeDepartments}
                </div>
                <p className="text-xs text-muted-foreground">
                  Active departments
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-open-positions">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Positions</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600" data-testid="text-positions-count">
                  {stats.openPositions}
                </div>
                <p className="text-xs text-muted-foreground">
                  Available roles
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-pending-approvals">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600" data-testid="text-approvals-count">
                  {stats.pendingApprovals}
                </div>
                <p className="text-xs text-muted-foreground">
                  Require attention
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* ERP Modules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Human Resources Module */}
            <Card className="hover-elevate active-elevate-2" data-testid="card-hr-module">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground mb-2">Human Resources</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Employee management, leave tracking, and HR analytics
                    </p>
                    <Link href={`/${companySlug}/employees`}>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-between"
                        data-testid="button-open-hr"
                      >
                        Open Dashboard
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Payroll Module */}
            <Card className="hover-elevate active-elevate-2" data-testid="card-payroll-module">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground mb-2">Payroll</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Salary processing, payslips, and compensation management
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-between"
                      data-testid="button-open-payroll"
                    >
                      Coming Soon
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Finance Module */}
            <Card className="hover-elevate active-elevate-2" data-testid="card-finance-module">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground mb-2">Finance</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Expense tracking, budgets, and financial analytics
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-between"
                      data-testid="button-open-finance"
                    >
                      Coming Soon
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CRM Module */}
            <Card className="hover-elevate active-elevate-2" data-testid="card-crm-module">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <PieChart className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground mb-2">CRM</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Customer relationship management and sales tracking
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-between"
                      data-testid="button-open-crm"
                    >
                      Coming Soon
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Projects Module */}
            <Card className="hover-elevate active-elevate-2" data-testid="card-projects-module">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground mb-2">Projects</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Project management, time tracking, and resource planning
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-between"
                      data-testid="button-open-projects"
                    >
                      Coming Soon
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reports Module */}
            <Card className="hover-elevate active-elevate-2" data-testid="card-reports-module">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground mb-2">Reports</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Analytics, reporting, and business intelligence dashboards
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-between"
                      data-testid="button-open-reports"
                    >
                      Coming Soon
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}