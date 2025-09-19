import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Building2,
  Target,
  UserCheck,
  ArrowLeft,
  FileText,
  Calendar,
  Clock
} from "lucide-react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Link } from "wouter";
import type { Employee, Department, Position } from "@shared/schema";

export default function HRDashboard() {
  const { user } = useAuth();
  const params = useParams<{ companySlug: string }>();
  const { companySlug } = params;

  // Update query keys to include company context for cache isolation
  const companyContext = companySlug || 'default';

  // Fetch company data with cache isolation per company
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees", companyContext],
    enabled: !!user && ['COMPANY_ADMIN', 'HR_MANAGER'].includes(user?.role || '')
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments", companyContext],
    enabled: !!user && ['COMPANY_ADMIN', 'HR_MANAGER'].includes(user?.role || '')
  });

  const { data: positions = [] } = useQuery<Position[]>({
    queryKey: ["/api/positions", companyContext],
    enabled: !!user && ['COMPANY_ADMIN', 'HR_MANAGER'].includes(user?.role || '')
  });

  // Calculate HR stats
  const stats = {
    totalEmployees: employees.length,
    activeDepartments: departments.length,
    openPositions: positions.length,
    probationEmployees: 5, // TODO: calculate from employee data
    pendingDocuments: 12, // TODO: calculate from documents
    leaveRequests: 3, // TODO: calculate from leave requests
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (!user || !['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER'].includes(user?.role || '')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground">You don't have HR access privileges.</p>
          <p className="text-sm text-muted-foreground">
            Currently logged in as: {user?.firstName || 'Unknown'} ({user?.email || 'No email'})
          </p>
          <Button onClick={handleLogout} variant="outline" data-testid="button-logout">
            Logout & Try Different Account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex">
      <Sidebar 
        userRole="HR_MODULE"
        companyName={companySlug || 'Unknown Company'}
        companySlug={companySlug}
      />
      
      <div className="flex-1 flex flex-col">
        {/* Header with Back to Main Dashboard button */}
        <div className="border-b border-border">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              <Link href={`/${companySlug}/dashboard`}>
                <Button variant="ghost" size="sm" data-testid="button-back-to-main">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Main Dashboard
                </Button>
              </Link>
              <div className="h-6 w-px bg-border" /> {/* Separator */}
              <div>
                <h1 className="text-lg font-semibold">Human Resources</h1>
                <p className="text-sm text-muted-foreground">Employee management and HR operations</p>
              </div>
            </div>
            <Header 
              user={{
                name: (user?.firstName || '') + ' ' + (user?.lastName || ''),
                email: user?.email || '',
                role: user?.role || 'HR_MANAGER',
                companyName: companySlug || 'Unknown Company'
              }}
              onLogout={handleLogout}
              pendingNotifications={stats.leaveRequests}
            />
          </div>
        </div>

        <main className="flex-1 overflow-auto p-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">HR Dashboard</h2>
            <p className="text-muted-foreground">
              Overview of human resources operations for {companySlug || 'your company'}
            </p>
          </div>
          
          {/* HR Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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

            <Card className="hover-elevate" data-testid="card-probation-employees">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Probation Period</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600" data-testid="text-probation-count">
                  {stats.probationEmployees}
                </div>
                <p className="text-xs text-muted-foreground">
                  Employees on probation
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-pending-documents">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Documents</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600" data-testid="text-documents-count">
                  {stats.pendingDocuments}
                </div>
                <p className="text-xs text-muted-foreground">
                  Require attention
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-leave-requests">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Leave Requests</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600" data-testid="text-leave-count">
                  {stats.leaveRequests}
                </div>
                <p className="text-xs text-muted-foreground">
                  Pending approval
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover-elevate active-elevate-2" data-testid="card-add-employee">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground mb-2">Add New Employee</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Start the onboarding process for a new team member
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      data-testid="button-add-employee"
                    >
                      Add Employee
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate active-elevate-2" data-testid="card-manage-leave">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground mb-2">Manage Leave</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Review and approve employee leave requests
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      data-testid="button-manage-leave"
                    >
                      View Requests
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate active-elevate-2" data-testid="card-attendance-report">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground mb-2">Attendance Report</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      View daily attendance and time tracking
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      data-testid="button-attendance-report"
                    >
                      View Report
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