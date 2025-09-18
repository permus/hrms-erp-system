import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Building2, UserCheck, UserX } from "lucide-react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import type { Company } from "@shared/schema";

export default function SuperAdminEmployees() {
  const { user } = useAuth();

  // Fetch companies to calculate platform stats
  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
    enabled: !!user && (user as any).role === 'SUPER_ADMIN'
  });

  // Platform employee stats (placeholder - would need aggregated data from backend)
  const stats = {
    totalEmployees: 0, // TODO: implement cross-company employee count
    activeEmployees: 0,
    companiesWithEmployees: companies.filter(c => c.isActive).length,
    avgEmployeesPerCompany: 0
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (!user || (user as any).role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground">You don't have super admin privileges.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex">
      <Sidebar 
        userRole={(user as any).role || 'SUPER_ADMIN'} 
        companyName="ERP Platform"
      />
      
      <div className="flex-1 flex flex-col">
        <Header 
          user={{
            name: ((user as any).firstName || '') + ' ' + ((user as any).lastName || ''),
            email: (user as any).email || '',
            role: (user as any).role || 'SUPER_ADMIN',
            companyName: 'ERP Platform'
          }}
          onLogout={handleLogout}
          pendingNotifications={0}
        />

        <main className="flex-1 overflow-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Platform Employees</h1>
            <p className="text-muted-foreground">Employee statistics across all companies</p>
          </div>
          
          {/* Platform Employee Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="hover-elevate" data-testid="card-total-employees">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary" data-testid="text-total-employees-count">
                  {stats.totalEmployees || "Coming Soon"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all companies
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-active-employees">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600" data-testid="text-active-employees-count">
                  {stats.activeEmployees || "Coming Soon"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently employed
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-companies-with-employees">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Companies with Staff</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600" data-testid="text-companies-with-employees-count">
                  {stats.companiesWithEmployees}
                </div>
                <p className="text-xs text-muted-foreground">
                  Active companies
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-avg-employees">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg per Company</CardTitle>
                <UserX className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600" data-testid="text-avg-employees">
                  {stats.avgEmployeesPerCompany || "Coming Soon"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Employee average
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Company Employee Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Employee Distribution by Company</CardTitle>
            </CardHeader>
            <CardContent>
              {companies.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No companies yet</h3>
                  <p className="text-muted-foreground mb-4">Add companies to see employee distribution</p>
                  <Button 
                    data-testid="button-add-company"
                    onClick={() => window.location.href = '/super-admin/create-company'}
                  >
                    Add Company
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {companies.map((company) => (
                    <Card key={company.id} className="hover-elevate">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold" data-testid={`text-company-name-${company.id}`}>
                              {company.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Employee count: Coming soon
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              0 employees
                            </span>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              data-testid={`button-view-company-employees-${company.id}`}
                              onClick={() => window.location.href = `/${company.slug}/employees`}
                            >
                              View Employees
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}