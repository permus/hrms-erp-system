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
import { CalendarIcon, Upload, User, FileText, MapPin, CreditCard, Shield } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import DocumentUpload from "./DocumentUpload";
import { insertEmployeeSchema } from "@shared/schema";

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

// Enhanced employee profile schema that extends the backend schema for Phase 2
const employeeProfileSchema = insertEmployeeSchema.extend({
  // Enhanced Personal Information with calculated fields
  personalInfo: z.object({
    name: z.string().min(1, "Full name is required"),
    preferredName: z.string().optional(),
    fatherName: z.string().min(1, "Father's name is required"),
    motherName: z.string().min(1, "Mother's name is required"),
    dob: z.date().transform((val) => val.toISOString()), // Normalize dates to ISO strings
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
    startDate: z.date().transform((val) => val.toISOString()), // Normalize dates to ISO strings
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
}).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true, 
  deletedAt: true 
});

type EmployeeProfileFormData = z.infer<typeof employeeProfileSchema>;

interface EmployeeProfileFormProps {
  employee?: any; // existing employee data for editing
  departments: Array<{ id: string; name: string }>;
  employees: Array<{ id: string; personalInfo: any }>; // for reporting manager dropdown
  onSubmit: (data: EmployeeProfileFormData) => void;
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

  const handleSubmit = (data: EmployeeProfileFormData) => {
    // Include documents and profile photo in submission
    const enrichedData = {
      ...data,
      personalInfo: {
        ...data.personalInfo,
        profilePhotoUrl: profilePhoto,
        age: calculateAge(data.personalInfo.dob)
      },
      employmentDetails: {
        ...data.employmentDetails,
        probationEndDate: calculateProbationEndDate(data.employmentDetails.startDate, data.employmentDetails.probationMonths),
        tenure: calculateTenure(data.employmentDetails.startDate)
      },
      compensation: {
        ...data.compensation,
        totalSalary: data.compensation.basicSalary + data.compensation.housingAllowance + 
                    data.compensation.transportAllowance + data.compensation.otherAllowance,
        endOfServiceGratuity: calculateEOSG(data.employmentDetails.startDate, data.compensation.basicSalary)
      },
      documents
    };

    onSubmit(enrichedData);
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

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
      
      {/* Personal Information Section */}
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