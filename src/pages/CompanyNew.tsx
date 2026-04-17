import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INDIAN_STATES } from "@/lib/indian";
import { toast } from "sonner";

export default function CompanyNew() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refresh } = useCompany();
  const [form, setForm] = useState({
    name: "", mailing_name: "", address: "", state: "Maharashtra", state_code: "27",
    pincode: "", gstin: "", pan: "", email: "", phone: "",
  });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from("companies").insert({ ...form, created_by: user.id }).select().single();
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    await refresh();
    if (data) localStorage.setItem("current_company_id", data.id);
    toast.success("Company created with chart of accounts");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <Card className="w-full max-w-2xl p-6">
        <h1 className="text-xl font-bold mb-1">Create Company</h1>
        <p className="text-sm text-muted-foreground mb-6">Auto-creates 28 standard ledger groups, units, and a Cash ledger.</p>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><Label>Company Name *</Label><Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Mailing Name</Label><Input value={form.mailing_name} onChange={e => setForm({ ...form, mailing_name: e.target.value })} /></div>
          <div><Label>GSTIN</Label><Input value={form.gstin} onChange={e => setForm({ ...form, gstin: e.target.value.toUpperCase() })} /></div>
          <div className="md:col-span-2"><Label>Address</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
          <div>
            <Label>State *</Label>
            <Select value={form.state} onValueChange={(v) => { const s = INDIAN_STATES.find(x => x.name === v); setForm({ ...form, state: v, state_code: s?.code ?? "27" }); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-72">
                {INDIAN_STATES.map(s => <SelectItem key={s.code} value={s.name}>{s.code} — {s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>PIN</Label><Input value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })} /></div>
          <div><Label>PAN</Label><Input value={form.pan} onChange={e => setForm({ ...form, pan: e.target.value.toUpperCase() })} /></div>
          <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="md:col-span-2 flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Creating…" : "Create Company"}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
