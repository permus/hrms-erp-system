import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, X, Download, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { queryClient } from "@/lib/queryClient";

interface DocumentManagementProps {
  employeeId: string;
  companySlug: string;
}

const DOCUMENT_TYPES = [
  { value: "passport", label: "Passport" },
  { value: "emirates-id", label: "Emirates ID" },
  { value: "visa", label: "Visa" },
  { value: "contract", label: "Employment Contract" },
  { value: "offer-letter", label: "Offer Letter" },
  { value: "certificate", label: "Certificate/Qualification" },
  { value: "other", label: "Other Document" }
];

export default function DocumentManagement({ employeeId, companySlug }: DocumentManagementProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>("");

  // Fetch employee documents
  const { data: employeeDocuments = [], isLoading } = useQuery({
    queryKey: ["/api/employee-documents", employeeId],
    queryFn: () => fetch(`/api/employee-documents?employeeId=${employeeId}`).then(r => r.json()),
    enabled: !!employeeId
  });

  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const response = await fetch(`/api/employee-documents/${documentId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete document');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee-documents", employeeId] });
      toast({
        title: "Document deleted",
        description: "Document has been successfully deleted"
      });
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Failed to delete document",
        variant: "destructive"
      });
    }
  });

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    if (!selectedDocumentType) {
      toast({
        title: "Document type required",
        description: "Please select a document type before uploading",
        variant: "destructive"
      });
      return;
    }

    const file = files[0]; // Only handle single file for now
    
    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "File size must be less than 10MB",
        variant: "destructive"
      });
      return;
    }

    // Validate file type
    const acceptedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!acceptedTypes.includes(fileExtension)) {
      toast({
        title: "Invalid file type",
        description: "Please upload PDF, image, or document files only",
        variant: "destructive"
      });
      return;
    }

    uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Get upload URL from object storage service
      const uploadUrlResponse = await fetch('/api/objects/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!uploadUrlResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadURL } = await uploadUrlResponse.json();

      // Step 2: Upload file directly to object storage
      const uploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      // Simulate progress for better UX
      setUploadProgress(50);

      // Step 3: Save document metadata
      const completeResponse = await fetch('/api/employee-documents', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentURL: uploadURL.split('?')[0], // Remove query parameters
          employeeId: employeeId,
          documentType: selectedDocumentType,
          fileName: file.name,
          fileSize: file.size,
        }),
      });

      if (!completeResponse.ok) {
        throw new Error('Failed to save document metadata');
      }

      setUploadProgress(100);

      // Refresh the documents list
      queryClient.invalidateQueries({ queryKey: ["/api/employee-documents", employeeId] });

      toast({
        title: "Upload successful",
        description: `${file.name} uploaded successfully`
      });

      // Reset the form
      setSelectedDocumentType("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDeleteDocument = (documentId: string, fileName: string) => {
    if (confirm(`Are you sure you want to delete "${fileName}"?`)) {
      deleteMutation.mutate(documentId);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const getDocumentTypeLabel = (type: string) => {
    const docType = DOCUMENT_TYPES.find(dt => dt.value === type);
    return docType ? docType.label : type;
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading documents...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Upload New Document Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload New Document</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Document Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Document Type</label>
            <Select value={selectedDocumentType} onValueChange={setSelectedDocumentType}>
              <SelectTrigger data-testid="select-document-type">
                <SelectValue placeholder="Select document type..." />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* File Upload Area */}
          <Card
            className={cn(
              "border-2 border-dashed transition-colors cursor-pointer",
              isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25",
              isUploading && "pointer-events-none opacity-50"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <CardContent className="p-6 text-center">
              <div className="space-y-4">
                <div className="flex justify-center">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    {isDragging ? "Drop file here" : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF, images, or document files up to 10MB
                  </p>
                </div>

                {isUploading && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} className="w-full" />
                    <p className="text-xs text-muted-foreground">
                      Uploading... {uploadProgress}%
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
        </CardContent>
      </Card>

      {/* Existing Documents Section */}
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Documents ({employeeDocuments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {employeeDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No documents uploaded yet</p>
              <p className="text-sm">Upload documents using the form above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {employeeDocuments.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3 flex-1">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" data-testid={`text-document-name-${doc.id}`}>
                        {doc.fileName}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <span>{getDocumentTypeLabel(doc.documentType)}</span>
                        <span>•</span>
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>•</span>
                        <span>Uploaded {formatDate(doc.uploadDate)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(doc.fileUrl, '_blank')}
                      data-testid={`button-view-document-${doc.id}`}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteDocument(doc.id, doc.fileName)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-document-${doc.id}`}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}