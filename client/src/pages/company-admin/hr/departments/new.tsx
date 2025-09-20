import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ArrowLeft, Building2, Save, X } from "lucide-react";
import type { Department, Employee, InsertDepartment } from "@shared/schema";
import { insertDepartmentSchema } from "@shared/schema";

// Form validation schema extending the base schema
const formSchema = insertDepartmentSchema.extend({
  name: z.string().min(1, "Department name is required").max(255, "Department name is too long"),
  description: z.string().optional(),
  parentId: z.string().optional(),
  managerId: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function NewDepartment() {
  const { companySlug: paramSlug } = useParams<{ companySlug?: string }>();
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  // Resolve company slug from user data when not in URL (fallback routes)
  const { data: userSlugs } = useQuery<{ role: string; companySlugs: string[]; employeeSlug?: string }>({
    queryKey: ['/api/resolve/me'],
    enabled: !paramSlug && !!user,
  });
  
  const companySlug = paramSlug || userSlugs?.companySlugs?.[0];
  
  // Detect HR context for context-aware navigation
  const isHR = location.includes("/hr/");
  const base = companySlug ? `/${companySlug}` : "/company-admin";
  const departmentsListPath = isHR ? `${base}/hr/departments` : `${base}/departments`;

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  // Check authorization
  if (!user || !['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER'].includes((user as any)?.role || '')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to create departments.</p>
          <Button onClick={handleLogout} variant="outline" data-testid="button-logout">
            Logout & Try Different Account
          </Button>
        </div>
      </div>
    );
  }

  // Initialize form
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      parentId: "none",
      managerId: "none",
    },
  });

  // Fetch required data for the form
  const { data: departments = [], isLoading: departmentsLoading } = useQuery<Department[]>({
    queryKey: ["/api/departments", companySlug],
    enabled: !!companySlug
  });

  const { data: employees = [], isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees", companySlug],
    enabled: !!companySlug
  });

  // Create department mutation
  const createDepartmentMutation = useMutation({
    mutationFn: async (departmentData: InsertDepartment) => {
      console.log('Creating department with context:', { companySlug, userRole: (user as any)?.role });
      
      const payload = {
        ...departmentData,
        companyId: user?.companyId, // Will be resolved server-side for company admins
        companySlug: companySlug // For super admin context
      };
      
      console.log('Department creation payload:', payload);
      return apiRequest('/api/departments', 'POST', payload);
    },
    onSuccess: (newDepartment: any) => {
      toast({
        title: "Department Created",
        description: `Department "${newDepartment.name}" has been successfully created.`,
      });
      
      // Invalidate queries to refresh department list
      queryClient.invalidateQueries({ queryKey: ['/api/departments', companySlug] });
      
      // Navigate back to departments list
      setLocation(departmentsListPath);
    },
    onError: (error: any) => {
      console.error('Failed to create department:', error);
      toast({
        title: "Error Creating Department",
        description: error.message || "Failed to create department. Please try again.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: FormData) => {
    // Prepare data for submission
    const submitData: InsertDepartment = {
      companyId: user?.companyId || "", // Will be overridden server-side
      name: data.name,
      description: data.description || null,
      parentId: data.parentId && data.parentId !== "none" ? data.parentId : null,
      managerId: data.managerId && data.managerId !== "none" ? data.managerId : null,
    };
    
    createDepartmentMutation.mutate(submitData);
  };

  const handleCancel = () => {
    setLocation(departmentsListPath);
  };

  // Show loading while resolving company slug
  if (!paramSlug && !userSlugs && user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
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

  if (departmentsLoading || employeesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading form data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <Breadcrumb data-testid="breadcrumb-navigation">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href={`${base}/dashboard`}>
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={departmentsListPath}>
                  Departments
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>New Department</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            data-testid="button-back-to-departments"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Departments
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3" data-testid="text-page-title">
              <Building2 className="h-8 w-8 text-primary" />
              Add New Department
            </h1>
            <p className="text-muted-foreground mt-1">
              Create a new department to organize your workforce structure
            </p>
          </div>
        </div>

        {/* Form Card */}
        <Card>
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
                          data-testid="input-department-name"
                          {...field}
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
                          className="min-h-[100px]"
                          data-testid="textarea-department-description"
                          {...field}
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
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        data-testid="select-parent-department"
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select parent department (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No parent department</SelectItem>
                          {departments.map((department) => (
                            <SelectItem key={department.id} value={department.id}>
                              {department.name}
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
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        data-testid="select-department-manager"
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department manager (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No manager assigned</SelectItem>
                          {employees.map((employee) => (
                            <SelectItem key={employee.id} value={employee.id}>
                              {employee.personalInfo?.name || `Employee #${employee.employeeCode}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Form Actions */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={createDepartmentMutation.isPending}
                    data-testid="button-cancel"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createDepartmentMutation.isPending}
                    data-testid="button-save-department"
                  >
                    {createDepartmentMutation.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Create Department
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}