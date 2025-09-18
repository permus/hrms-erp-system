import DocumentUploadCard from '../DocumentUploadCard';

export default function DocumentUploadCardExample() {
  // TODO: remove mock functionality
  const mockDocument = {
    id: 'doc-001',
    documentType: 'Passport',
    category: 'Identity Documents',
    fileName: 'passport_ahmed_almansouri.pdf',
    uploadDate: '2024-01-15T10:30:00Z',
    expiryDate: '2024-06-30',
    status: 'ACTIVE' as const,
    approvalStatus: 'APPROVED' as const,
    version: 1,
    fileSize: 2048576 // 2MB
  };

  const handleUpload = (file: File, documentType: string, category: string) => {
    console.log('Upload file:', file.name, 'Type:', documentType, 'Category:', category);
  };

  const handleDownload = (documentId: string) => {
    console.log('Download document:', documentId);
  };

  const handleDelete = (documentId: string) => {
    console.log('Delete document:', documentId);
  };

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
      {/* With Document */}
      <DocumentUploadCard
        document={mockDocument}
        documentType="Passport"
        category="Identity Documents"
        isRequired={true}
        onUpload={handleUpload}
        onDownload={handleDownload}
        onDelete={handleDelete}
      />

      {/* Without Document */}
      <DocumentUploadCard
        documentType="Emirates ID"
        category="Identity Documents"
        isRequired={true}
        onUpload={handleUpload}
        onDownload={handleDownload}
        onDelete={handleDelete}
      />
    </div>
  );
}