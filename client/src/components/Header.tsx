import { Bell, Search, Settings, LogOut, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";

interface HeaderProps {
  user: {
    name: string;
    email: string;
    profileImageUrl?: string;
    role: string;
    companyName?: string;
  };
  onLogout: () => void;
  pendingNotifications?: number;
}

export default function Header({ user, onLogout, pendingNotifications = 0 }: HeaderProps) {
  const { theme, setTheme } = useTheme();

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'Super Admin';
      case 'COMPANY_ADMIN': return 'Company Admin';
      case 'HR_MANAGER': return 'HR Manager';
      case 'DEPARTMENT_MANAGER': return 'Department Manager';
      case 'EMPLOYEE': return 'Employee';
      default: return role;
    }
  };

  return (
    <header className="h-16 bg-background border-b border-border flex items-center justify-between px-6">
      {/* Left Section - Sidebar Trigger and Search */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <SidebarTrigger data-testid="button-sidebar-toggle" />
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employees, documents..."
            className="pl-10"
            data-testid="header-search"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          data-testid="theme-toggle"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative" data-testid="notifications">
          <Bell className="h-4 w-4" />
          {pendingNotifications > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {pendingNotifications > 9 ? '9+' : pendingNotifications}
            </Badge>
          )}
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 h-10" data-testid="user-menu">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.profileImageUrl} alt={user.name} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{getRoleDisplayName(user.role)}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
              {user.companyName && (
                <p className="text-xs text-muted-foreground">{user.companyName}</p>
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem data-testid="menu-profile">
              <Settings className="mr-2 h-4 w-4" />
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout} data-testid="menu-logout">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}