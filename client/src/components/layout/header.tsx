import type { ReactNode } from "react";
import PageHeader, { type NavLink } from "./page-header";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

type HeaderProps = {
  title: string;
  /** Optional; omit on list pages to match Campus Axis compact header */
  subtitle?: string;
  actions?: ReactNode;
  links?: NavLink[];
  className?: string;
};

/**
 * Page chrome: Home + breadcrumbs | actions (filters / search / add).
 */
export default function Header({ title, subtitle, actions, links, className }: HeaderProps) {
  const [location] = useLocation();
  const crumbLinks: NavLink[] = links ?? [{ title, path: location }];

  return (
    <div className={cn("mb-4", className)}>
      <PageHeader links={crumbLinks} actions={actions} />
      {subtitle ? (
        <p className="mt-1 text-[15px] text-muted-foreground sm:pl-[52px]">{subtitle}</p>
      ) : null}
    </div>
  );
}
