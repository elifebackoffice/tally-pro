import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GST_RATES } from "@/lib/indian";
import { toast } from "sonner";

export default function StockItemNew() {
  const { current } = useCompany();
  const navigate = useNavigate();
  const [units, setUnits] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: "", hsn_code: "", gst_rate: "18", unit_id: "", group_id: "",
    opening_qty: "0", opening_rate: "0", standard_rate: "0",
  });

  useEffect(() => {
    if (!current) return;
    Promise.all([
      supabase.from("stock_units").select("id,symbol").eq("company_id", current.id),
      supabase.from("stock_groups").select("id,name").eq("company_id", current.id),
    ]).then(([u, g]) => { setUnits(u.data ?? []); setGroups(g.data ?? []); });
  }, [current]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!current) return;
    const qty = Number(form.opening_qty) || 0;
    const rate = Number(form.opening_rate) || 0;
    const { error } = await supabase.from("stock_items").insert({
      company_id: current.id, name: form.name, hsn_code: form.hsn_code || null,
      gst_rate: Number(form.gst_rate), unit_id: form.unit_id || null, group_id: form.group_id || null,
      opening_qty: qty, opening_rate: rate, opening_value: qty * rate,
      standard_rate: Number(form.standard_rate) || 0,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Stock item created");
    navigate("/masters/stock-items");
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="p-6">
        <h1 className="text-xl font-bold mb-4">Stock Item Creation</h1>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><Label>Name *</Label><Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>HSN/SAC</Label><Input value={form.hsn_code} onChange={e => setForm({ ...form, hsn_code: e.target.value })} /></div>
          <div>
            <Label>GST Rate %</Label>
            <Select value={form.gst_rate} onValueChange={(v) => setForm({ ...form, gst_rate: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{GST_RATES.map(r => <SelectItem key={r} value={String(r)}>{r}%</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Unit</Label>
            <Select value={form.unit_id} onValueChange={(v) => setForm({ ...form, unit_id: v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>{units.map(u => <SelectItem key={u.id} value={u.id}>{u.symbol}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Group</Label>
            <Select value={form.group_id} onValueChange={(v) => setForm({ ...form, group_id: v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>{groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Opening Qty</Label><Input type="number" step="0.001" value={form.opening_qty} onChange={e => setForm({ ...form, opening_qty: e.target.value })} /></div>
          <div><Label>Opening Rate</Label><Input type="number" step="0.01" value={form.opening_rate} onChange={e => setForm({ ...form, opening_rate: e.target.value })} /></div>
          <div><Label>Standard Selling Rate</Label><Input type="number" step="0.01" value={form.standard_rate} onChange={e => setForm({ ...form, standard_rate: e.target.value })} /></div>
          <div className="md:col-span-2 flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
            <Button type="submit">Accept</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
