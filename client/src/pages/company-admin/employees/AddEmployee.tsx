import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import EmployeeProfileForm from "@/components/employee/EmployeeProfileForm";

export default function AddEmployee() {
  const { companySlug } = useParams<{ companySlug: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();

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
    setLocation(`/${companySlug}/employees`);
  };

  const handleSuccess = () => {
    // Navigate back to employee list after successful creation
    setLocation(`/${companySlug}/employees`);
  };

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

        {/* Employee Creation Form */}
        <div className="max-w-4xl">
          <EmployeeProfileForm
            mode="create"
            companySlug={companySlug}
            onSuccess={handleSuccess}
            onCancel={handleBack}
          />
        </div>
      </div>
    </div>
  );
}