import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, EyeOff, Lock, Mail, Shield, Building, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const signinSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type SigninFormData = z.infer<typeof signinSchema>;

interface SigninResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    companyId: string;
    mustChangePassword: boolean;
  };
}

type AuthMode = "admin" | "company" | "employee";

export default function SigninPage() {
  const [location, setLocation] = useLocation();
  const [authMode, setAuthMode] = useState<AuthMode>("company");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Read initial mode from URL parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    if (mode === "admin" || mode === "company" || mode === "employee") {
      setAuthMode(mode);
    }
  }, []);

  const form = useForm<SigninFormData>({
    resolver: zodResolver(signinSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signinMutation = useMutation({
    mutationFn: async (data: SigninFormData) => {
      const response = await apiRequest("POST", "/api/auth/signin", data);
      return response.json() as Promise<SigninResponse>;
    },
    onSuccess: (response) => {
      if (response.user.mustChangePassword) {
        setLocation("/auth/change-password");
      } else {
        // Let RoleBasedRedirect handle the routing
        setLocation("/");
      }
    },
    onError: (error: any) => {
      const message = error?.error || "Sign in failed. Please try again.";
      setErrorMessage(message);
      form.setError("password", { message: " " }); // Clear any existing validation
    },
  });

  const onSubmit = (data: SigninFormData) => {
    setErrorMessage("");
    signinMutation.mutate(data);
  };

  const handleContinueWithReplit = () => {
    window.location.href = "/api/login";
  };

  const getAuthModeConfig = (mode: AuthMode) => {
    switch (mode) {
      case "admin":
        return {
          title: "Sign in to Admin",
          description: "Access the platform administration portal",
          icon: Shield,
        };
      case "company":
        return {
          title: "Sign in to Company Portal", 
          description: "Manage your company and employees",
          icon: Building,
        };
      case "employee":
        return {
          title: "Sign in to Employee Portal",
          description: "Access your employee dashboard",
          icon: Users,
        };
    }
  };

  const config = getAuthModeConfig(authMode);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex items-center justify-center">
            <config.icon className="h-8 w-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">{config.title}</CardTitle>
            <CardDescription>{config.description}</CardDescription>
          </div>

          {/* Auth Mode Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-left block">Select Portal</label>
            <Select value={authMode} onValueChange={(value: AuthMode) => setAuthMode(value)}>
              <SelectTrigger data-testid="select-auth-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin" data-testid="option-admin">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Sign in to Admin</span>
                  </div>
                </SelectItem>
                <SelectItem value="company" data-testid="option-company">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    <span>Sign in to Company Portal</span>
                  </div>
                </SelectItem>
                <SelectItem value="employee" data-testid="option-employee">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Sign in to Employee Portal</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {errorMessage && (
            <Alert variant="destructive" className="mb-6" data-testid="alert-error">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {/* Admin Mode: Replit Auth Button */}
          {authMode === "admin" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Use your Replit account to access the admin portal
              </p>
              <Button
                type="button"
                className="w-full"
                onClick={handleContinueWithReplit}
                data-testid="button-continue-replit"
              >
                Continue with Replit
              </Button>
            </div>
          )}

          {/* Company/Employee Mode: Password Form */}
          {(authMode === "company" || authMode === "employee") && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            type="email"
                            placeholder="Enter your email"
                            className="pl-10"
                            data-testid="input-email"
                            disabled={signinMutation.isPending}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            className="pl-10 pr-10"
                            data-testid="input-password"
                            disabled={signinMutation.isPending}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            data-testid="button-toggle-password"
                            disabled={signinMutation.isPending}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={signinMutation.isPending}
                  data-testid="button-signin"
                >
                  {signinMutation.isPending ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </Form>
          )}

          {/* Forgot Password Link - Only for password-based auth */}
          {(authMode === "company" || authMode === "employee") && (
            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                className="text-sm text-muted-foreground"
                onClick={() => setLocation("/auth/forgot-password")}
                data-testid="link-forgot-password"
              >
                Forgot your password?
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}