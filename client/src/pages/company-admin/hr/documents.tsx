import { useAuth } from "@/hooks/useAuth";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Upload, Clock, CheckCircle, AlertTriangle, Search, Download, Eye, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";

export default function HRDocuments() {
  const { user } = useAuth();
  const params = useParams<{ companySlug: string }>();
  const { companySlug } = params;
  
  // State for search and filtering
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDocumentType, setSelectedDocumentType] = useState("all");
  const [selectedEmployee, setSelectedEmployee] = useState("all");

  // Fetch employees
  const { data: employees = [] } = useQuery({
    queryKey: ['/api/employees'],
    enabled: !!user
  });

  // Type-safe employees array
  const typedEmployees = (employees as any[]);

  // Fetch employee documents from real API
  const { data: documents = [] } = useQuery({
    queryKey: ['/api/employee-documents'],
    enabled: !!user
  });

  // Calculate document statistics from real data
  const documentStats = {
    total: documents.length,
    pending: documents.filter((doc: any) => doc.status === 'pending').length,
    approved: documents.filter((doc: any) => doc.status === 'approved').length,
    expired: documents.filter((doc: any) => {
      if (!doc.expiryDate) return false;
      return new Date(doc.expiryDate) < new Date();
    }).length
  };

  // Document type configuration
  const documentTypes = [
    {
      id: 'passport',
      name: 'Passport',
      category: 'Identity Documents',
      required: true,
      count: documents.filter((doc: any) => doc.documentType === 'passport').length
    },
    {
      id: 'emirates-id',
      name: 'Emirates ID',
      category: 'Identity Documents',
      required: true,
      count: documents.filter((doc: any) => doc.documentType === 'emirates-id').length
    },
    {
      id: 'visa',
      name: 'Employment Visa',
      category: 'Immigration',
      required: true,
      count: documents.filter((doc: any) => doc.documentType === 'visa').length
    },
    {
      id: 'work-permit',
      name: 'Work Permit',
      category: 'Immigration',
      required: false,
      count: documents.filter((doc: any) => doc.documentType === 'work-permit').length
    },
    {
      id: 'labor-card',
      name: 'Labor Card',
      category: 'Employment',
      required: false,
      count: documents.filter((doc: any) => doc.documentType === 'labor-card').length
    }
  ];

  // Filter documents based on search and filters
  const filteredDocuments = documents.filter((doc: any) => {
    const matchesSearch = !searchTerm || 
      doc.fileName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.documentType?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedDocumentType === 'all' || doc.documentType === selectedDocumentType;
    const matchesEmployee = selectedEmployee === 'all' || doc.employeeId === selectedEmployee;
    
    return matchesSearch && matchesType && matchesEmployee;
  });

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
          <Plus className="w-4 h-4 mr-2" />
          Add Document
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Documents</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by file name or type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                  data-testid="input-search-documents"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Document Type</label>
              <Select 
                value={selectedDocumentType} 
                onValueChange={setSelectedDocumentType}
              >
                <SelectTrigger data-testid="select-document-type">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Document Types</SelectItem>
                  <SelectItem value="passport">Passport</SelectItem>
                  <SelectItem value="emirates-id">Emirates ID</SelectItem>
                  <SelectItem value="visa">Visa</SelectItem>
                  <SelectItem value="work-permit">Work Permit</SelectItem>
                  <SelectItem value="labor-card">Labor Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Employee</label>
              <Select 
                value={selectedEmployee} 
                onValueChange={setSelectedEmployee}
              >
                <SelectTrigger data-testid="select-employee">
                  <SelectValue placeholder="All employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {typedEmployees.map((emp: any) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.personalInfo?.name || "Unknown Employee"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setSelectedDocumentType("all");
                  setSelectedEmployee("all");
                }}
                className="w-full"
                data-testid="button-clear-filters"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* Document Management Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Documents ({filteredDocuments.length})</TabsTrigger>
          <TabsTrigger value="types">Document Types</TabsTrigger>
          <TabsTrigger value="pending">Pending Review ({documentStats.pending})</TabsTrigger>
          <TabsTrigger value="expired">Expired ({documentStats.expired})</TabsTrigger>
        </TabsList>

        {/* All Documents Tab */}
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Document List</CardTitle>
              <p className="text-sm text-muted-foreground">
                Showing {filteredDocuments.length} documents
              </p>
            </CardHeader>
            <CardContent>
              {filteredDocuments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Upload Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.map((doc: any) => (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{doc.fileName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {typedEmployees.find((emp: any) => emp.id === doc.employeeId)?.personalInfo?.name || "Unknown"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{doc.documentType}</Badge>
                        </TableCell>
                        <TableCell>
                          {doc.uploadDate ? format(new Date(doc.uploadDate), "dd/MM/yyyy") : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={doc.status === 'approved' ? 'default' : doc.status === 'pending' ? 'secondary' : 'destructive'}
                          >
                            {doc.status || 'pending'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Documents Found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || selectedDocumentType !== 'all' || selectedEmployee !== 'all' 
                      ? "Try adjusting your search filters."
                      : "No documents have been uploaded yet."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Document Types Tab */}
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
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => setSelectedDocumentType(docType.id)}
                    >
                      View Documents
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Pending Documents Tab */}
        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documents Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              {documentStats.pending > 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {documentStats.pending} documents require review and approval.
                  </p>
                  {/* Pending documents would be listed here */}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Pending Documents</h3>
                  <p className="text-muted-foreground">
                    All documents are currently up to date.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expired Documents Tab */}
        <TabsContent value="expired" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Expired Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {documentStats.expired > 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {documentStats.expired} documents have expired and need renewal.
                  </p>
                  {/* Expired documents would be listed here */}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Expired Documents</h3>
                  <p className="text-muted-foreground">
                    All documents are current and valid.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}