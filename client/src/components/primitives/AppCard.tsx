import * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type AppCardPaddingSize = "normal" | "dense" | "none";

export type AppCardProps = React.HTMLAttributes<HTMLDivElement> & {
  paddingSize?: AppCardPaddingSize;
};

const paddingMap = {
  normal: "p-6",
  dense: "p-4",
  none: "",
} as const;

/** Soft SaaS card: 24px radius, warm border, light shadow. */
export default function AppCard({
  children,
  paddingSize = "normal",
  className,
  ...props
}: AppCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)} {...props}>
      {paddingSize === "none" ? (
        children
      ) : (
        <div className={paddingMap[paddingSize]}>{children}</div>
      )}
    </Card>
  );
}
