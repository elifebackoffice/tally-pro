import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus } from "lucide-react";
import { calcGST, formatINR, GST_RATES } from "@/lib/indian";
import { toast } from "sonner";

type VType = "sales" | "purchase" | "receipt" | "payment" | "contra" | "journal";

const TITLES: Record<VType, { title: string; key: string; isInvoice: boolean }> = {
  sales:    { title: "Sales Voucher",    key: "F8", isInvoice: true },
  purchase: { title: "Purchase Voucher", key: "F9", isInvoice: true },
  receipt:  { title: "Receipt Voucher",  key: "F6", isInvoice: false },
  payment:  { title: "Payment Voucher",  key: "F5", isInvoice: false },
  contra:   { title: "Contra Voucher",   key: "F4", isInvoice: false },
  journal:  { title: "Journal Voucher",  key: "F7", isInvoice: false },
};

type Line = { ledger_id: string; entry_type: "debit" | "credit"; amount: string };
type InvLine = { stock_item_id: string; quantity: string; rate: string; gst_rate: string };

export default function VoucherEntry() {
  const { type } = useParams<{ type: VType }>();
  const vtype = (type ?? "journal") as VType;
  const cfg = TITLES[vtype];
  const { current } = useCompany();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [ledgers, setLedgers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [voucherNo, setVoucherNo] = useState("1");
  const [voucherDate, setVoucherDate] = useState(new Date().toISOString().slice(0, 10));
  const [partyId, setPartyId] = useState<string>("");
  const [narration, setNarration] = useState("");
  const [lines, setLines] = useState<Line[]>([
    { ledger_id: "", entry_type: vtype === "receipt" ? "debit" : "credit", amount: "" },
    { ledger_id: "", entry_type: vtype === "receipt" ? "credit" : "debit", amount: "" },
  ]);
  const [inv, setInv] = useState<InvLine[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!current) return;
    Promise.all([
      supabase.from("ledgers").select("id,name,state_code,ledger_groups(name)").eq("company_id", current.id).order("name"),
      supabase.from("stock_items").select("id,name,gst_rate,standard_rate").eq("company_id", current.id).order("name"),
      supabase.from("vouchers").select("voucher_no").eq("company_id", current.id).eq("voucher_type", vtype).order("created_at", { ascending: false }).limit(1),
    ]).then(([l, s, v]) => {
      setLedgers(l.data ?? []);
      setItems(s.data ?? []);
      const last = v.data?.[0]?.voucher_no;
      const next = last ? String(parseInt(last, 10) + 1 || 1) : "1";
      setVoucherNo(next);
    });
  }, [current, vtype]);

  // For sales/purchase: auto-build entries from inventory + GST
  const buyerLedger = ledgers.find(l => l.id === partyId);
  const isInterState = useMemo(() => {
    if (!current || !buyerLedger?.state_code) return false;
    return buyerLedger.state_code !== current.state_code;
  }, [current, buyerLedger]);

  const invSubtotal = inv.reduce((a, l) => a + (Number(l.quantity) || 0) * (Number(l.rate) || 0), 0);
  const invTaxes = inv.reduce((acc, l) => {
    const taxable = (Number(l.quantity) || 0) * (Number(l.rate) || 0);
    const t = calcGST(taxable, Number(l.gst_rate) || 0, current?.state_code ?? "27", buyerLedger?.state_code ?? current?.state_code ?? "27");
    return { cgst: acc.cgst + t.cgst, sgst: acc.sgst + t.sgst, igst: acc.igst + t.igst };
  }, { cgst: 0, sgst: 0, igst: 0 });
  const invTotal = invSubtotal + invTaxes.cgst + invTaxes.sgst + invTaxes.igst;

  const journalTotal = lines.reduce((a, l) => a + (Number(l.amount) || 0), 0);
  const drTotal = lines.filter(l => l.entry_type === "debit").reduce((a, l) => a + (Number(l.amount) || 0), 0);
  const crTotal = lines.filter(l => l.entry_type === "credit").reduce((a, l) => a + (Number(l.amount) || 0), 0);

  const addLine = () => setLines([...lines, { ledger_id: "", entry_type: "debit", amount: "" }]);
  const addInv = () => setInv([...inv, { stock_item_id: "", quantity: "1", rate: "0", gst_rate: "18" }]);

  const save = async () => {
    if (!current || !user) return;
    setSaving(true);
    try {
      let totalAmount = 0;
      let entriesPayload: any[] = [];
      let invPayload: any[] = [];

      if (cfg.isInvoice) {
        if (!partyId) { toast.error("Select party ledger"); setSaving(false); return; }
        if (inv.length === 0) { toast.error("Add at least one item"); setSaving(false); return; }
        totalAmount = +invTotal.toFixed(2);

        // Inventory rows + ledger postings (party Dr/Cr, sales/purchase Cr/Dr, GST split)
        const supplyState = current.state_code;
        const buyState = buyerLedger?.state_code ?? supplyState;

        // Find or warn about default GST/sales/purchase ledgers (user can also configure later)
        const findLedger = (substr: string) => ledgers.find(l => l.name.toLowerCase().includes(substr));
        const salesLedger = findLedger("sales");
        const purchaseLedger = findLedger("purchase");
        const cgstL = findLedger("cgst");
        const sgstL = findLedger("sgst");
        const igstL = findLedger("igst");

        const counterLedger = vtype === "sales" ? salesLedger : purchaseLedger;
        if (!counterLedger) {
          toast.error(`Create a ${vtype === "sales" ? "Sales" : "Purchase"} ledger first (under ${vtype === "sales" ? "Sales Accounts" : "Purchase Accounts"})`);
          setSaving(false); return;
        }
        const interState = supplyState !== buyState;
        if ((interState && !igstL) || (!interState && (!cgstL || !sgstL))) {
          toast.error(`Create ${interState ? "IGST" : "CGST & SGST"} ledger(s) under Duties & Taxes first`);
          setSaving(false); return;
        }

        // Party
        entriesPayload.push({
          company_id: current.id, ledger_id: partyId,
          entry_type: vtype === "sales" ? "debit" : "credit",
          amount: totalAmount, line_order: 0,
        });
        // Counter (sales/purchase)
        entriesPayload.push({
          company_id: current.id, ledger_id: counterLedger.id,
          entry_type: vtype === "sales" ? "credit" : "debit",
          amount: +invSubtotal.toFixed(2), line_order: 1,
        });
        // GST
        if (interState) {
          entriesPayload.push({ company_id: current.id, ledger_id: igstL!.id, entry_type: vtype === "sales" ? "credit" : "debit", amount: +invTaxes.igst.toFixed(2), line_order: 2 });
        } else {
          entriesPayload.push({ company_id: current.id, ledger_id: cgstL!.id, entry_type: vtype === "sales" ? "credit" : "debit", amount: +invTaxes.cgst.toFixed(2), line_order: 2 });
          entriesPayload.push({ company_id: current.id, ledger_id: sgstL!.id, entry_type: vtype === "sales" ? "credit" : "debit", amount: +invTaxes.sgst.toFixed(2), line_order: 3 });
        }

        invPayload = inv.map((l, idx) => {
          const taxable = (Number(l.quantity) || 0) * (Number(l.rate) || 0);
          const t = calcGST(taxable, Number(l.gst_rate) || 0, supplyState, buyState);
          return {
            company_id: current.id, stock_item_id: l.stock_item_id,
            quantity: Number(l.quantity), rate: Number(l.rate), amount: taxable,
            gst_rate: Number(l.gst_rate), cgst_amount: t.cgst, sgst_amount: t.sgst, igst_amount: t.igst,
            line_order: idx,
          };
        });
      } else {
        // Journal-style
        if (Math.abs(drTotal - crTotal) > 0.001) { toast.error(`Dr ${formatINR(drTotal)} ≠ Cr ${formatINR(crTotal)}`); setSaving(false); return; }
        if (drTotal === 0) { toast.error("Enter amounts"); setSaving(false); return; }
        totalAmount = drTotal;
        entriesPayload = lines.filter(l => l.ledger_id && Number(l.amount) > 0).map((l, i) => ({
          company_id: current.id, ledger_id: l.ledger_id, entry_type: l.entry_type,
          amount: Number(l.amount), line_order: i,
        }));
      }

      const { data: voucher, error: vErr } = await supabase.from("vouchers").insert({
        company_id: current.id, voucher_type: vtype, voucher_no: voucherNo, voucher_date: voucherDate,
        party_ledger_id: cfg.isInvoice ? partyId : null, narration: narration || null,
        total_amount: totalAmount, is_invoice: cfg.isInvoice,
        place_of_supply: cfg.isInvoice ? (buyerLedger?.state_code ?? current.state_code) : null,
        created_by: user.id,
      }).select().single();
      if (vErr) throw vErr;

      const entriesWithVoucher = entriesPayload.map(e => ({ ...e, voucher_id: voucher.id }));
      const { error: eErr } = await supabase.from("voucher_entries").insert(entriesWithVoucher);
      if (eErr) throw eErr;

      if (invPayload.length) {
        const invWithVoucher = invPayload.map(p => ({ ...p, voucher_id: voucher.id }));
        const { error: iErr } = await supabase.from("voucher_inventory").insert(invWithVoucher);
        if (iErr) throw iErr;
      }
      toast.success(`${cfg.title} #${voucherNo} saved`);
      navigate("/reports/day-book");
    } catch (e: any) {
      toast.error(e.message ?? "Save failed");
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <Card className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="tally-key">{cfg.key}</span>
          <h1 className="text-lg sm:text-xl font-bold">{cfg.title}</h1>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3">
          <div><Label className="text-xs">No.</Label><Input className="h-8 w-full sm:w-24" value={voucherNo} onChange={e => setVoucherNo(e.target.value)} /></div>
          <div><Label className="text-xs">Date</Label><Input className="h-8 w-full" type="date" value={voucherDate} onChange={e => setVoucherDate(e.target.value)} /></div>
        </div>
      </Card>

      {cfg.isInvoice && (
        <Card className="p-4 space-y-4">
          <div>
            <Label>{vtype === "sales" ? "Party (Buyer)" : "Party (Supplier)"} *</Label>
            <Select value={partyId} onValueChange={setPartyId}>
              <SelectTrigger><SelectValue placeholder="Select party ledger" /></SelectTrigger>
              <SelectContent className="max-h-72">
                {ledgers.filter(l => l.ledger_groups?.name === (vtype === "sales" ? "Sundry Debtors" : "Sundry Creditors")).map(l =>
                  <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                )}
              </SelectContent>
            </Select>
            {buyerLedger && <p className="text-xs text-muted-foreground mt-1">Place of Supply: state code {buyerLedger.state_code || "—"} · {isInterState ? "Inter-state (IGST)" : "Intra-state (CGST+SGST)"}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Items</Label>
              <Button type="button" size="sm" variant="outline" onClick={addInv}><Plus className="w-3 h-3 mr-1" />Add Item</Button>
            </div>
            <div className="space-y-3">
              {inv.map((line, idx) => (
                <div key={idx} className="rounded-md border border-border bg-muted/30 p-2 md:bg-transparent md:border-0 md:p-0 md:rounded-none">
                  {/* Mobile stacked layout */}
                  <div className="md:hidden space-y-2">
                    <div>
                      <Label className="text-[10px] uppercase text-muted-foreground">Item</Label>
                      <Select value={line.stock_item_id} onValueChange={(v) => {
                        const it = items.find(x => x.id === v);
                        const next = [...inv]; next[idx] = { ...line, stock_item_id: v, rate: it?.standard_rate ? String(it.standard_rate) : line.rate, gst_rate: String(it?.gst_rate ?? line.gst_rate) };
                        setInv(next);
                      }}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Item" /></SelectTrigger>
                        <SelectContent>{items.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-[10px] uppercase text-muted-foreground">Qty</Label>
                        <Input className="h-9 text-right num" type="number" step="0.001" placeholder="Qty" value={line.quantity}
                          onChange={(e) => { const next = [...inv]; next[idx] = { ...line, quantity: e.target.value }; setInv(next); }} />
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase text-muted-foreground">Rate</Label>
                        <Input className="h-9 text-right num" type="number" step="0.01" placeholder="Rate" value={line.rate}
                          onChange={(e) => { const next = [...inv]; next[idx] = { ...line, rate: e.target.value }; setInv(next); }} />
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase text-muted-foreground">GST</Label>
                        <Select value={line.gst_rate} onValueChange={(v) => { const next = [...inv]; next[idx] = { ...line, gst_rate: v }; setInv(next); }}>
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent>{GST_RATES.map(r => <SelectItem key={r} value={String(r)}>{r}%</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button type="button" size="sm" variant="ghost" onClick={() => setInv(inv.filter((_, i) => i !== idx))} className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4 mr-1" /> Remove
                      </Button>
                    </div>
                  </div>

                  {/* Desktop grid layout */}
                  <div className="hidden md:grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5">
                      <Select value={line.stock_item_id} onValueChange={(v) => {
                        const it = items.find(x => x.id === v);
                        const next = [...inv]; next[idx] = { ...line, stock_item_id: v, rate: it?.standard_rate ? String(it.standard_rate) : line.rate, gst_rate: String(it?.gst_rate ?? line.gst_rate) };
                        setInv(next);
                      }}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Item" /></SelectTrigger>
                        <SelectContent>{items.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <Input className="col-span-2 h-9 text-right num" type="number" step="0.001" placeholder="Qty" value={line.quantity}
                      onChange={(e) => { const next = [...inv]; next[idx] = { ...line, quantity: e.target.value }; setInv(next); }} />
                    <Input className="col-span-2 h-9 text-right num" type="number" step="0.01" placeholder="Rate" value={line.rate}
                      onChange={(e) => { const next = [...inv]; next[idx] = { ...line, rate: e.target.value }; setInv(next); }} />
                    <Select value={line.gst_rate} onValueChange={(v) => { const next = [...inv]; next[idx] = { ...line, gst_rate: v }; setInv(next); }}>
                      <SelectTrigger className="col-span-2 h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>{GST_RATES.map(r => <SelectItem key={r} value={String(r)}>{r}%</SelectItem>)}</SelectContent>
                    </Select>
                    <Button type="button" size="icon" variant="ghost" className="col-span-1 h-9" onClick={() => setInv(inv.filter((_, i) => i !== idx))}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {inv.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Click "Add Item" to start</p>}
            </div>
          </div>

          <div className="border-t pt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><div className="text-muted-foreground text-xs">Subtotal</div><div className="num font-semibold">{formatINR(invSubtotal)}</div></div>
            {isInterState
              ? <div><div className="text-muted-foreground text-xs">IGST</div><div className="num">{formatINR(invTaxes.igst)}</div></div>
              : <>
                  <div><div className="text-muted-foreground text-xs">CGST</div><div className="num">{formatINR(invTaxes.cgst)}</div></div>
                  <div><div className="text-muted-foreground text-xs">SGST</div><div className="num">{formatINR(invTaxes.sgst)}</div></div>
                </>}
            <div><div className="text-muted-foreground text-xs">Grand Total</div><div className="num font-bold text-primary">{formatINR(invTotal, { showSymbol: true })}</div></div>
          </div>
        </Card>
      )}

      {!cfg.isInvoice && (
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label>Entries</Label>
            <Button type="button" size="sm" variant="outline" onClick={addLine}><Plus className="w-3 h-3 mr-1" />Add</Button>
          </div>
          {lines.map((line, idx) => (
            <div key={idx} className="rounded-md border border-border bg-muted/30 p-2 md:bg-transparent md:border-0 md:p-0 md:rounded-none">
              {/* Mobile stacked */}
              <div className="md:hidden space-y-2">
                <div className="grid grid-cols-[80px_1fr] gap-2">
                  <Select value={line.entry_type} onValueChange={(v: any) => { const n = [...lines]; n[idx] = { ...line, entry_type: v }; setLines(n); }}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="debit">Dr</SelectItem><SelectItem value="credit">Cr</SelectItem></SelectContent>
                  </Select>
                  <Select value={line.ledger_id} onValueChange={(v) => { const n = [...lines]; n[idx] = { ...line, ledger_id: v }; setLines(n); }}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Ledger" /></SelectTrigger>
                    <SelectContent className="max-h-72">{ledgers.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 items-center">
                  <Input type="number" step="0.01" placeholder="Amount" className="h-9 text-right num flex-1" value={line.amount}
                    onChange={(e) => { const n = [...lines]; n[idx] = { ...line, amount: e.target.value }; setLines(n); }} />
                  <Button type="button" size="icon" variant="ghost" className="h-9 w-9 text-destructive hover:text-destructive" onClick={() => setLines(lines.filter((_, i) => i !== idx))}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Desktop grid */}
              <div className="hidden md:grid grid-cols-12 gap-2 items-end">
                <Select value={line.entry_type} onValueChange={(v: any) => { const n = [...lines]; n[idx] = { ...line, entry_type: v }; setLines(n); }}>
                  <SelectTrigger className="col-span-2 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="debit">Dr</SelectItem><SelectItem value="credit">Cr</SelectItem></SelectContent>
                </Select>
                <Select value={line.ledger_id} onValueChange={(v) => { const n = [...lines]; n[idx] = { ...line, ledger_id: v }; setLines(n); }}>
                  <SelectTrigger className="col-span-7 h-9"><SelectValue placeholder="Ledger" /></SelectTrigger>
                  <SelectContent className="max-h-72">{ledgers.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
                </Select>
                <Input type="number" step="0.01" placeholder="Amount" className="col-span-2 h-9 text-right num" value={line.amount}
                  onChange={(e) => { const n = [...lines]; n[idx] = { ...line, amount: e.target.value }; setLines(n); }} />
                <Button type="button" size="icon" variant="ghost" className="col-span-1 h-9" onClick={() => setLines(lines.filter((_, i) => i !== idx))}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          <div className="border-t pt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm sm:justify-end">
            <div>Dr Total: <span className="num font-semibold">{formatINR(drTotal)}</span></div>
            <div>Cr Total: <span className="num font-semibold">{formatINR(crTotal)}</span></div>
            <div className={Math.abs(drTotal - crTotal) > 0.001 ? "text-destructive font-bold" : "text-success font-bold"}>
              Diff: {formatINR(drTotal - crTotal)}
            </div>
          </div>
        </Card>
      )}

      <Card className="p-4 space-y-3">
        <div><Label>Narration</Label><Textarea value={narration} onChange={e => setNarration(e.target.value)} rows={2} /></div>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button variant="outline" onClick={() => navigate(-1)} className="w-full sm:w-auto">Cancel (Esc)</Button>
          <Button onClick={save} disabled={saving} className="w-full sm:w-auto">{saving ? "Saving…" : "Accept (Ctrl+A)"}</Button>
        </div>
      </Card>
    </div>
  );
}
