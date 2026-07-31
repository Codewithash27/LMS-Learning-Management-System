import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebar } from "@/hooks/use-sidebar";
import {
  BookOpen,
  LayoutDashboard,
  ClipboardList,
  Users,
  BarChart2,
  BookOpenCheck,
  CalendarClock,
  PieChart,
  LogOut,
  User as UserIcon,
  Bot,
  UsersRound,
  GraduationCap,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

type SidebarLinkProps = {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive?: boolean;
  isCollapsed?: boolean;
  onNavigate?: () => void;
};

const SidebarLink = ({ href, icon, children, isActive, isCollapsed, onNavigate }: SidebarLinkProps) => {
  return (
    <Link href={href} onClick={onNavigate}>
      <div
        className={cn(
          "relative flex items-center gap-3 mx-3 mb-0.5 rounded-xl px-3 py-2.5 text-sm font-medium cursor-pointer transition-colors",
          isActive
            ? "bg-blue-50 text-blue-700"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
          isCollapsed && "justify-center px-2"
        )}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-gradient-to-b from-blue-500 to-purple-600" />
        )}
        <span className={cn("shrink-0", isActive ? "text-blue-600" : "text-gray-500")}>
          {icon}
        </span>
        {!isCollapsed && <span className="truncate">{children}</span>}
      </div>
    </Link>
  );
};

const SectionLabel = ({ children, isCollapsed }: { children: string; isCollapsed: boolean }) => {
  if (isCollapsed) return <div className="h-3" />;
  return (
    <p className="px-6 pt-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
      {children}
    </p>
  );
};

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const isMobile = useIsMobile();
  const { sidebarOpen, closeSidebar } = useSidebar();

  if (!user) return null;

  const isAdmin = user.role === "admin" || user.role === "superadmin";
  const isCollapsed = !isMobile && !sidebarOpen;
  const showDrawer = isMobile ? sidebarOpen : true;
  const isLoggingOut = logoutMutation.isPending;

  const handleNavigate = () => {
    if (isMobile) closeSidebar();
  };

  const pathStarts = (prefix: string) =>
    location === prefix || location.startsWith(prefix + "/");

  const shellClass = cn(
    "sidebar flex flex-col bg-white/95 backdrop-blur-xl border-r border-gray-200/80 shadow-sm",
    isCollapsed ? "w-20" : "w-80"
  );

  const navContent = (
    <>
      {/* Brand */}
      <div className={cn("shrink-0 border-b border-gray-100", isCollapsed ? "p-3" : "px-5 py-4")}>
        <div className="flex items-center gap-3">
          <div className="shrink-0 p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-md shadow-blue-500/20">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-bold text-gray-900 truncate">Edu Transform</h1>
              <p className="text-xs text-gray-500 truncate">Aadi Technology</p>
            </div>
          )}
          {isMobile && (
            <button
              onClick={closeSidebar}
              className="ml-auto p-2 rounded-lg hover:bg-gray-100 text-gray-500"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Nav — scrolls; footer never overlaps */}
      <nav className="flex-1 overflow-y-auto py-2 min-h-0">
        {isAdmin ? (
          <>
            <SectionLabel isCollapsed={isCollapsed}>Management</SectionLabel>
            <SidebarLink href="/admin/dashboard" icon={<LayoutDashboard className="h-5 w-5" />} isActive={location === "/admin/dashboard" || location === "/"} isCollapsed={isCollapsed} onNavigate={handleNavigate}>Dashboard</SidebarLink>
            <SidebarLink href="/admin/courses" icon={<BookOpen className="h-5 w-5" />} isActive={pathStarts("/admin/courses")} isCollapsed={isCollapsed} onNavigate={handleNavigate}>Courses</SidebarLink>
            <SidebarLink href="/admin/exams" icon={<ClipboardList className="h-5 w-5" />} isActive={location === "/admin/exams"} isCollapsed={isCollapsed} onNavigate={handleNavigate}>Exams</SidebarLink>
            <SidebarLink href="/admin/grading" icon={<GraduationCap className="h-5 w-5" />} isActive={location === "/admin/grading"} isCollapsed={isCollapsed} onNavigate={handleNavigate}>Grading</SidebarLink>
            <SidebarLink href="/admin/students" icon={<Users className="h-5 w-5" />} isActive={pathStarts("/admin/students")} isCollapsed={isCollapsed} onNavigate={handleNavigate}>Students</SidebarLink>
            <SidebarLink href="/admin/batches" icon={<UsersRound className="h-5 w-5" />} isActive={pathStarts("/admin/batches")} isCollapsed={isCollapsed} onNavigate={handleNavigate}>Batches</SidebarLink>
            <SidebarLink href="/admin/reports" icon={<BarChart2 className="h-5 w-5" />} isActive={location === "/admin/reports"} isCollapsed={isCollapsed} onNavigate={handleNavigate}>Reports</SidebarLink>

            <SectionLabel isCollapsed={isCollapsed}>Account</SectionLabel>
            <SidebarLink href="/admin/profile" icon={<UserIcon className="h-5 w-5" />} isActive={location === "/admin/profile"} isCollapsed={isCollapsed} onNavigate={handleNavigate}>Profile</SidebarLink>
          </>
        ) : (
          <>
            <SectionLabel isCollapsed={isCollapsed}>Learning</SectionLabel>
            <SidebarLink href="/student/dashboard" icon={<LayoutDashboard className="h-5 w-5" />} isActive={location === "/student/dashboard" || location === "/"} isCollapsed={isCollapsed} onNavigate={handleNavigate}>Dashboard</SidebarLink>
            <SidebarLink href="/student/my-courses" icon={<BookOpenCheck className="h-5 w-5" />} isActive={pathStarts("/student/my-courses")} isCollapsed={isCollapsed} onNavigate={handleNavigate}>My Courses</SidebarLink>
            <SidebarLink href="/student/upcoming-exams" icon={<CalendarClock className="h-5 w-5" />} isActive={location === "/student/upcoming-exams"} isCollapsed={isCollapsed} onNavigate={handleNavigate}>Upcoming Exams</SidebarLink>
            <SidebarLink href="/student/results" icon={<PieChart className="h-5 w-5" />} isActive={location === "/student/results"} isCollapsed={isCollapsed} onNavigate={handleNavigate}>Results & Progress</SidebarLink>
            <SidebarLink href="/student/ai-assistant" icon={<Bot className="h-5 w-5" />} isActive={location === "/student/ai-assistant"} isCollapsed={isCollapsed} onNavigate={handleNavigate}>AI Assistant</SidebarLink>

            <SectionLabel isCollapsed={isCollapsed}>Account</SectionLabel>
            <SidebarLink href="/student/profile" icon={<UserIcon className="h-5 w-5" />} isActive={location === "/student/profile"} isCollapsed={isCollapsed} onNavigate={handleNavigate}>My Profile</SidebarLink>
          </>
        )}
      </nav>

      {/* Footer — always visible, never covers links */}
      <div className={cn("shrink-0 border-t border-gray-100", isCollapsed ? "p-2" : "p-4")}>
        <div className={cn("flex items-center gap-3 mb-3", isCollapsed && "justify-center mb-2")}>
          <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
            {user.firstName?.charAt(0)}
            {user.lastName?.charAt(0)}
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
          )}
        </div>

        <button
          onClick={() => logoutMutation.mutate()}
          disabled={isLoggingOut}
          className={cn(
            "w-full flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors",
            isCollapsed ? "p-2.5" : "px-3 py-2.5",
            isLoggingOut
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600 border border-gray-100"
          )}
        >
          {isLoggingOut ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-blue-500" />
          ) : (
            <>
              <LogOut className="h-4 w-4" />
              {!isCollapsed && <span>Sign Out</span>}
            </>
          )}
        </button>

        {!isCollapsed && (
          <p className="mt-2 text-center text-[10px] text-gray-400">
            by <span className="font-medium text-gray-500">Aman Hukkerikar</span>
          </p>
        )}
      </div>
    </>
  );

  if (isMobile) {
    return (
      <AnimatePresence>
        {showDrawer && (
          <>
            <motion.div
              key="sidebar-backdrop"
              className="fixed inset-0 z-40 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeSidebar}
            />
            <motion.div
              key="sidebar-drawer"
              className={cn(shellClass, "fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] h-screen")}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
            >
              {navContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <div className={cn(shellClass, "fixed top-0 left-0 z-50 h-screen")}>
      {navContent}
    </div>
  );
}
