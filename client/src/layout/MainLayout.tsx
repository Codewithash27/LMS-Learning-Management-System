import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  BookOpen,
  ChevronDown,
  LogOut,
  Lock,
  Menu,
  User as UserIcon,
} from "lucide-react";
import Sidebar from "@/components/layout/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { getFirstName, getTimeGreeting } from "@/lib/greeting";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { colorTokens } from "@/tokens/colors";

type MainLayoutProps = {
  children: ReactNode;
};

export default function MainLayout({ children }: MainLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const {
    collapsed,
    toggleCollapsed,
    mobileOpen,
    setMobileOpen,
    closeMobile,
  } = useSidebar();
  const isMobile = useIsMobile();
  const [location, setLocation] = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Close user menu + mobile drawer on route change. Never touch desktop collapse.
  useEffect(() => {
    setUserMenuOpen(false);
    closeMobile();
  }, [location, closeMobile]);

  const greeting = getTimeGreeting();
  const firstName = getFirstName(
    user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username : "User"
  );

  const homePath =
    user?.role === "student" ? "/student/dashboard" : "/admin/dashboard";
  const profilePath =
    user?.role === "student" ? "/student/profile" : "/admin/profile";

  const handleLogout = useCallback(() => {
    setUserMenuOpen(false);
    logoutMutation.mutate();
  }, [logoutMutation]);

  const initials =
    `${user?.firstName?.charAt(0) || ""}${user?.lastName?.charAt(0) || ""}`.toUpperCase() ||
    "U";

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        mobileOpen={isMobile && mobileOpen}
        onMobileClose={closeMobile}
        collapsed={!isMobile && collapsed}
        onToggleCollapse={toggleCollapsed}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-app-main transition-[width,margin] duration-300 ease-out">
        <header className="sticky top-0 z-30 border-b border-[var(--color-border-subtle)] glass-appbar">
          <div className="flex h-12 items-center justify-between gap-2 px-3 sm:h-12 sm:px-4 md:px-5">
            <div className="flex min-w-0 items-center gap-2">
              {isMobile && (
                <button
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  className="rounded-lg p-1.5 text-foreground hover:bg-black/5"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
              )}

              <Link href={homePath}>
                <div className="flex min-w-0 cursor-pointer items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-brand shadow-sm md:hidden">
                    <BookOpen className="h-4 w-4 text-white" />
                  </div>
                  <span className="truncate text-sm font-bold text-foreground md:hidden">
                    Edu Transform
                  </span>
                </div>
              </Link>
            </div>

            {user && (
              <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3">
                <p className="hidden max-w-[140px] truncate text-right text-[0.82rem] font-extrabold tracking-tight text-foreground sm:block sm:max-w-[260px] sm:text-[0.92rem] md:max-w-[320px] md:text-base">
                  {greeting.text},{" "}
                  <span style={{ color: colorTokens.primary.main }}>{firstName}</span>{" "}
                  <span className="animate-wave-hand text-base">👋</span>
                </p>

                <DropdownMenu open={userMenuOpen} onOpenChange={setUserMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-[14px] border border-transparent px-1.5 py-1 transition-all duration-200 hover:border-black/[0.04] hover:bg-white/80 hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)] sm:gap-3 sm:px-3"
                    >
                      <div className="hidden flex-col items-end lg:flex">
                        <span className="text-sm font-bold leading-tight text-foreground">
                          {user.firstName} {user.lastName}
                        </span>
                        <span
                          className={cn(
                            "mt-0.5 inline-block rounded px-1.5 py-0.5 text-[0.65rem] font-extrabold uppercase tracking-wide",
                            user.role === "superadmin"
                              ? "bg-brand-lavender/10 text-brand-lavender"
                              : "bg-black/[0.04] text-muted-foreground"
                          )}
                        >
                          {user.role}
                        </span>
                      </div>
                      <Avatar className="h-9 w-9 border-2 border-white shadow-[0_4px_12px_rgba(15,118,110,0.25)] sm:h-[42px] sm:w-[42px]">
                        {user.profilePhoto ? (
                          <AvatarImage src={user.profilePhoto} alt="" />
                        ) : null}
                        <AvatarFallback className="bg-accent-brand text-sm font-bold text-white">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-[260px] rounded-[20px] border border-black/[0.06] p-2 shadow-[0_12px_32px_rgba(0,0,0,0.1)]"
                  >
                    <div className="mb-1 rounded-[14px] bg-black/[0.02] px-3 py-3">
                      <p className="text-sm font-extrabold text-foreground">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {user.email || user.username}
                      </p>
                    </div>
                    <DropdownMenuItem
                      className="cursor-pointer gap-3 rounded-xl py-3 font-semibold"
                      onClick={() => setLocation(profilePath)}
                    >
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                      Account Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer gap-3 rounded-xl py-3 font-semibold"
                      onClick={() => setLocation(profilePath)}
                    >
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      Security Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="my-1 opacity-50" />
                    <DropdownMenuItem
                      className="cursor-pointer gap-3 rounded-xl py-3 font-bold text-destructive focus:text-destructive"
                      onClick={handleLogout}
                      disabled={logoutMutation.isPending}
                    >
                      <LogOut className="h-4 w-4" />
                      Logout Session
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </header>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto">
          <div className="w-full min-w-0 px-3 py-2 sm:px-4 md:px-5">
            {children}
          </div>
        </main>

        <footer className="sticky bottom-0 z-20 flex h-10 shrink-0 items-center justify-between border-t border-[var(--color-border-subtle)] bg-white px-3 sm:px-4">
          <div className="flex items-center gap-1.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-brand">
              <BookOpen className="h-3 w-3 text-white" />
            </div>
            <span className="hidden text-[11px] font-semibold text-foreground sm:inline">
              Edu Transform
            </span>
          </div>
          <p className="min-w-0 truncate text-center text-[10px] font-medium text-muted-foreground">
            © {new Date().getFullYear()} Edu Transform. All rights reserved to Aman Hukkerikar
          </p>
          <div className="hidden w-14 shrink-0 sm:block" />
        </footer>
      </div>
    </div>
  );
}

export { MainLayout as DashboardLayout };
