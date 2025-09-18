import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Building2, Plus, Calendar, Users, DollarSign, Edit, Trash2 } from "lucide-react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Company } from "@shared/schema";

// Edit company form schema
const editCompanySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  industry: z.string().optional(),
  employeeCount: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
});

type EditCompanyFormData = z.infer<typeof editCompanySchema>;

export default function SuperAdminCompanies() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);

  // Fetch companies
  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
    enabled: !!user && (user as any).role === 'SUPER_ADMIN'
  });

  // Edit company mutation
  const editCompanyMutation = useMutation({
    mutationFn: async ({ companyId, data }: { companyId: string; data: EditCompanyFormData }) => {
      return apiRequest('PUT', `/api/companies/${companyId}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Company Updated",
        description: "Company details have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
      setEditingCompany(null);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update company. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete company mutation
  const deleteCompanyMutation = useMutation({
    mutationFn: async (companyId: string) => {
      return apiRequest('DELETE', `/api/companies/${companyId}`);
    },
    onSuccess: () => {
      toast({
        title: "Company Deleted",
        description: "Company has been marked as inactive and removed from the active list.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
      setDeletingCompany(null);
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed", 
        description: error.message || "Failed to delete company. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
  };

  const handleDeleteCompany = (company: Company) => {
    setDeletingCompany(company);
  };

  const confirmDeleteCompany = () => {
    if (deletingCompany) {
      deleteCompanyMutation.mutate(deletingCompany.id);
    }
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

  // Edit Company Modal Component
  const EditCompanyModal = () => {
    if (!editingCompany) return null;

    const form = useForm<EditCompanyFormData>({
      resolver: zodResolver(editCompanySchema),
      defaultValues: {
        name: editingCompany.name,
        slug: editingCompany.slug,
        industry: editingCompany.industry || "",
        employeeCount: editingCompany.employeeCount?.toString() || "",
        country: editingCompany.country || "",
        city: editingCompany.city || "",
      },
    });

    const onSubmit = (data: EditCompanyFormData) => {
      editCompanyMutation.mutate({ 
        companyId: editingCompany.id, 
        data 
      });
    };

    return (
      <Dialog open={!!editingCompany} onOpenChange={() => setEditingCompany(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Company</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Enter company name"
                          data-testid="input-edit-company-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Slug *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="company-slug"
                          data-testid="input-edit-company-slug"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Technology, Healthcare, etc."
                          data-testid="input-edit-company-industry"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="employeeCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee Count</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-employee-count">
                            <SelectValue placeholder="Select employee count" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1-10">1-10 employees</SelectItem>
                          <SelectItem value="11-50">11-50 employees</SelectItem>
                          <SelectItem value="51-200">51-200 employees</SelectItem>
                          <SelectItem value="201-1000">201-1000 employees</SelectItem>
                          <SelectItem value="1000+">1000+ employees</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="United Arab Emirates"
                          data-testid="input-edit-company-country"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Dubai"
                          data-testid="input-edit-company-city"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setEditingCompany(null)}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={editCompanyMutation.isPending}
                  data-testid="button-update-company"
                >
                  {editCompanyMutation.isPending ? "Updating..." : "Update Company"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
  };

  // Delete Company Confirmation Dialog
  const DeleteCompanyDialog = () => {
    return (
      <AlertDialog open={!!deletingCompany} onOpenChange={() => setDeletingCompany(null)}>
        <AlertDialogContent data-testid="dialog-delete-company">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Company</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deletingCompany?.name}</strong>?
              <br /><br />
              <strong>This action will:</strong>
              <ul className="list-disc ml-4 mt-2 space-y-1">
                <li>Mark the company as inactive</li>
                <li>Remove it from the active companies list</li>
                <li>Preserve all company data for compliance</li>
                <li>Disable access for all company users</li>
              </ul>
              <br />
              <em>This is a soft delete - the company can be reactivated later if needed.</em>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteCompany}
              disabled={deleteCompanyMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteCompanyMutation.isPending ? "Deleting..." : "Delete Company"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
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

      {/* Edit Company Modal */}
      <EditCompanyModal />
      
      {/* Delete Company Confirmation Dialog */}
      <DeleteCompanyDialog />
    </div>
  );
}