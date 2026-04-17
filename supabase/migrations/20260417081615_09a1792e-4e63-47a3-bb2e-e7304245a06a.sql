
-- =========================================================
-- ENUMS
-- =========================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.company_role AS ENUM ('owner', 'admin', 'accountant', 'viewer');
CREATE TYPE public.voucher_type AS ENUM ('sales', 'purchase', 'receipt', 'payment', 'contra', 'journal', 'debit_note', 'credit_note');
CREATE TYPE public.entry_type AS ENUM ('debit', 'credit');
CREATE TYPE public.group_nature AS ENUM ('assets', 'liabilities', 'income', 'expenses');

-- =========================================================
-- UTILITY FUNCTION: updated_at trigger
-- =========================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =========================================================
-- PROFILES
-- =========================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- USER ROLES
-- =========================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- COMPANIES
-- =========================================================
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  mailing_name TEXT,
  address TEXT,
  state TEXT NOT NULL DEFAULT 'Maharashtra',
  state_code TEXT NOT NULL DEFAULT '27',
  pincode TEXT,
  country TEXT NOT NULL DEFAULT 'India',
  gstin TEXT,
  pan TEXT,
  email TEXT,
  phone TEXT,
  base_currency TEXT NOT NULL DEFAULT 'INR',
  fy_start DATE NOT NULL DEFAULT make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 4, 1),
  fy_end DATE NOT NULL DEFAULT make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int + 1, 3, 31),
  books_begin DATE NOT NULL DEFAULT make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 4, 1),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_companies_updated BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- COMPANY USERS (membership)
-- =========================================================
CREATE TABLE public.company_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role company_role NOT NULL DEFAULT 'owner',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, user_id)
);
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;

-- Membership check function (security definer to avoid recursion)
CREATE OR REPLACE FUNCTION public.is_company_member(_company_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.company_users WHERE company_id = _company_id AND user_id = _user_id)
$$;

CREATE POLICY "Users view their memberships" ON public.company_users
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own membership" ON public.company_users
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners delete memberships" ON public.company_users
  FOR DELETE USING (auth.uid() = user_id);

-- Companies policies (after company_users + helper exist)
CREATE POLICY "Members view companies" ON public.companies
  FOR SELECT USING (public.is_company_member(id, auth.uid()));
CREATE POLICY "Users create companies" ON public.companies
  FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Members update companies" ON public.companies
  FOR UPDATE USING (public.is_company_member(id, auth.uid()));
CREATE POLICY "Creator deletes companies" ON public.companies
  FOR DELETE USING (auth.uid() = created_by);

-- =========================================================
-- LEDGER GROUPS
-- =========================================================
CREATE TABLE public.ledger_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.ledger_groups(id) ON DELETE SET NULL,
  nature group_nature NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  affects_gross_profit BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, name)
);
ALTER TABLE public.ledger_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members access ledger_groups" ON public.ledger_groups
  FOR ALL USING (public.is_company_member(company_id, auth.uid()))
  WITH CHECK (public.is_company_member(company_id, auth.uid()));
CREATE TRIGGER trg_ledger_groups_updated BEFORE UPDATE ON public.ledger_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- LEDGERS
-- =========================================================
CREATE TABLE public.ledgers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.ledger_groups(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  alias TEXT,
  opening_balance NUMERIC(18,2) NOT NULL DEFAULT 0,
  opening_dr_cr entry_type NOT NULL DEFAULT 'debit',
  gstin TEXT,
  state TEXT,
  state_code TEXT,
  address TEXT,
  email TEXT,
  phone TEXT,
  pan TEXT,
  is_revenue BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, name)
);
ALTER TABLE public.ledgers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members access ledgers" ON public.ledgers
  FOR ALL USING (public.is_company_member(company_id, auth.uid()))
  WITH CHECK (public.is_company_member(company_id, auth.uid()));
CREATE TRIGGER trg_ledgers_updated BEFORE UPDATE ON public.ledgers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_ledgers_company ON public.ledgers(company_id);
CREATE INDEX idx_ledgers_group ON public.ledgers(group_id);

-- =========================================================
-- STOCK GROUPS / UNITS / GODOWNS / ITEMS
-- =========================================================
CREATE TABLE public.stock_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.stock_groups(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, name)
);
ALTER TABLE public.stock_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members access stock_groups" ON public.stock_groups
  FOR ALL USING (public.is_company_member(company_id, auth.uid()))
  WITH CHECK (public.is_company_member(company_id, auth.uid()));

CREATE TABLE public.stock_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  formal_name TEXT,
  decimal_places INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, symbol)
);
ALTER TABLE public.stock_units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members access stock_units" ON public.stock_units
  FOR ALL USING (public.is_company_member(company_id, auth.uid()))
  WITH CHECK (public.is_company_member(company_id, auth.uid()));

CREATE TABLE public.godowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, name)
);
ALTER TABLE public.godowns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members access godowns" ON public.godowns
  FOR ALL USING (public.is_company_member(company_id, auth.uid()))
  WITH CHECK (public.is_company_member(company_id, auth.uid()));

CREATE TABLE public.stock_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.stock_groups(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES public.stock_units(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  alias TEXT,
  hsn_code TEXT,
  gst_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  opening_qty NUMERIC(18,3) NOT NULL DEFAULT 0,
  opening_rate NUMERIC(18,2) NOT NULL DEFAULT 0,
  opening_value NUMERIC(18,2) NOT NULL DEFAULT 0,
  standard_rate NUMERIC(18,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, name)
);
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members access stock_items" ON public.stock_items
  FOR ALL USING (public.is_company_member(company_id, auth.uid()))
  WITH CHECK (public.is_company_member(company_id, auth.uid()));
CREATE TRIGGER trg_stock_items_updated BEFORE UPDATE ON public.stock_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- VOUCHERS
-- =========================================================
CREATE TABLE public.vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  voucher_type voucher_type NOT NULL,
  voucher_no TEXT NOT NULL,
  voucher_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference_no TEXT,
  reference_date DATE,
  party_ledger_id UUID REFERENCES public.ledgers(id) ON DELETE SET NULL,
  narration TEXT,
  total_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  is_invoice BOOLEAN NOT NULL DEFAULT false,
  place_of_supply TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, voucher_type, voucher_no)
);
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members access vouchers" ON public.vouchers
  FOR ALL USING (public.is_company_member(company_id, auth.uid()))
  WITH CHECK (public.is_company_member(company_id, auth.uid()));
CREATE TRIGGER trg_vouchers_updated BEFORE UPDATE ON public.vouchers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_vouchers_company_date ON public.vouchers(company_id, voucher_date);
CREATE INDEX idx_vouchers_type ON public.vouchers(company_id, voucher_type);

-- =========================================================
-- VOUCHER ENTRIES (double-entry)
-- =========================================================
CREATE TABLE public.voucher_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id UUID NOT NULL REFERENCES public.vouchers(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  ledger_id UUID NOT NULL REFERENCES public.ledgers(id) ON DELETE RESTRICT,
  entry_type entry_type NOT NULL,
  amount NUMERIC(18,2) NOT NULL,
  line_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.voucher_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members access voucher_entries" ON public.voucher_entries
  FOR ALL USING (public.is_company_member(company_id, auth.uid()))
  WITH CHECK (public.is_company_member(company_id, auth.uid()));
CREATE INDEX idx_voucher_entries_voucher ON public.voucher_entries(voucher_id);
CREATE INDEX idx_voucher_entries_ledger ON public.voucher_entries(ledger_id);

-- =========================================================
-- VOUCHER INVENTORY LINES
-- =========================================================
CREATE TABLE public.voucher_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id UUID NOT NULL REFERENCES public.vouchers(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  stock_item_id UUID NOT NULL REFERENCES public.stock_items(id) ON DELETE RESTRICT,
  godown_id UUID REFERENCES public.godowns(id) ON DELETE SET NULL,
  quantity NUMERIC(18,3) NOT NULL DEFAULT 0,
  rate NUMERIC(18,2) NOT NULL DEFAULT 0,
  amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  discount_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  gst_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  cgst_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  sgst_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  igst_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  line_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.voucher_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members access voucher_inventory" ON public.voucher_inventory
  FOR ALL USING (public.is_company_member(company_id, auth.uid()))
  WITH CHECK (public.is_company_member(company_id, auth.uid()));

-- =========================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)), NEW.email);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- AUTO-SEED LEDGER GROUPS + DEFAULTS ON COMPANY CREATE
-- =========================================================
CREATE OR REPLACE FUNCTION public.seed_company_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  cash_group_id UUID;
  pl_group_id UUID;
BEGIN
  -- Membership row for creator
  INSERT INTO public.company_users (company_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner')
  ON CONFLICT DO NOTHING;

  -- 28 standard Tally primary groups
  INSERT INTO public.ledger_groups (company_id, name, nature, is_primary, affects_gross_profit) VALUES
    (NEW.id, 'Capital Account', 'liabilities', true, false),
    (NEW.id, 'Reserves & Surplus', 'liabilities', true, false),
    (NEW.id, 'Loans (Liability)', 'liabilities', true, false),
    (NEW.id, 'Bank OD A/c', 'liabilities', true, false),
    (NEW.id, 'Secured Loans', 'liabilities', true, false),
    (NEW.id, 'Unsecured Loans', 'liabilities', true, false),
    (NEW.id, 'Current Liabilities', 'liabilities', true, false),
    (NEW.id, 'Duties & Taxes', 'liabilities', true, false),
    (NEW.id, 'Provisions', 'liabilities', true, false),
    (NEW.id, 'Sundry Creditors', 'liabilities', true, false),
    (NEW.id, 'Suspense A/c', 'liabilities', true, false),
    (NEW.id, 'Branch / Divisions', 'assets', true, false),
    (NEW.id, 'Fixed Assets', 'assets', true, false),
    (NEW.id, 'Investments', 'assets', true, false),
    (NEW.id, 'Current Assets', 'assets', true, false),
    (NEW.id, 'Bank Accounts', 'assets', true, false),
    (NEW.id, 'Cash-in-Hand', 'assets', true, false),
    (NEW.id, 'Deposits (Asset)', 'assets', true, false),
    (NEW.id, 'Loans & Advances (Asset)', 'assets', true, false),
    (NEW.id, 'Stock-in-Hand', 'assets', true, false),
    (NEW.id, 'Sundry Debtors', 'assets', true, false),
    (NEW.id, 'Misc. Expenses (Asset)', 'assets', true, false),
    (NEW.id, 'Sales Accounts', 'income', true, true),
    (NEW.id, 'Direct Incomes', 'income', true, true),
    (NEW.id, 'Indirect Incomes', 'income', true, false),
    (NEW.id, 'Purchase Accounts', 'expenses', true, true),
    (NEW.id, 'Direct Expenses', 'expenses', true, true),
    (NEW.id, 'Indirect Expenses', 'expenses', true, false);

  -- Default Cash ledger
  SELECT id INTO cash_group_id FROM public.ledger_groups WHERE company_id = NEW.id AND name = 'Cash-in-Hand';
  INSERT INTO public.ledgers (company_id, group_id, name) VALUES (NEW.id, cash_group_id, 'Cash');

  -- Default P&L
  SELECT id INTO pl_group_id FROM public.ledger_groups WHERE company_id = NEW.id AND name = 'Indirect Incomes';
  INSERT INTO public.ledgers (company_id, group_id, name, is_revenue) VALUES (NEW.id, pl_group_id, 'Profit & Loss A/c', true);

  -- Default units
  INSERT INTO public.stock_units (company_id, symbol, formal_name, decimal_places) VALUES
    (NEW.id, 'Nos', 'Numbers', 0),
    (NEW.id, 'Pcs', 'Pieces', 0),
    (NEW.id, 'Kg', 'Kilograms', 3),
    (NEW.id, 'Ltr', 'Litres', 3),
    (NEW.id, 'Mtr', 'Metres', 2),
    (NEW.id, 'Box', 'Box', 0);

  -- Main Location godown
  INSERT INTO public.godowns (company_id, name) VALUES (NEW.id, 'Main Location');

  -- Primary stock group
  INSERT INTO public.stock_groups (company_id, name) VALUES (NEW.id, 'Primary');

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_seed_company_defaults
  AFTER INSERT ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.seed_company_defaults();
