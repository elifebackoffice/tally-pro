import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

export type Company = {
  id: string;
  name: string;
  state: string;
  state_code: string;
  gstin: string | null;
  fy_start: string;
  fy_end: string;
  base_currency: string;
};

type Ctx = {
  companies: Company[];
  current: Company | null;
  loading: boolean;
  setCurrent: (c: Company) => void;
  refresh: () => Promise<void>;
};

const CompanyCtx = createContext<Ctx>({ companies: [], current: null, loading: true, setCurrent: () => {}, refresh: async () => {} });

export const CompanyProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [current, setCurrentState] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setCompanies([]); setCurrentState(null); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase.from("companies").select("id,name,state,state_code,gstin,fy_start,fy_end,base_currency").order("created_at", { ascending: false });
    const list = (data ?? []) as Company[];
    setCompanies(list);
    const savedId = localStorage.getItem("current_company_id");
    const found = list.find(c => c.id === savedId) ?? list[0] ?? null;
    setCurrentState(found);
    if (found) localStorage.setItem("current_company_id", found.id);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const setCurrent = (c: Company) => {
    setCurrentState(c);
    localStorage.setItem("current_company_id", c.id);
  };

  return <CompanyCtx.Provider value={{ companies, current, loading, setCurrent, refresh }}>{children}</CompanyCtx.Provider>;
};

export const useCompany = () => useContext(CompanyCtx);
