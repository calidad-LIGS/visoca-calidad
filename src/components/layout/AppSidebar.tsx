import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Calendar,
  BarChart2,
  FileText,
  ClipboardCheck,
  AlertTriangle,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { ROLE_LABELS } from "@/lib/roles";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  gerenteOnly?: boolean;
}

const NAV: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/calendario", label: "Calendario", icon: Calendar },
  { to: "/proyectos", label: "Proyectos", icon: BarChart2 },
  { to: "/documentos", label: "Documentos", icon: FileText },
  { to: "/auditorias", label: "Auditorías", icon: ClipboardCheck },
  { to: "/no-conformidades", label: "No Conformidades", icon: AlertTriangle },
  { to: "/configuracion", label: "Configuración", icon: Settings, gerenteOnly: true },
];

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function AppSidebar({
  collapsed,
  onToggle,
  isMobile = false,
  isMobileOpen = false,
  onMobileClose,
}: {
  collapsed: boolean;
  onToggle: () => void;
  isMobile?: boolean;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}) {
  const { perfil, roles, isGerente, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const items = NAV.filter((i) => !i.gerenteOnly || isGerente);
  const roleLabel = roles[0] ? ROLE_LABELS[roles[0]] : "—";

  // On mobile the sidebar is always full-width (never visually collapsed).
  const isCollapsed = isMobile ? false : collapsed;

  // On mobile, when the drawer is closed, render nothing in the layout flow.
  if (isMobile && !isMobileOpen) return null;

  const aside = (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200",
        isMobile
          ? "fixed inset-y-0 left-0 z-50 w-64 shadow-xl"
          : isCollapsed
            ? "w-16"
            : "w-60",
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-4">
        <Shield className="h-7 w-7 shrink-0 text-primary" />
        {!isCollapsed && (
          <span className="font-display text-lg font-bold tracking-tight text-foreground">
            VISOCA<span className="text-primary">-Calidad</span>
          </span>
        )}
        {isMobile && (
          <button
            onClick={onMobileClose}
            className="ml-auto rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-2">
        {items.map((item) => {
          const active =
            item.to === "/"
              ? pathname === "/"
              : pathname.startsWith(item.to);
          const Icon = item.icon;
          const link = (
            <Link
              key={item.to}
              to={item.to}
              onClick={isMobile ? onMobileClose : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isCollapsed && "justify-center px-0",
                active
                  ? "border-l-[3px] border-primary bg-card text-foreground"
                  : "border-l-[3px] border-transparent text-sidebar-foreground hover:bg-card hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
          return isCollapsed ? (
            <Tooltip key={item.to} delayDuration={0}>
              <TooltipTrigger asChild>{link}</TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          ) : (
            link
          );
        })}
      </nav>

      {/* User + toggle */}
      <div className="border-t border-sidebar-border p-2">
        <div
          className={cn(
            "flex items-center gap-3 rounded-md px-2 py-2",
            isCollapsed && "justify-center px-0",
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
            {perfil ? initials(perfil.nombre_completo) : "··"}
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {perfil?.nombre_completo ?? "Usuario"}
              </p>
              <p className="truncate text-xs text-muted-foreground">{roleLabel}</p>
            </div>
          )}
          {!isCollapsed && (
            <button
              onClick={() => signOut()}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-card hover:text-destructive"
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>

        {!isMobile && (
          <button
            onClick={onToggle}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-md py-2 text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span className="text-xs">Colapsar</span>
              </>
            )}
          </button>
        )}
      </div>
    </aside>
  );

  if (isMobile) {
    return (
      <>
        <div
          className="fixed inset-0 z-40 bg-black/60"
          onClick={onMobileClose}
          aria-hidden="true"
        />
        {aside}
      </>
    );
  }

  return aside;
}
