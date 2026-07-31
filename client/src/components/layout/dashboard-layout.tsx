import { ReactNode } from "react";
import Sidebar from "./sidebar";
import MobileNav from "./mobile-nav";
import { useSidebar } from "@/hooks/use-sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { sidebarOpen } = useSidebar();
  const isMobile = useIsMobile();

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      <Sidebar />
      
      <div className={`flex-1 transition-all duration-500 ease-in-out ${
        isMobile ? "ml-0" : sidebarOpen ? "lg:ml-80" : "lg:ml-20"
      }`}>
        <div className="min-h-screen p-4 sm:p-6 lg:p-8 backdrop-blur-sm flex flex-col pb-24 lg:pb-8">
          <div className="rounded-3xl bg-white/70 backdrop-blur-md border border-white/20 shadow-2xl min-h-[calc(100vh-4rem)] flex-1">
            <div className="p-4 sm:p-6 lg:p-8">
              {children}
            </div>
          </div>
          <p className="mt-3 text-center text-[11px] text-gray-400">
            Designed &amp; Deployed by{" "}
            <span className="font-medium text-gray-600">Aman Hukkerikar</span>
          </p>
        </div>
      </div>
      
      <MobileNav />
    </div>
  );
}
