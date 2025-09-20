import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, PieChart, Target, AlertCircle } from "lucide-react";

export default function Budgets() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budget Management</h1>
          <p className="text-muted-foreground">
            Create and monitor departmental and project budgets
          </p>
        </div>
        <Button disabled className="bg-orange-100 text-orange-700 hover:bg-orange-100">
          <Plus className="w-4 h-4 mr-2" />
          Create Budget
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              Total Budget
            </CardTitle>
            <CardDescription>
              Overall budget allocation for this period
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-24">
            <div className="text-center">
              <div className="text-2xl font-bold">AED 0</div>
              <p className="text-xs text-muted-foreground">Annual budget</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-green-500" />
              Budget Utilized
            </CardTitle>
            <CardDescription>
              Amount spent from allocated budgets
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-24">
            <div className="text-center">
              <div className="text-2xl font-bold">0%</div>
              <p className="text-xs text-muted-foreground">Of total budget</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              Over Budget
            </CardTitle>
            <CardDescription>
              Departments exceeding budget limits
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-24">
            <div className="text-center">
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Departments</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Budget Planning & Control</CardTitle>
          <CardDescription>
            Advanced budget management capabilities will include:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-semibold">Budget Features:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Departmental budget allocation</li>
                <li>• Project-based budgeting</li>
                <li>• Multi-currency support</li>
                <li>• Budget variance analysis</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Monitoring & Alerts:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Real-time budget tracking</li>
                <li>• Automated alert notifications</li>
                <li>• Approval workflow integration</li>
                <li>• Budget performance reports</li>
              </ul>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-center h-20">
            <div className="text-center space-y-2">
              <div className="text-lg font-semibold text-orange-600">Coming Soon</div>
              <p className="text-sm text-muted-foreground">
                Comprehensive budget management tools
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}