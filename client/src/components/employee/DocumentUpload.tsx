import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Image, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface DocumentUploadProps {
  accept?: string;
  maxSize?: number; // in bytes
  multiple?: boolean;
  onUpload: (url: string | string[]) => void;
  currentFile?: string | string[] | null;
  className?: string;
  label?: string;
  description?: string;
  "data-testid"?: string;
}

export default function DocumentUpload({
  accept = ".pdf,.jpg,.jpeg,.png",
  maxSize = 10 * 1024 * 1024, // 10MB default
  multiple = false,
  onUpload,
  currentFile,
  className,
  label,
  description,
  "data-testid": testId
}: DocumentUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    // Validate file size
    for (const file of fileArray) {
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `File "${file.name}" exceeds ${Math.round(maxSize / (1024 * 1024))}MB limit`,
          variant: "destructive"
        });
        return;
      }
    }

    // Validate file type
    const acceptedTypes = accept.split(',').map(type => type.trim());
    for (const file of fileArray) {
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      const mimeType = file.type;
      
      if (!acceptedTypes.some(type => 
        type === fileExtension || 
        type === mimeType || 
        (type.startsWith('image/') && file.type.startsWith('image/'))
      )) {
        toast({
          title: "Invalid file type",
          description: `File "${file.name}" is not a supported format`,
          variant: "destructive"
        });
        return;
      }
    }

    uploadFiles(fileArray);
  };

  const uploadFiles = async (files: File[]) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', 'employee-documents');

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed for ${file.name}`);
        }

        const result = await response.json();
        return result.url;
      });

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const uploadedUrls = await Promise.all(uploadPromises);
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Call onUpload with single URL or array based on multiple prop
      if (multiple) {
        onUpload(uploadedUrls);
      } else {
        onUpload(uploadedUrls[0]);
      }

      toast({
        title: "Upload successful",
        description: `${files.length} file(s) uploaded successfully`,
      });
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

  const handleRemoveFile = (indexToRemove?: number) => {
    if (multiple && Array.isArray(currentFile) && typeof indexToRemove === 'number') {
      const updatedFiles = currentFile.filter((_, index) => index !== indexToRemove);
      onUpload(updatedFiles);
    } else {
      onUpload(multiple ? [] : "");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderCurrentFiles = () => {
    if (!currentFile) return null;

    const files = Array.isArray(currentFile) ? currentFile : [currentFile];
    if (files.length === 0) return null;

    return (
      <div className="space-y-2">
        {files.map((file, index) => (
          <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
            <div className="flex items-center space-x-2">
              {file.includes('image') ? (
                <Image className="w-4 h-4 text-muted-foreground" />
              ) : (
                <FileText className="w-4 h-4 text-muted-foreground" />
              )}
              <span className="text-sm truncate">{file.split('/').pop()}</span>
              <Check className="w-4 h-4 text-green-600" />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveFile(multiple ? index : undefined)}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      {label && <label className="text-sm font-medium">{label}</label>}
      
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
        data-testid={testId}
      >
        <CardContent className="p-6 text-center">
          <div className="space-y-4">
            <div className="flex justify-center">
              <Upload className="w-8 h-8 text-muted-foreground" />
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {isDragging ? "Drop files here" : "Click to upload or drag and drop"}
              </p>
              <p className="text-xs text-muted-foreground">
                {description || `${accept} up to ${formatFileSize(maxSize)}`}
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
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
      />

      {renderCurrentFiles()}
    </div>
  );
}