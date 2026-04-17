import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Groups() {
  const { current } = useCompany();
  const [groups, setGroups] = useState<any[]>([]);
  useEffect(() => {
    if (!current) return;
    supabase.from("ledger_groups").select("*").eq("company_id", current.id).order("nature").order("name").then(({ data }) => setGroups(data ?? []));
  }, [current]);
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Ledger Groups</h1>
      <Card>
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Nature</TableHead><TableHead>Primary</TableHead></TableRow></TableHeader>
          <TableBody>
            {groups.map(g => (
              <TableRow key={g.id} className="tally-row-hover">
                <TableCell className="font-medium">{g.name}</TableCell>
                <TableCell className="capitalize">{g.nature}</TableCell>
                <TableCell>{g.is_primary ? "✓" : ""}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
