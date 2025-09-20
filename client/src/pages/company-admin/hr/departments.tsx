import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Plus, Users } from "lucide-react";
import type { Department } from "@shared/schema";

export default function HRDepartments() {
  const { user } = useAuth();
  const params = useParams<{ companySlug: string }>();
  const { companySlug } = params;

  // Fetch departments data
  const { data: departments = [], isLoading } = useQuery<Department[]>({
    queryKey: ["/api/departments", companySlug || 'default'],
    enabled: !!user
  });

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Departments</h2>
          <p className="text-muted-foreground">
            Manage organizational departments and structure
          </p>
        </div>
        <Button data-testid="button-add-department">
          <Plus className="w-4 h-4 mr-2" />
          Add Department
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading departments...</p>
        </div>
      ) : departments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Departments Found</h3>
            <p className="text-muted-foreground mb-4">
              Start by creating your first department to organize your workforce.
            </p>
            <Button data-testid="button-create-first-department">
              <Plus className="w-4 h-4 mr-2" />
              Create First Department
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((department) => (
            <Card key={department.id} className="hover-elevate" data-testid={`card-department-${department.id}`}>
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
                    <span>0 employees</span> {/* TODO: Calculate from employee data */}
                  </div>
                </div>
                <div className="flex space-x-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1">
                    View Details
                  </Button>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}