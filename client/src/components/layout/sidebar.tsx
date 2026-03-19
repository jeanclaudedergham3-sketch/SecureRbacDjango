import { Link, useLocation } from "wouter";
import { Shield, BarChart3, Users, UserCheck, Settings, Cog, LogOut, X, Map, ClipboardList, FileText, Package, DollarSign, TrendingUp, UsersRound, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { SidebarGuard } from "@/components/rbac/advanced-permission-guard";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useState } from "react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user, role, logout, permissions } = useAuth();
  const { hasPermission } = usePermissions();
  const [isHovered, setIsHovered] = useState(false);

  const navigationSections = [
    {
      title: "Overview",
      items: [
        { name: "Dashboard", href: "/", icon: BarChart3, permission: "sidebar.overview" },
        { name: "Analytics", href: "/analytics", icon: TrendingUp, permission: "sidebar.overview" },
      ]
    },
    {
      title: "User Management", 
      items: [
        { name: "Users", href: "/users", icon: Users, permission: "sidebar.user_management" },
        { name: "Roles & Permissions", href: "/roles", icon: UserCheck, permission: "sidebar.user_management" },
      ]
    },
    {
      title: "Operations",
      items: [
        { name: "Work Orders", href: "/work-orders", icon: ClipboardList, permission: "sidebar.operations" },
        { name: "Job Inspections", href: "/job-inspections", icon: Search, permission: "sidebar.operations" },
        { name: "Parts Requests", href: "/parts-requests", icon: Package, permission: "sidebar.operations" },
        { name: "Proposals", href: "/proposals", icon: FileText, permission: "sidebar.operations" },
        { name: "Invoices", href: "/invoices", icon: FileText, permission: "sidebar.operations" },
      ]
    },
    {
      title: "Technicians",
      items: [
        { name: "Technician List", href: "/technicians", icon: Settings, permission: "sidebar.technicians" },
        { name: "Technician Map", href: "/technician-map", icon: Map, permission: "sidebar.technicians" },
        { name: "Teams", href: "/teams", icon: UsersRound, permission: "sidebar.technicians" },
      ]
    },
    {
      title: "Payments",
      items: [
        { name: "Payment Manager", href: "/payment-manager", icon: DollarSign, permission: "sidebar.payments" },
        { name: "Technician Payments", href: "/technician-payments", icon: DollarSign, permission: "sidebar.payments" },
      ]
    }
  ];

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <>
      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity" onClick={onClose} />
        </div>
      )}
      {/* Sidebar */}
      <div 
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 shadow-2xl border-r border-slate-600/30 transform transition-all duration-500 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:w-16 lg:hover:w-64",
          isHovered ? "w-64" : "w-64 lg:w-16"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex flex-col h-full pt-6 pb-4 overflow-hidden">
          {/* Mobile close button */}
          <div className="flex items-center justify-between px-4 lg:hidden">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <h1 className="ml-3 text-xl font-semibold text-white">AdminPanel</h1>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5 text-white" />
            </Button>
          </div>

          {/* Logo */}
          <div className={cn(
            "hidden lg:flex items-center flex-shrink-0 mb-8 transition-all duration-500",
            isHovered ? "px-4" : "px-3 justify-center"
          )}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-blue-400/20 flex-shrink-0">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <h1 className={cn(
              "ml-4 text-xl font-bold text-white transition-all duration-500 bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent",
              isHovered ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"
            )}>Noviq</h1>
          </div>

          {/* User Info */}
          <div className={cn(
            "mt-2 mb-4 flex-shrink-0 transition-all duration-500",
            isHovered ? "px-4" : "px-3"
          )}>
            <div className={cn(
              "flex items-center transition-all duration-500 shadow-lg",
              isHovered 
                ? "p-3 bg-gradient-to-r from-slate-700/60 to-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-600/30" 
                : "p-2 bg-transparent rounded-full justify-center"
            )}>
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-md ring-2 ring-emerald-400/30 flex-shrink-0">
                <span className="text-white font-bold text-sm">
                  {user ? getInitials(user.firstName, user.lastName) : ""}
                </span>
              </div>
              <div className={cn(
                "ml-3 transition-all duration-500",
                isHovered ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"
              )}>
                <p className="text-sm font-semibold text-white whitespace-nowrap">
                  {user ? `${user.firstName} ${user.lastName}` : ""}
                </p>
                <p className="text-xs text-slate-300 capitalize whitespace-nowrap font-medium">
                  {role?.name || ""}
                </p>
                <div className="mt-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs h-7 bg-slate-600/50 border-slate-500/50 text-slate-200 hover:bg-red-600/20 hover:border-red-500/50 hover:text-red-300 transition-all duration-300"
                      >
                        <LogOut className="h-3 w-3 mr-1" />
                        Sign Out
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-md">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center text-lg">
                          <LogOut className="h-5 w-5 mr-2 text-slate-600" />
                          Sign Out Confirmation
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-600">
                          Are you sure you want to sign out of your account? You'll need to log in again to access the admin panel.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="hover:bg-slate-100">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={logout}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          Yes, Sign Out
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-2 space-y-3 overflow-y-auto scrollbar-thin">
            {navigationSections.map((section) => {
              // Check if user has permission for any item in this section
              const hasAnyPermission = section.items.some(item => 
                !item.permission || hasPermission(item.permission)
              );
              
              // Debug logging for manager role
              if (user?.username === 'qqq') {
                console.log(`Section: ${section.title}`, {
                  hasAnyPermission,
                  userPermissions: permissions,
                  items: section.items.map(item => ({
                    name: item.name,
                    permission: item.permission,
                    hasPermission: item.permission ? hasPermission(item.permission) : true
                  }))
                });
              }
              
              if (!hasAnyPermission) return null;
              
              return (
                <div key={section.title} className="space-y-1">
                  {/* Section Title */}
                  <div className={cn(
                    "transition-all duration-500",
                    isHovered ? "opacity-100 px-2 py-1 mb-1" : "opacity-0 h-0 overflow-hidden mb-0"
                  )}>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {section.title}
                    </h3>
                  </div>
                  
                  {/* Section Items */}
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const isActive = location === item.href;
                      const Icon = item.icon;
                      
                      if (item.permission && hasPermission(item.permission)) {
                        return (
                          <Link key={item.name} href={item.href}>
                            <button
                              className={cn(
                                "w-full group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 text-left relative transform hover:scale-105 active:scale-95",
                                isActive
                                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25 border border-blue-400/30"
                                  : "text-slate-300 hover:bg-gradient-to-r hover:from-slate-700/50 hover:to-slate-600/50 hover:text-white hover:shadow-md backdrop-blur-sm border border-transparent hover:border-slate-500/30"
                              )}
                              onClick={onClose}
                            >
                              <Icon className="h-4 w-4 flex-shrink-0" />
                              <span className={cn(
                                "ml-3 transition-all duration-500 whitespace-nowrap font-medium",
                                isHovered ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"
                              )}>
                                {item.name}
                              </span>
                              {!isHovered && (
                                <div className="absolute left-full ml-3 px-3 py-2 bg-slate-900/95 backdrop-blur-sm text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 whitespace-nowrap shadow-xl border border-slate-600/50">
                                  {item.name}
                                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-slate-900/95 rotate-45 border-l border-b border-slate-600/50"></div>
                                </div>
                              )}
                            </button>
                          </Link>
                        );
                      }

                      return (
                        <Link key={item.name} href={item.href}>
                          <button
                            className={cn(
                              "w-full group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 text-left relative transform hover:scale-105 active:scale-95",
                              isActive
                                ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25 border border-blue-400/30"
                                : "text-slate-300 hover:bg-gradient-to-r hover:from-slate-700/50 hover:to-slate-600/50 hover:text-white hover:shadow-md backdrop-blur-sm border border-transparent hover:border-slate-500/30"
                            )}
                            onClick={onClose}
                          >
                            <Icon className="h-4 w-4 flex-shrink-0" />
                            <span className={cn(
                              "ml-3 transition-all duration-500 whitespace-nowrap font-medium",
                              isHovered ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"
                            )}>
                              {item.name}
                            </span>
                            {!isHovered && (
                              <div className="absolute left-full ml-3 px-3 py-2 bg-slate-900/95 backdrop-blur-sm text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 whitespace-nowrap shadow-xl border border-slate-600/50">
                                {item.name}
                                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-slate-900/95 rotate-45 border-l border-b border-slate-600/50"></div>
                              </div>
                            )}
                          </button>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Logout for collapsed state */}
          <div className={cn(
            "flex-shrink-0 flex border-t border-slate-600/30 p-4 mt-4 transition-all duration-500",
            isHovered ? "opacity-0 h-0 overflow-hidden p-0 mt-0" : "opacity-100"
          )}>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="flex-shrink-0 w-full group block text-left hover:bg-gradient-to-r hover:from-red-600/20 hover:to-red-700/20 rounded-xl p-3 transition-all duration-300 relative transform hover:scale-105 active:scale-95 border border-transparent hover:border-red-500/30">
                  <div className="flex items-center justify-center">
                    <LogOut className="h-5 w-5 text-slate-400 group-hover:text-red-400 flex-shrink-0 transition-colors duration-300" />
                    <div className="absolute left-full ml-3 px-3 py-2 bg-slate-900/95 backdrop-blur-sm text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 whitespace-nowrap shadow-xl border border-slate-600/50">
                      Sign Out
                      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-slate-900/95 rotate-45 border-l border-b border-slate-600/50"></div>
                    </div>
                  </div>
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center text-lg">
                    <LogOut className="h-5 w-5 mr-2 text-slate-600" />
                    Sign Out Confirmation
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-600">
                    Are you sure you want to sign out of your account? You'll need to log in again to access the admin panel.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="hover:bg-slate-100">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={logout}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Yes, Sign Out
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </>
  );
}
