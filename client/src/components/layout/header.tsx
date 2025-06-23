import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
      <Button
        variant="ghost"
        size="sm"
        className="px-4 border-r border-gray-200 text-gray-500 md:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>
      
      <div className="flex-1 px-4 flex justify-end">
        <div className="flex items-center">
          <NotificationDropdown />
        </div>
      </div>
    </div>
  );
}
