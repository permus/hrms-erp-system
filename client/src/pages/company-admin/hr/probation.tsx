import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { UserCheck, Clock, Calendar, AlertTriangle, CheckCircle } from "lucide-react";
import type { Employee } from "@shared/schema";

export default function HRProbation() {
  const { user } = useAuth();
  const params = useParams<{ companySlug: string }>();
  const { companySlug } = params;

  // Fetch employees data to identify probation employees
  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees", companySlug || 'default'],
    enabled: !!user
  });

  // Filter employees on probation
  const probationEmployees = employees.filter(emp => {
    const empDetails = emp.employmentDetails as any;
    return empDetails?.employmentStatus === 'PROBATION';
  });

  // Mock probation data - TODO: implement real probation tracking
  const probationStats = {
    active: probationEmployees.length,
    completing: 2,
    extended: 1,
    confirmed: 15
  };

  const mockProbationData = [
    {
      id: '1',
      employee: 'Ahmed Al Mansouri',
      startDate: '2024-01-15',
      endDate: '2024-04-15',
      duration: 90,
      completed: 65,
      status: 'active',
      manager: 'Sarah Johnson',
      reviews: ['30-day', '60-day'],
      nextReview: '90-day'
    },
    {
      id: '2',
      employee: 'Fatima Ahmed',
      startDate: '2024-02-01',
      endDate: '2024-05-01',
      duration: 90,
      completed: 48,
      status: 'active',
      manager: 'Michael Chen',
      reviews: ['30-day'],
      nextReview: '60-day'
    },
    {
      id: '3',
      employee: 'Omar Hassan',
      startDate: '2023-12-01',
      endDate: '2024-03-01',
      duration: 90,
      completed: 88,
      status: 'completing',
      manager: 'Lisa Wong',
      reviews: ['30-day', '60-day', '90-day'],
      nextReview: 'confirmation'
    }
  ];

  if (!user) {
    return <div>Loading...</div>;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-blue-600">Active</Badge>;
      case 'completing':
        return <Badge className="bg-green-600">Completing</Badge>;
      case 'extended':
        return <Badge className="bg-orange-600">Extended</Badge>;
      case 'confirmed':
        return <Badge className="bg-green-600">Confirmed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const calculateDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Probation Tracking</h2>
          <p className="text-muted-foreground">
            Monitor and manage employee probationary periods
          </p>
        </div>
        <Button data-testid="button-probation-settings">
          <UserCheck className="w-4 h-4 mr-2" />
          Probation Settings
        </Button>
      </div>

      {/* Probation Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Probation</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{probationStats.active}</div>
            <p className="text-xs text-muted-foreground">Currently on probation</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completing Soon</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{probationStats.completing}</div>
            <p className="text-xs text-muted-foreground">Due within 30 days</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Extended Period</CardTitle>
            <Calendar className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{probationStats.extended}</div>
            <p className="text-xs text-muted-foreground">Extended probation</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{probationStats.confirmed}</div>
            <p className="text-xs text-muted-foreground">Successfully confirmed</p>
          </CardContent>
        </Card>
      </div>

      {/* Probation Employees List */}
      <Card>
        <CardHeader>
          <CardTitle>Current Probation Employees</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading probation data...</p>
            </div>
          ) : mockProbationData.length === 0 ? (
            <div className="text-center py-8">
              <UserCheck className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Active Probations</h3>
              <p className="text-muted-foreground">
                There are currently no employees on probation.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {mockProbationData.map((probation) => {
                const daysRemaining = calculateDaysRemaining(probation.endDate);
                const progressPercentage = probation.completed;
                
                return (
                  <div 
                    key={probation.id} 
                    className="p-6 border rounded-lg space-y-4"
                    data-testid={`probation-record-${probation.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold">{probation.employee}</h3>
                          {getStatusBadge(probation.status)}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Start Date: {probation.startDate}</p>
                          <p>End Date: {probation.endDate}</p>
                          <p>Manager: {probation.manager}</p>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="text-sm">
                          <span className="font-semibold">{daysRemaining}</span> days remaining
                        </div>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{progressPercentage}% complete</span>
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Completed Reviews</h4>
                        <div className="flex space-x-1">
                          {probation.reviews.map((review) => (
                            <Badge key={review} variant="secondary" className="text-xs">
                              {review}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-2">Next Review</h4>
                        <Badge variant="outline" className="text-xs">
                          {probation.nextReview}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 pt-2">
                      <Button size="sm" variant="outline">
                        Schedule Review
                      </Button>
                      <Button size="sm" variant="outline">
                        Add Note
                      </Button>
                      {probation.status === 'completing' && (
                        <>
                          <Button size="sm" className="bg-green-600">
                            Confirm Employee
                          </Button>
                          <Button size="sm" variant="outline">
                            Extend Probation
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}