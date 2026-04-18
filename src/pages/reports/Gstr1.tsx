import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatINR, formatDate } from "@/lib/indian";

export default function Gstr1() {
  const { current } = useCompany();
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    if (!current) return;
    supabase.from("vouchers")
      .select("id,voucher_no,voucher_date,total_amount,place_of_supply,ledgers!vouchers_party_ledger_id_fkey(name,gstin,state_code),voucher_inventory(amount,cgst_amount,sgst_amount,igst_amount,gst_rate)")
      .eq("company_id", current.id).eq("voucher_type", "sales")
      .order("voucher_date", { ascending: false })
      .then(({ data }) => setRows(data ?? []));
  }, [current]);

  const totals = rows.reduce((a, r) => {
    const inv = (r.voucher_inventory ?? []) as any[];
    return {
      taxable: a.taxable + inv.reduce((x, i) => x + Number(i.amount), 0),
      cgst: a.cgst + inv.reduce((x, i) => x + Number(i.cgst_amount), 0),
      sgst: a.sgst + inv.reduce((x, i) => x + Number(i.sgst_amount), 0),
      igst: a.igst + inv.reduce((x, i) => x + Number(i.igst_amount), 0),
      total: a.total + Number(r.total_amount),
    };
  }, { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 });

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <h1 className="text-xl sm:text-2xl font-bold">GSTR-1 Summary <span className="text-sm font-normal text-muted-foreground">(Outward Supplies)</span></h1>
      <Card className="overflow-x-auto">
        <Table className="min-w-[960px]">
          <TableHeader><TableRow>
            <TableHead>Date</TableHead><TableHead>Inv No.</TableHead><TableHead>Party</TableHead>
            <TableHead>GSTIN</TableHead><TableHead>POS</TableHead>
            <TableHead className="text-right">Taxable</TableHead><TableHead className="text-right">CGST</TableHead>
            <TableHead className="text-right">SGST</TableHead><TableHead className="text-right">IGST</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.map(r => {
              const inv = (r.voucher_inventory ?? []) as any[];
              const taxable = inv.reduce((x, i) => x + Number(i.amount), 0);
              const cgst = inv.reduce((x, i) => x + Number(i.cgst_amount), 0);
              const sgst = inv.reduce((x, i) => x + Number(i.sgst_amount), 0);
              const igst = inv.reduce((x, i) => x + Number(i.igst_amount), 0);
              return (
                <TableRow key={r.id} className="tally-row-hover">
                  <TableCell className="num text-xs">{formatDate(r.voucher_date)}</TableCell>
                  <TableCell className="font-mono text-xs">{r.voucher_no}</TableCell>
                  <TableCell>{r.ledgers?.name}</TableCell>
                  <TableCell className="font-mono text-xs">{r.ledgers?.gstin || "—"}</TableCell>
                  <TableCell className="text-xs">{r.place_of_supply}</TableCell>
                  <TableCell className="text-right num">{formatINR(taxable)}</TableCell>
                  <TableCell className="text-right num">{formatINR(cgst)}</TableCell>
                  <TableCell className="text-right num">{formatINR(sgst)}</TableCell>
                  <TableCell className="text-right num">{formatINR(igst)}</TableCell>
                  <TableCell className="text-right num font-semibold">{formatINR(r.total_amount)}</TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 && <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">No sales vouchers</TableCell></TableRow>}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={5} className="font-bold">Totals</TableCell>
              <TableCell className="text-right num font-bold">{formatINR(totals.taxable)}</TableCell>
              <TableCell className="text-right num font-bold">{formatINR(totals.cgst)}</TableCell>
              <TableCell className="text-right num font-bold">{formatINR(totals.sgst)}</TableCell>
              <TableCell className="text-right num font-bold">{formatINR(totals.igst)}</TableCell>
              <TableCell className="text-right num font-bold">{formatINR(totals.total)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </Card>
    </div>
  );
}
