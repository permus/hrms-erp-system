import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  MoreHorizontal,
  Calendar,
  MapPin,
  Phone,
  Mail,
  FileText,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Employee, Department } from "@shared/schema";

export default function EmployeeList() {
  const { user } = useAuth();
  const params = useParams<{ companySlug: string }>();
  const { companySlug } = params;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Local state
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Update query keys to include company context for cache isolation
  const companyContext = companySlug || 'default';

  // Fetch employees with enhanced Phase 2 data
  const { data: employees = [], isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: [`/api/employees?companySlug=${companyContext}`],
    enabled: !!user && ['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER'].includes(user?.role || '')
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: [`/api/departments?companySlug=${companyContext}`],
    enabled: !!user && ['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER'].includes(user?.role || '')
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (!user || !['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER'].includes(user?.role || '')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground">You don't have employee management privileges.</p>
          <Button onClick={handleLogout} variant="outline" data-testid="button-logout">
            Logout & Try Different Account
          </Button>
        </div>
      </div>
    );
  }

  // Filter employees based on search and filters
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = !searchTerm || 
      employee.personalInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.contactInfo?.personalEmail?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment = departmentFilter === "all" || 
      employee.employmentDetails?.departmentId === departmentFilter;

    const matchesStatus = statusFilter === "all" || 
      employee.status?.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  // Calculate document completion status
  const getDocumentCompletionStatus = (employee: Employee) => {
    const requiredDocs = [
      employee.emiratesIdInfo?.documents?.frontUrl,
      employee.emiratesIdInfo?.documents?.backUrl,
      employee.visaInfo?.documents?.visaPageUrl,
      employee.passportInfo?.documents?.biodataPageUrl
    ];
    
    const completedDocs = requiredDocs.filter(Boolean).length;
    const totalRequired = requiredDocs.length;
    
    return {
      completed: completedDocs,
      total: totalRequired,
      percentage: Math.round((completedDocs / totalRequired) * 100)
    };
  };

  // Calculate probation status
  const getProbationStatus = (employee: Employee) => {
    if (employee.employmentDetails?.employmentStatus !== 'probation') {
      return null;
    }

    if (!employee.employmentDetails.startDate) {
      return null;
    }

    const startDate = new Date(employee.employmentDetails.startDate);
    const probationMonths = employee.employmentDetails.probationMonths || 6;
    const probationEndDate = new Date(startDate);
    probationEndDate.setMonth(probationEndDate.getMonth() + probationMonths);

    const today = new Date();
    const daysRemaining = Math.ceil((probationEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return {
      endDate: probationEndDate,
      daysRemaining,
      isExpiringSoon: daysRemaining <= 30 && daysRemaining > 0,
      isExpired: daysRemaining <= 0
    };
  };

  const formatTenure = (startDate: string) => {
    const start = new Date(startDate);
    const today = new Date();
    const diffMonths = (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth());
    
    if (diffMonths < 12) {
      return `${diffMonths} months`;
    } else {
      const years = Math.floor(diffMonths / 12);
      const remainingMonths = diffMonths % 12;
      return remainingMonths > 0 ? `${years}y ${remainingMonths}m` : `${years} years`;
    }
  };

  return (
    <div className="p-6">
          {/* Page Header with Actions */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Employees</h2>
              <p className="text-muted-foreground">
                {filteredEmployees.length} of {employees.length} employees
              </p>
            </div>
            <Link href={`/${companySlug}/hr/employees/new`}>
              <Button className="flex items-center gap-2" data-testid="button-add-employee">
                <Plus className="w-4 h-4" />
                Add Employee
              </Button>
            </Link>
          </div>

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search employees by name, employee code, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-employees"
                  />
                </div>
                
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-48" data-testid="select-department-filter">
                    <SelectValue placeholder="Filter by department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((department) => (
                      <SelectItem key={department.id} value={department.id}>
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32" data-testid="select-status-filter">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="probation">Probation</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Employee Grid */}
          {employeesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-20 bg-muted rounded mb-4"></div>
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredEmployees.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No employees found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || departmentFilter !== "all" || statusFilter !== "all" 
                    ? "Try adjusting your filters" 
                    : "Get started by adding your first employee"}
                </p>
                <Link href={`/${companySlug}/employees/new`}>
                  <Button data-testid="button-add-first-employee">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Employee
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEmployees.map((employee) => {
                const docStatus = getDocumentCompletionStatus(employee);
                const probationStatus = getProbationStatus(employee);
                const department = departments.find(d => d.id === employee.employmentDetails?.departmentId);

                return (
                  <Card key={employee.id} className="hover-elevate" data-testid={`card-employee-${employee.id}`}>
                    <CardContent className="p-6">
                      {/* Employee Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-12 h-12">
                            <AvatarImage 
                              src={employee.personalInfo?.profilePhotoUrl} 
                              alt={employee.personalInfo?.name} 
                            />
                            <AvatarFallback>
                              {employee.personalInfo?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'EMP'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {employee.personalInfo?.name || 'Unknown'}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {employee.employeeCode}
                            </p>
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" data-testid={`button-menu-${employee.id}`}>
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/${companySlug}/employees/${employee.slug}`}>
                                View Profile
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/${companySlug}/employees/${employee.slug}/edit`}>
                                Edit Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/${companySlug}/employees/${employee.slug}/documents`}>
                                Manage Documents
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Status Badges */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge 
                          variant={employee.status === 'ACTIVE' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {employee.status}
                        </Badge>
                        
                        {employee.employmentDetails?.employmentType && (
                          <Badge variant="outline" className="text-xs">
                            {employee.employmentDetails.employmentType}
                          </Badge>
                        )}

                        {probationStatus && (
                          <Badge 
                            variant={probationStatus.isExpiringSoon ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            Probation {probationStatus.daysRemaining}d
                          </Badge>
                        )}
                      </div>

                      {/* Employee Details */}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center text-muted-foreground">
                          <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span>{department?.name || 'No Department'}</span>
                        </div>
                        
                        <div className="flex items-center text-muted-foreground">
                          <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span>
                            {employee.employmentDetails?.startDate 
                              ? formatTenure(employee.employmentDetails.startDate)
                              : 'Start date not set'
                            }
                          </span>
                        </div>

                        <div className="flex items-center text-muted-foreground">
                          <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span className="truncate">
                            {employee.contactInfo?.personalEmail || 'No email'}
                          </span>
                        </div>

                        <div className="flex items-center text-muted-foreground">
                          <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span>{employee.contactInfo?.uaePhone || 'No phone'}</span>
                        </div>
                      </div>

                      {/* Document Completion Status */}
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center">
                            <FileText className="w-4 h-4 mr-2 text-muted-foreground" />
                            <span className="text-muted-foreground">Documents</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {docStatus.percentage === 100 ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : docStatus.percentage > 50 ? (
                              <AlertTriangle className="w-4 h-4 text-orange-600" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-red-600" />
                            )}
                            <span className="font-medium">
                              {docStatus.completed}/{docStatus.total}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 w-full bg-secondary rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              docStatus.percentage === 100 ? 'bg-green-600' :
                              docStatus.percentage > 50 ? 'bg-orange-600' : 'bg-red-600'
                            }`}
                            style={{ width: `${docStatus.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
    </div>
  );
}