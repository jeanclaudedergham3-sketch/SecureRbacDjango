import { Link, useLocation } from "wouter";
import { Shield, BarChart3, Users, UserCheck, Settings, Cog, LogOut, X, Map, ClipboardList, FileText, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { PermissionGuard } from "@/components/rbac/permission-guard";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user, role, logout } = useAuth();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: BarChart3, permission: "view_dashboard" },
    { name: "Users", href: "/users", icon: Users, permission: "view_users" },
    { name: "Roles & Permissions", href: "/roles", icon: UserCheck, permission: "view_roles" },
    { name: "Equipment", href: "/equipment", icon: Cog, permission: "view_equipment" },
    { name: "Technicians", href: "/technicians", icon: Users, permission: "manage_technicians" },
    { name: "Technician Map", href: "/technician-map", icon: Map, permission: "manage_technicians" },
    { name: "Work Orders", href: "/work-orders", icon: ClipboardList, permission: "view_work_orders" },
    { name: "Proposals", href: "/proposals", icon: FileText, permission: "view_work_orders" },
    { name: "Parts Requests", href: "/parts-requests", icon: Package, permission: "view_work_orders" },
  ];

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <>
      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={onClose} />
        </div>
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 sidebar-bg transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
          {/* Mobile close button */}
          <div className="flex items-center justify-between px-4 md:hidden">
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
          <div className="hidden md:flex items-center flex-shrink-0 px-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <h1 className="ml-3 text-xl font-semibold text-white">AdminPanel</h1>
          </div>

          {/* User Info */}
          <div className="mt-6 px-4">
            <div className="flex items-center p-3 bg-slate-700 rounded-lg">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user ? getInitials(user.firstName, user.lastName) : ""}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">
                  {user ? `${user.firstName} ${user.lastName}` : ""}
                </p>
                <p className="text-xs text-slate-300 capitalize">
                  {role?.name || ""}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="mt-6 flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;

              if (item.permission) {
                return (
                  <PermissionGuard key={item.name} permission={item.permission}>
                    <Link href={item.href}>
                      <button
                        className={cn(
                          "w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors text-left",
                          isActive
                            ? "bg-slate-700 text-white"
                            : "text-slate-300 hover:bg-slate-700 hover:text-white"
                        )}
                        onClick={onClose}
                      >
                        <Icon className="mr-3 h-4 w-4" />
                        {item.name}
                      </button>
                    </Link>
                  </PermissionGuard>
                );
              }

              return (
                <Link key={item.name} href={item.href}>
                  <button
                    className={cn(
                      "w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors text-left",
                      isActive
                        ? "bg-slate-700 text-white"
                        : "text-slate-300 hover:bg-slate-700 hover:text-white"
                    )}
                    onClick={onClose}
                  >
                    <Icon className="mr-3 h-4 w-4" />
                    {item.name}
                  </button>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="flex-shrink-0 flex border-t border-slate-700 p-4">
            <button
              onClick={logout}
              className="flex-shrink-0 w-full group block text-left hover:bg-slate-700 rounded-md p-2 transition-colors"
            >
              <div className="flex items-center">
                <LogOut className="h-4 w-4 text-slate-400 mr-3" />
                <span className="text-sm font-medium text-slate-300 group-hover:text-white">
                  Logout
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
