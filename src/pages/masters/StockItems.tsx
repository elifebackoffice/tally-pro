import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { formatINR } from "@/lib/indian";

export default function StockItems() {
  const { current } = useCompany();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (!current) return;
    supabase.from("stock_items").select("*, stock_units(symbol)").eq("company_id", current.id).order("name").then(({ data }) => setItems(data ?? []));
  }, [current]);

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Stock Items</h1>
        <Button asChild className="w-full sm:w-auto"><Link to="/masters/stock-items/new"><Plus className="w-4 h-4 mr-1" />Create</Link></Button>
      </div>
      <Card className="overflow-x-auto">
        <Table className="min-w-[720px]">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead><TableHead>HSN</TableHead><TableHead>Unit</TableHead>
              <TableHead className="text-right">GST %</TableHead><TableHead className="text-right">Op. Qty</TableHead>
              <TableHead className="text-right">Op. Value</TableHead><TableHead className="text-right">Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(i => (
              <TableRow key={i.id} className="tally-row-hover">
                <TableCell className="font-medium">{i.name}</TableCell>
                <TableCell className="font-mono text-xs">{i.hsn_code || "—"}</TableCell>
                <TableCell>{i.stock_units?.symbol || "—"}</TableCell>
                <TableCell className="text-right num">{i.gst_rate}%</TableCell>
                <TableCell className="text-right num">{Number(i.opening_qty).toFixed(3)}</TableCell>
                <TableCell className="text-right num">{formatINR(i.opening_value)}</TableCell>
                <TableCell className="text-right num">{formatINR(i.standard_rate)}</TableCell>
              </TableRow>
            ))}
            {items.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No stock items</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
