import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Calculator, FileCheck, AlertTriangle } from "lucide-react";

export default function TaxManagement() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tax Management</h1>
          <p className="text-muted-foreground">
            Manage tax calculations, deductions, and compliance reporting
          </p>
        </div>
        <Button disabled className="bg-orange-100 text-orange-700 hover:bg-orange-100">
          <Calculator className="w-4 h-4 mr-2" />
          Calculate Taxes
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Income Tax
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">AED 0</div>
            <p className="text-xs text-muted-foreground">
              Current month total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Social Security
            </CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">AED 0</div>
            <p className="text-xs text-muted-foreground">
              Employee contributions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Reviews
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Compliance Score
            </CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--%</div>
            <p className="text-xs text-muted-foreground">
              Overall compliance
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tax Calculation Engine</CardTitle>
            <CardDescription>
              Automated tax calculations based on UAE regulations
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-center space-y-2">
              <div className="text-lg font-semibold text-orange-600">Coming Soon</div>
              <p className="text-sm text-muted-foreground">
                Advanced tax calculation algorithms
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compliance Reporting</CardTitle>
            <CardDescription>
              Generate tax reports and compliance documents
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-center space-y-2">
              <div className="text-lg font-semibold text-orange-600">Coming Soon</div>
              <p className="text-sm text-muted-foreground">
                Automated compliance reporting
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>UAE Tax Compliance Features</CardTitle>
          <CardDescription>
            Comprehensive tax management capabilities will include:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-semibold">Tax Calculations:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• VAT calculations and reporting</li>
                <li>• Corporate tax management</li>
                <li>• Employee tax deductions</li>
                <li>• Social security contributions</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Compliance & Reports:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Automated tax filing</li>
                <li>• FTA compliance monitoring</li>
                <li>• Audit trail maintenance</li>
                <li>• Tax calendar management</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}