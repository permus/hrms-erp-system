import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  details?: string;
}

export default function ErrorModal({ 
  isOpen, 
  onClose, 
  title = "Error", 
  message, 
  details 
}: ErrorModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <AlertDialogContent data-testid="modal-error" className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <AlertDialogTitle data-testid="text-error-title">{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription data-testid="text-error-message" className="text-left">
            {message}
            {details && (
              <div className="mt-3 p-3 bg-muted rounded-md text-sm text-muted-foreground">
                <strong>Details:</strong> {details}
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction 
            onClick={onClose}
            data-testid="button-error-ok"
          >
            OK
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}