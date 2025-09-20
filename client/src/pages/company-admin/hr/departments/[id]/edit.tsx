import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, apiRequestWithContext, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, Building2, Save, X, Loader2 } from "lucide-react";
import type { Department, Employee, User } from "@shared/schema";
import { insertDepartmentSchema } from "@shared/schema";

// Form validation schema extending the base schema
const formSchema = insertDepartmentSchema.extend({
  name: z.string().min(1, "Department name is required").max(255, "Department name is too long"),
  description: z.string().optional(),
  parentId: z.string().optional(),
  managerId: z.string().optional(),
}).omit({ companyId: true });

type FormData = z.infer<typeof formSchema>;

export default function EditDepartment() {
  const { id } = useParams<{ id: string }>();
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  // Resolve company slug from user data when not in URL (fallback routes)
  const { data: userSlugs } = useQuery<{ role: string; companySlugs: string[]; employeeSlug?: string }>({
    queryKey: ['/api/resolve/me'],
    enabled: !!user,
  });
  
  const companySlug = userSlugs?.companySlugs?.[0];
  
  // Detect HR context for context-aware navigation
  const isHR = location.includes("/hr/");
  const base = companySlug ? `/${companySlug}` : "/company-admin";
  const departmentsListPath = isHR ? `${base}/hr/departments` : `${base}/departments`;
  const departmentDetailsPath = isHR ? `${base}/hr/departments/${id}` : `${base}/departments/${id}`;

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  // Check authorization
  if (!user || !['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER'].includes((user as any)?.role || '')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to edit departments.</p>
          <Button onClick={handleLogout} variant="outline" data-testid="button-logout">
            Logout & Try Different Account
          </Button>
        </div>
      </div>
    );
  }

  // Fetch existing department data
  const { data: department, isLoading: departmentLoading, error: departmentError } = useQuery<Department>({
    queryKey: ["/api/departments", id],
    enabled: !!id && !!user
  });

  // Fetch required data for the form
  const { data: allDepartments = [], isLoading: departmentsLoading } = useQuery<Department[]>({
    queryKey: ["/api/departments", companySlug],
    enabled: !!companySlug
  });

  const { data: employees = [], isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees", companySlug],
    enabled: !!companySlug
  });

  // Filter departments to prevent circular references
  const availableParentDepartments = allDepartments.filter(dept => {
    if (!department) return true;
    
    // Exclude self
    if (dept.id === department.id) return false;
    
    // Exclude children (to prevent circular references)
    const isChild = (checkDept: Department): boolean => {
      if (checkDept.parentId === department.id) return true;
      const parent = allDepartments.find(d => d.id === checkDept.parentId);
      return parent ? isChild(parent) : false;
    };
    
    return !isChild(dept);
  });

  // Initialize form with default values
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      parentId: "none",
      managerId: "none",
    },
  });

  // Update form when department data is loaded
  useEffect(() => {
    if (department) {
      form.reset({
        name: department.name,
        description: department.description || "",
        parentId: department.parentId || "none",
        managerId: department.managerId || "none",
      });
    }
  }, [department, form]);

  // Track form changes for unsaved changes warning
  useEffect(() => {
    const subscription = form.watch(() => {
      setHasUnsavedChanges(true);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Handle browser navigation with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Update department mutation
  const updateDepartmentMutation = useMutation({
    mutationFn: async (departmentData: Partial<FormData>) => {
      const payload = {
        ...departmentData,
        companySlug: companySlug // For super admin context
      };
      
      // Use enhanced API request for super admin context
      if ((user as any)?.role === 'SUPER_ADMIN' && companySlug) {
        return apiRequestWithContext('PUT', `/api/departments/${id}`, payload, { companySlug });
      }
      
      return apiRequest('PUT', `/api/departments/${id}`, payload);
    },
    onSuccess: (updatedDepartment: any) => {
      toast({
        title: "Department Updated",
        description: `Department "${updatedDepartment.name}" has been successfully updated.`,
      });
      
      // Reset unsaved changes flag
      setHasUnsavedChanges(false);
      
      // Invalidate queries to refresh department data
      queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
      
      // Navigate back to department details
      setLocation(departmentDetailsPath);
    },
    onError: (error: any) => {
      console.error('Failed to update department:', error);
      toast({
        title: "Error Updating Department",
        description: error.message || "Failed to update department. Please try again.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: FormData) => {
    // Prepare data for submission - only send changed fields
    const submitData: Partial<FormData> = {};
    
    if (data.name !== department?.name) submitData.name = data.name;
    if (data.description !== (department?.description || "")) submitData.description = data.description || null;
    if (data.parentId !== (department?.parentId || "none")) {
      submitData.parentId = data.parentId && data.parentId !== "none" ? data.parentId : null;
    }
    if (data.managerId !== (department?.managerId || "none")) {
      submitData.managerId = data.managerId && data.managerId !== "none" ? data.managerId : null;
    }
    
    // Only submit if there are changes
    if (Object.keys(submitData).length === 0) {
      toast({
        title: "No Changes",
        description: "No changes were made to the department.",
      });
      return;
    }
    
    updateDepartmentMutation.mutate(submitData);
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setPendingNavigation(departmentDetailsPath);
      setShowUnsavedDialog(true);
    } else {
      setLocation(departmentDetailsPath);
    }
  };

  const handleBackToDepartments = () => {
    if (hasUnsavedChanges) {
      setPendingNavigation(departmentsListPath);
      setShowUnsavedDialog(true);
    } else {
      setLocation(departmentsListPath);
    }
  };

  const handleBackToDepartmentDetails = () => {
    if (hasUnsavedChanges) {
      setPendingNavigation(departmentDetailsPath);
      setShowUnsavedDialog(true);
    } else {
      setLocation(departmentDetailsPath);
    }
  };

  const handleConfirmNavigation = () => {
    setHasUnsavedChanges(false);
    setShowUnsavedDialog(false);
    if (pendingNavigation) {
      setLocation(pendingNavigation);
      setPendingNavigation(null);
    }
  };

  const handleCancelNavigation = () => {
    setShowUnsavedDialog(false);
    setPendingNavigation(null);
  };

  // Show loading while resolving company slug
  if (!userSlugs && user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <Loader2 className="w-6 h-6 animate-spin mx-auto" />
          <div className="text-lg font-medium">Loading company information...</div>
          <p className="text-sm text-muted-foreground">Resolving your company access...</p>
        </div>
      </div>
    );
  }

  // Show error if we can't resolve company slug
  if (!companySlug) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Company Access Required</h1>
          <p className="text-muted-foreground">Unable to determine your company. Please contact support.</p>
          <Button onClick={handleLogout} variant="outline" data-testid="button-logout">
            Logout & Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (departmentLoading || departmentsLoading || employeesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          <div className="text-lg font-medium">Loading department information...</div>
          <p className="text-sm text-muted-foreground">Please wait while we fetch the data...</p>
        </div>
      </div>
    );
  }

  if (departmentError || !department) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Department Not Found</h1>
          <p className="text-muted-foreground">The department you're trying to edit doesn't exist or you don't have access to it.</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => setLocation(departmentsListPath)} variant="outline" data-testid="button-back-to-list">
              Back to Departments
            </Button>
            <Button onClick={handleLogout} variant="outline" data-testid="button-logout">
              Logout
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header with Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb className="mb-4" data-testid="breadcrumb-edit-department">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink 
                  onClick={handleBackToDepartments}
                  className="cursor-pointer hover-elevate"
                  data-testid="breadcrumb-departments"
                >
                  Departments
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink 
                  onClick={handleBackToDepartmentDetails}
                  className="cursor-pointer hover-elevate"
                  data-testid="breadcrumb-department-details"
                >
                  {department.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbPage data-testid="breadcrumb-edit">Edit</BreadcrumbPage>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Back button and title */}
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBackToDepartmentDetails}
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="title-edit-department">
                <Building2 className="w-6 h-6" />
                Edit Department
              </h1>
              <p className="text-muted-foreground">Update the department information below</p>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <Card data-testid="card-edit-department">
          <CardHeader>
            <CardTitle>Department Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Department Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department Name *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter department name"
                          {...field}
                          data-testid="input-department-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter department description (optional)"
                          className="resize-none"
                          rows={3}
                          {...field}
                          data-testid="textarea-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Parent Department */}
                <FormField
                  control={form.control}
                  name="parentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent Department</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} data-testid="select-parent-department">
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select parent department (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none" data-testid="parent-option-none">No Parent Department</SelectItem>
                          {availableParentDepartments.map((dept) => (
                            <SelectItem 
                              key={dept.id} 
                              value={dept.id}
                              data-testid={`parent-option-${dept.id}`}
                            >
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Manager */}
                <FormField
                  control={form.control}
                  name="managerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department Manager</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} data-testid="select-manager">
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department manager (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none" data-testid="manager-option-none">No Manager Assigned</SelectItem>
                          {employees.map((employee) => (
                            <SelectItem 
                              key={employee.id} 
                              value={employee.userId || employee.id}
                              data-testid={`manager-option-${employee.id}`}
                            >
                              {employee.personalInfo?.name || `${employee.personalInfo?.firstName || ''} ${employee.personalInfo?.lastName || ''}`.trim() || 'Unnamed Employee'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Action Buttons */}
                <div className="flex gap-4 pt-6 border-t">
                  <Button
                    type="submit"
                    disabled={updateDepartmentMutation.isPending}
                    className="flex-1"
                    data-testid="button-save"
                  >
                    {updateDepartmentMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={updateDepartmentMutation.isPending}
                    className="flex-1"
                    data-testid="button-cancel"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Unsaved Changes Dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent data-testid="dialog-unsaved-changes">
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave this page? Your changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelNavigation} data-testid="button-stay">
              Stay on Page
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmNavigation} data-testid="button-leave">
              Leave Page
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}