import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  FileText, 
  Clock, 
  AlertTriangle, 
  Calendar,
  CheckCircle,
  TrendingUp,
  Building2,
  UserCheck
} from "lucide-react";

interface DashboardProps {
  userRole: 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'EMPLOYEE';
  stats: {
    totalEmployees?: number;
    activeEmployees?: number;
    onProbation?: number;
    pendingDocuments?: number;
    expiringDocuments?: number;
    pendingLeave?: number;
    totalCompanies?: number;
    recentActivities?: Array<{
      id: string;
      type: string;
      description: string;
      timestamp: string;
      user: string;
    }>;
  };
}

export default function Dashboard({ userRole, stats }: DashboardProps) {
  const renderSuperAdminDashboard = () => (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompanies || 0}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees || 0}</div>
            <p className="text-xs text-muted-foreground">
              Across all companies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Usage</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92%</div>
            <p className="text-xs text-muted-foreground">
              Active user rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Support Tickets</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">
              5 urgent, 18 normal
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );

  const renderCompanyAdminDashboard = () => (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeEmployees || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Probation</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.onProbation || 0}</div>
            <p className="text-xs text-muted-foreground">
              Require evaluation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.pendingDocuments || 0}</div>
            <p className="text-xs text-muted-foreground">
              Need approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leave Requests</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.pendingLeave || 0}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-20 flex-col gap-2" data-testid="quick-action-add-employee">
              <Users className="h-5 w-5" />
              <span className="text-sm">Add Employee</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2" data-testid="quick-action-review-documents">
              <FileText className="h-5 w-5" />
              <span className="text-sm">Review Documents</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2" data-testid="quick-action-attendance-report">
              <Clock className="h-5 w-5" />
              <span className="text-sm">Attendance Report</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2" data-testid="quick-action-probation-review">
              <UserCheck className="h-5 w-5" />
              <span className="text-sm">Probation Review</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );

  const renderEmployeeDashboard = () => (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leave Balance</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15</div>
            <p className="text-xs text-muted-foreground">
              Days remaining this year
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents Status</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm">All Up to Date</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Last updated 2 days ago
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">22</div>
            <p className="text-xs text-muted-foreground">
              Days worked / 22 total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Employee Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <Button variant="outline" className="h-20 flex-col gap-2" data-testid="quick-action-request-leave">
              <Calendar className="h-5 w-5" />
              <span className="text-sm">Request Leave</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2" data-testid="quick-action-update-profile">
              <Users className="h-5 w-5" />
              <span className="text-sm">Update Profile</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2" data-testid="quick-action-view-payslip">
              <FileText className="h-5 w-5" />
              <span className="text-sm">View Payslip</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );

  return (
    <div className="space-y-6" data-testid={`dashboard-${userRole.toLowerCase()}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {userRole === 'SUPER_ADMIN' ? 'Platform Overview' : 
             userRole === 'COMPANY_ADMIN' ? 'Company Dashboard' : 
             'My Dashboard'}
          </h1>
          <p className="text-muted-foreground">
            {userRole === 'SUPER_ADMIN' ? 'Monitor platform-wide metrics and activities' :
             userRole === 'COMPANY_ADMIN' ? 'Manage your company operations' :
             'View your personal information and activities'}
          </p>
        </div>
        {stats.expiringDocuments && stats.expiringDocuments > 0 && (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {stats.expiringDocuments} Expiring Soon
          </Badge>
        )}
      </div>

      {/* Dashboard Content Based on Role */}
      {userRole === 'SUPER_ADMIN' && renderSuperAdminDashboard()}
      {userRole === 'COMPANY_ADMIN' && renderCompanyAdminDashboard()}
      {userRole === 'EMPLOYEE' && renderEmployeeDashboard()}

      {/* Recent Activities */}
      {stats.recentActivities && stats.recentActivities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivities.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-start gap-3" data-testid={`activity-${activity.id}`}>
                  <div className="h-2 w-2 bg-primary rounded-full mt-2" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.user} • {activity.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}