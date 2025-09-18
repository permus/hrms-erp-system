import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Save, User, Briefcase, Phone, MapPin, CreditCard, FileText } from "lucide-react";

// UAE-compliant employee form schema
const employeeFormSchema = z.object({
  // Personal Information
  personalInfo: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    fatherName: z.string().min(2, "Father's name is required"),
    motherName: z.string().min(2, "Mother's name is required"),
    dob: z.date({ required_error: "Date of birth is required" }),
    nationality: z.string().min(1, "Nationality is required"),
    religion: z.string().min(1, "Religion is required"),
    maritalStatus: z.enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"]),
  }),
  
  // Contact Information
  contactInfo: z.object({
    uaePhone: z.string().regex(/^(\+971|0)?[1-9]\d{8}$/, "Invalid UAE phone number"),
    homeCountryPhone: z.string().optional(),
    email: z.string().email("Invalid email address"),
    uaeAddress: z.string().min(10, "UAE address is required"),
    homeCountryAddress: z.string().optional(),
  }),
  
  // Employment Details
  employmentDetails: z.object({
    position: z.string().min(1, "Position is required"),
    department: z.string().min(1, "Department is required"),
    reportingManagerId: z.string().optional(),
    startDate: z.date({ required_error: "Start date is required" }),
    employmentStatus: z.enum(["PROBATION", "CONFIRMED", "TERMINATED"]),
    probationMonths: z.number().min(0).max(12).optional(),
  }),
  
  // Compensation
  compensation: z.object({
    basicSalary: z.number().min(0, "Basic salary must be positive"),
    housingAllowance: z.number().min(0).optional(),
    transportAllowance: z.number().min(0).optional(),
    otherAllowance: z.number().min(0).optional(),
  }),
  
  // UAE Specific Information
  visaInfo: z.object({
    currentStatus: z.string().optional(),
    visaType: z.string().optional(),
    expiryDate: z.date().optional(),
    passportPlaceOfIssue: z.string().optional(),
  }).optional(),
  
  emiratesIdInfo: z.object({
    status: z.string().optional(),
    idNumber: z.string().optional(),
    expiryDate: z.date().optional(),
  }).optional(),
});

type EmployeeFormData = z.infer<typeof employeeFormSchema>;

interface EmployeeFormProps {
  initialData?: Partial<EmployeeFormData>;
  departments: Array<{ id: string; name: string }>;
  positions: Array<{ id: string; title: string }>;
  managers: Array<{ id: string; name: string }>;
  onSubmit: (data: EmployeeFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function EmployeeForm({
  initialData,
  departments,
  positions,
  managers,
  onSubmit,
  onCancel,
  isLoading = false
}: EmployeeFormProps) {
  const [activeTab, setActiveTab] = useState("personal");

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      personalInfo: {
        name: "",
        fatherName: "",
        motherName: "",
        nationality: "UAE",
        religion: "",
        maritalStatus: "SINGLE",
        ...initialData?.personalInfo,
      },
      contactInfo: {
        uaePhone: "",
        email: "",
        uaeAddress: "",
        ...initialData?.contactInfo,
      },
      employmentDetails: {
        position: "",
        department: "",
        employmentStatus: "PROBATION",
        probationMonths: 6,
        ...initialData?.employmentDetails,
      },
      compensation: {
        basicSalary: 0,
        housingAllowance: 0,
        transportAllowance: 0,
        otherAllowance: 0,
        ...initialData?.compensation,
      },
      visaInfo: initialData?.visaInfo || {},
      emiratesIdInfo: initialData?.emiratesIdInfo || {},
    },
  });

  const handleSubmit = (data: EmployeeFormData) => {
    // Calculate total salary
    const total = data.compensation.basicSalary + 
                 (data.compensation.housingAllowance || 0) + 
                 (data.compensation.transportAllowance || 0) + 
                 (data.compensation.otherAllowance || 0);
    
    onSubmit(data);
  };

  const uaeNationalities = [
    "UAE", "Saudi Arabia", "Kuwait", "Qatar", "Bahrain", "Oman",
    "India", "Pakistan", "Bangladesh", "Philippines", "Egypt", "Jordan", "Lebanon", "Syria", "Other"
  ];

  const religions = ["Islam", "Christianity", "Hinduism", "Buddhism", "Judaism", "Other"];

  return (
    <Card className="max-w-4xl mx-auto" data-testid="employee-form">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {initialData ? "Edit Employee" : "Add New Employee"}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="personal" className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Personal
                </TabsTrigger>
                <TabsTrigger value="contact" className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  Contact
                </TabsTrigger>
                <TabsTrigger value="employment" className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  Employment
                </TabsTrigger>
                <TabsTrigger value="compensation" className="flex items-center gap-1">
                  <CreditCard className="h-3 w-3" />
                  Compensation
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Documents
                </TabsTrigger>
              </TabsList>

              {/* Personal Information Tab */}
              <TabsContent value="personal" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="personalInfo.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name <Badge variant="destructive" className="ml-1 text-xs">Required</Badge></FormLabel>
                        <FormControl>
                          <Input placeholder="Enter full name" {...field} data-testid="input-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="personalInfo.fatherName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Father's Name <Badge variant="destructive" className="ml-1 text-xs">Required</Badge></FormLabel>
                        <FormControl>
                          <Input placeholder="Enter father's name" {...field} data-testid="input-father-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="personalInfo.motherName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mother's Name <Badge variant="destructive" className="ml-1 text-xs">Required</Badge></FormLabel>
                        <FormControl>
                          <Input placeholder="Enter mother's name" {...field} data-testid="input-mother-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="personalInfo.dob"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth <Badge variant="destructive" className="ml-1 text-xs">Required</Badge></FormLabel>
                        <FormControl>
                          <DatePicker
                            date={field.value}
                            onDateChange={field.onChange}
                            placeholder="Select date of birth"
                            data-testid="input-dob"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="personalInfo.nationality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nationality <Badge variant="destructive" className="ml-1 text-xs">Required</Badge></FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-nationality">
                              <SelectValue placeholder="Select nationality" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {uaeNationalities.map((nationality) => (
                              <SelectItem key={nationality} value={nationality}>
                                {nationality}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="personalInfo.religion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Religion <Badge variant="destructive" className="ml-1 text-xs">Required</Badge></FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-religion">
                              <SelectValue placeholder="Select religion" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {religions.map((religion) => (
                              <SelectItem key={religion} value={religion}>
                                {religion}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="personalInfo.maritalStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marital Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-marital-status">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="SINGLE">Single</SelectItem>
                            <SelectItem value="MARRIED">Married</SelectItem>
                            <SelectItem value="DIVORCED">Divorced</SelectItem>
                            <SelectItem value="WIDOWED">Widowed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* Contact Information Tab */}
              <TabsContent value="contact" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contactInfo.uaePhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>UAE Phone Number <Badge variant="destructive" className="ml-1 text-xs">Required</Badge></FormLabel>
                        <FormControl>
                          <Input placeholder="+971 50 123 4567" {...field} data-testid="input-uae-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactInfo.homeCountryPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Home Country Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Home country phone number" {...field} data-testid="input-home-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactInfo.email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address <Badge variant="destructive" className="ml-1 text-xs">Required</Badge></FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@example.com" {...field} data-testid="input-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="contactInfo.uaeAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UAE Address <Badge variant="destructive" className="ml-1 text-xs">Required</Badge></FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter complete UAE address" 
                          {...field} 
                          data-testid="input-uae-address"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactInfo.homeCountryAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Home Country Address</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter home country address" 
                          {...field} 
                          data-testid="input-home-address"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Employment Details Tab */}
              <TabsContent value="employment" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="employmentDetails.department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department <Badge variant="destructive" className="ml-1 text-xs">Required</Badge></FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-department">
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {departments.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="employmentDetails.position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position <Badge variant="destructive" className="ml-1 text-xs">Required</Badge></FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-position">
                              <SelectValue placeholder="Select position" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {positions.map((pos) => (
                              <SelectItem key={pos.id} value={pos.id}>
                                {pos.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="employmentDetails.reportingManagerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reporting Manager</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-manager">
                              <SelectValue placeholder="Select reporting manager" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {managers.map((manager) => (
                              <SelectItem key={manager.id} value={manager.id}>
                                {manager.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="employmentDetails.startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date <Badge variant="destructive" className="ml-1 text-xs">Required</Badge></FormLabel>
                        <FormControl>
                          <DatePicker
                            date={field.value}
                            onDateChange={field.onChange}
                            placeholder="Select start date"
                            data-testid="input-start-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="employmentDetails.employmentStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employment Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-employment-status">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="PROBATION">Probation</SelectItem>
                            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                            <SelectItem value="TERMINATED">Terminated</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("employmentDetails.employmentStatus") === "PROBATION" && (
                    <FormField
                      control={form.control}
                      name="employmentDetails.probationMonths"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Probation Period (Months)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              max="12" 
                              {...field} 
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              data-testid="input-probation-months"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </TabsContent>

              {/* Compensation Tab */}
              <TabsContent value="compensation" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="compensation.basicSalary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Basic Salary (AED) <Badge variant="destructive" className="ml-1 text-xs">Required</Badge></FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            {...field} 
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            data-testid="input-basic-salary"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="compensation.housingAllowance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Housing Allowance (AED)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            {...field} 
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            data-testid="input-housing-allowance"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="compensation.transportAllowance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transport Allowance (AED)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            {...field} 
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            data-testid="input-transport-allowance"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="compensation.otherAllowance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Other Allowance (AED)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            {...field} 
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            data-testid="input-other-allowance"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Total Salary Display */}
                <Card className="bg-muted">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Total Monthly Salary:</span>
                      <span className="text-2xl font-bold text-primary">
                        AED {(
                          form.watch("compensation.basicSalary") +
                          (form.watch("compensation.housingAllowance") || 0) +
                          (form.watch("compensation.transportAllowance") || 0) +
                          (form.watch("compensation.otherAllowance") || 0)
                        ).toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="space-y-4">
                <div className="text-center py-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Document Upload</h3>
                  <p className="text-muted-foreground">
                    Documents can be uploaded after the employee record is created.
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-6 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              
              <Button 
                type="submit" 
                disabled={isLoading}
                data-testid="button-save"
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "Saving..." : "Save Employee"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}