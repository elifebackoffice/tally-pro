import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INDIAN_STATES } from "@/lib/indian";
import { toast } from "sonner";

export default function LedgerNew() {
  const { current } = useCompany();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: "", group_id: "", opening_balance: "0", opening_dr_cr: "debit" as "debit" | "credit",
    gstin: "", state: "", state_code: "", address: "", email: "", phone: "", pan: "",
  });

  useEffect(() => {
    if (!current) return;
    supabase.from("ledger_groups").select("id,name,nature").eq("company_id", current.id).order("name").then(({ data }) => setGroups(data ?? []));
  }, [current]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!current || !form.group_id) return;
    const { error } = await supabase.from("ledgers").insert({
      company_id: current.id,
      group_id: form.group_id,
      name: form.name,
      opening_balance: Number(form.opening_balance) || 0,
      opening_dr_cr: form.opening_dr_cr,
      gstin: form.gstin || null,
      state: form.state || null,
      state_code: form.state_code || null,
      address: form.address || null,
      email: form.email || null,
      phone: form.phone || null,
      pan: form.pan || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Ledger created");
    navigate("/masters/ledgers");
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="p-6">
        <h1 className="text-xl font-bold mb-4">Ledger Creation</h1>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><Label>Name *</Label><Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div className="md:col-span-2">
            <Label>Under Group *</Label>
            <Select value={form.group_id} onValueChange={(v) => setForm({ ...form, group_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select group" /></SelectTrigger>
              <SelectContent className="max-h-72">
                {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Opening Balance</Label><Input type="number" step="0.01" value={form.opening_balance} onChange={e => setForm({ ...form, opening_balance: e.target.value })} /></div>
          <div>
            <Label>Dr / Cr</Label>
            <Select value={form.opening_dr_cr} onValueChange={(v: any) => setForm({ ...form, opening_dr_cr: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="debit">Dr</SelectItem><SelectItem value="credit">Cr</SelectItem></SelectContent>
            </Select>
          </div>
          <div><Label>GSTIN</Label><Input value={form.gstin} onChange={e => setForm({ ...form, gstin: e.target.value.toUpperCase() })} /></div>
          <div>
            <Label>State</Label>
            <Select value={form.state} onValueChange={(v) => { const s = INDIAN_STATES.find(x => x.name === v); setForm({ ...form, state: v, state_code: s?.code ?? "" }); }}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent className="max-h-72">{INDIAN_STATES.map(s => <SelectItem key={s.code} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2"><Label>Address</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
          <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="md:col-span-2 flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel (Esc)</Button>
            <Button type="submit">Accept</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
