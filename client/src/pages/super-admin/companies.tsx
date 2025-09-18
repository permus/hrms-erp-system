import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Plus, Calendar, Users, DollarSign, Edit, Trash2 } from "lucide-react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import type { Company } from "@shared/schema";

export default function SuperAdminCompanies() {
  const { user } = useAuth();

  // Fetch companies
  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
    enabled: !!user && (user as any).role === 'SUPER_ADMIN'
  });

  const handleEditCompany = (company: Company) => {
    // TODO: Open edit modal
    console.log('Edit company:', company);
  };

  const handleDeleteCompany = (company: Company) => {
    // TODO: Open delete confirmation dialog
    console.log('Delete company:', company);
  };

  const stats = {
    totalCompanies: companies.length,
    activeCompanies: companies.filter(company => company.isActive).length,
    inactiveCompanies: companies.filter(company => !company.isActive).length,
    newThisMonth: 0, // TODO: implement date-based filtering
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
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Company Management</h1>
              <p className="text-muted-foreground">Manage all companies on the platform</p>
            </div>
            <Button 
              data-testid="button-add-company" 
              onClick={() => window.location.href = '/super-admin/create-company'}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Company
            </Button>
          </div>
          
          {/* Company Stats */}
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
                  On the platform
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-active-companies">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Companies</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
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

            <Card className="hover-elevate" data-testid="card-inactive-companies">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inactive Companies</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600" data-testid="text-inactive-companies-count">
                  {stats.inactiveCompanies}
                </div>
                <p className="text-xs text-muted-foreground">
                  Need attention
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-new-companies">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New This Month</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600" data-testid="text-new-companies-count">
                  {stats.newThisMonth || "Coming Soon"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Recent additions
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Companies List */}
          <Card>
            <CardHeader>
              <CardTitle>All Companies</CardTitle>
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
                          <div className="flex-1">
                            <div className="flex items-center gap-4">
                              <div>
                                <h3 className="font-semibold text-lg" data-testid={`text-company-name-${company.id}`}>
                                  {company.name}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {company.industry} • {company.city}, {company.country}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Slug: /{company.slug}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                {(company as any).userLicenses || 'N/A'} user licenses
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {(company as any).employeeLicenses || 'N/A'} employee licenses
                              </p>
                            </div>
                            
                            <span 
                              className={`px-3 py-1 rounded-full text-sm ${
                                company.isActive 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}
                              data-testid={`badge-company-status-${company.id}`}
                            >
                              {company.isActive ? 'Active' : 'Inactive'}
                            </span>
                            
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                data-testid={`button-edit-company-${company.id}`}
                                onClick={() => handleEditCompany(company)}
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                data-testid={`button-delete-company-${company.id}`}
                                onClick={() => handleDeleteCompany(company)}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                data-testid={`button-access-company-${company.id}`}
                                onClick={() => window.location.href = `/${company.slug}/dashboard`}
                              >
                                Access
                              </Button>
                            </div>
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