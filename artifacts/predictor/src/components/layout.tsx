import { Link, useLocation } from "wouter";
import { useUserContext } from "@/contexts/user";
import { useGetMe } from "@/lib/hooks";
import { Trophy, Home, CalendarDays, LayoutList, User as UserIcon, LogOut, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { clearUserId } = useUserContext();
  const { data: user } = useGetMe();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  const isAdmin = user?.role === "admin";

  const navItems = [
    { href: "/dashboard", label: "Panel", icon: Home },
    { href: "/matches", label: "Partidos", icon: CalendarDays },
    { href: "/groups", label: "Grupos", icon: LayoutList },
    { href: "/bracket", label: "Eliminatoria", icon: Trophy },
    { href: "/leaderboard", label: "Clasificación", icon: Trophy },
    { href: "/profile", label: "Perfil", icon: UserIcon },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden border-b border-border bg-card">
        {/* Colombia tricolor stripe */}
        <div className="flex h-1.5">
          <div className="flex-1 bg-[#FCD116]" />
          <div className="flex-1 bg-[#003893]" />
          <div className="flex-1 bg-[#CE1126]" />
        </div>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-primary" />
            <span className="font-bold tracking-tight">Predictor 26</span>
          </div>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={() => clearUserId()} data-testid="mobile-button-logout">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card/50 min-h-screen sticky top-0">
        {/* Colombia tricolor stripe */}
        <div className="flex h-1.5">
          <div className="flex-1 bg-[#FCD116]" />
          <div className="flex-1 bg-[#003893]" />
          <div className="flex-1 bg-[#CE1126]" />
        </div>
        <div className="p-6 flex items-center gap-3">
          <Trophy className="w-8 h-8 text-primary" />
          <span className="text-xl font-black tracking-tighter uppercase">Predictor 26</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || location.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`} data-testid={`link-${item.label.toLowerCase()}`}>
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}

          {isAdmin && (
            <Link href="/admin" className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${location === '/admin' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`} data-testid="link-admin">
              <ShieldAlert className="w-5 h-5" />
              Admin
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-border">
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground" onClick={() => clearUserId()} data-testid="button-logout">
            <LogOut className="w-5 h-5 mr-3" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-0 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex items-center justify-around p-2 pb-safe z-50">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || location.startsWith(`${item.href}/`);
          return (
            <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-1 p-2 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} data-testid={`mobile-link-${item.label.toLowerCase()}`}>
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
