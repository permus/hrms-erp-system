import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
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

export default function Home() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState("dashboard");
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);

  // TODO: remove mock functionality
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

  const mockEmployees = [
    {
      id: 'emp-001',
      employeeCode: 'EMP2024001',
      personalInfo: {
        name: 'Ahmed Al Mansouri',
        nationality: 'UAE',
        dob: '1990-05-15'
      },
      contactInfo: {
        email: 'ahmed.almansouri@company.com',
        uaePhone: '+971 50 123 4567',
        uaeAddress: 'Marina District, Dubai, UAE'
      },
      employmentDetails: {
        position: 'Senior Software Engineer',
        department: 'Engineering',
        startDate: '2024-01-15',
        employmentStatus: 'PROBATION' as const
      },
      probationInfo: {
        endDate: '2024-07-15',
        status: 'ACTIVE' as const
      },
      visaInfo: {
        expiryDate: '2024-12-31',
        visaType: 'Employment Visa'
      },
      emiratesIdInfo: {
        expiryDate: '2024-06-30'
      }
    },
    {
      id: 'emp-002',
      employeeCode: 'EMP2024002',
      personalInfo: {
        name: 'Sara Abdullah',
        nationality: 'Jordan',
        dob: '1988-03-22'
      },
      contactInfo: {
        email: 'sara.abdullah@company.com',
        uaePhone: '+971 52 987 6543',
        uaeAddress: 'Business Bay, Dubai, UAE'
      },
      employmentDetails: {
        position: 'HR Manager',
        department: 'Human Resources',
        startDate: '2023-06-10',
        employmentStatus: 'CONFIRMED' as const
      },
      visaInfo: {
        expiryDate: '2025-06-10',
        visaType: 'Employment Visa'
      },
      emiratesIdInfo: {
        expiryDate: '2025-03-15'
      }
    }
  ];

  const mockDepartments = [
    { id: 'eng', name: 'Engineering' },
    { id: 'hr', name: 'Human Resources' },
    { id: 'fin', name: 'Finance' },
    { id: 'ops', name: 'Operations' }
  ];

  const mockPositions = [
    { id: 'senior-engineer', title: 'Senior Software Engineer' },
    { id: 'hr-manager', title: 'HR Manager' },
    { id: 'accountant', title: 'Senior Accountant' },
    { id: 'ops-manager', title: 'Operations Manager' }
  ];

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
            name: user.firstName + ' ' + user.lastName,
            email: user.email || '',
            role: user.role,
            companyName: 'Acme Corporation'
          }}
          onLogout={handleLogout}
          pendingNotifications={5}
        />
        <main className="h-[calc(100vh-4rem)] overflow-auto p-6">
          <EmployeeForm
            departments={mockDepartments}
            positions={mockPositions}
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
        userRole={user.role} 
        companyName="Acme Corporation"
      />
      
      <div className="flex-1 flex flex-col">
        <Header 
          user={{
            name: user.firstName + ' ' + user.lastName,
            email: user.email || '',
            role: user.role,
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
                userRole={user.role as 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'EMPLOYEE'} 
                stats={mockStats} 
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
                {mockEmployees.map((employee) => (
                  <EmployeeCard
                    key={employee.id}
                    employee={employee}
                    onViewDetails={handleViewEmployee}
                    onEditEmployee={handleEditEmployee}
                  />
                ))}
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