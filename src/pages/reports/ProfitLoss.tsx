import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { Card } from "@/components/ui/card";
import { formatINR } from "@/lib/indian";

export default function ProfitLoss() {
  const { current } = useCompany();
  const [income, setIncome] = useState<any[]>([]);
  const [expense, setExpense] = useState<any[]>([]);

  useEffect(() => {
    if (!current) return;
    (async () => {
      const { data: ledgers } = await supabase.from("ledgers").select("id,name,opening_balance,opening_dr_cr,ledger_groups(name,nature)").eq("company_id", current.id);
      const { data: entries } = await supabase.from("voucher_entries").select("ledger_id,entry_type,amount").eq("company_id", current.id);
      const map = new Map<string, number>();
      (entries ?? []).forEach((e: any) => {
        const cur = map.get(e.ledger_id) ?? 0;
        map.set(e.ledger_id, cur + (e.entry_type === "credit" ? Number(e.amount) : -Number(e.amount)));
      });
      const inc: any[] = []; const exp: any[] = [];
      (ledgers ?? []).forEach((l: any) => {
        const nature = l.ledger_groups?.nature;
        const net = map.get(l.id) ?? 0;
        if (nature === "income" && net !== 0) inc.push({ name: l.name, amount: net });
        if (nature === "expenses" && -net !== 0) exp.push({ name: l.name, amount: -net });
      });
      setIncome(inc); setExpense(exp);
    })();
  }, [current]);

  const totalInc = income.reduce((a, r) => a + r.amount, 0);
  const totalExp = expense.reduce((a, r) => a + r.amount, 0);
  const profit = totalInc - totalExp;

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <h1 className="text-xl sm:text-2xl font-bold">Profit & Loss A/c</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h2 className="font-bold mb-3 pb-2 border-b">Expenses (Dr)</h2>
          <ul className="space-y-1.5">
            {expense.map((r, i) => (
              <li key={i} className="flex justify-between text-sm"><span>{r.name}</span><span className="num">{formatINR(r.amount)}</span></li>
            ))}
            {profit > 0 && <li className="flex justify-between text-sm font-semibold text-success"><span>Net Profit</span><span className="num">{formatINR(profit)}</span></li>}
          </ul>
          <div className="mt-3 pt-2 border-t flex justify-between font-bold"><span>Total</span><span className="num">{formatINR(totalExp + Math.max(profit, 0))}</span></div>
        </Card>
        <Card className="p-4">
          <h2 className="font-bold mb-3 pb-2 border-b">Income (Cr)</h2>
          <ul className="space-y-1.5">
            {income.map((r, i) => (
              <li key={i} className="flex justify-between text-sm"><span>{r.name}</span><span className="num">{formatINR(r.amount)}</span></li>
            ))}
            {profit < 0 && <li className="flex justify-between text-sm font-semibold text-destructive"><span>Net Loss</span><span className="num">{formatINR(-profit)}</span></li>}
          </ul>
          <div className="mt-3 pt-2 border-t flex justify-between font-bold"><span>Total</span><span className="num">{formatINR(totalInc + Math.max(-profit, 0))}</span></div>
        </Card>
      </div>
    </div>
  );
}
