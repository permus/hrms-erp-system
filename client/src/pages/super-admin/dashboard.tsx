import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Building2, Users, TrendingUp, DollarSign } from "lucide-react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import type { Company, User } from "@shared/schema";

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const [showInviteForm, setShowInviteForm] = useState(false);

  // Fetch platform data
  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
    enabled: !!user && user.role === 'SUPER_ADMIN'
  });

  // Calculate platform stats
  const stats = {
    totalCompanies: companies.length,
    activeCompanies: companies.filter(company => company.isActive).length,
    totalUsers: 0, // TODO: implement cross-company user count
    monthlyRevenue: 0, // TODO: implement revenue calculation
  };

  const handleLogout = () => {
    // Clear sidebar preference from localStorage on logout
    localStorage.removeItem('sidebarOpen');
    window.location.href = "/api/logout";
  };

  if (!user || user.role !== 'SUPER_ADMIN') {
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
        userRole={user.role || 'SUPER_ADMIN'} 
        companyName="ERP Platform"
      />
      
      <div className="flex-1 flex flex-col">
        <Header 
          user={{
            name: (user.firstName || '') + ' ' + (user.lastName || ''),
            email: user.email || '',
            role: user.role || 'SUPER_ADMIN',
            companyName: 'ERP Platform'
          }}
          onLogout={handleLogout}
          pendingNotifications={0}
        />

        <main className="flex-1 overflow-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Platform Overview</h1>
            <p className="text-muted-foreground">Manage companies and platform operations</p>
          </div>
          
          {/* Platform Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="hover-elevate" data-testid="card-total-companies">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary" data-testid="text-total-companies-count">
                  {stats.totalCompanies}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeCompanies} active
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-active-companies">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Companies</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600" data-testid="text-active-companies-count">
                  {stats.activeCompanies}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently operational
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-total-users">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600" data-testid="text-total-users-count">
                  {stats.totalUsers || "Coming Soon"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all companies
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-monthly-revenue">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600" data-testid="text-monthly-revenue">
                  ${stats.monthlyRevenue || "Coming Soon"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Platform earnings
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Quick Actions */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  className="p-4 h-auto justify-start hover-elevate active-elevate-2"
                  data-testid="button-add-company"
                  onClick={() => window.location.href = '/super-admin/create-company'}
                >
                  <Plus className="w-5 h-5 mr-3" />
                  <div className="text-left">
                    <h3 className="font-semibold mb-1">Add New Company</h3>
                    <p className="text-sm text-muted-foreground">Create company with modules and licensing</p>
                  </div>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="p-4 h-auto justify-start hover-elevate active-elevate-2"
                  data-testid="button-manage-companies"
                >
                  <Building2 className="w-5 h-5 mr-3" />
                  <div className="text-left">
                    <h3 className="font-semibold mb-1">Manage Companies</h3>
                    <p className="text-sm text-muted-foreground">View and manage all companies</p>
                  </div>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="p-4 h-auto justify-start hover-elevate active-elevate-2"
                  data-testid="button-view-analytics"
                >
                  <TrendingUp className="w-5 h-5 mr-3" />
                  <div className="text-left">
                    <h3 className="font-semibold mb-1">View Analytics</h3>
                    <p className="text-sm text-muted-foreground">Platform usage and metrics</p>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Companies List */}
          <Card>
            <CardHeader>
              <CardTitle>Companies</CardTitle>
            </CardHeader>
            <CardContent>
              {companies.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No companies yet</h3>
                  <p className="text-muted-foreground mb-4">Get started by adding your first company to the platform</p>
                  <Button 
                    data-testid="button-add-first-company"
                    onClick={() => window.location.href = '/super-admin/create-company'}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Company
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
                              {company.subdomain ? `${company.subdomain}.erp.com` : 'No subdomain'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span 
                              className={`px-2 py-1 rounded-full text-xs ${
                                company.isActive 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}
                              data-testid={`badge-company-status-${company.id}`}
                            >
                              {company.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              data-testid={`button-manage-company-${company.id}`}
                              onClick={() => window.location.href = `/super-admin/companies/${company.id}`}
                            >
                              Manage
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