import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useParams, useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  ArrowLeft, 
  Building2, 
  Users, 
  Edit, 
  Trash2, 
  UserPlus, 
  Calendar, 
  Phone, 
  Mail,
  MapPin,
  Crown,
  ChevronRight,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import type { Department, Employee, User } from "@shared/schema";

interface DepartmentDetailsProps {
  id: string;
}

export default function DepartmentDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

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
  const editPath = isHR ? `${base}/hr/departments/${id}/edit` : `${base}/departments/${id}/edit`;

  // Check authorization
  if (!user || !['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER'].includes((user as any)?.role || '')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to view department details.</p>
          <Button onClick={() => setLocation("/")} variant="outline" data-testid="button-home">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  // Fetch department details
  const { data: department, isLoading: departmentLoading, error: departmentError } = useQuery<Department>({
    queryKey: ["/api/departments", id],
    enabled: !!id && !!user
  });

  // Fetch employee count
  const { data: employeeCountData, isLoading: countLoading } = useQuery<{ departmentId: string; employeeCount: number }>({
    queryKey: ["/api/departments", id, "employee-count"],
    enabled: !!id && !!user
  });

  // Fetch employees in department
  const { data: employees = [], isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ["/api/departments", id, "employees"],
    enabled: !!id && !!user
  });

  // Fetch all departments to find parent and children
  const { data: allDepartments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments", companySlug || 'default'],
    enabled: !!user
  });

  // Fetch manager details if department has a manager
  const { data: manager } = useQuery<User>({
    queryKey: ["/api/users", department?.managerId],
    enabled: !!department?.managerId
  });

  // Find parent and child departments
  const parentDepartment = department?.parentId 
    ? allDepartments.find(d => d.id === department.parentId)
    : null;
  
  const childDepartments = allDepartments.filter(d => d.parentId === department?.id);

  // Delete department mutation
  const deleteDepartmentMutation = useMutation({
    mutationFn: async (departmentId: string) => {
      return apiRequest(`/api/departments/${departmentId}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: "Department Deleted",
        description: "Department has been successfully deleted.",
      });
      
      // Invalidate queries to refresh department list
      queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
      
      // Navigate back to departments list
      setLocation(departmentsListPath);
    },
    onError: (error: any) => {
      console.error('Failed to delete department:', error);
      toast({
        title: "Error Deleting Department",
        description: error.message || "Failed to delete department. It may have employees or child departments.",
        variant: "destructive",
      });
    }
  });

  const handleEdit = () => {
    setLocation(editPath);
  };

  const handleDelete = () => {
    if (department) {
      deleteDepartmentMutation.mutate(department.id);
    }
  };

  const handleAssignEmployees = () => {
    const employeesPath = isHR ? `${base}/hr/departments/${id}/employees` : `${base}/departments/${id}/employees`;
    setLocation(employeesPath);
  };

  const handleBackToDepartments = () => {
    setLocation(departmentsListPath);
  };

  // Show loading while resolving company slug
  if (!userSlugs && user) {
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
          <Button onClick={() => setLocation("/")} variant="outline" data-testid="button-home">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  if (departmentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading department details...</p>
        </div>
      </div>
    );
  }

  if (departmentError || !department) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Department Not Found</h1>
          <p className="text-muted-foreground">The department you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={handleBackToDepartments} variant="outline" data-testid="button-back-to-departments">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Departments
          </Button>
        </div>
      </div>
    );
  }

  const employeeCount = employeeCountData?.employeeCount || 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-6xl">
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
                <BreadcrumbPage>{department.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Header Section */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBackToDepartments}
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Building2 className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold text-foreground" data-testid="text-department-name">
                  {department.name}
                </h1>
              </div>
              <p className="text-lg text-muted-foreground" data-testid="text-department-description">
                {department.description || 'No description available'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={handleAssignEmployees}
              data-testid="button-assign-employees"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Assign Employees
            </Button>
            <Button
              variant="outline"
              onClick={handleEdit}
              data-testid="button-edit-department"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" data-testid="button-delete-department">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Department</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{department.name}"? This action cannot be undone.
                    {employeeCount > 0 && (
                      <span className="block mt-2 text-destructive font-medium">
                        Warning: This department has {employeeCount} employee{employeeCount > 1 ? 's' : ''}.
                      </span>
                    )}
                    {childDepartments.length > 0 && (
                      <span className="block mt-2 text-destructive font-medium">
                        Warning: This department has {childDepartments.length} child department{childDepartments.length > 1 ? 's' : ''}.
                      </span>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={deleteDepartmentMutation.isPending}
                    data-testid="button-confirm-delete"
                  >
                    {deleteDepartmentMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Delete Department'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Information Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Department Information Card */}
            <Card data-testid="card-department-info">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="w-5 h-5" />
                  <span>Department Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created</label>
                    <p className="text-sm" data-testid="text-created-date">
                      {department.createdAt ? format(new Date(department.createdAt), 'PPP') : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                    <p className="text-sm" data-testid="text-updated-date">
                      {department.updatedAt ? format(new Date(department.updatedAt), 'PPP') : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Employee Count</label>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm" data-testid="text-employee-count">
                        {countLoading ? 'Loading...' : `${employeeCount} employee${employeeCount !== 1 ? 's' : ''}`}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Parent Department Card */}
            {parentDepartment && (
              <Card data-testid="card-parent-department">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building2 className="w-5 h-5" />
                    <span>Parent Department</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 border rounded-lg hover-elevate">
                    <div>
                      <h4 className="font-medium" data-testid={`text-parent-name-${parentDepartment.id}`}>
                        {parentDepartment.name}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {parentDepartment.description || 'No description'}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setLocation(`${base}${isHR ? '/hr' : ''}/departments/${parentDepartment.id}`)}
                      data-testid={`button-view-parent-${parentDepartment.id}`}
                    >
                      View <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Child Departments Card */}
            {childDepartments.length > 0 && (
              <Card data-testid="card-child-departments">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-5 h-5" />
                      <span>Child Departments</span>
                    </div>
                    <Badge variant="secondary" data-testid="badge-child-count">
                      {childDepartments.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {childDepartments.map((child) => (
                      <div
                        key={child.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover-elevate"
                        data-testid={`card-child-${child.id}`}
                      >
                        <div>
                          <h4 className="font-medium" data-testid={`text-child-name-${child.id}`}>
                            {child.name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {child.description || 'No description'}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLocation(`${base}${isHR ? '/hr' : ''}/departments/${child.id}`)}
                          data-testid={`button-view-child-${child.id}`}
                        >
                          View <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            {/* Manager Information Card */}
            <Card data-testid="card-manager-info">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Crown className="w-5 h-5" />
                  <span>Department Manager</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {department.managerId && manager ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-12 h-12" data-testid="avatar-manager">
                        <AvatarImage src={manager.profileImageUrl || undefined} />
                        <AvatarFallback>
                          {manager.firstName?.[0]}{manager.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium" data-testid="text-manager-name">
                          {manager.firstName} {manager.lastName}
                        </h4>
                        <p className="text-sm text-muted-foreground" data-testid="text-manager-role">
                          {manager.role?.replace('_', ' ') || 'Manager'}
                        </p>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      {manager.email && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span data-testid="text-manager-email">{manager.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Crown className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p data-testid="text-no-manager">No manager assigned</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Employee List Card */}
            <Card data-testid="card-employees-list">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Employees</span>
                  </div>
                  {!countLoading && (
                    <Badge variant="secondary" data-testid="badge-employee-count">
                      {employeeCount}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {employeesLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading employees...</p>
                  </div>
                ) : employees.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p data-testid="text-no-employees">No employees assigned</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={handleAssignEmployees}
                      data-testid="button-assign-first-employee"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Assign Employees
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {employees.map((employee) => {
                      const personalInfo = employee.personalInfo as any;
                      const contactInfo = employee.contactInfo as any;
                      const employmentDetails = employee.employmentDetails as any;
                      
                      return (
                        <div
                          key={employee.id}
                          className="flex items-center space-x-3 p-3 border rounded-lg hover-elevate"
                          data-testid={`card-employee-${employee.id}`}
                        >
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={personalInfo?.profilePhotoUrl} />
                            <AvatarFallback>
                              {personalInfo?.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate" data-testid={`text-employee-name-${employee.id}`}>
                              {personalInfo?.name || 'Unknown Employee'}
                            </h4>
                            <p className="text-sm text-muted-foreground truncate">
                              {employmentDetails?.position || 'No position'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {employee.employeeCode}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}