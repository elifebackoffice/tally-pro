// Indian formatting & GST helpers

export const INDIAN_STATES: { name: string; code: string }[] = [
  { name: "Andhra Pradesh", code: "37" }, { name: "Arunachal Pradesh", code: "12" },
  { name: "Assam", code: "18" }, { name: "Bihar", code: "10" }, { name: "Chhattisgarh", code: "22" },
  { name: "Delhi", code: "07" }, { name: "Goa", code: "30" }, { name: "Gujarat", code: "24" },
  { name: "Haryana", code: "06" }, { name: "Himachal Pradesh", code: "02" }, { name: "Jharkhand", code: "20" },
  { name: "Karnataka", code: "29" }, { name: "Kerala", code: "32" }, { name: "Madhya Pradesh", code: "23" },
  { name: "Maharashtra", code: "27" }, { name: "Manipur", code: "14" }, { name: "Meghalaya", code: "17" },
  { name: "Mizoram", code: "15" }, { name: "Nagaland", code: "13" }, { name: "Odisha", code: "21" },
  { name: "Punjab", code: "03" }, { name: "Rajasthan", code: "08" }, { name: "Sikkim", code: "11" },
  { name: "Tamil Nadu", code: "33" }, { name: "Telangana", code: "36" }, { name: "Tripura", code: "16" },
  { name: "Uttar Pradesh", code: "09" }, { name: "Uttarakhand", code: "05" }, { name: "West Bengal", code: "19" },
  { name: "Chandigarh", code: "04" }, { name: "Jammu and Kashmir", code: "01" }, { name: "Ladakh", code: "38" },
  { name: "Puducherry", code: "34" }, { name: "Andaman and Nicobar", code: "35" },
  { name: "Dadra & Nagar Haveli and Daman & Diu", code: "26" }, { name: "Lakshadweep", code: "31" },
];

export const GST_RATES = [0, 0.1, 0.25, 1, 1.5, 3, 5, 6, 7.5, 12, 18, 28];

// Indian numbering format: 12,34,567.89
export function formatINR(n: number | string | null | undefined, opts: { showSymbol?: boolean } = {}): string {
  const num = Number(n ?? 0);
  if (!isFinite(num)) return "0.00";
  const sign = num < 0 ? "-" : "";
  const abs = Math.abs(num);
  const [whole, dec = "00"] = abs.toFixed(2).split(".");
  // Indian grouping
  const last3 = whole.slice(-3);
  const rest = whole.slice(0, -3);
  const grouped = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3 : last3;
  return `${opts.showSymbol ? "₹" : ""}${sign}${grouped}.${dec}`;
}

export function calcGST(taxableAmount: number, gstRate: number, supplierStateCode: string, buyerStateCode: string) {
  const interState = supplierStateCode !== buyerStateCode;
  const totalTax = +(taxableAmount * gstRate / 100).toFixed(2);
  if (interState) {
    return { cgst: 0, sgst: 0, igst: totalTax, total: +(taxableAmount + totalTax).toFixed(2) };
  }
  const half = +(totalTax / 2).toFixed(2);
  return { cgst: half, sgst: +(totalTax - half).toFixed(2), igst: 0, total: +(taxableAmount + totalTax).toFixed(2) };
}

export function formatDate(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${date.getFullYear()}`;
}
