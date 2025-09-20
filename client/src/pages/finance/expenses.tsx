import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, CreditCard, FileText, TrendingUp } from "lucide-react";

export default function Expenses() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expense Management</h1>
          <p className="text-muted-foreground">
            Track and manage company expenses and reimbursements
          </p>
        </div>
        <Button disabled className="bg-orange-100 text-orange-700 hover:bg-orange-100">
          <Plus className="w-4 h-4 mr-2" />
          Add Expense
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-500" />
              This Month
            </CardTitle>
            <CardDescription>
              Total expenses for current month
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-24">
            <div className="text-center">
              <div className="text-2xl font-bold">AED 0</div>
              <p className="text-xs text-muted-foreground">Total expenses</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-500" />
              Pending Approval
            </CardTitle>
            <CardDescription>
              Expenses awaiting management approval
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-24">
            <div className="text-center">
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Pending items</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Budget Remaining
            </CardTitle>
            <CardDescription>
              Available budget for this period
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-24">
            <div className="text-center">
              <div className="text-2xl font-bold">AED 0</div>
              <p className="text-xs text-muted-foreground">Budget left</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expense Management Features</CardTitle>
          <CardDescription>
            Comprehensive expense tracking and management system
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-40">
          <div className="text-center space-y-4">
            <div className="text-lg font-semibold text-orange-600">Coming Soon</div>
            <p className="text-sm text-muted-foreground max-w-md">
              Advanced expense tracking, receipt management, approval workflows, 
              and automated reimbursement processing will be available here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}