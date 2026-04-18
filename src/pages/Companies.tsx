import { useNavigate } from "react-router-dom";
import { useCompany } from "@/contexts/CompanyContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Check, Building2 } from "lucide-react";
import { formatDate } from "@/lib/indian";

export default function Companies() {
  const navigate = useNavigate();
  const { companies, current, setCurrent } = useCompany();

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Companies</h1>
          <p className="text-sm text-muted-foreground">Select a company to load, or create a new one.</p>
        </div>
        <Button onClick={() => navigate("/companies/new")} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-1" /> New Company
        </Button>
      </div>

      {companies.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          No companies yet. Create your first company to get started.
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {companies.map((c) => {
            const active = current?.id === c.id;
            return (
              <Card key={c.id} className={`p-4 flex items-start gap-3 cursor-pointer transition-colors hover:border-primary ${active ? "border-primary bg-primary/5" : ""}`}
                onClick={() => { setCurrent(c); navigate("/"); }}>
                <div className="w-10 h-10 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold truncate">{c.name}</h2>
                    {active && <Badge variant="secondary" className="gap-1"><Check className="w-3 h-3" /> Active</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {c.state} · GSTIN {c.gstin || "—"}
                  </div>
                  <div className="text-xs text-muted-foreground num mt-1">
                    FY {formatDate(c.fy_start)} → {formatDate(c.fy_end)}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
