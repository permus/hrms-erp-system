import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useParams } from "wouter";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Dashboard from "@/components/Dashboard";
import EmployeeCard from "@/components/EmployeeCard";
import EmployeeForm from "@/components/EmployeeForm";
import DocumentUploadCard from "@/components/DocumentUploadCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Filter } from "lucide-react";
import type { Employee, Department, Position } from "@shared/schema";

export default function Home() {
  const { user } = useAuth();
  const params = useParams<{ companySlug?: string }>();
  const { companySlug } = params;
  
  // Determine the active view based on URL path
  const currentPath = window.location.pathname;
  const getViewFromPath = () => {
    if (currentPath.endsWith('/employees')) return 'employees';
    if (currentPath.endsWith('/departments')) return 'departments'; 
    if (currentPath.endsWith('/positions')) return 'positions';
    if (currentPath.endsWith('/documents')) return 'documents';
    return 'dashboard';
  };
  
  const [activeView, setActiveView] = useState(getViewFromPath());
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);

  // Fetch real data from API with company context
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: companySlug ? ["/api/employees", companySlug] : ["/api/employees"],
    queryFn: () => fetch(`/api/employees${companySlug ? `?companySlug=${companySlug}` : ''}`).then(r => r.json()),
    enabled: !!user
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: companySlug ? ["/api/departments", companySlug] : ["/api/departments"],
    queryFn: () => fetch(`/api/departments${companySlug ? `?companySlug=${companySlug}` : ''}`).then(r => r.json()),
    enabled: !!user
  });

  const { data: positions = [] } = useQuery<Position[]>({
    queryKey: companySlug ? ["/api/positions", companySlug] : ["/api/positions"],
    queryFn: () => fetch(`/api/positions${companySlug ? `?companySlug=${companySlug}` : ''}`).then(r => r.json()),
    enabled: !!user
  });

  // Calculate stats from real data
  const stats = {
    totalEmployees: employees.length,
    activeEmployees: employees.filter(emp => {
      const empDetails = emp.employmentDetails as any;
      return empDetails?.employmentStatus !== 'TERMINATED';
    }).length,
    onProbation: employees.filter(emp => {
      const empDetails = emp.employmentDetails as any;
      return empDetails?.employmentStatus === 'PROBATION';
    }).length,
    pendingDocuments: 12, // TODO: implement document tracking
    expiringDocuments: 5, // TODO: implement document expiry tracking
    pendingLeave: 7, // TODO: implement leave tracking
    totalCompanies: 24, // TODO: implement for super admin
    recentActivities: [] // TODO: implement activity tracking
  };

  // Prepare form data
  const departmentOptions = departments.map(dept => ({
    id: dept.id,
    name: dept.name
  }));

  const positionOptions = positions.map(pos => ({
    id: pos.id,
    title: pos.title
  }));

  // Mock managers for now - TODO: implement manager hierarchy
  const mockStats = {
    totalEmployees: 156,
    activeEmployees: 142,
    onProbation: 8,
    pendingDocuments: 12,
    expiringDocuments: 5,
    pendingLeave: 7,
    totalCompanies: 24,
    recentActivities: [
      {
        id: '1',
        type: 'employee_added',
        description: 'New employee Ahmed Al Mansouri added to Engineering department',
        timestamp: '2 hours ago',
        user: 'HR Manager'
      },
      {
        id: '2',
        type: 'document_approved',
        description: 'Passport document approved for Sara Abdullah',
        timestamp: '4 hours ago',
        user: 'Document Reviewer'
      }
    ]
  };

  const mockManagers = [
    { id: 'john-doe', name: 'John Doe - Engineering Director' },
    { id: 'jane-smith', name: 'Jane Smith - HR Director' }
  ];

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleViewEmployee = (id: string) => {
    console.log('View employee:', id);
  };

  const handleEditEmployee = (id: string) => {
    console.log('Edit employee:', id);
  };

  const handleAddEmployee = () => {
    setShowEmployeeForm(true);
  };

  const handleEmployeeSubmit = (data: any) => {
    console.log('Employee submitted:', data);
    setShowEmployeeForm(false);
  };

  const handleEmployeeCancel = () => {
    setShowEmployeeForm(false);
  };

  const handleDocumentUpload = (file: File, documentType: string, category: string) => {
    console.log('Upload document:', file.name, documentType, category);
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  if (showEmployeeForm) {
    return (
      <div className="h-screen bg-background">
        <Header 
          user={{
            name: (user.firstName || '') + ' ' + (user.lastName || ''),
            email: user.email || '',
            role: user.role || 'EMPLOYEE',
            companyName: 'Acme Corporation'
          }}
          onLogout={handleLogout}
          pendingNotifications={5}
        />
        <main className="h-[calc(100vh-4rem)] overflow-auto p-6">
          <EmployeeForm
            departments={departmentOptions}
            positions={positionOptions}
            managers={mockManagers}
            onSubmit={handleEmployeeSubmit}
            onCancel={handleEmployeeCancel}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex">
      <Sidebar 
        userRole={companySlug && user.role === 'SUPER_ADMIN' ? 'COMPANY_ADMIN' : (user.role || 'EMPLOYEE')}
        companyName={companySlug ? `Company: ${companySlug}` : "Acme Corporation"}
        companySlug={companySlug}
      />
      
      <div className="flex-1 flex flex-col">
        <Header 
          user={{
            name: (user.firstName || '') + ' ' + (user.lastName || ''),
            email: user.email || '',
            role: user.role || 'EMPLOYEE',
            companyName: 'Acme Corporation'
          }}
          onLogout={handleLogout}
          pendingNotifications={5}
        />
        
        <main className="flex-1 overflow-auto p-6">
          <Tabs value={activeView} onValueChange={setActiveView}>
            <TabsList className="mb-6">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="employees">Employees</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <Dashboard 
                userRole={(user.role || 'EMPLOYEE') as 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'EMPLOYEE'} 
                stats={stats} 
              />
            </TabsContent>

            <TabsContent value="employees" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold">Employees</h2>
                  <p className="text-muted-foreground">Manage your company employees</p>
                </div>
                <Button onClick={handleAddEmployee} data-testid="add-employee">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Employee
                </Button>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search employees..." className="pl-10" />
                </div>
                <Button variant="outline" data-testid="filter-employees">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {employees.map((employee) => (
                  <EmployeeCard
                    key={employee.id}
                    employee={{
                      id: employee.id,
                      employeeCode: employee.employeeCode,
                      personalInfo: employee.personalInfo as any,
                      contactInfo: employee.contactInfo as any,
                      employmentDetails: employee.employmentDetails as any,
                      probationInfo: employee.probationInfo as any,
                      visaInfo: employee.visaInfo as any,
                      emiratesIdInfo: employee.emiratesIdInfo as any
                    }}
                    onViewDetails={handleViewEmployee}
                    onEditEmployee={handleEditEmployee}
                  />
                ))}
                {employees.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <p className="text-muted-foreground">No employees found. Add your first employee to get started.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="documents" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold">Document Management</h2>
                  <p className="text-muted-foreground">Manage employee documents and compliance</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="destructive">12 Pending Approval</Badge>
                  <Badge variant="secondary">5 Expiring Soon</Badge>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Document Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <DocumentUploadCard
                      documentType="Passport"
                      category="Identity Documents"
                      isRequired={true}
                      onUpload={handleDocumentUpload}
                    />
                    <DocumentUploadCard
                      documentType="Emirates ID"
                      category="Identity Documents"
                      isRequired={true}
                      onUpload={handleDocumentUpload}
                    />
                    <DocumentUploadCard
                      documentType="Employment Visa"
                      category="Immigration Documents"
                      isRequired={true}
                      onUpload={handleDocumentUpload}
                    />
                    <DocumentUploadCard
                      documentType="Educational Certificate"
                      category="Educational Documents"
                      isRequired={false}
                      onUpload={handleDocumentUpload}
                    />
                    <DocumentUploadCard
                      documentType="Medical Certificate"
                      category="Health Documents"
                      isRequired={false}
                      onUpload={handleDocumentUpload}
                    />
                    <DocumentUploadCard
                      documentType="Employment Contract"
                      category="Employment Documents"
                      isRequired={true}
                      onUpload={handleDocumentUpload}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}