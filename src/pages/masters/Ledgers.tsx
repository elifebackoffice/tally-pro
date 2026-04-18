import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { formatINR } from "@/lib/indian";

export default function Ledgers() {
  const { current } = useCompany();
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!current) return;
    supabase.from("ledgers").select("*, ledger_groups(name, nature)").eq("company_id", current.id).order("name").then(({ data }) => setLedgers(data ?? []));
  }, [current]);

  const filtered = ledgers.filter(l => l.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Ledgers</h1>
          <p className="text-sm text-muted-foreground">{ledgers.length} ledger accounts</p>
        </div>
        <Button asChild className="w-full sm:w-auto"><Link to="/masters/ledgers/new"><Plus className="w-4 h-4 mr-1" />Create (Alt+C)</Link></Button>
      </div>
      <Input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
      <Card className="overflow-x-auto">
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>GSTIN</TableHead>
              <TableHead className="text-right">Opening</TableHead>
              <TableHead>Dr/Cr</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(l => (
              <TableRow key={l.id} className="tally-row-hover">
                <TableCell className="font-medium">{l.name}</TableCell>
                <TableCell className="text-muted-foreground">{l.ledger_groups?.name}</TableCell>
                <TableCell className="font-mono text-xs">{l.gstin || "—"}</TableCell>
                <TableCell className="text-right num">{formatINR(l.opening_balance)}</TableCell>
                <TableCell className="uppercase text-xs">{l.opening_dr_cr === "debit" ? "Dr" : "Cr"}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No ledgers</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
