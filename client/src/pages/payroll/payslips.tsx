import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Send } from "lucide-react";

export default function Payslips() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payslips</h1>
          <p className="text-muted-foreground">
            Generate, manage, and distribute employee payslips
          </p>
        </div>
        <div className="flex gap-2">
          <Button disabled className="bg-orange-100 text-orange-700 hover:bg-orange-100">
            <FileText className="w-4 h-4 mr-2" />
            Generate Payslips
          </Button>
          <Button disabled variant="outline" className="border-orange-200 text-orange-700">
            <Send className="w-4 h-4 mr-2" />
            Send All
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              Generated This Month
            </CardTitle>
            <CardDescription>
              Payslips ready for distribution
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-24">
            <div className="text-center">
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Payslips generated</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-green-500" />
              Sent to Employees
            </CardTitle>
            <CardDescription>
              Successfully delivered payslips
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-24">
            <div className="text-center">
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Payslips sent</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-orange-500" />
              Pending Delivery
            </CardTitle>
            <CardDescription>
              Payslips awaiting distribution
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-24">
            <div className="text-center">
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Pending delivery</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payslip Management</CardTitle>
          <CardDescription>
            Comprehensive payslip generation and distribution system
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-40">
          <div className="text-center space-y-4">
            <div className="text-lg font-semibold text-orange-600">Coming Soon</div>
            <p className="text-sm text-muted-foreground max-w-md">
              Advanced payslip generation with customizable templates, automated distribution, 
              and employee self-service access will be available here.
            </p>
            <div className="flex gap-2 justify-center">
              <Button disabled size="sm" variant="outline">Generate</Button>
              <Button disabled size="sm" variant="outline">Preview</Button>
              <Button disabled size="sm" variant="outline">Download</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}