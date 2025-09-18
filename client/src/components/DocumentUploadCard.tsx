import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  Upload, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Download
} from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";

interface Document {
  id: string;
  documentType: string;
  category: string;
  fileName: string;
  uploadDate: string;
  expiryDate?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'EXPIRING_SOON';
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  version: number;
  fileSize: number;
}

interface DocumentUploadCardProps {
  document?: Document;
  documentType: string;
  category: string;
  isRequired: boolean;
  onUpload: (file: File, documentType: string, category: string) => void;
  onDownload?: (documentId: string) => void;
  onDelete?: (documentId: string) => void;
}

export default function DocumentUploadCard({
  document,
  documentType,
  category,
  isRequired,
  onUpload,
  onDownload,
  onDelete
}: DocumentUploadCardProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return null;
    const daysUntilExpiry = differenceInDays(parseISO(expiryDate), new Date());
    if (daysUntilExpiry < 0) return 'EXPIRED';
    if (daysUntilExpiry <= 30) return 'EXPIRING_SOON';
    return 'ACTIVE';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'REJECTED': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'PENDING': return <Clock className="h-4 w-4 text-amber-500" />;
      default: return null;
    }
  };

  const getExpiryIcon = (status: string | null) => {
    switch (status) {
      case 'EXPIRED': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'EXPIRING_SOON': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default: return null;
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          onUpload(file, documentType, category);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const expiryStatus = document ? getExpiryStatus(document.expiryDate) : null;

  return (
    <Card className="relative" data-testid={`document-card-${documentType.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-sm font-medium">{documentType}</CardTitle>
              <p className="text-xs text-muted-foreground">{category}</p>
            </div>
          </div>
          {isRequired && (
            <Badge variant="outline" className="text-xs">Required</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {document ? (
          <>
            {/* Document Info */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium truncate">{document.fileName}</span>
                <div className="flex items-center gap-1">
                  {getStatusIcon(document.approvalStatus)}
                  {expiryStatus && getExpiryIcon(expiryStatus)}
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{formatFileSize(document.fileSize)}</span>
                <span>v{document.version}</span>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Uploaded {format(parseISO(document.uploadDate), 'MMM dd, yyyy')}</span>
              </div>

              {document.expiryDate && (
                <div className="flex items-center gap-2 text-xs">
                  <Calendar className="h-3 w-3" />
                  <span className={expiryStatus === 'EXPIRED' ? 'text-red-500' : expiryStatus === 'EXPIRING_SOON' ? 'text-amber-500' : 'text-muted-foreground'}>
                    Expires {format(parseISO(document.expiryDate), 'MMM dd, yyyy')}
                  </span>
                </div>
              )}
            </div>

            {/* Status Badges */}
            <div className="flex gap-2">
              <Badge variant={document.approvalStatus === 'APPROVED' ? 'default' : document.approvalStatus === 'REJECTED' ? 'destructive' : 'secondary'}>
                {document.approvalStatus}
              </Badge>
              {expiryStatus && (
                <Badge variant={expiryStatus === 'EXPIRED' ? 'destructive' : expiryStatus === 'EXPIRING_SOON' ? 'secondary' : 'outline'}>
                  {expiryStatus.replace('_', ' ')}
                </Badge>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {onDownload && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => onDownload(document.id)}
                  data-testid={`button-download-${document.id}`}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              )}
              <Button 
                variant="secondary" 
                size="sm" 
                className="flex-1"
                onClick={() => document?.querySelector<HTMLInputElement>(`#file-upload-${documentType}`)?.click()}
                data-testid={`button-update-${documentType.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Upload className="h-3 w-3 mr-1" />
                Update
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Upload State */}
            <div className="text-center py-8">
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-2">No document uploaded</p>
              {isRequired && (
                <p className="text-xs text-amber-600">This document is required</p>
              )}
            </div>

            {isUploading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-center text-muted-foreground">
                  Uploading... {uploadProgress}%
                </p>
              </div>
            )}

            <Button 
              variant="outline" 
              className="w-full"
              disabled={isUploading}
              onClick={() => document?.querySelector<HTMLInputElement>(`#file-upload-${documentType}`)?.click()}
              data-testid={`button-upload-${documentType.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Upload Document'}
            </Button>
          </>
        )}

        {/* Hidden File Input */}
        <input
          id={`file-upload-${documentType}`}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.docx"
          onChange={handleFileSelect}
        />
      </CardContent>
    </Card>
  );
}