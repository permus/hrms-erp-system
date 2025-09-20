import { useAuth } from "@/hooks/useAuth";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Users, TrendingUp, Download, Calendar } from "lucide-react";

export default function HRAttendance() {
  const { user } = useAuth();
  const params = useParams<{ companySlug: string }>();
  const { companySlug } = params;

  // Mock attendance data - TODO: implement real attendance tracking
  const attendanceStats = {
    present: 142,
    absent: 8,
    late: 12,
    onLeave: 6,
    totalEmployees: 168,
    averageHours: 8.2
  };

  const mockAttendanceRecords = [
    {
      id: '1',
      employee: 'Ahmed Al Mansouri',
      date: '2024-03-20',
      checkIn: '09:15',
      checkOut: '18:30',
      hours: 8.25,
      status: 'present',
      overtime: 0.25
    },
    {
      id: '2',
      employee: 'Sara Abdullah',
      date: '2024-03-20',
      checkIn: '08:45',
      checkOut: '17:15',
      hours: 8.5,
      status: 'present',
      overtime: 0
    },
    {
      id: '3',
      employee: 'Mohammed Hassan',
      date: '2024-03-20',
      checkIn: '10:30',
      checkOut: '19:00',
      hours: 8.5,
      status: 'late',
      overtime: 0
    }
  ];

  if (!user) {
    return <div>Loading...</div>;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-600">Present</Badge>;
      case 'absent':
        return <Badge variant="destructive">Absent</Badge>;
      case 'late':
        return <Badge variant="secondary" className="text-orange-600">Late</Badge>;
      case 'leave':
        return <Badge variant="outline">On Leave</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Attendance Tracking</h2>
          <p className="text-muted-foreground">
            Monitor employee attendance and working hours
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" data-testid="button-export-attendance">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button data-testid="button-attendance-settings">
            <Clock className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Attendance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{attendanceStats.present}</div>
            <p className="text-xs text-muted-foreground">Currently in office</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <Users className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{attendanceStats.absent}</div>
            <p className="text-xs text-muted-foreground">Not present today</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{attendanceStats.late}</div>
            <p className="text-xs text-muted-foreground">Late today</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Leave</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{attendanceStats.onLeave}</div>
            <p className="text-xs text-muted-foreground">Approved leave</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceStats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">Active employees</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Hours</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceStats.averageHours}</div>
            <p className="text-xs text-muted-foreground">Daily average</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="today" className="space-y-4">
        <TabsList>
          <TabsTrigger value="today">Today's Attendance</TabsTrigger>
          <TabsTrigger value="weekly">Weekly Report</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Report</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Today's Attendance - March 20, 2024</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockAttendanceRecords.map((record) => (
                  <div 
                    key={record.id} 
                    className="flex items-center justify-between p-4 border rounded-lg"
                    data-testid={`attendance-record-${record.id}`}
                  >
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-medium">{record.employee}</h3>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <span>In: {record.checkIn}</span>
                          <span>Out: {record.checkOut}</span>
                          <span>Hours: {record.hours}</span>
                          {record.overtime > 0 && (
                            <span className="text-blue-600">Overtime: {record.overtime}h</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(record.status)}
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly" className="space-y-4">
          <Card>
            <CardContent className="text-center py-12">
              <TrendingUp className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Weekly Attendance Report</h3>
              <p className="text-muted-foreground">
                Comprehensive weekly attendance analytics and trends.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Monthly Attendance Report</h3>
              <p className="text-muted-foreground">
                Detailed monthly attendance statistics and performance metrics.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}