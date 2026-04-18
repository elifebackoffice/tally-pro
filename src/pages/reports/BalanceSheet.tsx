import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { Card } from "@/components/ui/card";
import { formatINR } from "@/lib/indian";

export default function BalanceSheet() {
  const { current } = useCompany();
  const [assets, setAssets] = useState<any[]>([]);
  const [liab, setLiab] = useState<any[]>([]);
  const [profit, setProfit] = useState(0);

  useEffect(() => {
    if (!current) return;
    (async () => {
      const { data: ledgers } = await supabase.from("ledgers").select("id,name,opening_balance,opening_dr_cr,ledger_groups(name,nature)").eq("company_id", current.id);
      const { data: entries } = await supabase.from("voucher_entries").select("ledger_id,entry_type,amount").eq("company_id", current.id);
      const map = new Map<string, { dr: number; cr: number }>();
      (entries ?? []).forEach((e: any) => {
        const c = map.get(e.ledger_id) ?? { dr: 0, cr: 0 };
        if (e.entry_type === "debit") c.dr += Number(e.amount); else c.cr += Number(e.amount);
        map.set(e.ledger_id, c);
      });
      const a: any[] = []; const l: any[] = []; let inc = 0; let exp = 0;
      (ledgers ?? []).forEach((row: any) => {
        const m = map.get(row.id) ?? { dr: 0, cr: 0 };
        const opDr = row.opening_dr_cr === "debit" ? Number(row.opening_balance) : 0;
        const opCr = row.opening_dr_cr === "credit" ? Number(row.opening_balance) : 0;
        const net = (opDr + m.dr) - (opCr + m.cr);
        const nature = row.ledger_groups?.nature;
        if (nature === "assets" && net !== 0) a.push({ name: row.name, amount: net });
        if (nature === "liabilities" && -net !== 0) l.push({ name: row.name, amount: -net });
        if (nature === "income") inc += -net;
        if (nature === "expenses") exp += net;
      });
      setAssets(a); setLiab(l); setProfit(inc - exp);
    })();
  }, [current]);

  const totalA = assets.reduce((a, r) => a + r.amount, 0);
  const totalL = liab.reduce((a, r) => a + r.amount, 0) + profit;

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <h1 className="text-xl sm:text-2xl font-bold">Balance Sheet</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h2 className="font-bold mb-3 pb-2 border-b">Liabilities</h2>
          <ul className="space-y-1.5">
            {liab.map((r, i) => <li key={i} className="flex justify-between text-sm"><span>{r.name}</span><span className="num">{formatINR(r.amount)}</span></li>)}
            <li className="flex justify-between text-sm font-semibold"><span>Profit & Loss A/c</span><span className="num">{formatINR(profit)}</span></li>
          </ul>
          <div className="mt-3 pt-2 border-t flex justify-between font-bold"><span>Total</span><span className="num">{formatINR(totalL)}</span></div>
        </Card>
        <Card className="p-4">
          <h2 className="font-bold mb-3 pb-2 border-b">Assets</h2>
          <ul className="space-y-1.5">
            {assets.map((r, i) => <li key={i} className="flex justify-between text-sm"><span>{r.name}</span><span className="num">{formatINR(r.amount)}</span></li>)}
          </ul>
          <div className="mt-3 pt-2 border-t flex justify-between font-bold"><span>Total</span><span className="num">{formatINR(totalA)}</span></div>
        </Card>
      </div>
      {Math.abs(totalA - totalL) > 0.01 && (
        <Card className="p-3 border-warning bg-warning/10 text-sm">
          ⚠ Difference: {formatINR(totalA - totalL)} — check opening balances or unposted entries.
        </Card>
      )}
    </div>
  );
}
