import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Building2, RotateCcw, Trash2, Calendar, Users, DollarSign } from "lucide-react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import ErrorModal from "@/components/ErrorModal";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Company } from "@shared/schema";

export default function SuperAdminBin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [restoringCompany, setRestoringCompany] = useState<Company | null>(null);
  const [hardDeletingCompany, setHardDeletingCompany] = useState<Company | null>(null);
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    details?: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
    details: undefined,
  });

  // Function to show error modal with user-friendly messages
  const showErrorModal = (error: any, context: string) => {
    let title = "Error";
    let message = "Something went wrong. Please try again.";
    let details = "";

    // Parse status from apiRequest error message format "status: message"
    let status = error.status || error.response?.status;
    let errorMessage = error.message || error.response?.data?.message;

    if (!status && errorMessage && typeof errorMessage === 'string') {
      const statusMatch = errorMessage.match(/^(\d+):\s*(.*)$/);
      if (statusMatch) {
        status = parseInt(statusMatch[1]);
        errorMessage = statusMatch[2];
      }
    }

    if (status === 404) {
      title = "Not Found";
      message = "The company you're trying to manage could not be found.";
      details = "The company may have been permanently deleted already.";
    } else if (status === 403 || status === 401) {
      title = "Access Denied";
      message = "You don't have permission to perform this action.";
      details = "Please contact your system administrator if you believe this is an error.";
    } else {
      title = `${context} Failed`;
      message = "An unexpected error occurred. Please try again.";
      details = errorMessage || "If the problem persists, please contact support.";
    }

    setErrorModal({
      isOpen: true,
      title,
      message,
      details,
    });
  };

  // Fetch deleted companies
  const { data: deletedCompanies = [], isLoading, error } = useQuery<Company[]>({
    queryKey: ["/api/companies/bin"],
    enabled: !!user && (user as any).role === 'SUPER_ADMIN'
  });

  // Restore company mutation
  const restoreCompanyMutation = useMutation({
    mutationFn: async (companyId: string) => {
      const response = await apiRequest('POST', `/api/companies/${companyId}/restore`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Company Restored",
        description: "The company has been successfully restored and is now active.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/companies/bin"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      setRestoringCompany(null);
    },
    onError: (error: any) => {
      showErrorModal(error, "Restore Company");
    }
  });

  // Hard delete company mutation
  const hardDeleteCompanyMutation = useMutation({
    mutationFn: async (companyId: string) => {
      const response = await apiRequest('DELETE', `/api/companies/${companyId}/hard-delete`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Company Permanently Deleted",
        description: "The company has been permanently removed from the database.",
        variant: "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/companies/bin"] });
      setHardDeletingCompany(null);
    },
    onError: (error: any) => {
      showErrorModal(error, "Permanently Delete Company");
    }
  });

  // Handle restore company
  const handleRestoreCompany = async () => {
    if (!restoringCompany) return;
    await restoreCompanyMutation.mutateAsync(restoringCompany.id);
  };

  // Handle hard delete company
  const handleHardDeleteCompany = async () => {
    if (!hardDeletingCompany) return;
    await hardDeleteCompanyMutation.mutateAsync(hardDeletingCompany.id);
  };

  if (!user || (user as any).role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground mt-2">You don't have super admin privileges.</p>
          <p className="text-sm text-muted-foreground mt-1">Currently logged in as: {(user as any)?.firstName} ({(user as any)?.email})</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar 
          userRole={(user as any).role || 'SUPER_ADMIN'} 
          companyName="ERP Platform"
        />
        <main className="flex-1">
          <Header />
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <Trash2 className="w-8 h-8 text-muted-foreground" />
                  Deleted Companies
                </h1>
                <p className="text-muted-foreground mt-2">
                  Manage soft-deleted companies. You can restore them or permanently delete them.
                </p>
              </div>
            </div>

            {error && (
              <Card className="mb-6 border-destructive">
                <CardContent className="p-4">
                  <p className="text-destructive">Error loading deleted companies. Please try again.</p>
                </CardContent>
              </Card>
            )}

            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : deletedCompanies.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Trash2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h2 className="text-xl font-semibold mb-2">No Deleted Companies</h2>
                  <p className="text-muted-foreground">
                    There are no soft-deleted companies in the bin. All companies are currently active.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {deletedCompanies.map((company) => (
                  <Card key={company.id} className="border-l-4 border-l-destructive">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Building2 className="w-6 h-6 text-destructive" />
                          <div>
                            <CardTitle className="text-lg line-through text-muted-foreground">
                              {company.name}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              Slug: {company.slug} • Industry: {company.industry || "Not specified"}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRestoringCompany(company)}
                            data-testid={`button-restore-${company.id}`}
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Restore
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setHardDeletingCompany(company)}
                            data-testid={`button-hard-delete-${company.id}`}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Forever
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>Created: {new Date(company.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span>Employees: {company.employeeCount || "Not specified"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          <span>Monthly Cost: AED {company.monthlyCost || "0.00"}</span>
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-destructive/10 rounded-md">
                        <p className="text-sm text-destructive font-medium">
                          ⚠️ This company is soft-deleted and inactive
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Deleted on: {new Date(company.updatedAt).toLocaleDateString()} at {new Date(company.updatedAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Restore Company Confirmation Dialog */}
      <AlertDialog open={!!restoringCompany} onOpenChange={() => setRestoringCompany(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Company</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore "{restoringCompany?.name}"? This will make the company active again and it will appear in the companies list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-restore">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRestoreCompany}
              disabled={restoreCompanyMutation.isPending}
              data-testid="button-confirm-restore"
            >
              {restoreCompanyMutation.isPending ? 'Restoring...' : 'Restore Company'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hard Delete Company Confirmation Dialog */}
      <AlertDialog open={!!hardDeletingCompany} onOpenChange={() => setHardDeletingCompany(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Permanently Delete Company</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p>
                  Are you sure you want to <strong className="text-destructive">permanently delete</strong> "{hardDeletingCompany?.name}"?
                </p>
                <p className="text-destructive font-medium">
                  ⚠️ This action cannot be undone. All company data will be permanently removed from the database.
                </p>
                <p className="text-sm text-muted-foreground">
                  This includes all employees, departments, and related data associated with this company.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-hard-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleHardDeleteCompany}
              disabled={hardDeleteCompanyMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-confirm-hard-delete"
            >
              {hardDeleteCompanyMutation.isPending ? 'Deleting Forever...' : 'Delete Forever'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Error Modal */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal(prev => ({ ...prev, isOpen: false }))}
        title={errorModal.title}
        message={errorModal.message}
        details={errorModal.details}
      />
    </div>
  );
}