import { Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-medium text-gray-900">Colibri Core</h1>
            </div>
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                <Button variant="default" className="bg-primary text-white">
                  Products
                </Button>
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                  Analytics
                </Button>
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                  Settings
                </Button>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
              <Bell className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <span className="text-gray-700 text-sm">Product Manager</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
