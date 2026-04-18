

## Mobile Responsiveness Audit — Findings

At 390px width several layouts break or overflow. Here's what's wrong and what I'll fix.

### Issues found

**1. TallyShell (top bar + F-key bar)**
- Title bar packs logo + FY range + company `Select` (w-56) + Company button + Logout into one row → wraps awkwardly / overflows.
- F-key bar (`F4 Contra … F9 Purchase + Reports + Masters`) renders as a single non-scrollable row → squashed and overflows horizontally.
- Footer shows email + hint + date inline → cramped on phone.

**2. VoucherEntry (the page user is on)**
- Header card: title + voucher No + Date all in one flex row → date input gets clipped.
- Item rows use `grid-cols-12` with Item(5) / Qty(2) / Rate(2) / GST(2) / Trash(1) → unusable at 390px (each cell ~30px).
- Journal entries rows use the same 12-col grid — Dr/Cr select + ledger select + amount + trash all on one line → broken.
- Totals footer (Dr/Cr/Diff) is right-aligned flex with `gap-6` → wraps poorly.

**3. Gateway**
- Stats grid is `grid-cols-2` (good). Tile grid is `md:grid-cols-3` (good — stacks on mobile). Mostly OK, just header text sizing.

**4. Tables (DayBook, Ledgers, StockItems, TrialBalance, BalanceSheet, P&L, Stock Summary, GSTR-1)**
- Native `<Table>` with 5–7 columns → horizontal overflow with no scroll container; Narration/Party columns get squeezed; numbers wrap.

**5. Companies / Masters index / Auth**
- Companies grid is `md:grid-cols-2` → fine.
- Auth card is centered → fine.

**6. Global**
- `<main>` uses `p-4 md:p-6` — OK, but combined with non-scrollable wide tables it forces page-level horizontal scroll.

### Plan — what I'll change

**A. TallyShell — mobile-first header**
- Top bar: logo + a hamburger that opens a mobile `Sheet` containing: company switcher, FY range, "+ New Company", Sign out.
- On `md:` and up keep the current inline layout.
- F-key bar: wrap in a horizontally scrollable container (`overflow-x-auto` + `whitespace-nowrap`) so all F-keys remain reachable by swipe; hide the scrollbar.
- Footer: stack email above hint/date on mobile (`flex-col sm:flex-row`).

**B. VoucherEntry**
- Header card → `flex-col sm:flex-row`, voucher No/Date become a 2-col grid on mobile.
- Item rows: switch to a stacked card per item on mobile (`<md` → block layout with labels), keep 12-col grid `md:` and up. Each item card on mobile shows: Item (full width), then Qty/Rate/GST in a 3-col grid, then a delete button row.
- Journal entries: same approach — Dr/Cr + Ledger on row 1, Amount + delete on row 2 on mobile; current 12-col on `md:` and up.
- Totals footer: `flex-wrap` with smaller gap; right-align only on `sm:`.
- Action buttons (Cancel/Accept): full-width stacked on mobile.

**C. Tables (shared fix)**
- Wrap every report/master `<Table>` in a `<div className="overflow-x-auto">` so the table scrolls horizontally inside its Card instead of breaking the page.
- Add `min-w-[640px]` (or appropriate) to the Table so columns don't collapse.
- Files touched: `DayBook.tsx`, `Ledgers.tsx`, `StockItems.tsx`, `TrialBalance.tsx`, `BalanceSheet.tsx`, `ProfitLoss.tsx`, `StockSummary.tsx`, `Gstr1.tsx`.
- DayBook filter card: `flex-col sm:flex-row` for the From/To inputs.

**D. Gateway — minor polish**
- Heading: `text-xl sm:text-2xl`, allow wrapping.
- Stat values use `text-base sm:text-lg` so long INR amounts fit in 2-col on mobile.

**E. Companies page**
- Already responsive; just ensure the header (title + "New Company" button) stacks on mobile (`flex-col sm:flex-row`).

### Files to edit
1. `src/components/layout/TallyShell.tsx` — hamburger Sheet, scrollable F-key bar, stacked footer.
2. `src/pages/vouchers/VoucherEntry.tsx` — stacked item/entry rows on mobile, responsive header & actions.
3. `src/pages/Gateway.tsx` — heading + stat sizing.
4. `src/pages/Companies.tsx` — header stacking.
5. `src/pages/reports/DayBook.tsx` — filter row + table scroll wrap.
6. `src/pages/reports/TrialBalance.tsx` — table scroll wrap.
7. `src/pages/reports/BalanceSheet.tsx` — table scroll wrap.
8. `src/pages/reports/ProfitLoss.tsx` — table scroll wrap.
9. `src/pages/reports/StockSummary.tsx` — table scroll wrap.
10. `src/pages/reports/Gstr1.tsx` — table scroll wrap.
11. `src/pages/masters/Ledgers.tsx` — table scroll wrap + header stack.
12. `src/pages/masters/StockItems.tsx` — table scroll wrap + header stack.
13. `src/pages/masters/MastersIndex.tsx` — quick check; stack if needed.

No new dependencies. No DB changes. Purely Tailwind responsive utilities + a `Sheet` for the mobile menu (already in `components/ui/sheet.tsx`).

