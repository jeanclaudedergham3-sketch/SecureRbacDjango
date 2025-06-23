import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-white dark:bg-slate-900 shadow-sm border-b border-slate-200 dark:border-slate-700 transition-colors">
      <Button
        variant="ghost"
        size="sm"
        className="px-4 border-r border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 md:hidden transition-colors"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>
      
      <div className="flex-1 px-4 flex justify-end">
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          <NotificationDropdown />
        </div>
      </div>
    </div>
  );
}
