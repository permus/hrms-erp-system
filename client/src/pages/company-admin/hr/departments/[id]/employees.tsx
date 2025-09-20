import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useParams, useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { 
  ArrowLeft, 
  ArrowRight,
  Building2, 
  Users, 
  Search,
  UserCheck,
  UserX,
  Loader2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import type { Department, Employee, User } from "@shared/schema";

interface EmployeeWithDepartment extends Employee {
  departmentName?: string;
}

export default function DepartmentEmployeeAssignment() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // State for search, selection, and pagination
  const [currentEmployeesSearch, setCurrentEmployeesSearch] = useState("");
  const [availableEmployeesSearch, setAvailableEmployeesSearch] = useState("");
  const [selectedCurrentEmployees, setSelectedCurrentEmployees] = useState<Set<string>>(new Set());
  const [selectedAvailableEmployees, setSelectedAvailableEmployees] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [availablePage, setAvailablePage] = useState(1);
  
  const itemsPerPage = 10;

  // Resolve company slug from user data
  const { data: userSlugs } = useQuery<{ role: string; companySlugs: string[]; employeeSlug?: string }>({
    queryKey: ['/api/resolve/me'],
    enabled: !!user,
  });
  
  const companySlug = userSlugs?.companySlugs?.[0];
  
  // Detect HR context for navigation
  const isHR = location.includes("/hr/");
  const base = companySlug ? `/${companySlug}` : "/company-admin";
  const departmentDetailsPath = isHR ? `${base}/hr/departments/${id}` : `${base}/departments/${id}`;

  // Check authorization
  if (!user || !['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER'].includes((user as any)?.role || '')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to manage employee assignments.</p>
          <Button onClick={() => setLocation("/")} variant="outline" data-testid="button-home">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  // Fetch department details
  const { data: department, isLoading: departmentLoading } = useQuery<Department>({
    queryKey: ["/api/departments", id],
    enabled: !!id && !!user
  });

  // Fetch all departments for lookups
  const { data: allDepartments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments", companySlug || 'default'],
    enabled: !!user
  });

  // Fetch current employees in this department
  const { data: currentEmployees = [], isLoading: currentEmployeesLoading } = useQuery<Employee[]>({
    queryKey: ["/api/departments", id, "employees"],
    enabled: !!id && !!user
  });

  // Fetch all company employees
  const { data: allCompanyEmployees = [], isLoading: allEmployeesLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees", companySlug || 'default'],
    enabled: !!user
  });

  // Create department lookup map
  const departmentMap = useMemo(() => {
    const map = new Map<string, string>();
    allDepartments.forEach(dept => {
      map.set(dept.id, dept.name);
    });
    return map;
  }, [allDepartments]);

  // Filter available employees (not in current department)
  const availableEmployees = useMemo(() => {
    const currentEmployeeIds = new Set(currentEmployees.map(emp => emp.id));
    return allCompanyEmployees.filter(emp => !currentEmployeeIds.has(emp.id));
  }, [allCompanyEmployees, currentEmployees]);

  // Add department names to employees
  const currentEmployeesWithDept: EmployeeWithDepartment[] = useMemo(() => {
    return currentEmployees.map(emp => ({
      ...emp,
      departmentName: department?.name || 'Current Department'
    }));
  }, [currentEmployees, department]);

  const availableEmployeesWithDept: EmployeeWithDepartment[] = useMemo(() => {
    return availableEmployees.map(emp => {
      const employmentDetails = emp.employmentDetails as any;
      const deptId = employmentDetails?.departmentId;
      return {
        ...emp,
        departmentName: deptId ? departmentMap.get(deptId) || 'Unknown Department' : 'No Department'
      };
    });
  }, [availableEmployees, departmentMap]);

  // Filter and paginate current employees
  const filteredCurrentEmployees = useMemo(() => {
    if (!currentEmployeesSearch.trim()) return currentEmployeesWithDept;
    const searchTerm = currentEmployeesSearch.toLowerCase();
    return currentEmployeesWithDept.filter(emp => {
      const personalInfo = emp.personalInfo as any;
      const name = personalInfo?.name || '';
      const employmentDetails = emp.employmentDetails as any;
      const position = employmentDetails?.position || '';
      return name.toLowerCase().includes(searchTerm) || 
             position.toLowerCase().includes(searchTerm);
    });
  }, [currentEmployeesWithDept, currentEmployeesSearch]);

  const paginatedCurrentEmployees = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCurrentEmployees.slice(start, start + itemsPerPage);
  }, [filteredCurrentEmployees, currentPage]);

  // Filter and paginate available employees
  const filteredAvailableEmployees = useMemo(() => {
    if (!availableEmployeesSearch.trim()) return availableEmployeesWithDept;
    const searchTerm = availableEmployeesSearch.toLowerCase();
    return availableEmployeesWithDept.filter(emp => {
      const personalInfo = emp.personalInfo as any;
      const name = personalInfo?.name || '';
      const employmentDetails = emp.employmentDetails as any;
      const position = employmentDetails?.position || '';
      return name.toLowerCase().includes(searchTerm) || 
             position.toLowerCase().includes(searchTerm) ||
             (emp.departmentName && emp.departmentName.toLowerCase().includes(searchTerm));
    });
  }, [availableEmployeesWithDept, availableEmployeesSearch]);

  const paginatedAvailableEmployees = useMemo(() => {
    const start = (availablePage - 1) * itemsPerPage;
    return filteredAvailableEmployees.slice(start, start + itemsPerPage);
  }, [filteredAvailableEmployees, availablePage]);

  // Transfer employees mutation
  const transferEmployeesMutation = useMutation({
    mutationFn: async ({ employeeIds, departmentId }: { employeeIds: string[]; departmentId: string | null }) => {
      return apiRequest('/api/employees/department-assignment', 'PUT', {
        employeeIds,
        departmentId
      });
    },
    onSuccess: (data, variables) => {
      const action = variables.departmentId ? 'assigned to' : 'removed from';
      toast({
        title: "Transfer Successful",
        description: `Successfully ${action} department: ${data.updatedEmployees.length} employee(s)`,
      });
      
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/departments', id, 'employees'] });
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      queryClient.invalidateQueries({ queryKey: ['/api/departments', id, 'employee-count'] });
      
      // Clear selections
      setSelectedCurrentEmployees(new Set());
      setSelectedAvailableEmployees(new Set());
    },
    onError: (error: any) => {
      console.error('Transfer failed:', error);
      toast({
        title: "Transfer Failed",
        description: error.message || "Failed to transfer employees. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Handle moving employees to department
  const handleMoveToCurrentDepartment = () => {
    if (selectedAvailableEmployees.size === 0) {
      toast({
        title: "No Selection",
        description: "Please select employees to move to this department.",
        variant: "destructive"
      });
      return;
    }
    
    transferEmployeesMutation.mutate({
      employeeIds: Array.from(selectedAvailableEmployees),
      departmentId: id!
    });
  };

  // Handle removing employees from department
  const handleRemoveFromDepartment = () => {
    if (selectedCurrentEmployees.size === 0) {
      toast({
        title: "No Selection",
        description: "Please select employees to remove from this department.",
        variant: "destructive"
      });
      return;
    }
    
    transferEmployeesMutation.mutate({
      employeeIds: Array.from(selectedCurrentEmployees),
      departmentId: null
    });
  };

  // Toggle selection handlers
  const toggleCurrentEmployeeSelection = (employeeId: string) => {
    const newSelection = new Set(selectedCurrentEmployees);
    if (newSelection.has(employeeId)) {
      newSelection.delete(employeeId);
    } else {
      newSelection.add(employeeId);
    }
    setSelectedCurrentEmployees(newSelection);
  };

  const toggleAvailableEmployeeSelection = (employeeId: string) => {
    const newSelection = new Set(selectedAvailableEmployees);
    if (newSelection.has(employeeId)) {
      newSelection.delete(employeeId);
    } else {
      newSelection.add(employeeId);
    }
    setSelectedAvailableEmployees(newSelection);
  };

  // Select all handlers
  const selectAllCurrentEmployees = () => {
    setSelectedCurrentEmployees(new Set(paginatedCurrentEmployees.map(emp => emp.id)));
  };

  const deselectAllCurrentEmployees = () => {
    setSelectedCurrentEmployees(new Set());
  };

  const selectAllAvailableEmployees = () => {
    setSelectedAvailableEmployees(new Set(paginatedAvailableEmployees.map(emp => emp.id)));
  };

  const deselectAllAvailableEmployees = () => {
    setSelectedAvailableEmployees(new Set());
  };

  // Employee card component
  const EmployeeCard = ({ employee, isSelected, onToggleSelect, showDepartment = false }: {
    employee: EmployeeWithDepartment;
    isSelected: boolean;
    onToggleSelect: () => void;
    showDepartment?: boolean;
  }) => {
    const personalInfo = employee.personalInfo as any;
    const employmentDetails = employee.employmentDetails as any;
    const name = personalInfo?.name || 'Unknown Name';
    const position = employmentDetails?.position || 'No Position';
    const initials = name.split(' ').map(word => word[0]).join('').toUpperCase() || 'UN';

    return (
      <Card className={`transition-colors cursor-pointer hover-elevate ${isSelected ? 'ring-2 ring-primary' : ''}`} 
            onClick={onToggleSelect}
            data-testid={`card-employee-${employee.id}`}>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              checked={isSelected}
              onChange={onToggleSelect}
              onClick={(e) => e.stopPropagation()}
              data-testid={`checkbox-employee-${employee.id}`}
            />
            <Avatar className="w-10 h-10">
              <AvatarImage src={personalInfo?.profilePhotoUrl} alt={name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <h4 className="font-medium leading-none" data-testid={`text-name-${employee.id}`}>{name}</h4>
              <p className="text-sm text-muted-foreground" data-testid={`text-position-${employee.id}`}>{position}</p>
              {showDepartment && employee.departmentName && (
                <Badge variant="secondary" className="text-xs" data-testid={`badge-department-${employee.id}`}>
                  <Building2 className="w-3 h-3 mr-1" />
                  {employee.departmentName}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Pagination component
  const Pagination = ({ 
    currentPage, 
    totalItems, 
    onPageChange, 
    testIdPrefix 
  }: {
    currentPage: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    testIdPrefix: string;
  }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages} ({totalItems} total)
        </p>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            data-testid={`${testIdPrefix}-previous`}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            data-testid={`${testIdPrefix}-next`}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  // Loading state
  if (!userSlugs && user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          <div className="text-lg font-medium">Loading company information...</div>
        </div>
      </div>
    );
  }

  // Company access error
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

  // Department loading
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

  // Department not found
  if (!department) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Department Not Found</h1>
          <p className="text-muted-foreground">The department you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={() => setLocation(departmentDetailsPath)} variant="outline" data-testid="button-back-to-department">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Department
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-7xl">
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
                <BreadcrumbLink href={isHR ? `${base}/hr/departments` : `${base}/departments`}>
                  Departments
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={departmentDetailsPath}>
                  {department.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Employee Assignment</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">
              Employee Assignment: {department.name}
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage which employees belong to this department
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setLocation(departmentDetailsPath)}
            data-testid="button-back-to-department"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Department
          </Button>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Current Department Employees */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Current Department Employees ({filteredCurrentEmployees.length})
                </CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllCurrentEmployees}
                    disabled={paginatedCurrentEmployees.length === 0}
                    data-testid="button-select-all-current"
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={deselectAllCurrentEmployees}
                    disabled={selectedCurrentEmployees.size === 0}
                    data-testid="button-deselect-all-current"
                  >
                    Deselect All
                  </Button>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search current employees..."
                  value={currentEmployeesSearch}
                  onChange={(e) => {
                    setCurrentEmployeesSearch(e.target.value);
                    setCurrentPage(1); // Reset to first page when searching
                  }}
                  className="pl-9"
                  data-testid="input-search-current"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentEmployeesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="ml-2">Loading employees...</span>
                </div>
              ) : paginatedCurrentEmployees.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {currentEmployeesSearch ? 'No employees match your search.' : 'No employees in this department.'}
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {paginatedCurrentEmployees.map(employee => (
                      <EmployeeCard
                        key={employee.id}
                        employee={employee}
                        isSelected={selectedCurrentEmployees.has(employee.id)}
                        onToggleSelect={() => toggleCurrentEmployeeSelection(employee.id)}
                      />
                    ))}
                  </div>
                  <Pagination
                    currentPage={currentPage}
                    totalItems={filteredCurrentEmployees.length}
                    onPageChange={setCurrentPage}
                    testIdPrefix="current-pagination"
                  />
                </>
              )}
              
              {/* Transfer Actions */}
              <div className="pt-4 border-t">
                <Button
                  onClick={handleRemoveFromDepartment}
                  disabled={selectedCurrentEmployees.size === 0 || transferEmployeesMutation.isPending}
                  className="w-full"
                  variant="destructive"
                  data-testid="button-remove-from-department"
                >
                  {transferEmployeesMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <UserX className="w-4 h-4 mr-2" />
                  )}
                  Remove from Department ({selectedCurrentEmployees.size})
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Available Employees */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Building2 className="w-5 h-5 mr-2" />
                  Available Employees ({filteredAvailableEmployees.length})
                </CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllAvailableEmployees}
                    disabled={paginatedAvailableEmployees.length === 0}
                    data-testid="button-select-all-available"
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={deselectAllAvailableEmployees}
                    disabled={selectedAvailableEmployees.size === 0}
                    data-testid="button-deselect-all-available"
                  >
                    Deselect All
                  </Button>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search available employees..."
                  value={availableEmployeesSearch}
                  onChange={(e) => {
                    setAvailableEmployeesSearch(e.target.value);
                    setAvailablePage(1); // Reset to first page when searching
                  }}
                  className="pl-9"
                  data-testid="input-search-available"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {allEmployeesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="ml-2">Loading employees...</span>
                </div>
              ) : paginatedAvailableEmployees.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {availableEmployeesSearch ? 'No employees match your search.' : 'No other employees available.'}
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {paginatedAvailableEmployees.map(employee => (
                      <EmployeeCard
                        key={employee.id}
                        employee={employee}
                        isSelected={selectedAvailableEmployees.has(employee.id)}
                        onToggleSelect={() => toggleAvailableEmployeeSelection(employee.id)}
                        showDepartment={true}
                      />
                    ))}
                  </div>
                  <Pagination
                    currentPage={availablePage}
                    totalItems={filteredAvailableEmployees.length}
                    onPageChange={setAvailablePage}
                    testIdPrefix="available-pagination"
                  />
                </>
              )}
              
              {/* Transfer Actions */}
              <div className="pt-4 border-t">
                <Button
                  onClick={handleMoveToCurrentDepartment}
                  disabled={selectedAvailableEmployees.size === 0 || transferEmployeesMutation.isPending}
                  className="w-full"
                  data-testid="button-move-to-department"
                >
                  {transferEmployeesMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <UserCheck className="w-4 h-4 mr-2" />
                  )}
                  Add to Department ({selectedAvailableEmployees.size})
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}