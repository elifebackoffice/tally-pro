import { Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { TallyShell } from "./layout/TallyShell";

export const ProtectedRoute = ({ children, requireCompany = true }: { children: ReactNode; requireCompany?: boolean }) => {
  const { user, loading } = useAuth();
  const { current, loading: cLoading, companies } = useCompany();
  const location = useLocation();

  if (loading || cLoading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }
  if (!user) return <Navigate to="/auth" state={{ from: location }} replace />;
  if (requireCompany && !current && companies.length === 0 && location.pathname !== "/companies/new") {
    return <Navigate to="/companies/new" replace />;
  }
  return <TallyShell>{children}</TallyShell>;
};
