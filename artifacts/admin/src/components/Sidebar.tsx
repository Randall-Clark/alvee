import { BarChart2, Calendar, Home, LogOut, Settings, Users, DollarSign } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Vue d'ensemble", icon: Home, path: "/" },
  { label: "Utilisateurs", icon: Users, path: "/users" },
  { label: "Événements", icon: Calendar, path: "/events" },
  { label: "Revenus", icon: DollarSign, path: "/revenue" },
  { label: "Statistiques", icon: BarChart2, path: "/stats" },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-60 shrink-0 bg-sidebar flex flex-col h-screen sticky top-0 border-r border-sidebar-border">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(43,82%,54%)" }}>
          <span className="text-sm font-black text-gray-900">A</span>
        </div>
        <div>
          <p className="text-sidebar-foreground text-sm font-bold leading-none">Alvee</p>
          <p className="text-sidebar-foreground/50 text-[10px] mt-0.5">Admin Dashboard</p>
        </div>
      </div>

      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {NAV.map(({ label, icon: Icon, path }) => {
          const active = location === path || (path !== "/" && location.startsWith(path));
          return (
            <Link key={path} href={path}>
              <div className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}>
                <Icon size={16} />
                {label}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="px-2 pb-4 border-t border-sidebar-border pt-3 space-y-0.5">
        <Link href="/settings">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground text-sm transition-colors">
            <Settings size={16} />
            Paramètres
          </div>
        </Link>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-red-400 hover:bg-red-500/10 text-sm transition-colors">
          <LogOut size={16} />
          Déconnexion
        </div>
      </div>
    </aside>
  );
}
