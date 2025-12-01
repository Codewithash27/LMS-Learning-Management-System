import { useState } from "react";
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
  Building,
  ChevronLeft,
  Menu,
  Bot,
  UsersRound,
  GraduationCap,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type SidebarLinkProps = {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive?: boolean;
  isCollapsed?: boolean;
};

const SidebarLink = ({ href, icon, children, isActive, isCollapsed }: SidebarLinkProps) => {
  return (
    <Link href={href}>
      <motion.div
        className={cn(
          "flex items-center px-6 py-4 text-gray-600 hover:text-gray-900 transition-all duration-300 group relative overflow-hidden rounded-2xl mx-4 mb-1",
          isActive 
            ? "bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-700 shadow-lg shadow-blue-500/20 border border-blue-200/50" 
            : "hover:bg-white/50 hover:shadow-lg hover:border hover:border-white/30",
          isCollapsed ? "justify-center px-3" : ""
        )}
        whileHover={{ scale: 1.02, x: 5 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Active indicator */}
        {isActive && (
          <motion.div 
            className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-600 rounded-r-full"
            layoutId="activeIndicator"
          />
        )}
        
        <motion.div 
          className={cn(
            "flex items-center transition-colors duration-300",
            isActive ? "text-blue-600" : "text-gray-500 group-hover:text-gray-700"
          )}
          whileHover={{ scale: 1.1 }}
        >
          {icon}
        </motion.div>
        
        <AnimatePresence>
          {!isCollapsed && (
            <motion.span 
              className="ml-3 font-medium text-sm whitespace-nowrap"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Hover arrow */}
        {!isCollapsed && (
          <ChevronRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all duration-300" />
        )}
      </motion.div>
    </Link>
  );
};

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const isMobile = useIsMobile();
  const { sidebarOpen, toggleSidebar } = useSidebar();

  // Don't render sidebar if user is not logged in or if on mobile view
  if (!user || isMobile) return null;

  const isAdmin = user.role === "admin" || user.role === "superadmin";
  const isCollapsed = !sidebarOpen;

  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const isLoggingOut = logoutMutation.isPending;

  return (
    <motion.div 
      className={cn(
        "sidebar fixed h-full z-50 bg-gradient-to-b from-white/90 to-gray-50/90 backdrop-blur-xl border-r border-white/20 shadow-2xl",
        isCollapsed ? "w-20" : "w-80"
      )}
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, type: "spring" }}
    >
      {/* Header */}
      <div className="p-6 border-b border-white/20">
        <motion.div 
          className="flex items-center space-x-3"
          layout
        >
          <motion.div 
            className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25"
            whileHover={{ rotate: 5, scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <BookOpen className="h-6 w-6 text-white" />
          </motion.div>
          
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="text-xl font-bold bg-gradient-to-br from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Edu Transform
                </h1>
                <p className="text-xs text-gray-500 font-medium">
                  Aadi Technology
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Navigation */}
      <div className="py-6 overflow-y-auto h-[calc(100vh-200px)]">
        {isAdmin ? (
          <>
            <motion.p 
              className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {!isCollapsed && "Management"}
            </motion.p>
            
            <SidebarLink
              href="/admin/dashboard"
              icon={<LayoutDashboard className="h-5 w-5" />}
              isActive={location === "/admin/dashboard" || location === "/"}
              isCollapsed={isCollapsed}
            >
              Dashboard
            </SidebarLink>
            <SidebarLink
              href="/admin/courses"
              icon={<BookOpen className="h-5 w-5" />}
              isActive={location === "/admin/courses"}
              isCollapsed={isCollapsed}
            >
              Courses
            </SidebarLink>
            <SidebarLink
              href="/admin/exams"
              icon={<ClipboardList className="h-5 w-5" />}
              isActive={location === "/admin/exams"}
              isCollapsed={isCollapsed}
            >
              Exams
            </SidebarLink>
            <SidebarLink
              href="/admin/grading"
              icon={<GraduationCap className="h-5 w-5" />}
              isActive={location === "/admin/grading"}
              isCollapsed={isCollapsed}
            >
              Grading
            </SidebarLink>
            <SidebarLink
              href="/admin/students"
              icon={<Users className="h-5 w-5" />}
              isActive={location === "/admin/students"}
              isCollapsed={isCollapsed}
            >
              Students
            </SidebarLink>
            <SidebarLink
              href="/admin/batches"
              icon={<UsersRound className="h-5 w-5" />}
              isActive={location === "/admin/batches"}
              isCollapsed={isCollapsed}
            >
              Batches
            </SidebarLink>
            <SidebarLink
              href="/admin/reports"
              icon={<BarChart2 className="h-5 w-5" />}
              isActive={location === "/admin/reports"}
              isCollapsed={isCollapsed}
            >
              Reports
            </SidebarLink>

            <motion.p 
              className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {!isCollapsed && "Account"}
            </motion.p>
            <SidebarLink
              href="/admin/profile"
              icon={<UserIcon className="h-5 w-5" />}
              isActive={location === "/admin/profile"}
              isCollapsed={isCollapsed}
            >
              Profile
            </SidebarLink>
          </>
        ) : (
          <>
            <motion.p 
              className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {!isCollapsed && "Learning"}
            </motion.p>
            
            <SidebarLink
              href="/student/dashboard"
              icon={<LayoutDashboard className="h-5 w-5" />}
              isActive={location === "/student/dashboard" || location === "/"}
              isCollapsed={isCollapsed}
            >
              Dashboard
            </SidebarLink>
            <SidebarLink
              href="/student/my-courses"
              icon={<BookOpenCheck className="h-5 w-5" />}
              isActive={location === "/student/my-courses"}
              isCollapsed={isCollapsed}
            >
              My Courses
            </SidebarLink>
            <SidebarLink
              href="/student/upcoming-exams"
              icon={<CalendarClock className="h-5 w-5" />}
              isActive={location === "/student/upcoming-exams"}
              isCollapsed={isCollapsed}
            >
              Upcoming Exams
            </SidebarLink>
            <SidebarLink
              href="/student/results"
              icon={<PieChart className="h-5 w-5" />}
              isActive={location === "/student/results"}
              isCollapsed={isCollapsed}
            >
              Results & Progress
            </SidebarLink>
            <SidebarLink
              href="/student/ai-assistant"
              icon={<Bot className="h-5 w-5" />}
              isActive={location === "/student/ai-assistant"}
              isCollapsed={isCollapsed}
            >
              AI Assistant
            </SidebarLink>

            <motion.p 
              className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {!isCollapsed && "Account"}
            </motion.p>
            <SidebarLink
              href="/student/profile"
              icon={<UserIcon className="h-5 w-5" />}
              isActive={location === "/student/profile"}
              isCollapsed={isCollapsed}
            >
              My Profile
            </SidebarLink>
          </>
        )}
      </div>

      {/* Footer with User Info */}
      <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/20 bg-white/50 backdrop-blur-sm">
        <div className="flex items-center space-x-3 mb-4">
          <motion.div 
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg"
            whileHover={{ scale: 1.05 }}
          >
            {user.firstName?.charAt(0)}
            {user.lastName?.charAt(0)}
          </motion.div>
          
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500 capitalize font-medium">
                  {user.role}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={cn(
            "w-full flex items-center justify-center p-3 rounded-2xl text-sm font-medium transition-all duration-300 group",
            isCollapsed ? "px-3" : "px-4",
            isLoggingOut 
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
              : 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-600 hover:from-red-50 hover:to-red-100 hover:text-red-600 hover:shadow-lg border border-white/50'
          )}
          whileHover={!isLoggingOut ? { scale: 1.02, x: 2 } : {}}
          whileTap={!isLoggingOut ? { scale: 0.98 } : {}}
        >
          {isLoggingOut ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-blue-500" />
          ) : (
            <>
              <LogOut className={cn("h-4 w-4 transition-transform duration-300 group-hover:rotate-12", isCollapsed ? "" : "mr-2")} />
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    Sign Out
                  </motion.span>
                )}
              </AnimatePresence>
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}