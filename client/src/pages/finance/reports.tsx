import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileBarChart, Download, Calendar, Filter } from "lucide-react";

export default function FinanceReports() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
          <p className="text-muted-foreground">
            Generate comprehensive financial reports and analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Button disabled variant="outline" className="border-orange-200 text-orange-700">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button disabled className="bg-orange-100 text-orange-700 hover:bg-orange-100">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileBarChart className="w-5 h-5 text-blue-500" />
              P&L Statement
            </CardTitle>
            <CardDescription>
              Profit and Loss reports
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-20">
            <div className="text-center">
              <div className="text-sm font-semibold text-orange-600">Coming Soon</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-500" />
              Cash Flow
            </CardTitle>
            <CardDescription>
              Cash flow analysis reports
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-20">
            <div className="text-center">
              <div className="text-sm font-semibold text-orange-600">Coming Soon</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileBarChart className="w-5 h-5 text-purple-500" />
              Balance Sheet
            </CardTitle>
            <CardDescription>
              Balance sheet reports
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-20">
            <div className="text-center">
              <div className="text-sm font-semibold text-orange-600">Coming Soon</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-orange-500" />
              Tax Reports
            </CardTitle>
            <CardDescription>
              Tax compliance reports
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-20">
            <div className="text-center">
              <div className="text-sm font-semibold text-orange-600">Coming Soon</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Financial Reporting Suite</CardTitle>
          <CardDescription>
            Comprehensive financial reporting and analytics platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-semibold">Standard Reports:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Profit & Loss statements</li>
                <li>• Balance sheet reports</li>
                <li>• Cash flow analysis</li>
                <li>• Budget vs actual reports</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Advanced Analytics:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Financial ratio analysis</li>
                <li>• Trend analysis reports</li>
                <li>• Department cost analysis</li>
                <li>• Custom report builder</li>
              </ul>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-center h-20">
            <div className="text-center space-y-2">
              <div className="text-lg font-semibold text-orange-600">Coming Soon</div>
              <p className="text-sm text-muted-foreground">
                Advanced financial reporting and analytics dashboard
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}