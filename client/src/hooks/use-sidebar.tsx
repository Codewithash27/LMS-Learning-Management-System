import { createContext, ReactNode, useContext, useState, useEffect, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

type SidebarContextType = {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  closeSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextType | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpenState] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const savedPreference = localStorage.getItem("sidebar-open");
    if (isMobile) {
      setSidebarOpenState(false);
    } else if (savedPreference !== null) {
      setSidebarOpenState(savedPreference === "true");
    } else {
      setSidebarOpenState(true);
    }
    setHydrated(true);
  }, [isMobile]);

  const setSidebarOpen = useCallback((open: boolean) => {
    setSidebarOpenState(open);
    if (!isMobile) {
      localStorage.setItem("sidebar-open", String(open));
    }
  }, [isMobile]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpenState((prev) => {
      const next = !prev;
      if (!isMobile) {
        localStorage.setItem("sidebar-open", String(next));
      }
      return next;
    });
  }, [isMobile]);

  const closeSidebar = useCallback(() => {
    setSidebarOpenState(false);
  }, []);

  // Avoid flash before we know mobile vs desktop
  if (!hydrated && typeof window !== "undefined") {
    // still render children; default state is fine
  }

  return (
    <SidebarContext.Provider
      value={{
        sidebarOpen,
        toggleSidebar,
        setSidebarOpen,
        closeSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
