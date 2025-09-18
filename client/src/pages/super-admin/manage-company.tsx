import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, Users, Settings, CreditCard, Shield, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Company {
  id: string;
  name: string;
  slug: string;
  industry?: string;
  employeeCount?: number;
  country?: string;
  city?: string;
  subscriptionType?: string;
  monthlyCost?: string;
  status?: string;
  isActive: boolean;
  settings?: any;
  createdAt: string;
  updatedAt: string;
}

export default function ManageCompany() {
  const { companyId } = useParams<{ companyId: string }>();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch company details
  const { data: companies, isLoading } = useQuery<Company[]>({
    queryKey: ['/api/companies'],
    enabled: !!user && (user as any).role === 'SUPER_ADMIN',
  });

  const company = companies?.find(c => c.id === companyId);

  const handleBack = () => {
    setLocation('/super-admin/dashboard');
  };

  const handleNavigateToCompanyAdmin = () => {
    if (company?.slug) {
      setLocation(`/${company.slug}/dashboard`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Loading...</h2>
          <p className="text-muted-foreground">Fetching company details</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Company Not Found</h2>
          <p className="text-muted-foreground">The requested company could not be found</p>
          <Button onClick={handleBack} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="outline" 
              onClick={handleBack}
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{company.name}</h1>
              <p className="text-muted-foreground">Company Management Interface</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant={company.isActive ? "default" : "destructive"}>
              {company.isActive ? "Active" : "Inactive"}
            </Badge>
            <Badge variant="outline">
              {company.status || "Unknown"}
            </Badge>
            {company.subscriptionType && (
              <Badge variant="secondary">
                {company.subscriptionType}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Company Overview */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Company Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Company Name</label>
                    <p className="text-foreground">{company.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Slug</label>
                    <p className="text-foreground">{company.slug}</p>
                  </div>
                  {company.industry && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Industry</label>
                      <p className="text-foreground">{company.industry}</p>
                    </div>
                  )}
                  {company.employeeCount && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Employee Count</label>
                      <p className="text-foreground">{company.employeeCount}</p>
                    </div>
                  )}
                  {company.country && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Location</label>
                      <p className="text-foreground">{company.city ? `${company.city}, ${company.country}` : company.country}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created</label>
                    <p className="text-foreground">{new Date(company.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Licensing Information */}
            {company.settings?.licensing && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Licensing & Billing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">User Licenses</label>
                      <p className="text-foreground">{company.settings.licensing.userLicenseCount || 0}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Employee Licenses</label>
                      <p className="text-foreground">{company.settings.licensing.employeeLicenseCount || 0}</p>
                    </div>
                    {company.monthlyCost && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Monthly Cost</label>
                        <p className="text-foreground font-semibold">AED {company.monthlyCost}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Subscription</label>
                      <p className="text-foreground">{company.subscriptionType || 'Not Set'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Enabled Modules */}
            {company.settings?.enabledModules && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Enabled Modules
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {company.settings.enabledModules.map((module: string) => (
                      <Badge key={module} variant="secondary">
                        {module.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Actions Panel */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Management Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full" 
                  onClick={handleNavigateToCompanyAdmin}
                  data-testid="button-access-company-dashboard"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Access Company Dashboard
                </Button>
                <Button variant="outline" className="w-full" disabled>
                  <Users className="w-4 h-4 mr-2" />
                  Manage Users
                </Button>
                <Button variant="outline" className="w-full" disabled>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Billing Settings
                </Button>
                <Button variant="outline" className="w-full" disabled>
                  <Settings className="w-4 h-4 mr-2" />
                  Company Settings
                </Button>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className={company.isActive ? "text-green-600" : "text-red-600"}>
                    {company.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                {company.settings?.licensing && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Licenses</span>
                      <span>{(company.settings.licensing.userLicenseCount || 0) + (company.settings.licensing.employeeLicenseCount || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Modules</span>
                      <span>{company.settings?.enabledModules?.length || 0}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}