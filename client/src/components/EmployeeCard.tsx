import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Phone, Mail, AlertTriangle, Calendar } from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";

interface EmployeeCardProps {
  employee: {
    id: string;
    employeeCode: string;
    personalInfo: {
      name: string;
      nationality: string;
      dob: string;
    };
    contactInfo: {
      email: string;
      uaePhone: string;
      uaeAddress: string;
    };
    employmentDetails: {
      position: string;
      department: string;
      startDate: string;
      employmentStatus: 'PROBATION' | 'CONFIRMED' | 'TERMINATED';
    };
    probationInfo?: {
      endDate: string;
      status: 'ACTIVE' | 'COMPLETED' | 'EXTENDED';
    };
    visaInfo?: {
      expiryDate: string;
      visaType: string;
    };
    emiratesIdInfo?: {
      expiryDate: string;
    };
    profileImageUrl?: string;
  };
  onViewDetails: (id: string) => void;
  onEditEmployee: (id: string) => void;
}

export default function EmployeeCard({ employee, onViewDetails, onEditEmployee }: EmployeeCardProps) {
  // Calculate if documents are expiring soon (within 30 days)
  const checkExpiryWarning = (expiryDate: string) => {
    const daysUntilExpiry = differenceInDays(parseISO(expiryDate), new Date());
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  };

  const visaWarning = employee.visaInfo?.expiryDate ? checkExpiryWarning(employee.visaInfo.expiryDate) : false;
  const emiratesIdWarning = employee.emiratesIdInfo?.expiryDate ? checkExpiryWarning(employee.emiratesIdInfo.expiryDate) : false;
  const hasWarnings = visaWarning || emiratesIdWarning;

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'default';
      case 'PROBATION': return 'secondary';
      case 'TERMINATED': return 'destructive';
      default: return 'outline';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Card className="hover-elevate transition-all duration-200" data-testid={`employee-card-${employee.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={employee.profileImageUrl} alt={employee.personalInfo.name} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(employee.personalInfo.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-foreground" data-testid={`employee-name-${employee.id}`}>
                {employee.personalInfo.name}
              </h3>
              <p className="text-sm text-muted-foreground font-mono">
                ID: {employee.employeeCode}
              </p>
            </div>
          </div>
          {hasWarnings && (
            <AlertTriangle className="h-5 w-5 text-destructive" data-testid={`warning-icon-${employee.id}`} />
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Employment Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{employee.employmentDetails.position}</span>
            <Badge variant={getStatusBadgeVariant(employee.employmentDetails.employmentStatus)}>
              {employee.employmentDetails.employmentStatus}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{employee.employmentDetails.department}</p>
        </div>

        {/* Contact Info */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-3 w-3" />
            <span>{employee.contactInfo.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-3 w-3" />
            <span>{employee.contactInfo.uaePhone}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{employee.contactInfo.uaeAddress}</span>
          </div>
        </div>

        {/* Probation Status */}
        {employee.employmentDetails.employmentStatus === 'PROBATION' && employee.probationInfo && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-3 w-3 text-amber-500" />
            <span className="text-muted-foreground">
              Probation ends: {format(parseISO(employee.probationInfo.endDate), 'MMM dd, yyyy')}
            </span>
          </div>
        )}

        {/* Document Warnings */}
        {hasWarnings && (
          <div className="space-y-1 p-2 bg-destructive/10 rounded-md">
            {visaWarning && (
              <p className="text-xs text-destructive">
                Visa expires: {format(parseISO(employee.visaInfo!.expiryDate), 'MMM dd, yyyy')}
              </p>
            )}
            {emiratesIdWarning && (
              <p className="text-xs text-destructive">
                Emirates ID expires: {format(parseISO(employee.emiratesIdInfo!.expiryDate), 'MMM dd, yyyy')}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1" 
            onClick={() => onViewDetails(employee.id)}
            data-testid={`button-view-${employee.id}`}
          >
            View Details
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            className="flex-1" 
            onClick={() => onEditEmployee(employee.id)}
            data-testid={`button-edit-${employee.id}`}
          >
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}