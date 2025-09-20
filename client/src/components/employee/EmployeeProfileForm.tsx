import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Upload, User, Briefcase, CreditCard, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { insertEmployeeSchema, type InsertEmployee } from "@shared/schema";

// Simplified form schema with only required fields
const simplifiedEmployeeSchema = z.object({
  personalInfo: z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    profilePhotoUrl: z.string().optional(),
  }),
  employmentDetails: z.object({
    position: z.string().min(1, "Position/Job Title is required"),
    startDate: z.date(),
    departmentId: z.string().min(1, "Department is required"),
  }),
  contactInfo: z.object({
    uaePhone: z.string().min(1, "Phone number is required"),
  }),
  passportInfo: z.object({
    number: z.string().min(1, "Passport number is required"),
  }),
  compensation: z.object({
    basicSalary: z.coerce.number().min(0, "Basic salary must be positive"),
  }),
});

type SimplifiedEmployeeFormData = z.infer<typeof simplifiedEmployeeSchema>;

interface EmployeeProfileFormProps {
  employee?: any;
  departments: Array<{ id: string; name: string }>;
  employees: Array<{ id: string; personalInfo: any }>;
  onSubmit: (data: InsertEmployee) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function EmployeeProfileForm({
  employee,
  departments,
  employees,
  onSubmit,
  onCancel,
  isLoading = false
}: EmployeeProfileFormProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [manualDateInput, setManualDateInput] = useState("");

  const totalSteps = 5;

  const form = useForm<SimplifiedEmployeeFormData>({
    resolver: zodResolver(simplifiedEmployeeSchema),
    mode: "onChange",
    defaultValues: {
      personalInfo: {
        firstName: "",
        lastName: "",
        profilePhotoUrl: "",
      },
      employmentDetails: {
        position: "",
        startDate: new Date(),
        departmentId: "",
      },
      contactInfo: {
        uaePhone: "",
      },
      passportInfo: {
        number: "",
      },
      compensation: {
        basicSalary: 0,
      },
    }
  });

  const steps = [
    {
      id: 1,
      title: "Profile Photo",
      icon: User,
      description: "Upload employee photo",
      fields: []
    },
    {
      id: 2,
      title: "Personal Information",
      icon: User,
      description: "Basic personal details",
      fields: ["personalInfo.firstName", "personalInfo.lastName"]
    },
    {
      id: 3,
      title: "Employment Details",
      icon: Briefcase,
      description: "Job information",
      fields: ["employmentDetails.position", "employmentDetails.startDate", "employmentDetails.departmentId"]
    },
    {
      id: 4,
      title: "Contact & Documents",
      icon: User,
      description: "Contact and passport details",
      fields: ["contactInfo.uaePhone", "passportInfo.number"]
    },
    {
      id: 5,
      title: "Compensation",
      icon: CreditCard,
      description: "Salary information",
      fields: ["compensation.basicSalary"]
    }
  ];

  // Check if current step is valid
  const isCurrentStepValid = () => {
    const currentStepConfig = steps.find(step => step.id === currentStep);
    if (!currentStepConfig || currentStepConfig.fields.length === 0) return true;

    return currentStepConfig.fields.every(field => {
      try {
        const value = form.getValues(field as any);
        
        // Check if field has a meaningful value
        if (value === undefined || value === null || value === '') {
          return false;
        }

        // For nested fields, check specific errors
        if (field.includes('.')) {
          const [section, fieldName] = field.split('.');
          const sectionErrors = form.formState.errors?.[section as keyof typeof form.formState.errors];
          return !sectionErrors?.[fieldName as keyof typeof sectionErrors];
        }
        
        return !form.formState.errors[field as keyof typeof form.formState.errors];
      } catch (error) {
        return false;
      }
    });
  };

  const handleNext = async () => {
    const currentStepConfig = steps.find(step => step.id === currentStep);
    if (currentStepConfig && currentStepConfig.fields.length > 0) {
      const isValid = await form.trigger(currentStepConfig.fields as any);
      if (!isValid) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields before proceeding.",
          variant: "destructive",
        });
        return;
      }
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setProfilePhoto(result);
        form.setValue("personalInfo.profilePhotoUrl", result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleManualDateChange = (value: string) => {
    setManualDateInput(value);
    
    // Parse DD/MM/YYYY format
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = value.match(dateRegex);
    
    if (match) {
      const [, day, month, year] = match;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      if (!isNaN(date.getTime())) {
        form.setValue("employmentDetails.startDate", date);
      }
    }
  };

  // Transform form data to backend format
  const transformFormDataToBackend = (data: SimplifiedEmployeeFormData): InsertEmployee => {
    return {
      companyId: "",
      employeeCode: "",
      slug: "",
      personalInfo: {
        name: `${data.personalInfo.firstName} ${data.personalInfo.lastName}`,
        preferredName: "",
        fatherName: "",
        motherName: "",
        dob: new Date().toISOString(), // Default to current date
        nationality: "",
        languages: ["English"],
        religion: "",
        maritalStatus: "single",
        profilePhotoUrl: profilePhoto || "",
        age: 25, // Default age
        emergencyContact: {
          name: "",
          relation: "",
          phone: "",
          email: ""
        }
      },
      contactInfo: {
        personalEmail: "",
        companyEmail: "",
        uaePhone: data.contactInfo.uaePhone,
        homeCountryPhone: "",
        uaeAddress: {
          street: "",
          city: "",
          emirate: "",
          poBox: ""
        },
        homeCountryAddress: {
          street: "",
          city: "",
          state: "",
          country: "",
          postalCode: ""
        }
      },
      employmentDetails: {
        position: data.employmentDetails.position,
        departmentId: data.employmentDetails.departmentId,
        reportingManagerId: "",
        startDate: data.employmentDetails.startDate.toISOString(),
        employmentStatus: "probation",
        employmentType: "full-time",
        workLocation: "office",
        probationMonths: 6,
        probationEndDate: new Date(data.employmentDetails.startDate.getTime() + (6 * 30 * 24 * 60 * 60 * 1000)).toISOString(),
        tenure: 0
      },
      compensation: {
        basicSalary: data.compensation.basicSalary,
        housingAllowance: 0,
        transportAllowance: 0,
        otherAllowance: 0,
        totalSalary: data.compensation.basicSalary,
        benefits: {
          medicalInsurance: false,
          lifeInsurance: false
        },
        bankDetails: {
          bankName: "",
          accountNumber: "",
          iban: ""
        },
        endOfServiceGratuity: 0
      },
      emiratesIdInfo: {
        idNumber: "",
        expiryDate: new Date().toISOString(),
        status: "pending_renewal",
        documents: {
          frontUrl: "",
          backUrl: ""
        }
      },
      visaInfo: {
        type: "",
        number: "",
        expiryDate: new Date().toISOString(),
        sponsor: "",
        status: "pending_renewal",
        documents: {
          visaPageUrl: "",
          entryStampUrl: ""
        }
      },
      passportInfo: {
        number: data.passportInfo.number,
        nationality: "",
        expiryDate: new Date().toISOString(),
        placeOfIssue: "",
        documents: {
          biodataPageUrl: "",
          visaPagesUrls: []
        }
      },
      workPermitInfo: {
        number: "",
        expiryDate: new Date().toISOString(),
        restrictions: "",
        documents: {
          workPermitUrl: ""
        }
      },
      laborCardInfo: {
        number: "",
        expiryDate: new Date().toISOString(),
        profession: "",
        documents: {
          laborCardUrl: ""
        }
      }
    };
  };

  const handleSubmit = (data: SimplifiedEmployeeFormData) => {
    const backendData = transformFormDataToBackend(data);
    onSubmit(backendData);
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-semibold">Profile Photo</h2>
              <p className="text-muted-foreground">Upload a professional photo for the employee profile</p>
            </div>

            <div className="flex flex-col items-center space-y-4">
              <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400 relative overflow-hidden">
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <p className="text-sm text-gray-500">Upload Photo</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  data-testid="input-profile-photo"
                />
              </div>
              <p className="text-sm text-muted-foreground">Click to upload a profile photo (optional)</p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-semibold">Personal Information</h2>
              <p className="text-muted-foreground">Enter the employee's basic personal details</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  {...form.register("personalInfo.firstName")}
                  placeholder="Enter first name"
                  data-testid="input-first-name"
                />
                {form.formState.errors.personalInfo?.firstName && (
                  <p className="text-sm text-destructive">{form.formState.errors.personalInfo.firstName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  {...form.register("personalInfo.lastName")}
                  placeholder="Enter last name"
                  data-testid="input-last-name"
                />
                {form.formState.errors.personalInfo?.lastName && (
                  <p className="text-sm text-destructive">{form.formState.errors.personalInfo.lastName.message}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-semibold">Employment Details</h2>
              <p className="text-muted-foreground">Enter job-related information</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="position">Position/Job Title *</Label>
                <Input
                  id="position"
                  {...form.register("employmentDetails.position")}
                  placeholder="e.g., Software Engineer, Marketing Manager"
                  data-testid="input-position"
                />
                {form.formState.errors.employmentDetails?.position && (
                  <p className="text-sm text-destructive">{form.formState.errors.employmentDetails.position.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Select onValueChange={(value) => form.setValue("employmentDetails.departmentId", value)}>
                  <SelectTrigger data-testid="select-department">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.employmentDetails?.departmentId && (
                  <p className="text-sm text-destructive">{form.formState.errors.employmentDetails.departmentId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <div className="space-y-2">
                  <Input
                    id="manualStartDate"
                    value={manualDateInput}
                    onChange={(e) => handleManualDateChange(e.target.value)}
                    placeholder="DD/MM/YYYY"
                    data-testid="input-start-date-manual"
                  />
                  <div className="text-center text-sm text-muted-foreground">or</div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        data-testid="button-start-date"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.watch("employmentDetails.startDate") ? 
                          format(form.watch("employmentDetails.startDate"), "dd/MM/yyyy") : 
                          "Pick start date"
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <div className="p-3 border-b">
                        <div className="flex gap-2">
                          <Select onValueChange={(year) => {
                            const currentDate = form.watch("employmentDetails.startDate") || new Date();
                            const newDate = new Date(currentDate);
                            newDate.setFullYear(parseInt(year));
                            form.setValue("employmentDetails.startDate", newDate);
                          }}>
                            <SelectTrigger className="w-24">
                              <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - 25 + i).map(year => (
                                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select onValueChange={(month) => {
                            const currentDate = form.watch("employmentDetails.startDate") || new Date();
                            const newDate = new Date(currentDate);
                            newDate.setMonth(parseInt(month));
                            form.setValue("employmentDetails.startDate", newDate);
                          }}>
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Month" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 12 }, (_, i) => i).map(month => (
                                <SelectItem key={month} value={month.toString()}>
                                  {new Date(2000, month).toLocaleString('default', { month: 'long' })}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Calendar
                        mode="single"
                        selected={form.watch("employmentDetails.startDate")}
                        onSelect={(date) => {
                          if (date) {
                            form.setValue("employmentDetails.startDate", date);
                            setManualDateInput(format(date, "dd/MM/yyyy"));
                          }
                        }}
                        fromYear={1960}
                        toYear={2030}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                {form.formState.errors.employmentDetails?.startDate && (
                  <p className="text-sm text-destructive">{form.formState.errors.employmentDetails.startDate.message}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-semibold">Contact & Documents</h2>
              <p className="text-muted-foreground">Contact details and essential document information</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="uaePhone">Phone Number *</Label>
                <Input
                  id="uaePhone"
                  {...form.register("contactInfo.uaePhone")}
                  placeholder="+971 50 123 4567"
                  data-testid="input-phone"
                />
                {form.formState.errors.contactInfo?.uaePhone && (
                  <p className="text-sm text-destructive">{form.formState.errors.contactInfo.uaePhone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="passportNumber">Passport Number *</Label>
                <Input
                  id="passportNumber"
                  {...form.register("passportInfo.number")}
                  placeholder="Enter passport number"
                  data-testid="input-passport"
                />
                {form.formState.errors.passportInfo?.number && (
                  <p className="text-sm text-destructive">{form.formState.errors.passportInfo.number.message}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-semibold">Compensation</h2>
              <p className="text-muted-foreground">Salary and compensation details</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="basicSalary">Basic Salary (AED) *</Label>
                <Input
                  id="basicSalary"
                  type="number"
                  {...form.register("compensation.basicSalary", { valueAsNumber: true })}
                  placeholder="Enter basic salary amount"
                  data-testid="input-salary"
                />
                {form.formState.errors.compensation?.basicSalary && (
                  <p className="text-sm text-destructive">{form.formState.errors.compensation.basicSalary.message}</p>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-8">
      <div className="w-full max-w-2xl mx-auto px-4">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">Add New Employee</h1>
            <div className="text-sm text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </div>
          </div>
          
          <div className="w-full bg-secondary rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
          
          <div className="flex justify-between mt-2">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`text-xs text-center ${
                  step.id <= currentStep ? 'text-primary font-medium' : 'text-muted-foreground'
                }`}
              >
                {step.title}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          <Card className="border-2">
            <CardContent className="p-8">
              {renderCurrentStep()}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={currentStep === 1 ? onCancel : handlePrevious}
              data-testid="button-previous"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              {currentStep === 1 ? 'Cancel' : 'Previous'}
            </Button>

            {currentStep < totalSteps ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!isCurrentStepValid()}
                data-testid="button-next"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isLoading || !form.formState.isValid}
                data-testid="button-submit"
              >
                {isLoading ? 'Creating Employee...' : 'Create Employee'}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}