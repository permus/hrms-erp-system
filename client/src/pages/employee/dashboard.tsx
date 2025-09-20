import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  FileText, 
  Clock, 
  DollarSign, 
  User, 
  Download,
  Upload,
  CheckCircle,
  AlertTriangle,
  ChevronRight
} from "lucide-react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const params = useParams<{ companySlug: string; employeeSlug: string }>();
  const { companySlug, employeeSlug } = params;

  // Verify this employee belongs to this user (security check)
  const isValidEmployee = user?.role === 'EMPLOYEE';

  // Mock employee-specific data - TODO: replace with real API calls
  const employeeStats = {
    leaveBalance: {
      annual: 15,
      sick: 5,
      used: 10,
      total: 30
    },
    documents: {
      submitted: 8,
      pending: 2,
      approved: 6,
      expiringSoon: 1
    },
    thisMonth: {
      daysWorked: 18,
      totalDays: 22,
      overtime: 5,
      attendance: 82 // percentage
    }
  };

  const quickActions = [
    {
      title: "Request Leave",
      description: "Submit annual or sick leave request",
      icon: Calendar,
      action: () => console.log("Request leave"),
      testId: "button-request-leave"
    },
    {
      title: "Upload Document",
      description: "Submit required documents",
      icon: Upload,
      action: () => console.log("Upload document"),
      testId: "button-upload-document"
    },
    {
      title: "Download Payslip",
      description: "Get your latest salary statement",
      icon: Download,
      action: () => console.log("Download payslip"),
      testId: "button-download-payslip"
    },
    {
      title: "Update Profile",
      description: "Modify personal information",
      icon: User,
      action: () => console.log("Update profile"),
      testId: "button-update-profile"
    }
  ];

  const handleLogout = () => {
    // Clear sidebar preference from localStorage on logout
    localStorage.removeItem('sidebarOpen');
    window.location.href = "/api/logout";
  };

  if (!user || user.role !== 'EMPLOYEE' || !isValidEmployee) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground">This is the employee self-service portal.</p>
          {companySlug && employeeSlug && (
            <p className="text-xs text-muted-foreground mt-2">
              Company: {companySlug} | Employee: {employeeSlug}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex">
      <Sidebar 
        userRole={user.role || 'EMPLOYEE'} 
        companyName={companySlug || 'Unknown Company'}
        companySlug={companySlug}
        employeeSlug={employeeSlug}
      />
      
      <div className="flex-1 flex flex-col">
        <Header 
          user={{
            name: (user.firstName || '') + ' ' + (user.lastName || ''),
            email: user.email || '',
            role: user.role || 'EMPLOYEE',
            companyName: companySlug || 'Unknown Company'
          }}
          onLogout={handleLogout}
          pendingNotifications={employeeStats.documents.pending}
        />

        <main className="flex-1 overflow-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">My Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here's your overview for {companySlug || 'your company'}
            </p>
          </div>
          
          {/* Personal Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            
            {/* Leave Balance Card */}
            <Card className="hover-elevate" data-testid="card-leave-balance">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Leave Balance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Annual Leave</span>
                    <span className="font-medium" data-testid="text-annual-leave">
                      {employeeStats.leaveBalance.annual} days left
                    </span>
                  </div>
                  <Progress value={60} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Sick Leave</span>
                    <span className="font-medium" data-testid="text-sick-leave">
                      {employeeStats.leaveBalance.sick} days left
                    </span>
                  </div>
                  <Progress value={100} className="h-2" />
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Used this year</span>
                    <span className="font-medium text-orange-600" data-testid="text-used-leave">
                      {employeeStats.leaveBalance.used} days
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Documents Status Card */}
            <Card className="hover-elevate" data-testid="card-documents-status">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-green-600" />
                  Documents Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Approved</span>
                  </div>
                  <Badge variant="secondary" data-testid="badge-approved-docs">
                    {employeeStats.documents.approved}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <span className="text-sm">Pending</span>
                  </div>
                  <Badge variant="outline" data-testid="badge-pending-docs">
                    {employeeStats.documents.pending}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-sm">Expiring Soon</span>
                  </div>
                  <Badge variant="destructive" data-testid="badge-expiring-docs">
                    {employeeStats.documents.expiringSoon}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* This Month Card */}
            <Card className="hover-elevate" data-testid="card-this-month">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-purple-600" />
                  This Month
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Days Worked</span>
                    <span className="font-medium" data-testid="text-days-worked">
                      {employeeStats.thisMonth.daysWorked}/{employeeStats.thisMonth.totalDays}
                    </span>
                  </div>
                  <Progress value={employeeStats.thisMonth.attendance} className="h-2" />
                  <div className="text-xs text-muted-foreground mt-1">
                    {employeeStats.thisMonth.attendance}% attendance
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Overtime Hours</span>
                  <span className="font-medium text-blue-600" data-testid="text-overtime">
                    {employeeStats.thisMonth.overtime}h
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action) => (
                  <Button
                    key={action.title}
                    variant="outline"
                    className="p-4 h-auto justify-start hover-elevate active-elevate-2"
                    data-testid={action.testId}
                    onClick={action.action}
                  >
                    <action.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                    <div className="text-left">
                      <h3 className="font-semibold text-sm mb-1">{action.title}</h3>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card data-testid="card-recent-activities">
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Leave request approved</p>
                    <p className="text-xs text-muted-foreground">Annual leave for Dec 25-29 has been approved</p>
                  </div>
                  <span className="text-xs text-muted-foreground">2 days ago</span>
                </div>
                
                <div className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Document uploaded</p>
                    <p className="text-xs text-muted-foreground">Emirates ID copy submitted successfully</p>
                  </div>
                  <span className="text-xs text-muted-foreground">5 days ago</span>
                </div>

                <div className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Payslip available</p>
                    <p className="text-xs text-muted-foreground">November 2024 salary statement is ready</p>
                  </div>
                  <span className="text-xs text-muted-foreground">1 week ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}