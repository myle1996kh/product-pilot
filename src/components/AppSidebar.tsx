import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Plus,
  FolderOpen,
  Settings,
  HelpCircle,
  Sparkles,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/create", icon: Plus, label: "New Project" },
];

export function AppSidebar() {
  const location = useLocation();
  const { user, signOut } = useAuth();

  const { data: projects } = useQuery({
    queryKey: ["projects-sidebar", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("projects")
        .select("id, name")
        .order("updated_at", { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!user,
  });

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar px-3 py-4">
      <Link to="/" className="mb-8 flex items-center gap-2.5 px-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-display text-lg font-semibold text-sidebar-foreground">
          PlanForge
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        {projects && projects.length > 0 && (
          <>
            <div className="mt-6 px-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Recent Projects
              </p>
            </div>
            {projects.map((p) => (
              <Link
                key={p.id}
                to={`/project/${p.id}`}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  location.pathname.includes(p.id)
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <FolderOpen className="h-3.5 w-3.5" />
                <span className="truncate">{p.name}</span>
              </Link>
            ))}
          </>
        )}
      </nav>

      <div className="flex flex-col gap-1 border-t border-sidebar-border pt-3">
        <Link
          to="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <button
          onClick={signOut}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
