import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { colorTokens } from "@/tokens/colors";
import { useAuth } from "@/hooks/use-auth";

export type NavLink = {
  title: string;
  path: string;
};

export type PageHeaderProps = {
  links: NavLink[];
  homePath?: string;
  actions?: ReactNode;
  className?: string;
};

/**
 * PageHeader — Home button + breadcrumb trail + optional actions.
 */
export default function PageHeader({
  links,
  homePath,
  actions,
  className,
}: PageHeaderProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const resolvedHome =
    homePath ??
    (user?.role === "student" ? "/student/dashboard" : "/admin/dashboard");

  return (
    <div
      className={cn(
        "flex w-full flex-col items-stretch justify-between gap-2 py-1 lg:flex-row lg:items-center",
        className
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <Link href={resolvedHome}>
          <button
            type="button"
            aria-label="Home"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-[0_4px_12px_rgba(78,205,196,0.2)] transition-all duration-200 hover:scale-110 hover:shadow-[0_6px_16px_rgba(78,205,196,0.3)]"
            style={{
              background: `linear-gradient(135deg, ${colorTokens.preschool.turquoise.main} 0%, ${colorTokens.primary.main} 100%)`,
            }}
          >
            <Home className="h-5 w-5" />
          </button>
        </Link>

        {links.slice(0, -1).map((link, index) => (
          <div key={`${link.path}-${index}`} className="flex items-center gap-1.5">
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            <button
              type="button"
              className="whitespace-nowrap text-sm font-medium text-foreground hover:font-bold sm:text-[15px]"
              onClick={() => setLocation(link.path)}
            >
              {link.title}
            </button>
          </div>
        ))}

        {links.length > 0 && (
          <>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="whitespace-nowrap text-base font-bold text-foreground sm:text-lg">
              {links[links.length - 1].title}
            </span>
          </>
        )}
      </div>

      {actions != null && (
        <div className="flex min-w-0 flex-shrink-0 flex-wrap items-center justify-start gap-2 lg:ml-auto lg:justify-end">
          {actions}
        </div>
      )}
    </div>
  );
}
