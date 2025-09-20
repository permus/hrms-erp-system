import { useAuth } from "@/hooks/useAuth";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Upload, Clock, CheckCircle, AlertTriangle } from "lucide-react";

export default function HRDocuments() {
  const { user } = useAuth();
  const params = useParams<{ companySlug: string }>();
  const { companySlug } = params;

  // Mock document data - TODO: implement real document management
  const documentStats = {
    pending: 12,
    approved: 156,
    expired: 5,
    total: 173
  };

  const documentTypes = [
    {
      id: 'passport',
      name: 'Passport',
      category: 'Identity Documents',
      required: true,
      count: 45
    },
    {
      id: 'emirates-id',
      name: 'Emirates ID',
      category: 'Identity Documents',
      required: true,
      count: 42
    },
    {
      id: 'visa',
      name: 'Employment Visa',
      category: 'Immigration',
      required: true,
      count: 38
    },
    {
      id: 'contract',
      name: 'Employment Contract',
      category: 'Employment',
      required: true,
      count: 50
    },
    {
      id: 'certificate',
      name: 'Educational Certificate',
      category: 'Education',
      required: false,
      count: 25
    }
  ];

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Document Management</h2>
          <p className="text-muted-foreground">
            Manage employee documents and compliance requirements
          </p>
        </div>
        <Button data-testid="button-upload-document">
          <Upload className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Document Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documentStats.total}</div>
            <p className="text-xs text-muted-foreground">All documents</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{documentStats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{documentStats.approved}</div>
            <p className="text-xs text-muted-foreground">Verified documents</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{documentStats.expired}</div>
            <p className="text-xs text-muted-foreground">Need renewal</p>
          </CardContent>
        </Card>
      </div>

      {/* Document Types */}
      <Tabs defaultValue="types" className="space-y-4">
        <TabsList>
          <TabsTrigger value="types">Document Types</TabsTrigger>
          <TabsTrigger value="pending">Pending Review</TabsTrigger>
          <TabsTrigger value="expired">Expired Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="types" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documentTypes.map((docType) => (
              <Card key={docType.id} className="hover-elevate" data-testid={`card-document-type-${docType.id}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{docType.name}</CardTitle>
                    {docType.required && (
                      <Badge variant="destructive" className="text-xs">Required</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{docType.category}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Documents on file:</span>
                      <span className="font-semibold">{docType.count}</span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      View Documents
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardContent className="text-center py-12">
              <Clock className="w-16 h-16 mx-auto text-orange-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Pending Documents</h3>
              <p className="text-muted-foreground">
                All documents are currently up to date.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expired" className="space-y-4">
          <Card>
            <CardContent className="text-center py-12">
              <AlertTriangle className="w-16 h-16 mx-auto text-red-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Document Expiry Management</h3>
              <p className="text-muted-foreground">
                Monitor and manage document expiry dates to ensure compliance.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}