import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { useCompany } from "@/contexts/CompanyContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/indian";
import { Book, FileText, Package, BarChart3, ScrollText, Receipt, ArrowLeftRight, BookOpen } from "lucide-react";

const tiles = [
  { label: "Masters", icon: Book, items: [
    { name: "Ledgers", path: "/masters/ledgers" },
    { name: "Stock Items", path: "/masters/stock-items" },
    { name: "Groups", path: "/masters/groups" },
  ]},
  { label: "Vouchers", icon: Receipt, items: [
    { name: "Sales (F8)", path: "/voucher/sales" },
    { name: "Purchase (F9)", path: "/voucher/purchase" },
    { name: "Receipt (F6)", path: "/voucher/receipt" },
    { name: "Payment (F5)", path: "/voucher/payment" },
    { name: "Contra (F4)", path: "/voucher/contra" },
    { name: "Journal (F7)", path: "/voucher/journal" },
  ]},
  { label: "Reports", icon: BarChart3, items: [
    { name: "Day Book", path: "/reports/day-book" },
    { name: "Trial Balance", path: "/reports/trial-balance" },
    { name: "Profit & Loss", path: "/reports/profit-loss" },
    { name: "Balance Sheet", path: "/reports/balance-sheet" },
    { name: "Stock Summary", path: "/reports/stock-summary" },
    { name: "GSTR-1 Summary", path: "/reports/gstr1" },
  ]},
];

export default function Gateway() {
  const { current } = useCompany();
  const [stats, setStats] = useState({ vouchers: 0, ledgers: 0, items: 0, revenue: 0 });

  useEffect(() => {
    if (!current) return;
    (async () => {
      const [v, l, i, sales] = await Promise.all([
        supabase.from("vouchers").select("id", { count: "exact", head: true }).eq("company_id", current.id),
        supabase.from("ledgers").select("id", { count: "exact", head: true }).eq("company_id", current.id),
        supabase.from("stock_items").select("id", { count: "exact", head: true }).eq("company_id", current.id),
        supabase.from("vouchers").select("total_amount").eq("company_id", current.id).eq("voucher_type", "sales"),
      ]);
      const revenue = (sales.data ?? []).reduce((a, r: any) => a + Number(r.total_amount || 0), 0);
      setStats({ vouchers: v.count ?? 0, ledgers: l.count ?? 0, items: i.count ?? 0, revenue });
    })();
  }, [current]);

  if (!current) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{current.name}</h1>
        <p className="text-sm text-muted-foreground">Gateway of Tally · {current.state} · GSTIN {current.gstin || "—"}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={ScrollText} label="Vouchers" value={String(stats.vouchers)} />
        <StatCard icon={BookOpen} label="Ledgers" value={String(stats.ledgers)} />
        <StatCard icon={Package} label="Stock Items" value={String(stats.items)} />
        <StatCard icon={ArrowLeftRight} label="Sales (FY)" value={formatINR(stats.revenue, { showSymbol: true })} />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {tiles.map(t => (
          <Card key={t.label} className="p-5">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b">
              <t.icon className="w-4 h-4 text-primary" />
              <h2 className="font-semibold">{t.label}</h2>
            </div>
            <ul className="space-y-1">
              {t.items.map(item => (
                <li key={item.path}>
                  <Link to={item.path} className="block px-2 py-1.5 rounded text-sm hover:bg-accent/15 hover:text-accent-foreground transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <Card className="p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded bg-primary/10 text-primary flex items-center justify-center"><Icon className="w-5 h-5" /></div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-lg font-bold num">{value}</div>
      </div>
    </Card>
  );
}
