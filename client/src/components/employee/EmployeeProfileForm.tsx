import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { CalendarIcon, Upload, User, Briefcase, CreditCard, ChevronLeft, ChevronRight, FileText, Users, Phone, Globe, ChevronsUpDown, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import DocumentUpload from "./DocumentUpload";
import { insertEmployeeSchema, type InsertEmployee } from "@shared/schema";

// List of countries for nationality dropdown
const countries = [
  "Afghanistan", "Albania", "Algeria", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahrain", "Bangladesh", "Belarus", "Belgium", "Brazil", "Bulgaria", "Cambodia", "Canada",
  "Chile", "China", "Colombia", "Croatia", "Czech Republic", "Denmark", "Egypt", "Estonia",
  "Ethiopia", "Finland", "France", "Georgia", "Germany", "Ghana", "Greece", "Hungary",
  "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Japan",
  "Jordan", "Kazakhstan", "Kenya", "Kuwait", "Latvia", "Lebanon", "Libya", "Lithuania",
  "Luxembourg", "Malaysia", "Maldives", "Mexico", "Morocco", "Nepal", "Netherlands",
  "New Zealand", "Nigeria", "Norway", "Oman", "Pakistan", "Palestine", "Philippines",
  "Poland", "Portugal", "Qatar", "Romania", "Russia", "Saudi Arabia", "Singapore",
  "Slovakia", "Slovenia", "South Africa", "South Korea", "Spain", "Sri Lanka", "Sudan",
  "Sweden", "Switzerland", "Syria", "Thailand", "Tunisia", "Turkey", "Ukraine",
  "United Arab Emirates", "United Kingdom", "United States", "Vietnam", "Yemen"
].sort();

// Enhanced form schema with only required fields: firstName, lastName, uaePhone
const enhancedEmployeeSchema = z.object({
  personalInfo: z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    fatherName: z.string().optional(),
    motherName: z.string().optional(),
    dob: z.string().optional(), // Changed to string for manual input
    nationality: z.string().optional(),
    religion: z.string().optional(),
    maritalStatus: z.enum(["single", "married", "divorced", "widowed"]).optional(),
    profilePhotoUrl: z.string().optional(),
  }),
  contactInfo: z.object({
    personalEmail: z.string().email("Invalid email format").optional(),
    companyEmail: z.string().email("Invalid email format").optional(),
    uaePhone: z.string().regex(/^(\+971|971)[0-9]{8,9}$/, "UAE phone must be in format +971XXXXXXXX or 971XXXXXXXX"),
    homeCountryPhone: z.string().optional(),
    uaeAddress: z.string().optional(),
    homeCountryAddress: z.string().optional(),
  }),
  employmentDetails: z.object({
    position: z.string().min(1, "Position/Job Title is required"),
    startDate: z.date({ required_error: "Start date is required" }),
    departmentId: z.string().min(1, "Department is required"),
    reportingManagerId: z.string().optional(),
    employmentStatus: z.enum(["probation", "confirmed", "permanent"], {
      required_error: "Employment status is required"
    }),
    probationMonths: z.coerce.number().min(1).max(12, "Probation period must be between 1-12 months"),
    probationEndDate: z.date().optional(),
    contractType: z.enum(["permanent", "fixed-term", "temporary"], {
      required_error: "Contract type is required"
    }),
    workLocation: z.enum(["office", "remote", "hybrid"], {
      required_error: "Work location is required"
    }),
  }),
  documents: z.object({
    passportInfo: z.object({
      number: z.string().min(1, "Passport number is required"),
      nationality: z.string().min(1, "Passport nationality is required"),
      expiryDate: z.date({ required_error: "Passport expiry date is required" }),
      placeOfIssue: z.string().min(1, "Place of issue is required"),
      documentUrl: z.string().optional(),
    }),
    visaInfo: z.object({
      type: z.string().min(1, "Visa type is required"),
      number: z.string().min(1, "Visa number is required"),
      expiryDate: z.date({ required_error: "Visa expiry date is required" }),
      sponsor: z.string().min(1, "Sponsor is required"),
      documentUrl: z.string().optional(),
    }),
    emiratesIdInfo: z.object({
      idNumber: z.string().min(15, "Emirates ID must be 15 digits").max(15),
      expiryDate: z.date({ required_error: "Emirates ID expiry date is required" }),
      documentUrl: z.string().optional(),
    }),
    workPermitInfo: z.object({
      number: z.string().min(1, "Work permit number is required"),
      expiryDate: z.date({ required_error: "Work permit expiry date is required" }),
      restrictions: z.string().optional(),
      documentUrl: z.string().optional(),
    }),
    laborCardInfo: z.object({
      number: z.string().min(1, "Labor card number is required"),
      expiryDate: z.date({ required_error: "Labor card expiry date is required" }),
      profession: z.string().min(1, "Profession is required"),
      documentUrl: z.string().optional(),
    }),
  }),
  compensation: z.object({
    basicSalary: z.coerce.number().min(1, "Basic salary must be positive"),
    housingAllowance: z.coerce.number().min(0, "Housing allowance must be positive"),
    transportAllowance: z.coerce.number().min(0, "Transport allowance must be positive"),
    otherAllowance: z.coerce.number().min(0, "Other allowance must be positive"),
    totalSalary: z.coerce.number().min(0),
    annualFlightAllowance: z.boolean(),
    medicalInsurance: z.enum(["basic", "comprehensive", "family"], {
      required_error: "Medical insurance is required"
    }),
    bankDetails: z.object({
      bankName: z.string().min(1, "Bank name is required"),
      accountNumber: z.string().min(8, "Account number must be at least 8 digits"),
      iban: z.string().regex(/^AE[0-9]{21}$/, "IBAN must be in UAE format (AE + 21 digits)"),
    }),
  }),
});

type EnhancedEmployeeFormData = z.infer<typeof enhancedEmployeeSchema>;

interface EmployeeProfileFormProps {
  employee?: any;
  departments: Array<{ id: string; name: string }>;
  employees: Array<{ id: string; personalInfo?: any }>;
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
  const [employeeId, setEmployeeId] = useState("");
  const [documentUploads, setDocumentUploads] = useState<{[key: string]: string}>({});

  const totalSteps = 5;

  // Auto-generate Employee ID on component mount
  useEffect(() => {
    const generateEmployeeId = () => {
      const year = new Date().getFullYear();
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `EMP-${year}-${randomNum}`;
    };
    setEmployeeId(generateEmployeeId());
  }, []);

  const form = useForm<EnhancedEmployeeFormData>({
    resolver: zodResolver(enhancedEmployeeSchema),
    mode: "onChange",
    defaultValues: {
      personalInfo: {
        firstName: "",
        lastName: "",
        fatherName: "",
        motherName: "",
        dob: "",
        nationality: "",
        religion: "",
        maritalStatus: "single",
        profilePhotoUrl: "",
      },
      contactInfo: {
        personalEmail: "",
        companyEmail: "",
        uaePhone: "",
        homeCountryPhone: "",
        uaeAddress: "",
        homeCountryAddress: "",
      },
      employmentDetails: {
        position: "",
        startDate: new Date(),
        departmentId: "",
        reportingManagerId: "",
        employmentStatus: "probation",
        probationMonths: 6,
        probationEndDate: new Date(),
        contractType: "permanent",
        workLocation: "office",
      },
      documents: {
        passportInfo: {
          number: "",
          nationality: "",
          expiryDate: new Date(),
          placeOfIssue: "",
          documentUrl: "",
        },
        visaInfo: {
          type: "",
          number: "",
          expiryDate: new Date(),
          sponsor: "",
          documentUrl: "",
        },
        emiratesIdInfo: {
          idNumber: "",
          expiryDate: new Date(),
          documentUrl: "",
        },
        workPermitInfo: {
          number: "",
          expiryDate: new Date(),
          restrictions: "",
          documentUrl: "",
        },
        laborCardInfo: {
          number: "",
          expiryDate: new Date(),
          profession: "",
          documentUrl: "",
        },
      },
      compensation: {
        basicSalary: 0,
        housingAllowance: 0,
        transportAllowance: 0,
        otherAllowance: 0,
        totalSalary: 0,
        annualFlightAllowance: false,
        medicalInsurance: "basic",
        bankDetails: {
          bankName: "",
          accountNumber: "",
          iban: "",
        },
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
      title: "Personal & Contact",
      icon: Users,
      description: "Personal details and contact information",
      fields: [
        "personalInfo.firstName", "personalInfo.lastName", "personalInfo.fatherName", 
        "personalInfo.motherName", "personalInfo.dob", "personalInfo.nationality", 
        "personalInfo.religion", "personalInfo.maritalStatus",
        "contactInfo.personalEmail", "contactInfo.uaePhone", "contactInfo.homeCountryPhone",
        "contactInfo.uaeAddress", "contactInfo.homeCountryAddress"
      ]
    },
    {
      id: 3,
      title: "Employment Details",
      icon: Briefcase,
      description: "Job information and employment terms",
      fields: [
        "employmentDetails.position", "employmentDetails.startDate", "employmentDetails.departmentId",
        "employmentDetails.employmentStatus", "employmentDetails.probationMonths",
        "employmentDetails.contractType", "employmentDetails.workLocation"
      ]
    },
    {
      id: 4,
      title: "Documents",
      icon: FileText,
      description: "Upload UAE compliance documents",
      fields: [
        "documents.passportInfo.number", "documents.visaInfo.number", "documents.emiratesIdInfo.idNumber",
        "documents.workPermitInfo.number", "documents.laborCardInfo.number"
      ]
    },
    {
      id: 5,
      title: "Compensation",
      icon: CreditCard,
      description: "Salary and benefits information",
      fields: [
        "compensation.basicSalary", "compensation.medicalInsurance", 
        "compensation.bankDetails.bankName", "compensation.bankDetails.accountNumber", 
        "compensation.bankDetails.iban"
      ]
    }
  ];

  // Watch form values for reactive validation and auto-calculations
  const watchedValues = form.watch();
  const watchedSalaryComponents = form.watch([
    "compensation.basicSalary",
    "compensation.housingAllowance", 
    "compensation.transportAllowance",
    "compensation.otherAllowance"
  ]);
  const watchedEmploymentFields = form.watch([
    "employmentDetails.startDate",
    "employmentDetails.probationMonths"
  ]);

  // Auto-calculate total salary when components change
  useEffect(() => {
    const [basicSalary, housingAllowance, transportAllowance, otherAllowance] = watchedSalaryComponents;
    const total = (basicSalary || 0) + (housingAllowance || 0) + (transportAllowance || 0) + (otherAllowance || 0);
    form.setValue("compensation.totalSalary", total);
  }, [watchedSalaryComponents]);

  // Auto-calculate probation end date when start date or probation months change
  useEffect(() => {
    const [startDate, probationMonths] = watchedEmploymentFields;
    if (startDate && probationMonths) {
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + probationMonths);
      form.setValue("employmentDetails.probationEndDate", endDate);
    }
  }, [watchedEmploymentFields]);

  // Check if current step is valid
  const isCurrentStepValid = () => {
    const currentStepConfig = steps.find(step => step.id === currentStep);
    if (!currentStepConfig || currentStepConfig.fields.length === 0) return true;

    return currentStepConfig.fields.every(field => {
      try {
        // Get the current value from watched values
        const value = getNestedValue(watchedValues, field);
        
        // Check if field has a meaningful value
        if (value === undefined || value === null || value === '') {
          return false;
        }

        return true;
      } catch (error) {
        return false;
      }
    });
  };

  // Helper function to get nested values
  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
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

  const handleDocumentUpload = (documentType: string, url: string) => {
    setDocumentUploads(prev => ({ ...prev, [documentType]: url }));
    // Update the form field based on document type
    if (documentType === 'passport') {
      form.setValue("documents.passportInfo.documentUrl", url);
    } else if (documentType === 'visa') {
      form.setValue("documents.visaInfo.documentUrl", url);
    } else if (documentType === 'emirates-id') {
      form.setValue("documents.emiratesIdInfo.documentUrl", url);
    } else if (documentType === 'work-permit') {
      form.setValue("documents.workPermitInfo.documentUrl", url);
    } else if (documentType === 'labor-card') {
      form.setValue("documents.laborCardInfo.documentUrl", url);
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
  const transformFormDataToBackend = (data: EnhancedEmployeeFormData): InsertEmployee => {
    return {
      companyId: "",
      employeeCode: employeeId,
      slug: "",
      personalInfo: {
        name: `${data.personalInfo.firstName} ${data.personalInfo.lastName}`,
        preferredName: "",
        fatherName: data.personalInfo.fatherName || "",
        motherName: data.personalInfo.motherName || "",
        dob: data.personalInfo.dob?.toISOString() || new Date().toISOString(),
        nationality: data.personalInfo.nationality || "",
        languages: ["English"],
        religion: data.personalInfo.religion || "",
        maritalStatus: data.personalInfo.maritalStatus || "single",
        profilePhotoUrl: profilePhoto || "",
        age: data.personalInfo.dob ? new Date().getFullYear() - data.personalInfo.dob.getFullYear() : 0,
        emergencyContact: {
          name: "",
          relation: "",
          phone: "",
          email: ""
        }
      },
      contactInfo: {
        personalEmail: data.contactInfo.personalEmail || "",
        companyEmail: data.contactInfo.companyEmail || "",
        uaePhone: data.contactInfo.uaePhone || "",
        homeCountryPhone: data.contactInfo.homeCountryPhone || "",
        uaeAddress: {
          street: data.contactInfo.uaeAddress || "",
          city: "",
          emirate: "",
          poBox: ""
        },
        homeCountryAddress: {
          street: data.contactInfo.homeCountryAddress || "",
          city: "",
          state: "",
          country: "",
          postalCode: ""
        }
      },
      employmentDetails: {
        position: data.employmentDetails.position || "",
        departmentId: data.employmentDetails.departmentId || "",
        reportingManagerId: data.employmentDetails.reportingManagerId || "",
        startDate: data.employmentDetails.startDate?.toISOString() || new Date().toISOString(),
        employmentStatus: data.employmentDetails.employmentStatus || "probation",
        employmentType: "full-time",
        workLocation: data.employmentDetails.workLocation || "office",
        probationMonths: data.employmentDetails.probationMonths || 6,
        probationEndDate: data.employmentDetails.probationEndDate?.toISOString() || new Date().toISOString(),
        tenure: 0
      },
      compensation: {
        basicSalary: data.compensation.basicSalary || 0,
        housingAllowance: data.compensation.housingAllowance || 0,
        transportAllowance: data.compensation.transportAllowance || 0,
        otherAllowance: data.compensation.otherAllowance || 0,
        totalSalary: data.compensation.totalSalary || 0,
        benefits: {
          medicalInsurance: data.compensation.medicalInsurance === "basic" || data.compensation.medicalInsurance === "comprehensive" || data.compensation.medicalInsurance === "family",
          lifeInsurance: false,
          annualFlightAllowance: data.compensation.annualFlightAllowance || false
        },
        bankDetails: {
          bankName: data.compensation.bankDetails?.bankName || "",
          accountNumber: data.compensation.bankDetails?.accountNumber || "",
          iban: data.compensation.bankDetails?.iban || ""
        },
        endOfServiceGratuity: 0
      },
      emiratesIdInfo: {
        idNumber: data.documents.emiratesIdInfo?.idNumber || "",
        expiryDate: data.documents.emiratesIdInfo?.expiryDate?.toISOString() || new Date().toISOString(),
        status: "pending_renewal",
        documents: {
          frontUrl: data.documents.emiratesIdInfo?.documentUrl || "",
          backUrl: ""
        }
      },
      visaInfo: {
        type: data.documents.visaInfo?.type || "",
        number: data.documents.visaInfo?.number || "",
        expiryDate: data.documents.visaInfo?.expiryDate?.toISOString() || new Date().toISOString(),
        sponsor: data.documents.visaInfo?.sponsor || "",
        status: "pending_renewal",
        documents: {
          visaPageUrl: data.documents.visaInfo?.documentUrl || "",
          entryStampUrl: ""
        }
      },
      passportInfo: {
        number: data.documents.passportInfo?.number || "",
        nationality: data.documents.passportInfo?.nationality || "",
        expiryDate: data.documents.passportInfo?.expiryDate?.toISOString() || new Date().toISOString(),
        placeOfIssue: data.documents.passportInfo?.placeOfIssue || "",
        documents: {
          biodataPageUrl: data.documents.passportInfo?.documentUrl || "",
          visaPagesUrls: []
        }
      },
      workPermitInfo: {
        number: data.documents.workPermitInfo?.number || "",
        expiryDate: data.documents.workPermitInfo?.expiryDate?.toISOString() || new Date().toISOString(),
        restrictions: data.documents.workPermitInfo?.restrictions || "",
        documents: {
          workPermitUrl: data.documents.workPermitInfo?.documentUrl || ""
        }
      },
      laborCardInfo: {
        number: data.documents.laborCardInfo?.number || "",
        expiryDate: data.documents.laborCardInfo?.expiryDate?.toISOString() || new Date().toISOString(),
        profession: data.documents.laborCardInfo?.profession || "",
        documents: {
          laborCardUrl: data.documents.laborCardInfo?.documentUrl || ""
        }
      }
    };
  };

  const handleSubmit = (data: EnhancedEmployeeFormData) => {
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
              <h2 className="text-2xl font-semibold">Personal & Contact Information</h2>
              <p className="text-muted-foreground">Complete personal details and contact information</p>
            </div>

            <div className="space-y-6">
              {/* Personal Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Personal Details</h3>
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

                  <div className="space-y-2">
                    <Label htmlFor="fatherName">Father's Name</Label>
                    <Input
                      id="fatherName"
                      {...form.register("personalInfo.fatherName")}
                      placeholder="Enter father's name (optional)"
                      data-testid="input-father-name"
                    />
                    {form.formState.errors.personalInfo?.fatherName && (
                      <p className="text-sm text-destructive">{form.formState.errors.personalInfo.fatherName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="motherName">Mother's Name</Label>
                    <Input
                      id="motherName"
                      {...form.register("personalInfo.motherName")}
                      placeholder="Enter mother's name (optional)"
                      data-testid="input-mother-name"
                    />
                    {form.formState.errors.personalInfo?.motherName && (
                      <p className="text-sm text-destructive">{form.formState.errors.personalInfo.motherName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input
                      id="dob"
                      {...form.register("personalInfo.dob")}
                      placeholder="DD/MM/YYYY (optional)"
                      data-testid="input-dob"
                    />
                    {form.formState.errors.personalInfo?.dob && (
                      <p className="text-sm text-destructive">{form.formState.errors.personalInfo.dob.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nationality">Nationality</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between"
                          data-testid="select-nationality"
                        >
                          {form.watch("personalInfo.nationality") || "Select nationality (optional)"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search nationality..." />
                          <CommandList>
                            <CommandEmpty>No nationality found.</CommandEmpty>
                            <CommandGroup>
                              {countries.map((country) => (
                                <CommandItem
                                  key={country}
                                  value={country}
                                  onSelect={() => {
                                    form.setValue("personalInfo.nationality", country);
                                  }}
                                >
                                  {country}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {form.formState.errors.personalInfo?.nationality && (
                      <p className="text-sm text-destructive">{form.formState.errors.personalInfo.nationality.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="religion">Religion</Label>
                    <Input
                      id="religion"
                      {...form.register("personalInfo.religion")}
                      placeholder="Enter religion (optional)"
                      data-testid="input-religion"
                    />
                    {form.formState.errors.personalInfo?.religion && (
                      <p className="text-sm text-destructive">{form.formState.errors.personalInfo.religion.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maritalStatus">Marital Status</Label>
                    <Select onValueChange={(value) => form.setValue("personalInfo.maritalStatus", value as any)}>
                      <SelectTrigger data-testid="select-marital-status">
                        <SelectValue placeholder="Select marital status (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="divorced">Divorced</SelectItem>
                        <SelectItem value="widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.personalInfo?.maritalStatus && (
                      <p className="text-sm text-destructive">{form.formState.errors.personalInfo.maritalStatus.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="personalEmail">Personal Email</Label>
                    <Input
                      id="personalEmail"
                      type="email"
                      {...form.register("contactInfo.personalEmail")}
                      placeholder="personal@example.com (optional)"
                      data-testid="input-personal-email"
                    />
                    {form.formState.errors.contactInfo?.personalEmail && (
                      <p className="text-sm text-destructive">{form.formState.errors.contactInfo.personalEmail.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyEmail">Company Email</Label>
                    <Input
                      id="companyEmail"
                      type="email"
                      {...form.register("contactInfo.companyEmail")}
                      placeholder="employee@company.com (optional)"
                      data-testid="input-company-email"
                    />
                    {form.formState.errors.contactInfo?.companyEmail && (
                      <p className="text-sm text-destructive">{form.formState.errors.contactInfo.companyEmail.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="uaePhone">UAE Phone Number *</Label>
                    <Input
                      id="uaePhone"
                      {...form.register("contactInfo.uaePhone")}
                      placeholder="+971501234567"
                      data-testid="input-uae-phone"
                    />
                    {form.formState.errors.contactInfo?.uaePhone && (
                      <p className="text-sm text-destructive">{form.formState.errors.contactInfo.uaePhone.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="homeCountryPhone">Home Country Phone</Label>
                    <Input
                      id="homeCountryPhone"
                      {...form.register("contactInfo.homeCountryPhone")}
                      placeholder="Enter home country phone (optional)"
                      data-testid="input-home-phone"
                    />
                    {form.formState.errors.contactInfo?.homeCountryPhone && (
                      <p className="text-sm text-destructive">{form.formState.errors.contactInfo.homeCountryPhone.message}</p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="uaeAddress">UAE Address</Label>
                    <Textarea
                      id="uaeAddress"
                      {...form.register("contactInfo.uaeAddress")}
                      placeholder="Enter complete UAE address (optional)"
                      rows={3}
                      data-testid="textarea-uae-address"
                    />
                    {form.formState.errors.contactInfo?.uaeAddress && (
                      <p className="text-sm text-destructive">{form.formState.errors.contactInfo.uaeAddress.message}</p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="homeCountryAddress">Home Country Address</Label>
                    <Textarea
                      id="homeCountryAddress"
                      {...form.register("contactInfo.homeCountryAddress")}
                      placeholder="Enter complete home country address (optional)"
                      rows={3}
                      data-testid="textarea-home-address"
                    />
                    {form.formState.errors.contactInfo?.homeCountryAddress && (
                      <p className="text-sm text-destructive">{form.formState.errors.contactInfo.homeCountryAddress.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-semibold">Employment Details</h2>
              <p className="text-muted-foreground">Complete employment information and terms</p>
            </div>

            <div className="space-y-6">
              {/* Employee ID Display */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="employeeId">Employee ID</Label>
                  <Input
                    id="employeeId"
                    value={employeeId}
                    disabled
                    className="font-mono bg-background"
                    data-testid="input-employee-id"
                  />
                  <p className="text-xs text-muted-foreground">Auto-generated employee identifier</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <Label htmlFor="reportingManager">Reporting Manager</Label>
                  <Select onValueChange={(value) => form.setValue("employmentDetails.reportingManagerId", value)}>
                    <SelectTrigger data-testid="select-reporting-manager">
                      <SelectValue placeholder="Select reporting manager" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.personalInfo?.name || "Unknown Employee"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.employmentDetails?.reportingManagerId && (
                    <p className="text-sm text-destructive">{form.formState.errors.employmentDetails.reportingManagerId.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employmentStatus">Employment Status *</Label>
                  <Select onValueChange={(value) => form.setValue("employmentDetails.employmentStatus", value as any)}>
                    <SelectTrigger data-testid="select-employment-status">
                      <SelectValue placeholder="Select employment status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="probation">Probation</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="permanent">Permanent</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.employmentDetails?.employmentStatus && (
                    <p className="text-sm text-destructive">{form.formState.errors.employmentDetails.employmentStatus.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="probationMonths">Probation Period (Months) *</Label>
                  <Input
                    id="probationMonths"
                    type="number"
                    min="1"
                    max="12"
                    {...form.register("employmentDetails.probationMonths", { valueAsNumber: true })}
                    placeholder="6"
                    data-testid="input-probation-months"
                  />
                  {form.formState.errors.employmentDetails?.probationMonths && (
                    <p className="text-sm text-destructive">{form.formState.errors.employmentDetails.probationMonths.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="probationEndDate">Probation End Date</Label>
                  <Input
                    id="probationEndDate"
                    value={(() => {
                      const endDate = form.watch("employmentDetails.probationEndDate");
                      return endDate ? format(endDate, "dd/MM/yyyy") : "Auto-calculated";
                    })()}
                    disabled
                    className="bg-muted font-medium"
                    data-testid="input-probation-end-date"
                  />
                  <p className="text-xs text-muted-foreground">Automatically calculated based on start date and probation period</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contractType">Contract Type *</Label>
                  <Select onValueChange={(value) => form.setValue("employmentDetails.contractType", value as any)}>
                    <SelectTrigger data-testid="select-contract-type">
                      <SelectValue placeholder="Select contract type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="permanent">Permanent</SelectItem>
                      <SelectItem value="fixed-term">Fixed-term</SelectItem>
                      <SelectItem value="temporary">Temporary</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.employmentDetails?.contractType && (
                    <p className="text-sm text-destructive">{form.formState.errors.employmentDetails.contractType.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workLocation">Work Location *</Label>
                  <Select onValueChange={(value) => form.setValue("employmentDetails.workLocation", value as any)}>
                    <SelectTrigger data-testid="select-work-location">
                      <SelectValue placeholder="Select work location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="office">Office</SelectItem>
                      <SelectItem value="remote">Remote</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.employmentDetails?.workLocation && (
                    <p className="text-sm text-destructive">{form.formState.errors.employmentDetails.workLocation.message}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
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
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-semibold">Documents</h2>
              <p className="text-muted-foreground">Upload UAE compliance documents and legal information</p>
            </div>

            <div className="space-y-6">
              {/* Passport Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Passport Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="passportNumber">Passport Number *</Label>
                    <Input
                      id="passportNumber"
                      {...form.register("documents.passportInfo.number")}
                      placeholder="Enter passport number"
                      data-testid="input-passport-number"
                    />
                    {form.formState.errors.documents?.passportInfo?.number && (
                      <p className="text-sm text-destructive">{form.formState.errors.documents.passportInfo.number.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passportNationality">Passport Nationality *</Label>
                    <Input
                      id="passportNationality"
                      {...form.register("documents.passportInfo.nationality")}
                      placeholder="Enter passport nationality"
                      data-testid="input-passport-nationality"
                    />
                    {form.formState.errors.documents?.passportInfo?.nationality && (
                      <p className="text-sm text-destructive">{form.formState.errors.documents.passportInfo.nationality.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passportExpiry">Passport Expiry Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                          data-testid="button-passport-expiry"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {form.watch("documents.passportInfo.expiryDate") ? 
                            format(form.watch("documents.passportInfo.expiryDate"), "dd/MM/yyyy") : 
                            "Pick expiry date"
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={form.watch("documents.passportInfo.expiryDate")}
                          onSelect={(date) => {
                            if (date) {
                              form.setValue("documents.passportInfo.expiryDate", date);
                            }
                          }}
                          fromYear={2024}
                          toYear={2050}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {form.formState.errors.documents?.passportInfo?.expiryDate && (
                      <p className="text-sm text-destructive">{form.formState.errors.documents.passportInfo.expiryDate.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passportPlaceOfIssue">Place of Issue *</Label>
                    <Input
                      id="passportPlaceOfIssue"
                      {...form.register("documents.passportInfo.placeOfIssue")}
                      placeholder="Enter place of issue"
                      data-testid="input-passport-place-issue"
                    />
                    {form.formState.errors.documents?.passportInfo?.placeOfIssue && (
                      <p className="text-sm text-destructive">{form.formState.errors.documents.passportInfo.placeOfIssue.message}</p>
                    )}
                  </div>
                </div>
                <DocumentUpload
                  label="Passport Copy"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onUpload={(url) => handleDocumentUpload('passport', url as string)}
                  data-testid="upload-passport"
                />
              </div>

              {/* Visa Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Visa Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="visaType">Visa Type *</Label>
                    <Input
                      id="visaType"
                      {...form.register("documents.visaInfo.type")}
                      placeholder="e.g., Employment Visa"
                      data-testid="input-visa-type"
                    />
                    {form.formState.errors.documents?.visaInfo?.type && (
                      <p className="text-sm text-destructive">{(form.formState.errors.documents.visaInfo.type as any)?.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="visaNumber">Visa Number *</Label>
                    <Input
                      id="visaNumber"
                      {...form.register("documents.visaInfo.number")}
                      placeholder="Enter visa number"
                      data-testid="input-visa-number"
                    />
                    {form.formState.errors.documents?.visaInfo?.number && (
                      <p className="text-sm text-destructive">{form.formState.errors.documents.visaInfo.number.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="visaExpiry">Visa Expiry Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                          data-testid="button-visa-expiry"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {form.watch("documents.visaInfo.expiryDate") ? 
                            format(form.watch("documents.visaInfo.expiryDate"), "dd/MM/yyyy") : 
                            "Pick expiry date"
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={form.watch("documents.visaInfo.expiryDate")}
                          onSelect={(date) => {
                            if (date) {
                              form.setValue("documents.visaInfo.expiryDate", date);
                            }
                          }}
                          fromYear={2024}
                          toYear={2050}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {form.formState.errors.documents?.visaInfo?.expiryDate && (
                      <p className="text-sm text-destructive">{form.formState.errors.documents.visaInfo.expiryDate.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="visaSponsor">Sponsor *</Label>
                    <Input
                      id="visaSponsor"
                      {...form.register("documents.visaInfo.sponsor")}
                      placeholder="Enter sponsor name"
                      data-testid="input-visa-sponsor"
                    />
                    {form.formState.errors.documents?.visaInfo?.sponsor && (
                      <p className="text-sm text-destructive">{form.formState.errors.documents.visaInfo.sponsor.message}</p>
                    )}
                  </div>
                </div>
                <DocumentUpload
                  label="Visa Copy"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onUpload={(url) => handleDocumentUpload('visa', url as string)}
                  data-testid="upload-visa"
                />
              </div>

              {/* Emirates ID Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Emirates ID Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="emiratesIdNumber">Emirates ID Number *</Label>
                    <Input
                      id="emiratesIdNumber"
                      {...form.register("documents.emiratesIdInfo.idNumber")}
                      placeholder="784-XXXX-XXXXXXX-X"
                      data-testid="input-emirates-id-number"
                    />
                    {form.formState.errors.documents?.emiratesIdInfo?.idNumber && (
                      <p className="text-sm text-destructive">{form.formState.errors.documents.emiratesIdInfo.idNumber.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emiratesIdExpiry">Emirates ID Expiry Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                          data-testid="button-emirates-id-expiry"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {form.watch("documents.emiratesIdInfo.expiryDate") ? 
                            format(form.watch("documents.emiratesIdInfo.expiryDate"), "dd/MM/yyyy") : 
                            "Pick expiry date"
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={form.watch("documents.emiratesIdInfo.expiryDate")}
                          onSelect={(date) => {
                            if (date) {
                              form.setValue("documents.emiratesIdInfo.expiryDate", date);
                            }
                          }}
                          fromYear={2024}
                          toYear={2050}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {form.formState.errors.documents?.emiratesIdInfo?.expiryDate && (
                      <p className="text-sm text-destructive">{form.formState.errors.documents.emiratesIdInfo.expiryDate.message}</p>
                    )}
                  </div>
                </div>
                <DocumentUpload
                  label="Emirates ID Copy (Front & Back)"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onUpload={(url) => handleDocumentUpload('emirates-id', url as string)}
                  data-testid="upload-emirates-id"
                />
              </div>

              {/* Work Permit Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Work Permit Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="workPermitNumber">Work Permit Number *</Label>
                    <Input
                      id="workPermitNumber"
                      {...form.register("documents.workPermitInfo.number")}
                      placeholder="Enter work permit number"
                      data-testid="input-work-permit-number"
                    />
                    {form.formState.errors.documents?.workPermitInfo?.number && (
                      <p className="text-sm text-destructive">{form.formState.errors.documents.workPermitInfo.number.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workPermitExpiry">Work Permit Expiry Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                          data-testid="button-work-permit-expiry"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {form.watch("documents.workPermitInfo.expiryDate") ? 
                            format(form.watch("documents.workPermitInfo.expiryDate"), "dd/MM/yyyy") : 
                            "Pick expiry date"
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={form.watch("documents.workPermitInfo.expiryDate")}
                          onSelect={(date) => {
                            if (date) {
                              form.setValue("documents.workPermitInfo.expiryDate", date);
                            }
                          }}
                          fromYear={2024}
                          toYear={2050}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {form.formState.errors.documents?.workPermitInfo?.expiryDate && (
                      <p className="text-sm text-destructive">{form.formState.errors.documents.workPermitInfo.expiryDate.message}</p>
                    )}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="workPermitRestrictions">Restrictions</Label>
                    <Input
                      id="workPermitRestrictions"
                      {...form.register("documents.workPermitInfo.restrictions")}
                      placeholder="Enter any work restrictions (optional)"
                      data-testid="input-work-permit-restrictions"
                    />
                    {form.formState.errors.documents?.workPermitInfo?.restrictions && (
                      <p className="text-sm text-destructive">{form.formState.errors.documents.workPermitInfo.restrictions.message}</p>
                    )}
                  </div>
                </div>
                <DocumentUpload
                  label="Work Permit Copy"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onUpload={(url) => handleDocumentUpload('work-permit', url as string)}
                  data-testid="upload-work-permit"
                />
              </div>

              {/* Labor Card Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Labor Card Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="laborCardNumber">Labor Card Number *</Label>
                    <Input
                      id="laborCardNumber"
                      {...form.register("documents.laborCardInfo.number")}
                      placeholder="Enter labor card number"
                      data-testid="input-labor-card-number"
                    />
                    {form.formState.errors.documents?.laborCardInfo?.number && (
                      <p className="text-sm text-destructive">{form.formState.errors.documents.laborCardInfo.number.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="laborCardProfession">Profession *</Label>
                    <Input
                      id="laborCardProfession"
                      {...form.register("documents.laborCardInfo.profession")}
                      placeholder="Enter profession on labor card"
                      data-testid="input-labor-card-profession"
                    />
                    {form.formState.errors.documents?.laborCardInfo?.profession && (
                      <p className="text-sm text-destructive">{form.formState.errors.documents.laborCardInfo.profession.message}</p>
                    )}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="laborCardExpiry">Labor Card Expiry Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                          data-testid="button-labor-card-expiry"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {form.watch("documents.laborCardInfo.expiryDate") ? 
                            format(form.watch("documents.laborCardInfo.expiryDate"), "dd/MM/yyyy") : 
                            "Pick expiry date"
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={form.watch("documents.laborCardInfo.expiryDate")}
                          onSelect={(date) => {
                            if (date) {
                              form.setValue("documents.laborCardInfo.expiryDate", date);
                            }
                          }}
                          fromYear={2024}
                          toYear={2050}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {form.formState.errors.documents?.laborCardInfo?.expiryDate && (
                      <p className="text-sm text-destructive">{form.formState.errors.documents.laborCardInfo.expiryDate.message}</p>
                    )}
                  </div>
                </div>
                <DocumentUpload
                  label="Labor Card Copy"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onUpload={(url) => handleDocumentUpload('labor-card', url as string)}
                  data-testid="upload-labor-card"
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-semibold">Compensation</h2>
              <p className="text-muted-foreground">Complete salary structure and benefits information</p>
            </div>

            <div className="space-y-6">
              {/* Salary Components */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Salary Components</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="basicSalary">Basic Salary (AED) *</Label>
                    <Input
                      id="basicSalary"
                      type="number"
                      {...form.register("compensation.basicSalary", { valueAsNumber: true })}
                      placeholder="Enter basic salary amount"
                      data-testid="input-basic-salary"
                    />
                    {form.formState.errors.compensation?.basicSalary && (
                      <p className="text-sm text-destructive">{form.formState.errors.compensation.basicSalary.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="housingAllowance">Housing Allowance (AED)</Label>
                    <Input
                      id="housingAllowance"
                      type="number"
                      {...form.register("compensation.housingAllowance", { valueAsNumber: true })}
                      placeholder="Enter housing allowance"
                      data-testid="input-housing-allowance"
                    />
                    {form.formState.errors.compensation?.housingAllowance && (
                      <p className="text-sm text-destructive">{form.formState.errors.compensation.housingAllowance.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transportAllowance">Transport Allowance (AED)</Label>
                    <Input
                      id="transportAllowance"
                      type="number"
                      {...form.register("compensation.transportAllowance", { valueAsNumber: true })}
                      placeholder="Enter transport allowance"
                      data-testid="input-transport-allowance"
                    />
                    {form.formState.errors.compensation?.transportAllowance && (
                      <p className="text-sm text-destructive">{form.formState.errors.compensation.transportAllowance.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="otherAllowance">Other Allowances (AED)</Label>
                    <Input
                      id="otherAllowance"
                      type="number"
                      {...form.register("compensation.otherAllowance", { valueAsNumber: true })}
                      placeholder="Enter other allowances"
                      data-testid="input-other-allowance"
                    />
                    {form.formState.errors.compensation?.otherAllowance && (
                      <p className="text-sm text-destructive">{form.formState.errors.compensation.otherAllowance.message}</p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="totalSalary">Total Monthly Salary (AED)</Label>
                    <Input
                      id="totalSalary"
                      value={form.watch("compensation.totalSalary")?.toLocaleString() || "0"}
                      disabled
                      className="bg-primary/10 font-bold text-lg border-primary"
                      data-testid="input-total-salary"
                    />
                    <p className="text-xs text-muted-foreground">Automatically calculated as sum of all salary components</p>
                  </div>
                </div>
              </div>

              {/* Additional Benefits */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Additional Benefits</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="annualFlightAllowance">Annual Flight Allowance</Label>
                    <Select onValueChange={(value) => form.setValue("compensation.annualFlightAllowance", value === "true")}>
                      <SelectTrigger data-testid="select-flight-allowance">
                        <SelectValue placeholder="Select eligibility" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Eligible</SelectItem>
                        <SelectItem value="false">Not Eligible</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.compensation?.annualFlightAllowance && (
                      <p className="text-sm text-destructive">{form.formState.errors.compensation.annualFlightAllowance.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="medicalInsurance">Medical Insurance *</Label>
                    <Select onValueChange={(value) => form.setValue("compensation.medicalInsurance", value as any)}>
                      <SelectTrigger data-testid="select-medical-insurance">
                        <SelectValue placeholder="Select medical insurance" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="comprehensive">Comprehensive</SelectItem>
                        <SelectItem value="family">Family</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.compensation?.medicalInsurance && (
                      <p className="text-sm text-destructive">{form.formState.errors.compensation.medicalInsurance.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Bank Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name *</Label>
                    <Select onValueChange={(value) => form.setValue("compensation.bankDetails.bankName", value)}>
                      <SelectTrigger data-testid="select-bank-name">
                        <SelectValue placeholder="Select UAE bank" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="emirates-nbd">Emirates NBD</SelectItem>
                        <SelectItem value="adcb">ADCB</SelectItem>
                        <SelectItem value="fab">FAB</SelectItem>
                        <SelectItem value="cbd">CBD</SelectItem>
                        <SelectItem value="enbd">ENBD</SelectItem>
                        <SelectItem value="hsbc">HSBC UAE</SelectItem>
                        <SelectItem value="citibank">Citibank UAE</SelectItem>
                        <SelectItem value="mashreq">Mashreq Bank</SelectItem>
                        <SelectItem value="rakbank">RAKBank</SelectItem>
                        <SelectItem value="noor-bank">Noor Bank</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.compensation?.bankDetails?.bankName && (
                      <p className="text-sm text-destructive">{form.formState.errors.compensation.bankDetails.bankName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number *</Label>
                    <Input
                      id="accountNumber"
                      {...form.register("compensation.bankDetails.accountNumber")}
                      placeholder="Enter account number"
                      data-testid="input-account-number"
                    />
                    {form.formState.errors.compensation?.bankDetails?.accountNumber && (
                      <p className="text-sm text-destructive">{form.formState.errors.compensation.bankDetails.accountNumber.message}</p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="iban">IBAN *</Label>
                    <Input
                      id="iban"
                      {...form.register("compensation.bankDetails.iban")}
                      placeholder="AE123456789012345678901"
                      data-testid="input-iban"
                    />
                    {form.formState.errors.compensation?.bankDetails?.iban && (
                      <p className="text-sm text-destructive">{form.formState.errors.compensation.bankDetails.iban.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-muted/30 rounded-lg border shadow">
      {/* Progress Indicator - Header */}
      <div className="p-6 bg-background border-b rounded-t-lg">
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

      {/* Form Content - Full Height */}
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="p-6 bg-muted/30">
          {renderCurrentStep()}
        </div>

        {/* Navigation Buttons - Footer */}
        <div className="border-t bg-background p-6 rounded-b-lg">
          <div className="flex justify-between">
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
        </div>
      </form>
    </div>
  );
}