import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatINR } from "@/lib/indian";

export default function TrialBalance() {
  const { current } = useCompany();
  const [rows, setRows] = useState<{ name: string; group: string; dr: number; cr: number }[]>([]);

  useEffect(() => {
    if (!current) return;
    (async () => {
      const { data: ledgers } = await supabase.from("ledgers").select("id,name,opening_balance,opening_dr_cr,ledger_groups(name,nature)").eq("company_id", current.id);
      const { data: entries } = await supabase.from("voucher_entries").select("ledger_id,entry_type,amount").eq("company_id", current.id);
      const map = new Map<string, { dr: number; cr: number }>();
      (entries ?? []).forEach((e: any) => {
        const cur = map.get(e.ledger_id) ?? { dr: 0, cr: 0 };
        if (e.entry_type === "debit") cur.dr += Number(e.amount);
        else cur.cr += Number(e.amount);
        map.set(e.ledger_id, cur);
      });
      const out = (ledgers ?? []).map((l: any) => {
        const m = map.get(l.id) ?? { dr: 0, cr: 0 };
        const opDr = l.opening_dr_cr === "debit" ? Number(l.opening_balance) : 0;
        const opCr = l.opening_dr_cr === "credit" ? Number(l.opening_balance) : 0;
        const net = (opDr + m.dr) - (opCr + m.cr);
        return { name: l.name, group: l.ledger_groups?.name ?? "", dr: net > 0 ? net : 0, cr: net < 0 ? -net : 0 };
      }).filter(r => r.dr !== 0 || r.cr !== 0).sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name));
      setRows(out);
    })();
  }, [current]);

  const totalDr = rows.reduce((a, r) => a + r.dr, 0);
  const totalCr = rows.reduce((a, r) => a + r.cr, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <h1 className="text-xl sm:text-2xl font-bold">Trial Balance</h1>
      <Card className="overflow-x-auto">
        <Table className="min-w-[560px]">
          <TableHeader><TableRow><TableHead>Ledger</TableHead><TableHead>Group</TableHead><TableHead className="text-right">Debit</TableHead><TableHead className="text-right">Credit</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={i} className="tally-row-hover">
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{r.group}</TableCell>
                <TableCell className="text-right num">{r.dr ? formatINR(r.dr) : ""}</TableCell>
                <TableCell className="text-right num">{r.cr ? formatINR(r.cr) : ""}</TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No transactions</TableCell></TableRow>}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2} className="font-bold">Grand Total</TableCell>
              <TableCell className="text-right num font-bold">{formatINR(totalDr)}</TableCell>
              <TableCell className="text-right num font-bold">{formatINR(totalCr)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </Card>
    </div>
  );
}
