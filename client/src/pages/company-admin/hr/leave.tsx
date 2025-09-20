import { useAuth } from "@/hooks/useAuth";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, CheckCircle, XCircle, Plus } from "lucide-react";

export default function HRLeave() {
  const { user } = useAuth();
  const params = useParams<{ companySlug: string }>();
  const { companySlug } = params;

  // Mock leave data - TODO: implement real leave management
  const leaveStats = {
    pending: 7,
    approved: 23,
    rejected: 2,
    total: 32
  };

  const leaveTypes = [
    { id: 'annual', name: 'Annual Leave', allowance: 30, color: 'blue' },
    { id: 'sick', name: 'Sick Leave', allowance: 15, color: 'red' },
    { id: 'maternity', name: 'Maternity Leave', allowance: 90, color: 'pink' },
    { id: 'emergency', name: 'Emergency Leave', allowance: 5, color: 'orange' }
  ];

  const mockLeaveRequests = [
    {
      id: '1',
      employee: 'Ahmed Al Mansouri',
      type: 'Annual Leave',
      startDate: '2024-03-15',
      endDate: '2024-03-22',
      days: 8,
      status: 'pending',
      reason: 'Family vacation'
    },
    {
      id: '2',
      employee: 'Sara Abdullah',
      type: 'Sick Leave',
      startDate: '2024-03-20',
      endDate: '2024-03-21',
      days: 2,
      status: 'approved',
      reason: 'Medical appointment'
    },
    {
      id: '3',
      employee: 'Mohammed Hassan',
      type: 'Emergency Leave',
      startDate: '2024-03-18',
      endDate: '2024-03-18',
      days: 1,
      status: 'pending',
      reason: 'Family emergency'
    }
  ];

  if (!user) {
    return <div>Loading...</div>;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="text-orange-600">Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-600">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Leave Management</h2>
          <p className="text-muted-foreground">
            Manage employee leave requests and policies
          </p>
        </div>
        <Button data-testid="button-add-leave-policy">
          <Plus className="w-4 h-4 mr-2" />
          Add Leave Policy
        </Button>
      </div>

      {/* Leave Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leaveStats.total}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{leaveStats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{leaveStats.approved}</div>
            <p className="text-xs text-muted-foreground">Confirmed leave</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{leaveStats.rejected}</div>
            <p className="text-xs text-muted-foreground">Declined requests</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="requests">Leave Requests</TabsTrigger>
          <TabsTrigger value="policies">Leave Policies</TabsTrigger>
          <TabsTrigger value="calendar">Leave Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          <div className="space-y-4">
            {mockLeaveRequests.map((request) => (
              <Card key={request.id} className="hover-elevate" data-testid={`card-leave-request-${request.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{request.employee}</h3>
                        {getStatusBadge(request.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{request.type}</p>
                      <div className="flex items-center space-x-4 text-sm">
                        <span>{request.startDate} to {request.endDate}</span>
                        <span className="font-medium">{request.days} days</span>
                      </div>
                      <p className="text-sm">{request.reason}</p>
                    </div>
                    {request.status === 'pending' && (
                      <div className="flex space-x-2">
                        <Button size="sm" className="bg-green-600">
                          Approve
                        </Button>
                        <Button size="sm" variant="outline">
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {leaveTypes.map((type) => (
              <Card key={type.id} className="hover-elevate" data-testid={`card-leave-type-${type.id}`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{type.name}</span>
                    <Badge variant="outline">{type.allowance} days</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Annual allowance for {type.name.toLowerCase()}
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    Edit Policy
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Leave Calendar</h3>
              <p className="text-muted-foreground">
                Visual calendar view of all approved leave requests.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}