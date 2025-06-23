import { Link, useLocation } from "wouter";
import { Shield, BarChart3, Users, UserCheck, Settings, Cog, LogOut, X, Map, ClipboardList, FileText, Package, DollarSign, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { PermissionGuard } from "@/components/rbac/permission-guard";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user, role, logout } = useAuth();
  const [isHovered, setIsHovered] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: BarChart3, permission: "view_dashboard" },
    { name: "Users", href: "/users", icon: Users, permission: "view_users" },
    { name: "Roles & Permissions", href: "/roles", icon: UserCheck, permission: "view_roles" },

    { name: "Technicians", href: "/technicians", icon: Users, permission: "manage_technicians" },
    { name: "Technician Map", href: "/technician-map", icon: Map, permission: "manage_technicians" },
    { name: "Work Orders", href: "/work-orders", icon: ClipboardList, permission: "view_work_orders" },
    { name: "Proposals", href: "/proposals", icon: FileText, permission: "view_work_orders" },
    { name: "Parts Requests", href: "/parts-requests", icon: Package, permission: "view_work_orders" },
    { name: "Payment Manager", href: "/payment-manager", icon: DollarSign, permission: "manage_work_orders" },
    { name: "Technician Payments", href: "/technician-payments", icon: BarChart3, permission: "view_work_orders" },
    { name: "ABC Invoices", href: "/invoices", icon: FileText, permission: "view_work_orders" },
    { name: "Financial Analysis", href: "/financial-analysis", icon: TrendingUp, permission: "view_dashboard" },

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
        <div className="flex flex-col flex-grow pt-6 pb-4 overflow-y-auto">
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
            )}>UVG</h1>
          </div>

          {/* User Info */}
          <div className={cn(
            "mt-2 mb-6 transition-all duration-500",
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
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
            {navigation.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;

              if (item.permission) {
                return (
                  <PermissionGuard key={item.name} permission={item.permission}>
                    <Link href={item.href}>
                      <button
                        className={cn(
                          "w-full group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-300 text-left relative transform hover:scale-105 active:scale-95",
                          isActive
                            ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25 border border-blue-400/30"
                            : "text-slate-300 hover:bg-gradient-to-r hover:from-slate-700/50 hover:to-slate-600/50 hover:text-white hover:shadow-md backdrop-blur-sm border border-transparent hover:border-slate-500/30"
                        )}
                        onClick={onClose}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
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
                  </PermissionGuard>
                );
              }

              return (
                <Link key={item.name} href={item.href}>
                  <button
                    className={cn(
                      "w-full group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-300 text-left relative transform hover:scale-105 active:scale-95",
                      isActive
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25 border border-blue-400/30"
                        : "text-slate-300 hover:bg-gradient-to-r hover:from-slate-700/50 hover:to-slate-600/50 hover:text-white hover:shadow-md backdrop-blur-sm border border-transparent hover:border-slate-500/30"
                    )}
                    onClick={onClose}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
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
          </nav>

          {/* Logout */}
          <div className="flex-shrink-0 flex border-t border-slate-600/30 p-4 mt-4">
            <button
              onClick={logout}
              className="flex-shrink-0 w-full group block text-left hover:bg-gradient-to-r hover:from-red-600/20 hover:to-red-700/20 rounded-xl p-3 transition-all duration-300 relative transform hover:scale-105 active:scale-95 border border-transparent hover:border-red-500/30"
            >
              <div className="flex items-center">
                <LogOut className="h-5 w-5 text-slate-400 group-hover:text-red-400 flex-shrink-0 transition-colors duration-300" />
                <span className={cn(
                  "ml-3 text-sm font-medium text-slate-300 group-hover:text-red-300 transition-all duration-500 whitespace-nowrap",
                  isHovered ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"
                )}>
                  Logout
                </span>
                {!isHovered && (
                  <div className="absolute left-full ml-3 px-3 py-2 bg-slate-900/95 backdrop-blur-sm text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 whitespace-nowrap shadow-xl border border-slate-600/50">
                    Logout
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-slate-900/95 rotate-45 border-l border-b border-slate-600/50"></div>
                  </div>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
