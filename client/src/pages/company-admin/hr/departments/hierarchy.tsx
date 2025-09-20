import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { 
  Building2, 
  Users, 
  UserCheck, 
  ChevronDown, 
  ChevronRight, 
  ArrowLeft, 
  Loader2,
  AlertCircle
} from "lucide-react";
import type { Department, Employee, User } from "@shared/schema";

interface TreeDepartment extends Department {
  children: TreeDepartment[];
  level: number;
  employeeCount: number;
  manager?: User;
}

export default function DepartmentHierarchy() {
  const { user } = useAuth();
  const params = useParams<{ companySlug: string }>();
  const { companySlug } = params;
  const [location, setLocation] = useLocation();
  
  // Track expanded state for each department
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Resolve company slug from user data when not in URL (fallback routes)
  const { data: userSlugs } = useQuery<{ role: string; companySlugs: string[]; employeeSlug?: string }>({
    queryKey: ['/api/resolve/me'],
    enabled: !companySlug && !!user,
  });
  
  const resolvedCompanySlug = companySlug || userSlugs?.companySlugs?.[0];
  
  // Detect HR context for context-aware navigation
  const isHR = location.includes("/hr/");
  const base = resolvedCompanySlug ? `/${resolvedCompanySlug}` : "/company-admin";
  const departmentsListPath = isHR ? `${base}/hr/departments` : `${base}/departments`;

  // Fetch departments data
  const { data: departments = [], isLoading: departmentsLoading, error: departmentsError } = useQuery<Department[]>({
    queryKey: ["/api/departments", resolvedCompanySlug || 'default'],
    enabled: !!user && !!resolvedCompanySlug
  });

  // Fetch employees data to calculate department employee counts
  const { data: employees = [], isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees", resolvedCompanySlug || 'default'],
    enabled: !!user && !!resolvedCompanySlug
  });

  // Fetch all users to get manager information
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users", resolvedCompanySlug || 'default'],
    enabled: !!user && !!resolvedCompanySlug
  });

  // Build tree structure from flat department array
  const buildDepartmentTree = (depts: Department[]): TreeDepartment[] => {
    // Create a map for quick lookup
    const deptMap = new Map<string, TreeDepartment>();
    
    // Initialize all departments with empty children arrays
    depts.forEach(dept => {
      // Calculate employee count for this department
      const employeeCount = employees.filter(emp => {
        const employmentDetails = emp.employmentDetails as any;
        return employmentDetails?.departmentId === dept.id;
      }).length;

      // Find manager information
      const manager = dept.managerId ? users.find(u => u.id === dept.managerId) : undefined;

      deptMap.set(dept.id, {
        ...dept,
        children: [],
        level: 0,
        employeeCount,
        manager
      });
    });

    const rootDepartments: TreeDepartment[] = [];
    const orphanedDepartments: TreeDepartment[] = [];

    // Build the tree structure
    depts.forEach(dept => {
      const treeDept = deptMap.get(dept.id)!;
      
      if (dept.parentId) {
        const parent = deptMap.get(dept.parentId);
        if (parent) {
          parent.children.push(treeDept);
        } else {
          // Parent not found - orphaned department
          orphanedDepartments.push(treeDept);
        }
      } else {
        // Root level department
        rootDepartments.push(treeDept);
      }
    });

    // Set levels for all departments
    const setLevels = (depts: TreeDepartment[], level: number) => {
      depts.forEach(dept => {
        dept.level = level;
        setLevels(dept.children, level + 1);
      });
    };

    setLevels(rootDepartments, 0);
    setLevels(orphanedDepartments, 0); // Orphaned departments start at level 0

    // Sort departments by name at each level
    const sortChildren = (depts: TreeDepartment[]) => {
      depts.sort((a, b) => a.name.localeCompare(b.name));
      depts.forEach(dept => sortChildren(dept.children));
    };

    sortChildren(rootDepartments);
    sortChildren(orphanedDepartments);

    // Return root departments followed by orphaned ones
    return [...rootDepartments, ...orphanedDepartments];
  };

  // Toggle expand/collapse for a department
  const toggleExpanded = (departmentId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(departmentId)) {
      newExpanded.delete(departmentId);
    } else {
      newExpanded.add(departmentId);
    }
    setExpandedNodes(newExpanded);
  };

  // Navigate to department details
  const navigateToDepartment = (departmentId: string) => {
    const detailsPath = isHR ? `${base}/hr/departments/${departmentId}` : `${base}/departments/${departmentId}`;
    setLocation(detailsPath);
  };

  // Handle back to departments list
  const handleBackToDepartments = () => {
    setLocation(departmentsListPath);
  };

  // Render a single department node in the tree
  const renderDepartmentNode = (dept: TreeDepartment): JSX.Element => {
    const hasChildren = dept.children.length > 0;
    const isExpanded = expandedNodes.has(dept.id);
    const hasManager = !!dept.manager;

    return (
      <div key={dept.id} className="relative">
        {/* Department Node */}
        <Card 
          className="mb-2 hover-elevate transition-all duration-200" 
          style={{ marginLeft: `${dept.level * 24}px` }}
          data-testid={`hierarchy-node-${dept.id}`}
        >
          <CardHeader className="py-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* Expand/Collapse Button */}
                {hasChildren ? (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => toggleExpanded(dept.id)}
                    data-testid={`button-toggle-${dept.id}`}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                ) : (
                  <div className="h-6 w-6 flex items-center justify-center">
                    <div className="h-2 w-2 bg-muted-foreground rounded-full opacity-40" />
                  </div>
                )}

                {/* Department Icon and Info */}
                <div className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Button
                      variant="link"
                      className="h-auto p-0 font-semibold text-foreground hover:text-primary"
                      onClick={() => navigateToDepartment(dept.id)}
                      data-testid={`link-department-${dept.id}`}
                    >
                      {dept.name}
                    </Button>
                    {dept.description && (
                      <p className="text-sm text-muted-foreground mt-1" data-testid={`text-description-${dept.id}`}>
                        {dept.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Department Stats and Manager */}
              <div className="flex items-center space-x-4">
                {/* Employee Count */}
                <div className="flex items-center space-x-1 text-sm text-muted-foreground" data-testid={`stats-employees-${dept.id}`}>
                  <Users className="h-4 w-4" />
                  <span>
                    {dept.employeeCount === 0 ? 'No employees' : `${dept.employeeCount} employee${dept.employeeCount > 1 ? 's' : ''}`}
                  </span>
                </div>

                {/* Manager Badge */}
                {hasManager ? (
                  <Badge variant="secondary" className="flex items-center space-x-1" data-testid={`badge-manager-${dept.id}`}>
                    <UserCheck className="h-3 w-3" />
                    <span>
                      {dept.manager!.firstName && dept.manager!.lastName 
                        ? `${dept.manager!.firstName} ${dept.manager!.lastName}`
                        : dept.manager!.email || 'Manager'
                      }
                    </span>
                  </Badge>
                ) : (
                  <Badge variant="outline" data-testid={`badge-no-manager-${dept.id}`}>
                    <AlertCircle className="h-3 w-3 mr-1" />
                    No Manager
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Children (if expanded) */}
        {hasChildren && isExpanded && (
          <div className="relative" data-testid={`children-${dept.id}`}>
            {/* Connecting Lines */}
            <div 
              className="absolute left-3 border-l border-muted-foreground/20" 
              style={{ 
                left: `${dept.level * 24 + 12}px`,
                top: '0px',
                height: '100%'
              }}
            />
            {dept.children.map(child => renderDepartmentNode(child))}
          </div>
        )}
      </div>
    );
  };

  // Check authorization
  if (!user || !['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER'].includes((user as any)?.role || '')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
            <h1 className="text-xl font-semibold text-destructive mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-4">You don't have permission to view the department hierarchy.</p>
            <Button onClick={() => setLocation("/")} variant="outline" data-testid="button-home">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading while resolving company slug
  if (!userSlugs && user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          <div>
            <div className="text-lg font-medium">Loading company information...</div>
            <p className="text-sm text-muted-foreground">Resolving your company access...</p>
          </div>
        </div>
      </div>
    );
  }

  const isLoading = departmentsLoading || employeesLoading;
  const hasError = departmentsError;
  const treeDepartments = departments.length > 0 ? buildDepartmentTree(departments) : [];

  return (
    <div className="p-6 space-y-6" data-testid="page-department-hierarchy">
      {/* Breadcrumb Navigation */}
      <Breadcrumb data-testid="breadcrumb-hierarchy">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink 
              onClick={handleBackToDepartments} 
              className="cursor-pointer hover:text-foreground"
              data-testid="breadcrumb-departments"
            >
              Departments
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage data-testid="breadcrumb-current">Hierarchy</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="icon"
              onClick={handleBackToDepartments}
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Department Hierarchy</h2>
              <p className="text-muted-foreground">
                Organizational structure with parent-child relationships
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => {
              // Expand all departments
              const allIds = new Set<string>();
              const collectIds = (depts: TreeDepartment[]) => {
                depts.forEach(dept => {
                  if (dept.children.length > 0) {
                    allIds.add(dept.id);
                    collectIds(dept.children);
                  }
                });
              };
              collectIds(treeDepartments);
              setExpandedNodes(allIds);
            }}
            data-testid="button-expand-all"
          >
            Expand All
          </Button>
          <Button
            variant="outline"
            onClick={() => setExpandedNodes(new Set())}
            data-testid="button-collapse-all"
          >
            Collapse All
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-12" data-testid="loading-hierarchy">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading department hierarchy...</p>
        </div>
      ) : hasError ? (
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Hierarchy</h3>
            <p className="text-muted-foreground mb-4">
              Failed to load department data. Please try again.
            </p>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              data-testid="button-retry"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : treeDepartments.length === 0 ? (
        <Card data-testid="empty-hierarchy">
          <CardContent className="text-center py-12">
            <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Departments Found</h3>
            <p className="text-muted-foreground mb-4">
              Create departments to visualize your organizational hierarchy.
            </p>
            <Button 
              onClick={() => setLocation(isHR ? `${base}/hr/departments/new` : `${base}/departments/new`)}
              data-testid="button-create-first-department"
            >
              <Building2 className="w-4 h-4 mr-2" />
              Create Department
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2" data-testid="hierarchy-tree">
          {/* Summary Stats */}
          <Card className="mb-6">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2" data-testid="stats-total-departments">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{departments.length} Departments</span>
                  </div>
                  <div className="flex items-center space-x-2" data-testid="stats-total-employees">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{employees.length} Total Employees</span>
                  </div>
                  <div className="flex items-center space-x-2" data-testid="stats-managed-departments">
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {departments.filter(d => d.managerId).length} Managed Departments
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tree Visualization */}
          <div className="space-y-1">
            {treeDepartments.map(dept => renderDepartmentNode(dept))}
          </div>
        </div>
      )}
    </div>
  );
}