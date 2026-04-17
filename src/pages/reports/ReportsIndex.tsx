import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";

const reports = [
  { name: "Day Book", path: "/reports/day-book", desc: "All vouchers chronologically" },
  { name: "Trial Balance", path: "/reports/trial-balance", desc: "Closing balances by ledger" },
  { name: "Profit & Loss", path: "/reports/profit-loss", desc: "Income vs expenses" },
  { name: "Balance Sheet", path: "/reports/balance-sheet", desc: "Assets vs liabilities" },
  { name: "Stock Summary", path: "/reports/stock-summary", desc: "Item-wise stock value" },
  { name: "GSTR-1 Summary", path: "/reports/gstr1", desc: "Outward supplies (sales)" },
];

export default function ReportsIndex() {
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Reports</h1>
      <div className="grid md:grid-cols-3 gap-4">
        {reports.map(r => (
          <Link key={r.path} to={r.path}>
            <Card className="p-5 hover:border-primary transition-colors">
              <div className="font-semibold">{r.name}</div>
              <div className="text-sm text-muted-foreground">{r.desc}</div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
