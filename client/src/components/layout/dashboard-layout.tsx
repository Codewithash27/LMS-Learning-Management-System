import { ReactNode } from "react";
import Sidebar from "./sidebar";
import MobileNav from "./mobile-nav";
import { useSidebar } from "@/hooks/use-sidebar";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { sidebarOpen } = useSidebar();

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      {/* Premium Sidebar */}
      <Sidebar />
      
      {/* Main Content with Glassmorphism Effect */}
      <div className={`flex-1 transition-all duration-500 ease-in-out ${
        sidebarOpen ? 'lg:ml-80' : 'lg:ml-20'
      }`}>
        <div className="min-h-screen p-6 lg:p-8 backdrop-blur-sm flex flex-col">
          {/* Glassmorphism content area */}
          <div className="rounded-3xl bg-white/70 backdrop-blur-md border border-white/20 shadow-2xl min-h-[calc(100vh-4rem)] flex-1">
            {children}
          </div>
          <p className="mt-3 text-center text-[11px] text-gray-400">
            Designed &amp; Deployed by{" "}
            <span className="font-medium text-gray-600">Aman Hukkerikar</span>
          </p>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}