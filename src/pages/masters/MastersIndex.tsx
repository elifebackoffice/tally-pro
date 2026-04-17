import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { BookOpen, Package, Layers, Warehouse, Ruler } from "lucide-react";

const items = [
  { label: "Ledgers", path: "/masters/ledgers", icon: BookOpen, desc: "Chart of accounts" },
  { label: "Stock Items", path: "/masters/stock-items", icon: Package, desc: "Inventory items with HSN & GST" },
  { label: "Groups", path: "/masters/groups", icon: Layers, desc: "Ledger groups" },
];

export default function MastersIndex() {
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Masters</h1>
      <div className="grid md:grid-cols-3 gap-4">
        {items.map(i => (
          <Link key={i.path} to={i.path}>
            <Card className="p-5 hover:border-primary transition-colors cursor-pointer">
              <i.icon className="w-8 h-8 text-primary mb-2" />
              <div className="font-semibold">{i.label}</div>
              <div className="text-sm text-muted-foreground">{i.desc}</div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
