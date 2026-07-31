import { ReactNode } from "react";
import Sidebar from "./sidebar";
import MobileNav from "./mobile-nav";
import { useSidebar } from "@/hooks/use-sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { sidebarOpen } = useSidebar();
  const isMobile = useIsMobile();

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      <Sidebar />

      {/* Not a flex sibling of the fixed sidebar — avoids vertical stacking */}
      <main
        className={cn(
          "min-h-screen transition-all duration-500 ease-in-out",
          isMobile
            ? "ml-0 px-3 pt-3 pb-24"
            : cn(sidebarOpen ? "ml-80" : "ml-20", "p-4")
        )}
      >
        <div className="rounded-3xl bg-white/70 backdrop-blur-md border border-white/20 shadow-2xl min-h-[calc(100vh-2rem)]">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </div>
        <p className="mt-3 text-center text-[11px] text-gray-400">
          Designed &amp; Deployed by{" "}
          <span className="font-medium text-gray-600">Aman Hukkerikar</span>
        </p>
      </main>

      <MobileNav />
    </div>
  );
}
