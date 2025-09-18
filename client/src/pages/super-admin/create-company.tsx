import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Building2, Users, DollarSign, Package, Mail, Calculator } from "lucide-react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { 
  CompanyFormData, 
  DEFAULT_COMPANY_FORM, 
  calculateMonthlyCost, 
  generateCompanySlug,
  UAE_CITIES,
  INDUSTRIES,
  EMPLOYEE_COUNT_OPTIONS,
  ModuleConfig
} from "@shared/modules";
import { AvailableModule } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function CreateCompany() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState<CompanyFormData>(DEFAULT_COMPANY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch available modules
  const { data: availableModules = [] } = useQuery<AvailableModule[]>({
    queryKey: ["/api/modules"],
    enabled: !!user && (user as any).role === 'SUPER_ADMIN'
  });

  // Transform to ModuleConfig format for pricing calculations
  const moduleConfigs: ModuleConfig[] = availableModules.map(module => ({
    id: module.id,
    key: module.moduleKey,
    name: module.name,
    description: module.description || '',
    icon: module.icon || 'Package',
    color: module.color || 'blue',
    basePrice: parseFloat(module.basePrice || '0'),
    isCore: module.isCore || false
  }));

  // Auto-generate slug when company name changes
  useEffect(() => {
    if (formData.companyName) {
      const newSlug = generateCompanySlug(formData.companyName);
      setFormData(prev => ({ ...prev, slug: newSlug }));
    }
  }, [formData.companyName]);

  // Calculate pricing in real-time
  const selectedModules = moduleConfigs.filter(module => 
    formData.enabledModules.includes(module.key)
  );
  const pricing = calculateMonthlyCost(
    selectedModules,
    formData.userLicenseCount,
    formData.employeeLicenseCount,
    {
      userLicensePrice: formData.userLicensePrice,
      employeeLicensePrice: formData.employeeLicensePrice
    }
  );

  // Handle form input changes
  const handleInputChange = (field: keyof CompanyFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle module toggle
  const handleModuleToggle = (moduleKey: string, enabled: boolean) => {
    setFormData(prev => ({
      ...prev,
      enabledModules: enabled 
        ? [...prev.enabledModules, moduleKey]
        : prev.enabledModules.filter(key => key !== moduleKey)
    }));
  };

  // Create company mutation
  const createCompanyMutation = useMutation({
    mutationFn: async (data: CompanyFormData) => {
      return apiRequest('POST', '/api/super-admin/create-company', data);
    },
    onSuccess: (result: any) => {
      // Show success with admin credentials
      const tempPassword = result.adminUser?.tempPassword;
      const adminEmail = formData.adminEmail;
      
      toast({
        title: "Company Created Successfully!",
        description: (
          <div className="space-y-2">
            <p>{formData.companyName} has been created.</p>
            <div className="bg-muted p-3 rounded-md text-sm">
              <p><strong>Admin Login:</strong> {adminEmail}</p>
              <p><strong>Temporary Password:</strong> <code className="bg-background px-2 py-1 rounded">{tempPassword}</code></p>
              <p className="text-xs text-muted-foreground mt-1">Please share these credentials with the company admin</p>
            </div>
          </div>
        ),
        duration: 10000, // Show for 10 seconds so user can copy the password
      });
      
      // Invalidate companies list to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
      
      // Navigate back to super admin dashboard after delay
      setTimeout(() => {
        window.location.href = '/super-admin/dashboard';
      }, 12000);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Company",
        description: error.message || "An error occurred while creating the company",
        variant: "destructive"
      });
    }
  });

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.companyName || !formData.adminEmail || !formData.adminFirstName || !formData.adminLastName) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required company and admin information",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createCompanyMutation.mutateAsync(formData);
    } finally {
      setIsSubmitting(false);
    }
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
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <Button 
                  variant="outline" 
                  onClick={() => window.history.back()}
                  data-testid="button-back"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Create New Company</h1>
                  <p className="text-muted-foreground">Set up a new company with modules, licensing, and admin access</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Company Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Company Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="companyName">Company Name *</Label>
                      <Input
                        id="companyName"
                        value={formData.companyName}
                        onChange={(e) => handleInputChange('companyName', e.target.value)}
                        placeholder="e.g., Acme Corporation"
                        required
                        data-testid="input-company-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="slug">URL Slug</Label>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => handleInputChange('slug', e.target.value)}
                        placeholder="acme-corporation"
                        data-testid="input-company-slug"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Company URL: /{formData.slug}/dashboard
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="industry">Industry</Label>
                      <Select 
                        value={formData.industry} 
                        onValueChange={(value) => handleInputChange('industry', value)}
                      >
                        <SelectTrigger data-testid="select-industry">
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {INDUSTRIES.map(industry => (
                            <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="employeeCount">Company Size</Label>
                      <Select 
                        value={formData.employeeCount} 
                        onValueChange={(value) => handleInputChange('employeeCount', value)}
                      >
                        <SelectTrigger data-testid="select-employee-count">
                          <SelectValue placeholder="Select company size" />
                        </SelectTrigger>
                        <SelectContent>
                          {EMPLOYEE_COUNT_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Select 
                        value={formData.country} 
                        onValueChange={(value) => handleInputChange('country', value)}
                      >
                        <SelectTrigger data-testid="select-country">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UAE">United Arab Emirates</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Select 
                        value={formData.city} 
                        onValueChange={(value) => handleInputChange('city', value)}
                      >
                        <SelectTrigger data-testid="select-city">
                          <SelectValue placeholder="Select city" />
                        </SelectTrigger>
                        <SelectContent>
                          {UAE_CITIES.map(city => (
                            <SelectItem key={city} value={city}>{city}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Company Admin Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Company Administrator
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="adminFirstName">First Name *</Label>
                      <Input
                        id="adminFirstName"
                        value={formData.adminFirstName}
                        onChange={(e) => handleInputChange('adminFirstName', e.target.value)}
                        required
                        data-testid="input-admin-first-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="adminLastName">Last Name *</Label>
                      <Input
                        id="adminLastName"
                        value={formData.adminLastName}
                        onChange={(e) => handleInputChange('adminLastName', e.target.value)}
                        required
                        data-testid="input-admin-last-name"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="adminEmail">Email Address *</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      value={formData.adminEmail}
                      onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                      placeholder="admin@company.com"
                      required
                      data-testid="input-admin-email"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      An invitation with temporary credentials will be sent to this email
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Module Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Module Selection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {moduleConfigs.map(module => (
                      <div key={module.key} className="border rounded-lg p-4 hover-elevate">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 bg-${module.color}-100 dark:bg-${module.color}-900 rounded-lg flex items-center justify-center`}>
                              <Package className={`w-5 h-5 text-${module.color}-600 dark:text-${module.color}-400`} />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold">{module.name}</h4>
                              <p className="text-sm text-muted-foreground">{module.description}</p>
                              <p className="text-sm font-medium">AED {module.basePrice.toFixed(2)}/month</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            {module.isCore ? (
                              <Badge variant="secondary">Core Module</Badge>
                            ) : (
                              <input
                                type="checkbox"
                                checked={formData.enabledModules.includes(module.key)}
                                onChange={(e) => handleModuleToggle(module.key, e.target.checked)}
                                className="w-4 h-4 text-blue-600"
                                data-testid={`checkbox-module-${module.key}`}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* License Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    License Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="userLicenseCount">User Licenses</Label>
                      <Input
                        id="userLicenseCount"
                        type="number"
                        min="1"
                        value={formData.userLicenseCount}
                        onChange={(e) => handleInputChange('userLicenseCount', parseInt(e.target.value) || 1)}
                        data-testid="input-user-license-count"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        AED {formData.userLicensePrice} per user/month
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="employeeLicenseCount">Employee Licenses</Label>
                      <Input
                        id="employeeLicenseCount"
                        type="number"
                        min="0"
                        value={formData.employeeLicenseCount}
                        onChange={(e) => handleInputChange('employeeLicenseCount', parseInt(e.target.value) || 0)}
                        data-testid="input-employee-license-count"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        AED {formData.employeeLicensePrice} per employee/month
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pricing Calculator */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Pricing Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Modules ({selectedModules.length})</span>
                      <span className="font-medium">AED {pricing.modulesCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>User Licenses ({formData.userLicenseCount})</span>
                      <span className="font-medium">AED {pricing.userLicensesCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Employee Licenses ({formData.employeeLicenseCount})</span>
                      <span className="font-medium">AED {pricing.employeeLicensesCost.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-medium">AED {pricing.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>VAT (5%)</span>
                      <span className="font-medium">AED {pricing.vatAmount.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total Monthly</span>
                      <span className="text-primary">AED {pricing.total.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Submit */}
              <div className="flex justify-end space-x-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => window.history.back()}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  data-testid="button-create-company"
                >
                  {isSubmitting ? 'Creating...' : 'Create Company & Send Invitation'}
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}