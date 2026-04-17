import { ReactNode, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogOut, Plus, Calendar } from "lucide-react";
import { formatDate } from "@/lib/indian";

const MENU = [
  { key: "F1", label: "Company", path: "/companies" },
  { key: "F4", label: "Contra", path: "/voucher/contra" },
  { key: "F5", label: "Payment", path: "/voucher/payment" },
  { key: "F6", label: "Receipt", path: "/voucher/receipt" },
  { key: "F7", label: "Journal", path: "/voucher/journal" },
  { key: "F8", label: "Sales", path: "/voucher/sales" },
  { key: "F9", label: "Purchase", path: "/voucher/purchase" },
];

export const TallyShell = ({ children }: { children: ReactNode }) => {
  const { user, signOut } = useAuth();
  const { companies, current, setCurrent } = useCompany();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const m = MENU.find(x => x.key.toLowerCase() === e.key.toLowerCase());
      if (m) { e.preventDefault(); navigate(m.path); return; }
      if (e.key === "Escape") { e.preventDefault(); if (location.pathname !== "/") navigate(-1); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate, location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top title bar */}
      <header className="bg-menubar text-menubar-foreground border-b border-menubar-hover">
        <div className="px-4 py-2 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-accent text-accent-foreground flex items-center justify-center font-bold">T</div>
            <div>
              <div className="font-bold text-sm leading-tight">TallyBooks ERP</div>
              <div className="text-[10px] opacity-75 leading-tight">Gateway of Tally · India · INR</div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {current && (
              <div className="flex items-center gap-2 text-xs opacity-90">
                <Calendar className="w-3.5 h-3.5" />
                <span className="num">{formatDate(current.fy_start)} → {formatDate(current.fy_end)}</span>
              </div>
            )}
            {companies.length > 0 && current && (
              <Select value={current.id} onValueChange={(v) => { const c = companies.find(x => x.id === v); if (c) setCurrent(c); }}>
                <SelectTrigger className="h-8 w-56 bg-menubar-hover border-menubar-hover text-menubar-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Button size="sm" variant="ghost" onClick={() => navigate("/companies/new")} className="text-menubar-foreground hover:bg-menubar-hover h-8">
              <Plus className="w-4 h-4 mr-1" /> Company
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { signOut(); navigate("/auth"); }} className="text-menubar-foreground hover:bg-menubar-hover h-8">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* F-key bar */}
        <nav className="px-4 py-1 flex items-center gap-1 border-t border-menubar-hover bg-menubar/95">
          {MENU.map(m => (
            <Link key={m.key} to={m.path} className="tally-menu-item">
              <span className="tally-key">{m.key}</span>
              <span>{m.label}</span>
            </Link>
          ))}
          <div className="ml-auto flex items-center gap-1">
            <Link to="/reports" className="tally-menu-item"><span>Reports</span></Link>
            <Link to="/masters" className="tally-menu-item"><span>Masters</span></Link>
          </div>
        </nav>
      </header>

      <main className="flex-1 p-4 md:p-6">{children}</main>

      <footer className="bg-statusbar text-statusbar-foreground text-xs px-4 py-1.5 flex items-center justify-between">
        <div>{user?.email}</div>
        <div className="flex items-center gap-4">
          <span>Press <span className="tally-key">Esc</span> to go back</span>
          <span className="num">{formatDate(new Date())}</span>
        </div>
      </footer>
    </div>
  );
};
