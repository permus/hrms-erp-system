import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useParams, useLocation } from "wouter";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, Users, Workflow, Search, Filter, X } from "lucide-react";
import type { Department } from "@shared/schema";

// Filter options
const PARENT_FILTER_OPTIONS = [
  { value: "all", label: "All Departments" },
  { value: "top-level", label: "Top-level only" },
  { value: "has-parent", label: "Has parent" }
];

const MANAGER_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "has-manager", label: "Has manager" },
  { value: "no-manager", label: "No manager" }
];

const EMPLOYEE_COUNT_OPTIONS = [
  { value: "all", label: "All" },
  { value: "0", label: "0 employees" },
  { value: "1-10", label: "1-10 employees" },
  { value: "11-50", label: "11-50 employees" },
  { value: "50+", label: "50+ employees" }
];

// Custom hook for debounced value
function useDebounced<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function HRDepartments() {
  const { user } = useAuth();
  const params = useParams<{ companySlug: string }>();
  const { companySlug } = params;
  const [location, setLocation] = useLocation();
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [parentFilter, setParentFilter] = useState("all");
  const [managerFilter, setManagerFilter] = useState("all");
  const [employeeCountFilter, setEmployeeCountFilter] = useState("all");
  
  // Debounced search to avoid excessive re-renders
  const debouncedSearchTerm = useDebounced(searchTerm, 300);
  
  // URL query parameter management
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const search = urlParams.get('search') || '';
    const parent = urlParams.get('parent') || 'all';
    const manager = urlParams.get('manager') || 'all';
    const employees = urlParams.get('employees') || 'all';
    
    setSearchTerm(search);
    setParentFilter(parent);
    setManagerFilter(manager);
    setEmployeeCountFilter(employees);
  }, []);
  
  // Update URL when filters change
  useEffect(() => {
    const urlParams = new URLSearchParams();
    if (debouncedSearchTerm) urlParams.set('search', debouncedSearchTerm);
    if (parentFilter !== 'all') urlParams.set('parent', parentFilter);
    if (managerFilter !== 'all') urlParams.set('manager', managerFilter);
    if (employeeCountFilter !== 'all') urlParams.set('employees', employeeCountFilter);
    
    const newSearch = urlParams.toString();
    const newUrl = `${window.location.pathname}${newSearch ? '?' + newSearch : ''}`;
    window.history.replaceState(null, '', newUrl);
  }, [debouncedSearchTerm, parentFilter, managerFilter, employeeCountFilter]);

  // Resolve company slug from user data when not in URL (fallback routes)
  const { data: userSlugs } = useQuery<{ role: string; companySlugs: string[]; employeeSlug?: string }>({
    queryKey: ['/api/resolve/me'],
    enabled: !companySlug && !!user,
  });
  
  const resolvedCompanySlug = companySlug || userSlugs?.companySlugs?.[0];
  
  // Detect HR context for context-aware navigation
  const isHR = location.includes("/hr/");
  const base = resolvedCompanySlug ? `/${resolvedCompanySlug}` : "/company-admin";
  const newDepartmentPath = isHR ? `${base}/hr/departments/new` : `${base}/departments/new`;

  const handleAddDepartment = () => {
    setLocation(newDepartmentPath);
  };

  const handleViewHierarchy = () => {
    const hierarchyPath = isHR ? `${base}/hr/departments/hierarchy` : `${base}/departments/hierarchy`;
    setLocation(hierarchyPath);
  };

  // Fetch departments data
  const { data: departments = [], isLoading } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
    enabled: !!user
  });
  
  // TODO: Fetch employee data to calculate employee counts per department
  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ["/api/employees"],
    enabled: !!user
  });
  
  // Helper function to get employee count for a department
  const getEmployeeCount = (departmentId: string): number => {
    return employees.filter((emp: any) => 
      emp.employmentDetails?.departmentId === departmentId
    ).length;
  };
  
  // Filter departments based on search and filter criteria
  const filteredDepartments = useMemo(() => {
    let filtered = [...departments];
    
    // Search filter (case-insensitive, searches name and description)
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter((dept) => 
        dept.name.toLowerCase().includes(searchLower) ||
        (dept.description && dept.description.toLowerCase().includes(searchLower))
      );
    }
    
    // Parent department filter
    if (parentFilter === "top-level") {
      filtered = filtered.filter((dept) => !dept.parentId);
    } else if (parentFilter === "has-parent") {
      filtered = filtered.filter((dept) => dept.parentId);
    }
    
    // Manager filter
    if (managerFilter === "has-manager") {
      filtered = filtered.filter((dept) => dept.managerId);
    } else if (managerFilter === "no-manager") {
      filtered = filtered.filter((dept) => !dept.managerId);
    }
    
    // Employee count filter
    if (employeeCountFilter !== "all") {
      filtered = filtered.filter((dept) => {
        const count = getEmployeeCount(dept.id);
        switch (employeeCountFilter) {
          case "0":
            return count === 0;
          case "1-10":
            return count >= 1 && count <= 10;
          case "11-50":
            return count >= 11 && count <= 50;
          case "50+":
            return count > 50;
          default:
            return true;
        }
      });
    }
    
    return filtered;
  }, [departments, debouncedSearchTerm, parentFilter, managerFilter, employeeCountFilter, employees]);
  
  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (debouncedSearchTerm) count++;
    if (parentFilter !== 'all') count++;
    if (managerFilter !== 'all') count++;
    if (employeeCountFilter !== 'all') count++;
    return count;
  }, [debouncedSearchTerm, parentFilter, managerFilter, employeeCountFilter]);
  
  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setParentFilter('all');
    setManagerFilter('all');
    setEmployeeCountFilter('all');
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Departments</h2>
          <p className="text-muted-foreground">
            Manage organizational departments and structure
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={handleViewHierarchy}
            data-testid="button-view-hierarchy"
          >
            <Workflow className="w-4 h-4 mr-2" />
            Hierarchy View
          </Button>
          <Button onClick={handleAddDepartment} data-testid="button-add-department">
            <Plus className="w-4 h-4 mr-2" />
            Add Department
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mb-6">
        <div className="flex flex-col gap-4 p-4 bg-muted/50 rounded-lg">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search departments by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-departments"
              aria-label="Search departments"
            />
          </div>
          
          {/* Filter Controls */}
          <div className="flex flex-wrap gap-4">
            {/* Parent Department Filter */}
            <div className="flex flex-col gap-1 min-w-[200px]">
              <label htmlFor="parent-filter" className="text-sm font-medium text-muted-foreground">
                Parent Department
              </label>
              <Select 
                value={parentFilter} 
                onValueChange={setParentFilter}
                data-testid="select-parent-filter"
              >
                <SelectTrigger id="parent-filter" aria-label="Filter by parent department">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PARENT_FILTER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Manager Filter */}
            <div className="flex flex-col gap-1 min-w-[150px]">
              <label htmlFor="manager-filter" className="text-sm font-medium text-muted-foreground">
                Manager Status
              </label>
              <Select 
                value={managerFilter} 
                onValueChange={setManagerFilter}
                data-testid="select-manager-filter"
              >
                <SelectTrigger id="manager-filter" aria-label="Filter by manager status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MANAGER_FILTER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Employee Count Filter */}
            <div className="flex flex-col gap-1 min-w-[150px]">
              <label htmlFor="employee-count-filter" className="text-sm font-medium text-muted-foreground">
                Employee Count
              </label>
              <Select 
                value={employeeCountFilter} 
                onValueChange={setEmployeeCountFilter}
                data-testid="select-employee-count-filter"
              >
                <SelectTrigger id="employee-count-filter" aria-label="Filter by employee count">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYEE_COUNT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Active Filters and Clear Button */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {activeFilterCount > 0 && (
                <>
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Active filters:</span>
                  </div>
                  
                  {debouncedSearchTerm && (
                    <Badge variant="secondary" data-testid="badge-search-filter">
                      Search: "{debouncedSearchTerm}"
                      <X 
                        className="w-3 h-3 ml-1 cursor-pointer hover:text-destructive" 
                        onClick={() => setSearchTerm('')}
                        aria-label="Clear search filter"
                      />
                    </Badge>
                  )}
                  
                  {parentFilter !== 'all' && (
                    <Badge variant="secondary" data-testid="badge-parent-filter">
                      Parent: {PARENT_FILTER_OPTIONS.find(opt => opt.value === parentFilter)?.label}
                      <X 
                        className="w-3 h-3 ml-1 cursor-pointer hover:text-destructive" 
                        onClick={() => setParentFilter('all')}
                        aria-label="Clear parent filter"
                      />
                    </Badge>
                  )}
                  
                  {managerFilter !== 'all' && (
                    <Badge variant="secondary" data-testid="badge-manager-filter">
                      Manager: {MANAGER_FILTER_OPTIONS.find(opt => opt.value === managerFilter)?.label}
                      <X 
                        className="w-3 h-3 ml-1 cursor-pointer hover:text-destructive" 
                        onClick={() => setManagerFilter('all')}
                        aria-label="Clear manager filter"
                      />
                    </Badge>
                  )}
                  
                  {employeeCountFilter !== 'all' && (
                    <Badge variant="secondary" data-testid="badge-employee-count-filter">
                      Employees: {EMPLOYEE_COUNT_OPTIONS.find(opt => opt.value === employeeCountFilter)?.label}
                      <X 
                        className="w-3 h-3 ml-1 cursor-pointer hover:text-destructive" 
                        onClick={() => setEmployeeCountFilter('all')}
                        aria-label="Clear employee count filter"
                      />
                    </Badge>
                  )}
                </>
              )}
            </div>
            
            {activeFilterCount > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearAllFilters}
                data-testid="button-clear-all-filters"
                aria-label="Clear all filters"
              >
                <X className="w-4 h-4 mr-2" />
                Clear All ({activeFilterCount})
              </Button>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading departments...</p>
        </div>
      ) : filteredDepartments.length === 0 && departments.length > 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Filter className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No departments match your filters</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search criteria or clearing some filters.
            </p>
            <Button 
              variant="outline" 
              onClick={clearAllFilters}
              data-testid="button-clear-filters-no-results"
            >
              <X className="w-4 h-4 mr-2" />
              Clear All Filters
            </Button>
          </CardContent>
        </Card>
      ) : departments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Departments Found</h3>
            <p className="text-muted-foreground mb-4">
              Start by creating your first department to organize your workforce.
            </p>
            <Button onClick={handleAddDepartment} data-testid="button-create-first-department">
              <Plus className="w-4 h-4 mr-2" />
              Create First Department
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Results Summary */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredDepartments.length} of {departments.length} departments
              {activeFilterCount > 0 && (
                <span className="ml-2">
                  ({activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active)
                </span>
              )}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDepartments.map((department) => (
            <Card 
              key={department.id} 
              className="hover-elevate cursor-pointer" 
              data-testid={`card-department-${department.id}`}
              onClick={() => setLocation(`${base}${isHR ? '/hr' : ''}/departments/${department.id}`)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{department.name}</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {department.description || 'No description available'}
                  </p>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="w-4 h-4 mr-1" />
                    <span>{getEmployeeCount(department.id)} employees</span>
                  </div>
                </div>
                <div className="flex space-x-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation(`${base}${isHR ? '/hr' : ''}/departments/${department.id}`);
                    }}
                    data-testid={`button-view-details-${department.id}`}
                  >
                    View Details
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation(`${base}${isHR ? '/hr' : ''}/departments/${department.id}/edit`);
                    }}
                    data-testid={`button-edit-${department.id}`}
                  >
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        </>
      )}
      </div>
    </div>
  );
}