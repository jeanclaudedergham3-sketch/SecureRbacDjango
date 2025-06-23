import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <div className="relative z-10 flex-shrink-0 flex h-14 sm:h-16 bg-white shadow-sm border-b border-gray-200">
      <Button
        variant="ghost"
        size="sm"
        className="px-3 sm:px-4 border-r border-gray-200 text-gray-500 lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
      </Button>
      
      <div className="flex-1 px-3 sm:px-4 md:px-6 flex justify-end">
        <div className="flex items-center">
          <NotificationDropdown />
        </div>
      </div>
    </div>
  );
}
