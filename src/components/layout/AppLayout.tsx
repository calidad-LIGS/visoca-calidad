import { useState, type ReactNode } from "react";
import { Menu, Shield } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { AppSidebar } from "./AppSidebar";

export function AppLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        isMobile={isMobile}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        {isMobile && (
          <header className="flex h-14 shrink-0 items-center gap-3 border-b border-sidebar-border bg-sidebar px-4">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="rounded-md p-1.5 text-foreground transition-colors hover:bg-card"
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-display text-base font-bold tracking-tight text-foreground">
                VISOCA<span className="text-primary">-Calidad</span>
              </span>
            </div>
          </header>
        )}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1400px] p-4 sm:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
