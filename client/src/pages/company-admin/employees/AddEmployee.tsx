import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import EmployeeProfileForm from "@/components/employee/EmployeeProfileForm";
import type { Department, Employee, InsertEmployee } from "@shared/schema";

export default function AddEmployee() {
  const { companySlug: paramSlug } = useParams<{ companySlug?: string }>();
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  // Resolve company slug from user data when not in URL (fallback routes)
  const { data: userSlugs } = useQuery({
    queryKey: ['/api/resolve/me'],
    enabled: !paramSlug && !!user,
  });
  
  const companySlug = paramSlug || userSlugs?.companySlugs?.[0];
  
  // Detect HR context for context-aware navigation
  const isHR = location.includes("/hr/");
  const base = companySlug ? `/${companySlug}` : "/company-admin";
  const employeeListPath = isHR ? `${base}/hr/employees` : `${base}/employees`;

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  // Check authorization
  if (!user || !['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER'].includes((user as any)?.role || '')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to create employees.</p>
          <Button onClick={handleLogout} variant="outline" data-testid="button-logout">
            Logout & Try Different Account
          </Button>
        </div>
      </div>
    );
  }

  const handleBack = () => {
    setLocation(employeeListPath);
  };

  // Fetch required data for the form
  const { data: departments = [], isLoading: departmentsLoading } = useQuery<Department[]>({
    queryKey: ["/api/departments", companySlug],
    enabled: !!companySlug
  });

  const { data: employees = [], isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees", companySlug],
    enabled: !!companySlug
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async (employeeData: InsertEmployee) => {
      const payload = {
        ...employeeData,
        companyId: user?.companyId, // Will be resolved server-side for company admins
        companySlug: companySlug // For super admin context
      };
      
      return apiRequest('/api/employees', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },
    onSuccess: (newEmployee) => {
      toast({
        title: "Employee Created",
        description: `Employee ${newEmployee.personalInfo?.name} has been successfully added.`,
      });
      
      // Invalidate queries to refresh employee list
      queryClient.invalidateQueries({ queryKey: ['/api/employees', companySlug] });
      
      // Navigate to employee list (context-aware)
      setLocation(employeeListPath);
    },
    onError: (error: any) => {
      console.error('Failed to create employee:', error);
      toast({
        title: "Error Creating Employee",
        description: error.message || "Failed to create employee. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (data: InsertEmployee) => {
    createEmployeeMutation.mutate(data);
  };

  const handleCancel = () => {
    setLocation(employeeListPath);
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            data-testid="button-back-to-employees"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Employees
          </Button>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Add New Employee</h1>
            <p className="text-muted-foreground">Create a comprehensive employee profile with UAE compliance documentation</p>
          </div>
        </div>
      </div>

      {/* Employee Creation Form - Centered Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <EmployeeProfileForm
          departments={departments}
          employees={employees}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}