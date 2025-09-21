import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import EmployeeProfileForm from "@/components/employee/EmployeeProfileForm";
import type { Employee, Department } from "@shared/schema";

export default function EditEmployee() {
  const { companySlug: paramSlug, employeeSlug } = useParams<{ companySlug?: string; employeeSlug: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // Resolve company slug from user data when not in URL (fallback routes)
  const { data: userSlugs } = useQuery<{companySlugs?: string[]}>({
    queryKey: ['/api/resolve/me'],
    enabled: !paramSlug && !!user,
  });
  
  const companySlug = paramSlug || userSlugs?.companySlugs?.[0];

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  // Check authorization
  if (!user || !['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER'].includes((user as any)?.role || '')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to edit employees.</p>
          <Button onClick={handleLogout} variant="outline" data-testid="button-logout">
            Logout & Try Different Account
          </Button>
        </div>
      </div>
    );
  }

  // Fetch employee data for editing - First resolve slug to ID, then fetch employee
  const { data: employeeData, isLoading: employeeDataLoading } = useQuery<{id: string, slug: string, companyId: string}>({
    queryKey: ["/api/employees/by-slug", companySlug, employeeSlug],
    queryFn: () => fetch(`/api/employees/by-slug/${companySlug}/${employeeSlug}`).then(r => r.json()),
    enabled: !!employeeSlug && !!companySlug
  });

  // Fetch full employee details once we have the ID
  const { data: employee, isLoading: employeeLoading } = useQuery<Employee>({
    queryKey: ["/api/employees", employeeData?.id],
    queryFn: () => fetch(`/api/employees/${employeeData?.id}`).then(r => r.json()),
    enabled: !!employeeData?.id
  });

  // Fetch required data for the form
  const { data: departments = [], isLoading: departmentsLoading } = useQuery<Department[]>({
    queryKey: [`/api/departments?companySlug=${companySlug}`],
    enabled: !!companySlug
  });

  const { data: employees = [], isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: [`/api/employees?companySlug=${companySlug}`],
    enabled: !!companySlug
  });

  const handleBack = () => {
    if (companySlug) {
      setLocation(`/${companySlug}/employees/${employeeSlug}`);
    } else {
      setLocation(`/company-admin/employees/${employeeSlug}`);
    }
  };

  const handleSubmit = async (data: any) => {
    // Handle employee update submission
    console.log("Updating employee with data:", data);
    // Navigate back to employee profile after successful edit
    if (companySlug) {
      setLocation(`/${companySlug}/employees/${employeeSlug}`);
    } else {
      setLocation(`/company-admin/employees/${employeeSlug}`);
    }
  };

  const handleCancel = () => {
    if (companySlug) {
      setLocation(`/${companySlug}/employees/${employeeSlug}`);
    } else {
      setLocation(`/company-admin/employees/${employeeSlug}`);
    }
  };

  if (employeeDataLoading || employeeLoading || departmentsLoading || employeesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading employee data...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Employee Not Found</h1>
          <p className="text-muted-foreground">The requested employee could not be found.</p>
          <Button onClick={handleBack} variant="outline" data-testid="button-back">
            Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              data-testid="button-back-to-profile"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Profile
            </Button>
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-page-title">
                Edit Employee: {employee.personalInfo?.name || 'Unnamed Employee'}
              </h1>
              <p className="text-muted-foreground">Update employee profile and UAE compliance information</p>
            </div>
          </div>
        </div>

        {/* Employee Edit Form */}
        <div className="max-w-4xl">
          <EmployeeProfileForm
            employee={employee}
            departments={departments}
            employees={employees.map(emp => ({ id: emp.id, personalInfo: emp.personalInfo || {} }))}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
}