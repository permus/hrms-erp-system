import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, FileText, User, Briefcase, Phone, MapPin, CreditCard, Calendar } from "lucide-react";
import DocumentUpload from "@/components/employee/DocumentUpload";
import type { Employee } from "@shared/schema";

export default function EmployeeProfile() {
  const { companySlug, employeeSlug } = useParams<{ companySlug: string; employeeSlug: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  // Check authorization
  if (!user || !['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER'].includes((user as any)?.role || '')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to view employee profiles.</p>
          <Button onClick={handleLogout} variant="outline" data-testid="button-logout">
            Logout & Try Different Account
          </Button>
        </div>
      </div>
    );
  }

  // Fetch employee data
  const { data: employee, isLoading: employeeLoading } = useQuery<Employee>({
    queryKey: ["/api/employees", companySlug, employeeSlug],
    enabled: !!employeeSlug && !!companySlug
  });

  const handleBack = () => {
    setLocation(`/${companySlug}/employees`);
  };

  const handleEdit = () => {
    setLocation(`/${companySlug}/employees/${employeeSlug}/edit`);
  };

  if (employeeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading employee profile...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Employee Not Found</h1>
          <p className="text-muted-foreground">The requested employee profile could not be found.</p>
          <Button onClick={handleBack} variant="outline" data-testid="button-back-to-employees">
            Back to Employees
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'terminated': return 'destructive';
      default: return 'outline';
    }
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
              <h1 className="text-2xl font-bold" data-testid="text-employee-name">
                {employee.personalInfo?.name || 'Unnamed Employee'}
              </h1>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant={getStatusBadgeVariant(employee.status || 'inactive')} data-testid="badge-employee-status">
                  {employee.status || 'Unknown'}
                </Badge>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground" data-testid="text-employee-code">
                  {employee.employeeCode || 'No Code'}
                </span>
              </div>
            </div>
          </div>
          <Button onClick={handleEdit} data-testid="button-edit-employee">
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>

        {/* Profile Content */}
        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="personal" data-testid="tab-personal">
              <User className="h-4 w-4 mr-2" />
              Personal
            </TabsTrigger>
            <TabsTrigger value="employment" data-testid="tab-employment">
              <Briefcase className="h-4 w-4 mr-2" />
              Employment
            </TabsTrigger>
            <TabsTrigger value="contact" data-testid="tab-contact">
              <Phone className="h-4 w-4 mr-2" />
              Contact
            </TabsTrigger>
            <TabsTrigger value="legal" data-testid="tab-legal">
              <CreditCard className="h-4 w-4 mr-2" />
              Legal Documents
            </TabsTrigger>
            <TabsTrigger value="documents" data-testid="tab-documents">
              <FileText className="h-4 w-4 mr-2" />
              Documents
            </TabsTrigger>
          </TabsList>

          {/* Personal Information */}
          <TabsContent value="personal" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                    <p className="text-sm" data-testid="text-full-name">{employee.personalInfo?.name || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                    <p className="text-sm" data-testid="text-date-of-birth">{formatDate(employee.personalInfo?.dateOfBirth)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Gender</label>
                    <p className="text-sm" data-testid="text-gender">{employee.personalInfo?.gender || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nationality</label>
                    <p className="text-sm" data-testid="text-nationality">{employee.personalInfo?.nationality || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Marital Status</label>
                    <p className="text-sm" data-testid="text-marital-status">{employee.personalInfo?.maritalStatus || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Blood Type</label>
                    <p className="text-sm" data-testid="text-blood-type">{employee.personalInfo?.bloodType || 'Not specified'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Employment Information */}
          <TabsContent value="employment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Employment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Department</label>
                    <p className="text-sm" data-testid="text-department">{employee.employmentDetails?.departmentId || 'Not assigned'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Position</label>
                    <p className="text-sm" data-testid="text-position">{employee.employmentDetails?.positionId || 'Not assigned'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                    <p className="text-sm" data-testid="text-start-date">{formatDate(employee.employmentDetails?.startDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Employment Type</label>
                    <p className="text-sm" data-testid="text-employment-type">{employee.employmentDetails?.employmentType || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Manager</label>
                    <p className="text-sm" data-testid="text-manager">{employee.employmentDetails?.managerId || 'No manager assigned'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Probation End</label>
                    <p className="text-sm" data-testid="text-probation-end">{formatDate(employee.employmentDetails?.probationEndDate)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Compensation */}
            <Card>
              <CardHeader>
                <CardTitle>Compensation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Basic Salary</label>
                    <p className="text-sm" data-testid="text-basic-salary">
                      {employee.compensation?.basicSalary ? `AED ${employee.compensation.basicSalary.toLocaleString()}` : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Housing Allowance</label>
                    <p className="text-sm" data-testid="text-housing-allowance">
                      {employee.compensation?.housingAllowance ? `AED ${employee.compensation.housingAllowance.toLocaleString()}` : 'Not specified'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Information */}
          <TabsContent value="contact" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Personal Email</label>
                    <p className="text-sm" data-testid="text-personal-email">{employee.contactInfo?.personalEmail || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Work Email</label>
                    <p className="text-sm" data-testid="text-work-email">{employee.contactInfo?.workEmail || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Mobile Number</label>
                    <p className="text-sm" data-testid="text-mobile-number">{employee.contactInfo?.mobileNumber || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Emergency Contact</label>
                    <p className="text-sm" data-testid="text-emergency-contact">{employee.contactInfo?.emergencyContactNumber || 'Not specified'}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Address</label>
                    <p className="text-sm" data-testid="text-address">{employee.contactInfo?.address || 'Not specified'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Legal Documents */}
          <TabsContent value="legal" className="space-y-6">
            {/* Emirates ID */}
            <Card>
              <CardHeader>
                <CardTitle>Emirates ID</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Emirates ID Number</label>
                    <p className="text-sm" data-testid="text-emirates-id">{employee.emiratesIdInfo?.number || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Expiry Date</label>
                    <p className="text-sm" data-testid="text-emirates-id-expiry">{formatDate(employee.emiratesIdInfo?.expiryDate)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Passport */}
            <Card>
              <CardHeader>
                <CardTitle>Passport Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Passport Number</label>
                    <p className="text-sm" data-testid="text-passport-number">{employee.passportInfo?.number || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nationality</label>
                    <p className="text-sm" data-testid="text-passport-nationality">{employee.passportInfo?.nationality || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Issue Date</label>
                    <p className="text-sm" data-testid="text-passport-issue">{formatDate(employee.passportInfo?.issueDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Expiry Date</label>
                    <p className="text-sm" data-testid="text-passport-expiry">{formatDate(employee.passportInfo?.expiryDate)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Visa */}
            <Card>
              <CardHeader>
                <CardTitle>Visa Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Visa Number</label>
                    <p className="text-sm" data-testid="text-visa-number">{employee.visaInfo?.number || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Visa Type</label>
                    <p className="text-sm" data-testid="text-visa-type">{employee.visaInfo?.type || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Issue Date</label>
                    <p className="text-sm" data-testid="text-visa-issue">{formatDate(employee.visaInfo?.issueDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Expiry Date</label>
                    <p className="text-sm" data-testid="text-visa-expiry">{formatDate(employee.visaInfo?.expiryDate)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents */}
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Document Management</CardTitle>
              </CardHeader>
              <CardContent>
                <DocumentUpload 
                  employeeId={employee.id}
                  companySlug={companySlug || ''}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}