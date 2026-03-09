import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Plus, FolderOpen, Settings, HelpCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/create", icon: Plus, label: "New Project" },
];

const bottomItems = [
  { to: "/settings", icon: Settings, label: "Settings" },
  { to: "/help", icon: HelpCircle, label: "Help" },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar px-3 py-4">
      {/* Logo */}
      <Link to="/" className="mb-8 flex items-center gap-2.5 px-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-display text-lg font-semibold text-sidebar-foreground">
          PlanForge
        </span>
      </Link>

      {/* Main nav */}
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

        {/* Recent projects section */}
        <div className="mt-6 px-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Recent Projects
          </p>
        </div>
        {["E-commerce MVP", "SaaS Dashboard", "Mobile App"].map((name, i) => (
          <Link
            key={i}
            to={`/project/${i + 1}`}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              location.pathname === `/project/${i + 1}`
                ? "bg-sidebar-accent text-sidebar-primary"
                : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            )}
          >
            <FolderOpen className="h-3.5 w-3.5" />
            {name}
          </Link>
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="flex flex-col gap-1 border-t border-sidebar-border pt-3">
        {bottomItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </div>
    </aside>
  );
}
