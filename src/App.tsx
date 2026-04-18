import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { CompanyProvider } from "@/contexts/CompanyContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import CompanyNew from "./pages/CompanyNew";
import Companies from "./pages/Companies";
import MastersIndex from "./pages/masters/MastersIndex";
import Ledgers from "./pages/masters/Ledgers";
import LedgerNew from "./pages/masters/LedgerNew";
import StockItems from "./pages/masters/StockItems";
import StockItemNew from "./pages/masters/StockItemNew";
import Groups from "./pages/masters/Groups";
import VoucherEntry from "./pages/vouchers/VoucherEntry";
import ReportsIndex from "./pages/reports/ReportsIndex";
import DayBook from "./pages/reports/DayBook";
import TrialBalance from "./pages/reports/TrialBalance";
import ProfitLoss from "./pages/reports/ProfitLoss";
import BalanceSheet from "./pages/reports/BalanceSheet";
import StockSummary from "./pages/reports/StockSummary";
import Gstr1 from "./pages/reports/Gstr1";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CompanyProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/companies/new" element={<ProtectedRoute requireCompany={false}><CompanyNew /></ProtectedRoute>} />
              <Route path="/companies" element={<ProtectedRoute requireCompany={false}><Companies /></ProtectedRoute>} />

              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/masters" element={<ProtectedRoute><MastersIndex /></ProtectedRoute>} />
              <Route path="/masters/ledgers" element={<ProtectedRoute><Ledgers /></ProtectedRoute>} />
              <Route path="/masters/ledgers/new" element={<ProtectedRoute><LedgerNew /></ProtectedRoute>} />
              <Route path="/masters/stock-items" element={<ProtectedRoute><StockItems /></ProtectedRoute>} />
              <Route path="/masters/stock-items/new" element={<ProtectedRoute><StockItemNew /></ProtectedRoute>} />
              <Route path="/masters/groups" element={<ProtectedRoute><Groups /></ProtectedRoute>} />

              <Route path="/voucher/:type" element={<ProtectedRoute><VoucherEntry /></ProtectedRoute>} />

              <Route path="/reports" element={<ProtectedRoute><ReportsIndex /></ProtectedRoute>} />
              <Route path="/reports/day-book" element={<ProtectedRoute><DayBook /></ProtectedRoute>} />
              <Route path="/reports/trial-balance" element={<ProtectedRoute><TrialBalance /></ProtectedRoute>} />
              <Route path="/reports/profit-loss" element={<ProtectedRoute><ProfitLoss /></ProtectedRoute>} />
              <Route path="/reports/balance-sheet" element={<ProtectedRoute><BalanceSheet /></ProtectedRoute>} />
              <Route path="/reports/stock-summary" element={<ProtectedRoute><StockSummary /></ProtectedRoute>} />
              <Route path="/reports/gstr1" element={<ProtectedRoute><Gstr1 /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </CompanyProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
