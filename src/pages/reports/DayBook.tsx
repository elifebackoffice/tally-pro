import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatINR, formatDate } from "@/lib/indian";

export default function DayBook() {
  const { current } = useCompany();
  const [from, setFrom] = useState(new Date(new Date().getFullYear(), 3, 1).toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    if (!current) return;
    supabase.from("vouchers")
      .select("*, ledgers!vouchers_party_ledger_id_fkey(name)")
      .eq("company_id", current.id)
      .gte("voucher_date", from).lte("voucher_date", to)
      .order("voucher_date", { ascending: false }).order("created_at", { ascending: false })
      .then(({ data }) => setRows(data ?? []));
  }, [current, from, to]);

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <h1 className="text-xl sm:text-2xl font-bold">Day Book</h1>
      <Card className="p-4 flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="flex-1 sm:flex-none"><Label className="text-xs">From</Label><Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="h-8" /></div>
        <div className="flex-1 sm:flex-none"><Label className="text-xs">To</Label><Input type="date" value={to} onChange={e => setTo(e.target.value)} className="h-8" /></div>
      </Card>
      <Card className="overflow-x-auto">
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>No.</TableHead>
              <TableHead>Party</TableHead><TableHead>Narration</TableHead><TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(r => (
              <TableRow key={r.id} className="tally-row-hover">
                <TableCell className="num text-xs">{formatDate(r.voucher_date)}</TableCell>
                <TableCell className="capitalize">{r.voucher_type}</TableCell>
                <TableCell className="font-mono text-xs">{r.voucher_no}</TableCell>
                <TableCell>{r.ledgers?.name ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground text-xs truncate max-w-xs">{r.narration}</TableCell>
                <TableCell className="text-right num font-semibold">{formatINR(r.total_amount)}</TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No vouchers</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
