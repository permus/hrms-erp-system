import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CalendarIcon, Upload, User, FileText, MapPin, CreditCard, Shield, CheckCircle, Circle } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import DocumentUpload from "./DocumentUpload";
import { insertEmployeeSchema, type InsertEmployee } from "@shared/schema";

// UAE Emirates for dropdown
const UAE_EMIRATES = [
  "Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Umm Al-Quwain", "Ras Al Khaimah", "Fujairah"
];

// Common languages in UAE
const LANGUAGES = [
  "Arabic", "English", "Hindi", "Urdu", "Filipino", "Bengali", "Malayalam", "Tamil", "Farsi", "French"
];

// Employment types
const EMPLOYMENT_TYPES = ["full-time", "part-time", "contract"] as const;
const WORK_LOCATIONS = ["office", "remote", "hybrid"] as const;

// Form schema extending shared schema for proper validation
const employeeProfileSchema = insertEmployeeSchema.extend({
  // Enhanced Personal Information with calculated fields
  personalInfo: z.object({
    name: z.string().min(1, "Full name is required"),
    preferredName: z.string().optional(),
    fatherName: z.string().min(1, "Father's name is required"),
    motherName: z.string().min(1, "Mother's name is required"),
    dob: z.date(), // Keep as Date object for form handling
    nationality: z.string().min(1, "Nationality is required"),
    languages: z.array(z.string()).min(1, "At least one language is required"),
    religion: z.string().optional(),
    maritalStatus: z.enum(["single", "married", "divorced", "widowed"]),
    profilePhotoUrl: z.string().optional(),
    age: z.coerce.number().optional(), // Calculated field
    emergencyContact: z.object({
      name: z.string().min(1, "Emergency contact name is required"),
      relation: z.string().min(1, "Relation is required"),
      phone: z.string().min(1, "Emergency contact phone is required"),
      email: z.string().email().optional()
    })
  }),

  // Enhanced Contact Information  
  contactInfo: z.object({
    personalEmail: z.string().email("Valid email is required"),
    companyEmail: z.string().email().optional(),
    uaePhone: z.string().min(1, "UAE phone number is required"),
    homeCountryPhone: z.string().optional(),
    uaeAddress: z.object({
      street: z.string().min(1, "Street address is required"),
      city: z.string().min(1, "City is required"),
      emirate: z.string().min(1, "Emirate is required"),
      poBox: z.string().optional()
    }),
    homeCountryAddress: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      postalCode: z.string().optional()
    }).optional()
  }),

  // Enhanced Employment Details with calculated fields
  employmentDetails: z.object({
    position: z.string().min(1, "Position is required"),
    departmentId: z.string().min(1, "Department is required"),
    reportingManagerId: z.string().optional(),
    startDate: z.date(), // Normalize dates to ISO strings
    employmentStatus: z.enum(["active", "probation", "notice_period", "terminated"]),
    employmentType: z.enum(EMPLOYMENT_TYPES),
    workLocation: z.enum(WORK_LOCATIONS),
    probationMonths: z.coerce.number().min(0).max(12).default(6),
    probationEndDate: z.string().optional(), // Calculated field
    tenure: z.coerce.number().optional() // Calculated field
  }),

  // Enhanced Compensation & Benefits with calculated fields
  compensation: z.object({
    basicSalary: z.coerce.number().min(0, "Basic salary must be positive"),
    housingAllowance: z.coerce.number().min(0).default(0),
    transportAllowance: z.coerce.number().min(0).default(0),
    otherAllowance: z.coerce.number().min(0).default(0),
    totalSalary: z.coerce.number().optional(), // Calculated field
    benefits: z.object({
      medicalInsurance: z.boolean().default(false),
      lifeInsurance: z.boolean().default(false)
    }),
    bankDetails: z.object({
      bankName: z.string().min(1, "Bank name is required"),
      accountNumber: z.string().min(1, "Account number is required"),
      iban: z.string().min(1, "IBAN is required")
    }),
    endOfServiceGratuity: z.coerce.number().optional() // Calculated field
  }),

  // Enhanced UAE Legal Documents with document URLs
  emiratesIdInfo: z.object({
    idNumber: z.string().min(1, "Emirates ID number is required"),
    expiryDate: z.date().transform((val) => val.toISOString()),
    status: z.enum(["valid", "expired", "pending_renewal"]),
    documents: z.object({
      frontUrl: z.string().optional(),
      backUrl: z.string().optional()
    }).optional()
  }),

  visaInfo: z.object({
    type: z.string().min(1, "Visa type is required"),
    number: z.string().min(1, "Visa number is required"),
    expiryDate: z.date().transform((val) => val.toISOString()),
    sponsor: z.string().min(1, "Sponsor is required"),
    status: z.enum(["valid", "expired", "pending_renewal"]),
    documents: z.object({
      visaPageUrl: z.string().optional(),
      entryStampUrl: z.string().optional()
    }).optional()
  }),

  passportInfo: z.object({
    number: z.string().min(1, "Passport number is required"),
    nationality: z.string().min(1, "Passport nationality is required"),
    expiryDate: z.date().transform((val) => val.toISOString()),
    placeOfIssue: z.string().min(1, "Place of issue is required"),
    documents: z.object({
      biodataPageUrl: z.string().optional(),
      visaPagesUrls: z.array(z.string()).optional()
    }).optional()
  }),

  workPermitInfo: z.object({
    number: z.string().min(1, "Work permit number is required"),
    expiryDate: z.date().transform((val) => val.toISOString()),
    restrictions: z.string().optional(),
    documents: z.object({
      workPermitUrl: z.string().optional()
    }).optional()
  }).optional(),

  laborCardInfo: z.object({
    number: z.string().min(1, "Labor card number is required"),
    expiryDate: z.date().transform((val) => val.toISOString()),
    profession: z.string().min(1, "Profession is required"),
    documents: z.object({
      laborCardUrl: z.string().optional()
    }).optional()
  }).optional()
});

// Form data type with proper date objects for UI
type EmployeeProfileFormData = Omit<z.infer<typeof employeeProfileSchema>, 'personalInfo' | 'employmentDetails' | 'visaInfo' | 'emiratesIdInfo' | 'passportInfo'> & {
  personalInfo: {
    name: string;
    preferredName?: string;
    fatherName?: string;
    motherName?: string;
    dob: Date;
    nationality: string;
    languages: string[];
    religion?: string;
    maritalStatus?: "single" | "married" | "divorced" | "widowed";
    emergencyContact: {
      name: string;
      relation: string;
      phone: string;
      email?: string;
    };
  };
  employmentDetails: {
    position: string;
    departmentId: string;
    reportingManagerId?: string;
    startDate: Date;
    employmentStatus: string;
    employmentType: string;
    workLocation: string;
    probationMonths: number;
  };
  contactInfo: any;
  compensation: any;
  visaInfo: {
    type: string;
    number: string;
    expiryDate: Date;
    sponsor: string;
    status: string;
    documents: string[];
  };
  emiratesIdInfo: {
    idNumber: string;
    expiryDate: Date;
    status: string;
    documents: string[];
  };
  passportInfo: {
    number: string;
    nationality: string;
    expiryDate: Date;
    placeOfIssue: string;
    documents: string[];
  };
  workPermitInfo?: {
    number: string;
    expiryDate: Date;
    restrictions?: string;
    documents: string[];
  };
  laborCardInfo?: {
    number: string;
    expiryDate: Date;
    profession: string;
    documents: string[];
  };
};

interface EmployeeProfileFormProps {
  employee?: any; // existing employee data for editing
  departments: Array<{ id: string; name: string }>;
  employees: Array<{ id: string; personalInfo: any }>; // for reporting manager dropdown
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
  const [profilePhoto, setProfilePhoto] = useState<string | null>(
    employee?.personalInfo?.profilePhotoUrl || null
  );
  
  // Document upload states
  const [documents, setDocuments] = useState({
    emiratesIdFront: null,
    emiratesIdBack: null,
    visaPage: null,
    entryStamp: null,
    passportBiodata: null,
    passportVisaPages: [],
    workPermit: null,
    laborCard: null
  });

  const form = useForm<EmployeeProfileFormData>({
    resolver: zodResolver(employeeProfileSchema),
    defaultValues: employee ? {
      personalInfo: {
        name: employee.personalInfo?.name || "",
        preferredName: employee.personalInfo?.preferredName || "",
        fatherName: employee.personalInfo?.fatherName || "",
        motherName: employee.personalInfo?.motherName || "",
        dob: employee.personalInfo?.dob ? new Date(employee.personalInfo.dob) : new Date(),
        nationality: employee.personalInfo?.nationality || "",
        languages: employee.personalInfo?.languages || [],
        religion: employee.personalInfo?.religion || "",
        maritalStatus: employee.personalInfo?.maritalStatus || "single",
        emergencyContact: {
          name: employee.personalInfo?.emergencyContact?.name || "",
          relation: employee.personalInfo?.emergencyContact?.relation || "",
          phone: employee.personalInfo?.emergencyContact?.phone || "",
          email: employee.personalInfo?.emergencyContact?.email || ""
        }
      },
      contactInfo: {
        personalEmail: employee.contactInfo?.personalEmail || "",
        companyEmail: employee.contactInfo?.companyEmail || "",
        uaePhone: employee.contactInfo?.uaePhone || "",
        homeCountryPhone: employee.contactInfo?.homeCountryPhone || "",
        uaeAddress: {
          street: employee.contactInfo?.uaeAddress?.street || "",
          city: employee.contactInfo?.uaeAddress?.city || "",
          emirate: employee.contactInfo?.uaeAddress?.emirate || "",
          poBox: employee.contactInfo?.uaeAddress?.poBox || ""
        },
        homeCountryAddress: {
          street: employee.contactInfo?.homeCountryAddress?.street || "",
          city: employee.contactInfo?.homeCountryAddress?.city || "",
          state: employee.contactInfo?.homeCountryAddress?.state || "",
          country: employee.contactInfo?.homeCountryAddress?.country || "",
          postalCode: employee.contactInfo?.homeCountryAddress?.postalCode || ""
        }
      },
      employmentDetails: {
        position: employee.employmentDetails?.position || "",
        departmentId: employee.employmentDetails?.departmentId || "",
        reportingManagerId: employee.employmentDetails?.reportingManagerId || "",
        startDate: employee.employmentDetails?.startDate ? new Date(employee.employmentDetails.startDate) : new Date(),
        employmentStatus: employee.employmentDetails?.employmentStatus || "probation",
        employmentType: employee.employmentDetails?.employmentType || "full-time",
        workLocation: employee.employmentDetails?.workLocation || "office",
        probationMonths: employee.employmentDetails?.probationMonths || 6
      },
      compensation: {
        basicSalary: employee.compensation?.basicSalary || 0,
        housingAllowance: employee.compensation?.housingAllowance || 0,
        transportAllowance: employee.compensation?.transportAllowance || 0,
        otherAllowance: employee.compensation?.otherAllowance || 0,
        benefits: {
          medicalInsurance: employee.compensation?.benefits?.medicalInsurance || false,
          lifeInsurance: employee.compensation?.benefits?.lifeInsurance || false
        },
        bankDetails: {
          bankName: employee.compensation?.bankDetails?.bankName || "",
          accountNumber: employee.compensation?.bankDetails?.accountNumber || "",
          iban: employee.compensation?.bankDetails?.iban || ""
        }
      },
      emiratesIdInfo: {
        idNumber: employee.emiratesIdInfo?.idNumber || "",
        expiryDate: employee.emiratesIdInfo?.expiryDate ? new Date(employee.emiratesIdInfo.expiryDate) : new Date(),
        status: employee.emiratesIdInfo?.status || "pending_renewal"
      },
      visaInfo: {
        type: employee.visaInfo?.type || "",
        number: employee.visaInfo?.number || "",
        expiryDate: employee.visaInfo?.expiryDate ? new Date(employee.visaInfo.expiryDate) : new Date(),
        sponsor: employee.visaInfo?.sponsor || "",
        status: employee.visaInfo?.status || "pending_renewal"
      },
      passportInfo: {
        number: employee.passportInfo?.number || "",
        nationality: employee.passportInfo?.nationality || "",
        expiryDate: employee.passportInfo?.expiryDate ? new Date(employee.passportInfo.expiryDate) : new Date(),
        placeOfIssue: employee.passportInfo?.placeOfIssue || ""
      },
      workPermitInfo: employee.workPermitInfo ? {
        number: employee.workPermitInfo.number || "",
        expiryDate: employee.workPermitInfo.expiryDate ? new Date(employee.workPermitInfo.expiryDate) : new Date(),
        restrictions: employee.workPermitInfo.restrictions || ""
      } : undefined,
      laborCardInfo: employee.laborCardInfo ? {
        number: employee.laborCardInfo.number || "",
        expiryDate: employee.laborCardInfo.expiryDate ? new Date(employee.laborCardInfo.expiryDate) : new Date(),
        profession: employee.laborCardInfo.profession || ""
      } : undefined
    } : {
      personalInfo: {
        name: "",
        preferredName: "",
        fatherName: "",
        motherName: "",
        dob: new Date(),
        nationality: "",
        languages: [],
        religion: "",
        maritalStatus: "single",
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
        uaePhone: "",
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
        position: "",
        departmentId: "",
        reportingManagerId: "",
        startDate: new Date(),
        employmentStatus: "probation",
        employmentType: "full-time",
        workLocation: "office",
        probationMonths: 6
      },
      compensation: {
        basicSalary: 0,
        housingAllowance: 0,
        transportAllowance: 0,
        otherAllowance: 0,
        benefits: {
          medicalInsurance: false,
          lifeInsurance: false
        },
        bankDetails: {
          bankName: "",
          accountNumber: "",
          iban: ""
        }
      },
      emiratesIdInfo: {
        idNumber: "",
        expiryDate: new Date(),
        status: "pending_renewal"
      },
      visaInfo: {
        type: "",
        number: "",
        expiryDate: new Date(),
        sponsor: "",
        status: "pending_renewal"
      },
      passportInfo: {
        number: "",
        nationality: "",
        expiryDate: new Date(),
        placeOfIssue: ""
      },
      workPermitInfo: {
        number: "",
        expiryDate: new Date(),
        restrictions: ""
      },
      laborCardInfo: {
        number: "",
        expiryDate: new Date(),
        profession: ""
      }
    }
  });

  // Tab state management (must be after form initialization)
  const [activeTab, setActiveTab] = useState("personal");
  const [completedSections, setCompletedSections] = useState<Record<string, boolean>>({});

  // Tab configuration with progress tracking
  const tabs = [
    { id: "personal", title: "Personal Info", icon: User, required: ["personalInfo.name", "personalInfo.dob", "personalInfo.nationality"] },
    { id: "contact", title: "Contact Info", icon: MapPin, required: ["contactInfo.personalEmail", "contactInfo.uaePhone"] },
    { id: "employment", title: "Employment", icon: FileText, required: ["employmentDetails.position", "employmentDetails.departmentId", "employmentDetails.startDate"] },
    { id: "legal", title: "Legal & Compliance", icon: Shield, required: ["emiratesIdInfo.idNumber", "visaInfo.type", "passportInfo.number"] },
    { id: "compensation", title: "Compensation", icon: CreditCard, required: ["compensation.basicSalary", "compensation.bankDetails.bankName"] }
  ];

  // Calculate completion status for each section (safe hook dependency)
  useEffect(() => {
    const subscription = form.watch((value) => {
      const newCompletedSections: Record<string, boolean> = {};
      
      tabs.forEach(tab => {
        const isComplete = tab.required.every(path => {
          const formValue = form.getValues(path as any);
          return formValue !== undefined && formValue !== null && formValue !== '';
        });
        newCompletedSections[tab.id] = isComplete;
      });
      
      setCompletedSections(newCompletedSections);
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

  // Transform form data to backend JSONB format
  const transformFormDataToBackend = (data: EmployeeProfileFormData): InsertEmployee => {
    return {
      companyId: "", // Will be set by the calling component
      employeeCode: "", // Will be auto-generated by backend
      slug: "", // Will be auto-generated by backend
      personalInfo: {
        ...data.personalInfo,
        dob: data.personalInfo.dob.toISOString(),
        profilePhotoUrl: profilePhoto,
        age: calculateAge(data.personalInfo.dob)
      },
      contactInfo: data.contactInfo,
      employmentDetails: {
        ...data.employmentDetails,
        startDate: data.employmentDetails.startDate.toISOString(),
        probationEndDate: calculateProbationEndDate(data.employmentDetails.startDate, data.employmentDetails.probationMonths).toISOString(),
        tenure: calculateTenure(data.employmentDetails.startDate)
      },
      compensation: {
        ...data.compensation,
        totalSalary: data.compensation.basicSalary + data.compensation.housingAllowance + 
                    data.compensation.transportAllowance + data.compensation.otherAllowance,
        endOfServiceGratuity: calculateEOSG(data.employmentDetails.startDate, data.compensation.basicSalary)
      },
      visaInfo: {
        type: data.visaInfo.type,
        number: data.visaInfo.number,
        expiryDate: data.visaInfo.expiryDate.toISOString(),
        sponsor: data.visaInfo.sponsor,
        status: data.visaInfo.status,
        documents: data.visaInfo.documents
      },
      emiratesIdInfo: {
        idNumber: data.emiratesIdInfo.idNumber,
        expiryDate: data.emiratesIdInfo.expiryDate.toISOString(),
        status: data.emiratesIdInfo.status,
        documents: data.emiratesIdInfo.documents
      },
      passportInfo: {
        number: data.passportInfo.number,
        nationality: data.passportInfo.nationality,
        expiryDate: data.passportInfo.expiryDate.toISOString(),
        placeOfIssue: data.passportInfo.placeOfIssue,
        documents: data.passportInfo.documents
      },
      workPermitInfo: data.workPermitInfo ? {
        number: data.workPermitInfo.number,
        expiryDate: data.workPermitInfo.expiryDate.toISOString(),
        restrictions: data.workPermitInfo.restrictions,
        documents: data.workPermitInfo.documents
      } : undefined,
      laborCardInfo: data.laborCardInfo ? {
        number: data.laborCardInfo.number,
        expiryDate: data.laborCardInfo.expiryDate.toISOString(),
        profession: data.laborCardInfo.profession,
        documents: data.laborCardInfo.documents
      } : undefined
    };
  };

  const handleSubmit = (data: EmployeeProfileFormData) => {
    // Transform and validate with shared schema
    const backendData = transformFormDataToBackend(data);
    
    // Validate against shared schema
    const validation = insertEmployeeSchema.safeParse(backendData);
    if (!validation.success) {
      console.error("Validation failed:", validation.error);
      toast({
        title: "Validation Error",
        description: "Please check all required fields are filled correctly.",
        variant: "destructive",
      });
      return;
    }

    onSubmit(validation.data);
  };

  const calculateAge = (dob: Date) => {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const calculateProbationEndDate = (startDate: Date, probationMonths: number) => {
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + probationMonths);
    return endDate;
  };

  const calculateTenure = (startDate: Date) => {
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 365); // Years of service
  };

  const calculateEOSG = (startDate: Date, basicSalary: number) => {
    const tenure = calculateTenure(startDate);
    if (tenure < 1) return 0;
    
    // UAE labor law: 21 days for each year of service
    const daysPerYear = 21;
    const dailySalary = basicSalary / 30; // Assuming 30-day month
    return tenure * daysPerYear * dailySalary;
  };

  // Calculate overall progress
  const completedCount = Object.values(completedSections).filter(Boolean).length;
  const progressPercentage = Math.round((completedCount / tabs.length) * 100);

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 max-w-5xl mx-auto">
      {/* Progress Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Employee Profile</h2>
          <Badge variant={progressPercentage === 100 ? "default" : "secondary"}>
            {completedCount}/{tabs.length} sections completed
          </Badge>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Overall Progress</span>
            <span>{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </div>

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-8">
          {tabs.map((tab, index) => {
            const Icon = tab.icon;
            const isCompleted = completedSections[tab.id];
            const isCurrent = activeTab === tab.id;
            
            return (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
                className="flex items-center gap-2 text-xs sm:text-sm"
                data-testid={`tab-${tab.id}`}
              >
                <div className="flex items-center gap-1">
                  {isCompleted ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : isCurrent ? (
                    <Icon className="w-4 h-4" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">{tab.title}</span>
                </div>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Personal Information Tab */}
        <TabsContent value="personal">
          <Card>
            <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Photo Upload */}
          <div className="space-y-2">
            <Label>Profile Photo</Label>
            <DocumentUpload
              accept="image/*"
              maxSize={5 * 1024 * 1024} // 5MB
              onUpload={(url) => setProfilePhoto(url)}
              currentFile={profilePhoto}
              className="w-32 h-32 rounded-full"
              data-testid="upload-profile-photo"
            />
          </div>

          {/* Basic Personal Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                {...form.register("personalInfo.name")}
                placeholder="Enter full name"
                data-testid="input-full-name"
              />
              {form.formState.errors.personalInfo?.name && (
                <p className="text-sm text-destructive">{form.formState.errors.personalInfo.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferredName">Preferred Name</Label>
              <Input
                id="preferredName"
                {...form.register("personalInfo.preferredName")}
                placeholder="Enter preferred name"
                data-testid="input-preferred-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fatherName">Father's Name *</Label>
              <Input
                id="fatherName"
                {...form.register("personalInfo.fatherName")}
                placeholder="Enter father's name"
                data-testid="input-father-name"
              />
              {form.formState.errors.personalInfo?.fatherName && (
                <p className="text-sm text-destructive">{form.formState.errors.personalInfo.fatherName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="motherName">Mother's Name *</Label>
              <Input
                id="motherName"
                {...form.register("personalInfo.motherName")}
                placeholder="Enter mother's name"
                data-testid="input-mother-name"
              />
              {form.formState.errors.personalInfo?.motherName && (
                <p className="text-sm text-destructive">{form.formState.errors.personalInfo.motherName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Date of Birth *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    data-testid="button-dob"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch("personalInfo.dob") ? format(form.watch("personalInfo.dob"), "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={form.watch("personalInfo.dob")}
                    onSelect={(date) => form.setValue("personalInfo.dob", date || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {form.formState.errors.personalInfo?.dob && (
                <p className="text-sm text-destructive">{form.formState.errors.personalInfo.dob.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nationality">Nationality *</Label>
              <Input
                id="nationality"
                {...form.register("personalInfo.nationality")}
                placeholder="Enter nationality"
                data-testid="input-nationality"
              />
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="maritalStatus">Marital Status *</Label>
              <Select onValueChange={(value) => form.setValue("personalInfo.maritalStatus", value as any)}>
                <SelectTrigger data-testid="select-marital-status">
                  <SelectValue placeholder="Select marital status" />
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

          {/* Languages - Multi-select */}
          <div className="space-y-2">
            <Label>Languages Spoken *</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {LANGUAGES.map((language) => (
                <div key={language} className="flex items-center space-x-2">
                  <Checkbox
                    id={`language-${language}`}
                    checked={form.watch("personalInfo.languages")?.includes(language)}
                    onCheckedChange={(checked) => {
                      const currentLanguages = form.watch("personalInfo.languages") || [];
                      if (checked) {
                        form.setValue("personalInfo.languages", [...currentLanguages, language]);
                      } else {
                        form.setValue("personalInfo.languages", currentLanguages.filter(l => l !== language));
                      }
                    }}
                    data-testid={`checkbox-language-${language.toLowerCase()}`}
                  />
                  <Label htmlFor={`language-${language}`} className="text-sm">{language}</Label>
                </div>
              ))}
            </div>
            {form.formState.errors.personalInfo?.languages && (
              <p className="text-sm text-destructive">{form.formState.errors.personalInfo.languages.message}</p>
            )}
          </div>

          {/* Emergency Contact */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Emergency Contact</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyContactName">Name *</Label>
                <Input
                  id="emergencyContactName"
                  {...form.register("personalInfo.emergencyContact.name")}
                  placeholder="Emergency contact name"
                  data-testid="input-emergency-name"
                />
                {form.formState.errors.personalInfo?.emergencyContact?.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.personalInfo.emergencyContact.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyContactRelation">Relation *</Label>
                <Input
                  id="emergencyContactRelation"
                  {...form.register("personalInfo.emergencyContact.relation")}
                  placeholder="Relationship (e.g., Spouse, Parent)"
                  data-testid="input-emergency-relation"
                />
                {form.formState.errors.personalInfo?.emergencyContact?.relation && (
                  <p className="text-sm text-destructive">{form.formState.errors.personalInfo.emergencyContact.relation.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyContactPhone">Phone *</Label>
                <Input
                  id="emergencyContactPhone"
                  {...form.register("personalInfo.emergencyContact.phone")}
                  placeholder="Emergency contact phone"
                  data-testid="input-emergency-phone"
                />
                {form.formState.errors.personalInfo?.emergencyContact?.phone && (
                  <p className="text-sm text-destructive">{form.formState.errors.personalInfo.emergencyContact.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyContactEmail">Email</Label>
                <Input
                  id="emergencyContactEmail"
                  type="email"
                  {...form.register("personalInfo.emergencyContact.email")}
                  placeholder="Emergency contact email (optional)"
                  data-testid="input-emergency-email"
                />
                {form.formState.errors.personalInfo?.emergencyContact?.email && (
                  <p className="text-sm text-destructive">{form.formState.errors.personalInfo.emergencyContact.email.message}</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

        </TabsContent>

        {/* Contact Information Tab */}
        <TabsContent value="contact">
          <Card>
            <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Employment Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="position">Position/Job Title *</Label>
              <Input
                id="position"
                {...form.register("employmentDetails.position")}
                placeholder="Enter job title"
                data-testid="input-position"
              />
              {form.formState.errors.employmentDetails?.position && (
                <p className="text-sm text-destructive">{form.formState.errors.employmentDetails.position.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="departmentId">Department *</Label>
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
              <Label htmlFor="reportingManagerId">Reporting Manager</Label>
              <Select onValueChange={(value) => form.setValue("employmentDetails.reportingManagerId", value)}>
                <SelectTrigger data-testid="select-reporting-manager">
                  <SelectValue placeholder="Select reporting manager" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.personalInfo?.name || 'Unknown'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    data-testid="button-start-date"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch("employmentDetails.startDate") ? 
                      format(form.watch("employmentDetails.startDate"), "PPP") : 
                      "Pick a date"
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={form.watch("employmentDetails.startDate")}
                    onSelect={(date) => form.setValue("employmentDetails.startDate", date || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {form.formState.errors.employmentDetails?.startDate && (
                <p className="text-sm text-destructive">{form.formState.errors.employmentDetails.startDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="employmentStatus">Employment Status *</Label>
              <Select onValueChange={(value) => form.setValue("employmentDetails.employmentStatus", value as any)}>
                <SelectTrigger data-testid="select-employment-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="probation">Probation</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="notice_period">Notice Period</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="probationMonths">Probation Months</Label>
              <Input
                id="probationMonths"
                type="number"
                {...form.register("employmentDetails.probationMonths", { valueAsNumber: true })}
                placeholder="6"
                data-testid="input-probation-months"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employmentType">Employment Type *</Label>
              <Select onValueChange={(value) => form.setValue("employmentDetails.employmentType", value as any)}>
                <SelectTrigger data-testid="select-employment-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workLocation">Work Location *</Label>
              <Select onValueChange={(value) => form.setValue("employmentDetails.workLocation", value as any)}>
                <SelectTrigger data-testid="select-work-location">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="office">Office</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

        </TabsContent>

        {/* Employment Details Tab */}
        <TabsContent value="employment">
          <Card>
            <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="personalEmail">Personal Email *</Label>
              <Input
                id="personalEmail"
                type="email"
                {...form.register("contactInfo.personalEmail")}
                placeholder="personal@email.com"
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
                placeholder="employee@company.com"
                data-testid="input-company-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="uaePhone">UAE Phone Number *</Label>
              <Input
                id="uaePhone"
                {...form.register("contactInfo.uaePhone")}
                placeholder="+971 50 123 4567"
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
                placeholder="Home country phone number"
                data-testid="input-home-phone"
              />
            </div>
          </div>

          {/* UAE Address */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">UAE Address</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="uaeStreet">Street Address *</Label>
                <Input
                  id="uaeStreet"
                  {...form.register("contactInfo.uaeAddress.street")}
                  placeholder="Street address"
                  data-testid="input-uae-street"
                />
                {form.formState.errors.contactInfo?.uaeAddress?.street && (
                  <p className="text-sm text-destructive">{form.formState.errors.contactInfo.uaeAddress.street.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="uaeCity">City *</Label>
                <Input
                  id="uaeCity"
                  {...form.register("contactInfo.uaeAddress.city")}
                  placeholder="City"
                  data-testid="input-uae-city"
                />
                {form.formState.errors.contactInfo?.uaeAddress?.city && (
                  <p className="text-sm text-destructive">{form.formState.errors.contactInfo.uaeAddress.city.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="uaeEmirate">Emirate *</Label>
                <Select onValueChange={(value) => form.setValue("contactInfo.uaeAddress.emirate", value)}>
                  <SelectTrigger data-testid="select-uae-emirate">
                    <SelectValue placeholder="Select emirate" />
                  </SelectTrigger>
                  <SelectContent>
                    {UAE_EMIRATES.map((emirate) => (
                      <SelectItem key={emirate} value={emirate}>{emirate}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.contactInfo?.uaeAddress?.emirate && (
                  <p className="text-sm text-destructive">{form.formState.errors.contactInfo.uaeAddress.emirate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="uaePoBox">P.O. Box</Label>
                <Input
                  id="uaePoBox"
                  {...form.register("contactInfo.uaeAddress.poBox")}
                  placeholder="P.O. Box (optional)"
                  data-testid="input-uae-pobox"
                />
              </div>
            </div>
          </div>

          {/* Home Country Address */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Home Country Address (Optional)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="homeStreet">Street Address</Label>
                <Input
                  id="homeStreet"
                  {...form.register("contactInfo.homeCountryAddress.street")}
                  placeholder="Street address"
                  data-testid="input-home-street"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="homeCity">City</Label>
                <Input
                  id="homeCity"
                  {...form.register("contactInfo.homeCountryAddress.city")}
                  placeholder="City"
                  data-testid="input-home-city"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="homeState">State/Province</Label>
                <Input
                  id="homeState"
                  {...form.register("contactInfo.homeCountryAddress.state")}
                  placeholder="State/Province"
                  data-testid="input-home-state"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="homeCountry">Country</Label>
                <Input
                  id="homeCountry"
                  {...form.register("contactInfo.homeCountryAddress.country")}
                  placeholder="Country"
                  data-testid="input-home-country"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="homePostalCode">Postal Code</Label>
                <Input
                  id="homePostalCode"
                  {...form.register("contactInfo.homeCountryAddress.postalCode")}
                  placeholder="Postal code"
                  data-testid="input-home-postal-code"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

        </TabsContent>

        {/* Legal & Compliance Tab */}
        <TabsContent value="legal">
          <Card>
            <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Legal & Compliance Documentation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Emirates ID */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Emirates ID</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emiratesIdNumber">Emirates ID Number *</Label>
                <Input
                  id="emiratesIdNumber"
                  {...form.register("emiratesIdInfo.idNumber")}
                  placeholder="784-YYYY-XXXXXXX-X"
                  data-testid="input-emirates-id"
                />
                {form.formState.errors.emiratesIdInfo?.idNumber && (
                  <p className="text-sm text-destructive">{form.formState.errors.emiratesIdInfo.idNumber.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="emiratesIdExpiry">Expiry Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      data-testid="button-emirates-id-expiry"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.watch("emiratesIdInfo.expiryDate") ? 
                        format(form.watch("emiratesIdInfo.expiryDate"), "PPP") : 
                        "Pick expiry date"
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={form.watch("emiratesIdInfo.expiryDate")}
                      onSelect={(date) => form.setValue("emiratesIdInfo.expiryDate", date || new Date())}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="col-span-2 space-y-2">
                <Label>Emirates ID Documents</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Front Side</Label>
                    <DocumentUpload
                      accept="image/*,.pdf"
                      maxSize={10 * 1024 * 1024} // 10MB
                      onUpload={(url) => setDocuments(prev => ({ ...prev, emiratesIdFront: url }))}
                      currentFile={documents.emiratesIdFront}
                      data-testid="upload-emirates-id-front"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Back Side</Label>
                    <DocumentUpload
                      accept="image/*,.pdf"
                      maxSize={10 * 1024 * 1024} // 10MB
                      onUpload={(url) => setDocuments(prev => ({ ...prev, emiratesIdBack: url }))}
                      currentFile={documents.emiratesIdBack}
                      data-testid="upload-emirates-id-back"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Passport */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Passport Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="passportNumber">Passport Number *</Label>
                <Input
                  id="passportNumber"
                  {...form.register("passportInfo.number")}
                  placeholder="Passport number"
                  data-testid="input-passport-number"
                />
                {form.formState.errors.passportInfo?.number && (
                  <p className="text-sm text-destructive">{form.formState.errors.passportInfo.number.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="passportNationality">Nationality *</Label>
                <Input
                  id="passportNationality"
                  {...form.register("passportInfo.nationality")}
                  placeholder="Passport nationality"
                  data-testid="input-passport-nationality"
                />
                {form.formState.errors.passportInfo?.nationality && (
                  <p className="text-sm text-destructive">{form.formState.errors.passportInfo.nationality.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="passportExpiry">Expiry Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      data-testid="button-passport-expiry"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.watch("passportInfo.expiryDate") ? 
                        format(form.watch("passportInfo.expiryDate"), "PPP") : 
                        "Pick expiry date"
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={form.watch("passportInfo.expiryDate")}
                      onSelect={(date) => form.setValue("passportInfo.expiryDate", date || new Date())}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="passportPlaceOfIssue">Place of Issue *</Label>
                <Input
                  id="passportPlaceOfIssue"
                  {...form.register("passportInfo.placeOfIssue")}
                  placeholder="Place of issue"
                  data-testid="input-passport-place"
                />
                {form.formState.errors.passportInfo?.placeOfIssue && (
                  <p className="text-sm text-destructive">{form.formState.errors.passportInfo.placeOfIssue.message}</p>
                )}
              </div>

              <div className="col-span-2 space-y-2">
                <Label>Passport Bio-data Page</Label>
                <DocumentUpload
                  accept="image/*,.pdf"
                  maxSize={10 * 1024 * 1024} // 10MB
                  onUpload={(url) => setDocuments(prev => ({ ...prev, passportBiodata: url }))}
                  currentFile={documents.passportBiodata}
                  data-testid="upload-passport-biodata"
                />
              </div>
            </div>
          </div>

          {/* Visa Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Visa Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="visaType">Visa Type *</Label>
                <Select onValueChange={(value) => form.setValue("visaInfo.type", value)}>
                  <SelectTrigger data-testid="select-visa-type">
                    <SelectValue placeholder="Select visa type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employment">Employment Visa</SelectItem>
                    <SelectItem value="residence">Residence Visa</SelectItem>
                    <SelectItem value="investor">Investor Visa</SelectItem>
                    <SelectItem value="dependent">Dependent Visa</SelectItem>
                    <SelectItem value="golden">Golden Visa</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.visaInfo?.type && (
                  <p className="text-sm text-destructive">{form.formState.errors.visaInfo.type.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="visaNumber">Visa Number *</Label>
                <Input
                  id="visaNumber"
                  {...form.register("visaInfo.number")}
                  placeholder="Visa number"
                  data-testid="input-visa-number"
                />
                {form.formState.errors.visaInfo?.number && (
                  <p className="text-sm text-destructive">{form.formState.errors.visaInfo.number.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="visaExpiry">Expiry Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      data-testid="button-visa-expiry"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.watch("visaInfo.expiryDate") ? 
                        format(form.watch("visaInfo.expiryDate"), "PPP") : 
                        "Pick expiry date"
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={form.watch("visaInfo.expiryDate")}
                      onSelect={(date) => form.setValue("visaInfo.expiryDate", date || new Date())}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="visaSponsor">Sponsor *</Label>
                <Input
                  id="visaSponsor"
                  {...form.register("visaInfo.sponsor")}
                  placeholder="Visa sponsor"
                  data-testid="input-visa-sponsor"
                />
                {form.formState.errors.visaInfo?.sponsor && (
                  <p className="text-sm text-destructive">{form.formState.errors.visaInfo.sponsor.message}</p>
                )}
              </div>

              <div className="col-span-2 space-y-2">
                <Label>Visa Page Document</Label>
                <DocumentUpload
                  accept="image/*,.pdf"
                  maxSize={10 * 1024 * 1024} // 10MB
                  onUpload={(url) => setDocuments(prev => ({ ...prev, visaPage: url }))}
                  currentFile={documents.visaPage}
                  data-testid="upload-visa-page"
                />
              </div>
            </div>
          </div>

          {/* Work Permit (Optional) */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Work Permit (If Applicable)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="workPermitNumber">Work Permit Number</Label>
                <Input
                  id="workPermitNumber"
                  {...form.register("workPermitInfo.number")}
                  placeholder="Work permit number"
                  data-testid="input-work-permit-number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="workPermitExpiry">Expiry Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      data-testid="button-work-permit-expiry"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.watch("workPermitInfo.expiryDate") ? 
                        format(form.watch("workPermitInfo.expiryDate"), "PPP") : 
                        "Pick expiry date"
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={form.watch("workPermitInfo.expiryDate")}
                      onSelect={(date) => form.setValue("workPermitInfo.expiryDate", date || new Date())}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="col-span-2 space-y-2">
                <Label>Work Permit Document</Label>
                <DocumentUpload
                  accept="image/*,.pdf"
                  maxSize={10 * 1024 * 1024} // 10MB
                  onUpload={(url) => setDocuments(prev => ({ ...prev, workPermit: url }))}
                  currentFile={documents.workPermit}
                  data-testid="upload-work-permit"
                />
              </div>
            </div>
          </div>

          {/* Labor Card (Optional) */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Labor Card (If Applicable)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="laborCardNumber">Labor Card Number</Label>
                <Input
                  id="laborCardNumber"
                  {...form.register("laborCardInfo.number")}
                  placeholder="Labor card number"
                  data-testid="input-labor-card-number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="laborCardExpiry">Expiry Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      data-testid="button-labor-card-expiry"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.watch("laborCardInfo.expiryDate") ? 
                        format(form.watch("laborCardInfo.expiryDate"), "PPP") : 
                        "Pick expiry date"
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={form.watch("laborCardInfo.expiryDate")}
                      onSelect={(date) => form.setValue("laborCardInfo.expiryDate", date || new Date())}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="laborCardProfession">Profession</Label>
                <Input
                  id="laborCardProfession"
                  {...form.register("laborCardInfo.profession")}
                  placeholder="Profession on labor card"
                  data-testid="input-labor-card-profession"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label>Labor Card Document</Label>
                <DocumentUpload
                  accept="image/*,.pdf"
                  maxSize={10 * 1024 * 1024} // 10MB
                  onUpload={(url) => setDocuments(prev => ({ ...prev, laborCard: url }))}
                  currentFile={documents.laborCard}
                  data-testid="upload-labor-card"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

        </TabsContent>

        {/* Compensation Tab */}
        <TabsContent value="compensation">
          <Card>
            <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Compensation & Benefits
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Salary Details */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Salary Breakdown (AED)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="basicSalary">Basic Salary *</Label>
                <Input
                  id="basicSalary"
                  type="number"
                  {...form.register("compensation.basicSalary", { valueAsNumber: true })}
                  placeholder="Basic salary amount"
                  data-testid="input-basic-salary"
                />
                {form.formState.errors.compensation?.basicSalary && (
                  <p className="text-sm text-destructive">{form.formState.errors.compensation.basicSalary.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="housingAllowance">Housing Allowance</Label>
                <Input
                  id="housingAllowance"
                  type="number"
                  {...form.register("compensation.housingAllowance", { valueAsNumber: true })}
                  placeholder="Housing allowance"
                  data-testid="input-housing-allowance"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="transportAllowance">Transport Allowance</Label>
                <Input
                  id="transportAllowance"
                  type="number"
                  {...form.register("compensation.transportAllowance", { valueAsNumber: true })}
                  placeholder="Transport allowance"
                  data-testid="input-transport-allowance"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="otherAllowance">Other Allowances</Label>
                <Input
                  id="otherAllowance"
                  type="number"
                  {...form.register("compensation.otherAllowance", { valueAsNumber: true })}
                  placeholder="Other allowances"
                  data-testid="input-other-allowance"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-lg font-semibold">Total Monthly Salary</Label>
                <div className="text-2xl font-bold text-primary">
                  AED {(
                    (form.watch("compensation.basicSalary") || 0) +
                    (form.watch("compensation.housingAllowance") || 0) +
                    (form.watch("compensation.transportAllowance") || 0) +
                    (form.watch("compensation.otherAllowance") || 0)
                  ).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Benefits</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="medicalInsurance"
                  checked={form.watch("compensation.benefits.medicalInsurance")}
                  onCheckedChange={(checked) => form.setValue("compensation.benefits.medicalInsurance", checked === true)}
                  data-testid="checkbox-medical-insurance"
                />
                <Label htmlFor="medicalInsurance">Medical Insurance</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="lifeInsurance"
                  checked={form.watch("compensation.benefits.lifeInsurance")}
                  onCheckedChange={(checked) => form.setValue("compensation.benefits.lifeInsurance", checked === true)}
                  data-testid="checkbox-life-insurance"
                />
                <Label htmlFor="lifeInsurance">Life Insurance</Label>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Bank Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name *</Label>
                <Input
                  id="bankName"
                  {...form.register("compensation.bankDetails.bankName")}
                  placeholder="Bank name"
                  data-testid="input-bank-name"
                />
                {form.formState.errors.compensation?.bankDetails?.bankName && (
                  <p className="text-sm text-destructive">{form.formState.errors.compensation.bankDetails.bankName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number *</Label>
                <Input
                  id="accountNumber"
                  {...form.register("compensation.bankDetails.accountNumber")}
                  placeholder="Account number"
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
                  placeholder="AE00 0000 0000 0000 0000 000"
                  data-testid="input-iban"
                />
                {form.formState.errors.compensation?.bankDetails?.iban && (
                  <p className="text-sm text-destructive">{form.formState.errors.compensation.bankDetails.iban.message}</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
          </Card>
        </TabsContent>

        {/* Other tabs placeholder */}
        <TabsContent value="contact"><Card><CardHeader><CardTitle>Contact Information</CardTitle></CardHeader><CardContent><p>Coming soon</p></CardContent></Card></TabsContent>
        <TabsContent value="employment"><Card><CardHeader><CardTitle>Employment Details</CardTitle></CardHeader><CardContent><p>Coming soon</p></CardContent></Card></TabsContent>
        <TabsContent value="legal"><Card><CardHeader><CardTitle>Legal & Compliance</CardTitle></CardHeader><CardContent><p>Coming soon</p></CardContent></Card></TabsContent>
        <TabsContent value="compensation"><Card><CardHeader><CardTitle>Compensation</CardTitle></CardHeader><CardContent><p>Coming soon</p></CardContent></Card></TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          data-testid="button-cancel"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          data-testid="button-save"
        >
          {isLoading ? "Saving..." : employee ? "Update Employee" : "Create Employee"}
        </Button>
      </div>
    </form>
  );
}