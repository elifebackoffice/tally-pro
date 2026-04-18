import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatINR } from "@/lib/indian";

export default function StockSummary() {
  const { current } = useCompany();
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    if (!current) return;
    (async () => {
      const { data: items } = await supabase.from("stock_items").select("id,name,opening_qty,opening_rate,opening_value,stock_units(symbol)").eq("company_id", current.id);
      const { data: inv } = await supabase.from("voucher_inventory").select("stock_item_id,quantity,amount,vouchers!inner(voucher_type)").eq("company_id", current.id);
      const moves = new Map<string, { inQ: number; inV: number; outQ: number; outV: number }>();
      (inv ?? []).forEach((r: any) => {
        const t = r.vouchers?.voucher_type;
        const cur = moves.get(r.stock_item_id) ?? { inQ: 0, inV: 0, outQ: 0, outV: 0 };
        if (t === "purchase") { cur.inQ += Number(r.quantity); cur.inV += Number(r.amount); }
        else if (t === "sales") { cur.outQ += Number(r.quantity); cur.outV += Number(r.amount); }
        moves.set(r.stock_item_id, cur);
      });
      const out = (items ?? []).map((it: any) => {
        const m = moves.get(it.id) ?? { inQ: 0, inV: 0, outQ: 0, outV: 0 };
        const closingQ = Number(it.opening_qty) + m.inQ - m.outQ;
        const closingV = Number(it.opening_value) + m.inV - m.outV;
        return { name: it.name, unit: it.stock_units?.symbol || "", openQ: it.opening_qty, inQ: m.inQ, outQ: m.outQ, closingQ, closingV };
      });
      setRows(out);
    })();
  }, [current]);

  const totalV = rows.reduce((a, r) => a + r.closingV, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <h1 className="text-xl sm:text-2xl font-bold">Stock Summary</h1>
      <Card className="overflow-x-auto">
        <Table className="min-w-[760px]">
          <TableHeader><TableRow>
            <TableHead>Item</TableHead><TableHead>Unit</TableHead>
            <TableHead className="text-right">Opening</TableHead><TableHead className="text-right">Inwards</TableHead>
            <TableHead className="text-right">Outwards</TableHead><TableHead className="text-right">Closing Qty</TableHead>
            <TableHead className="text-right">Closing Value</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={i} className="tally-row-hover">
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell>{r.unit}</TableCell>
                <TableCell className="text-right num">{Number(r.openQ).toFixed(3)}</TableCell>
                <TableCell className="text-right num">{r.inQ.toFixed(3)}</TableCell>
                <TableCell className="text-right num">{r.outQ.toFixed(3)}</TableCell>
                <TableCell className="text-right num font-semibold">{r.closingQ.toFixed(3)}</TableCell>
                <TableCell className="text-right num">{formatINR(r.closingV)}</TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No items</TableCell></TableRow>}
          </TableBody>
          <TableFooter>
            <TableRow><TableCell colSpan={6} className="font-bold">Total Stock Value</TableCell><TableCell className="text-right num font-bold">{formatINR(totalV)}</TableCell></TableRow>
          </TableFooter>
        </Table>
      </Card>
    </div>
  );
}
