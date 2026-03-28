-- Migration V1: Business Modules (Payments, Staff, Inventory, Expenses)

-- 1. Profiles Update
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS upi_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS qr_code_enabled BOOLEAN DEFAULT FALSE;

-- 2. Staff Management Table
CREATE TABLE IF NOT EXISTS public.staff (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'staff' CHECK (role IN ('admin', 'staff', 'viewer')),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(business_id, user_id)
);

-- 3. Inventory / Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  sku TEXT,
  description TEXT,
  unit_price DECIMAL(12,2) NOT NULL,
  current_stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  unit TEXT DEFAULT 'Pcs',
  hsn_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  category TEXT NOT NULL,
  receipt_url TEXT,
  notes TEXT,
  expense_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Row Level Security (RLS)
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- 6. Updated Policies (Include Business Context)

-- Function to get Business ID for the current user
CREATE OR REPLACE FUNCTION public.get_current_business_id()
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Check if user is staff for someone else
  SELECT business_id INTO v_id FROM public.staff WHERE user_id = auth.uid() LIMIT 1;
  -- If not staff, they are the owner
  IF v_id IS NULL THEN
    RETURN auth.uid();
  END IF;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Staff Policies
CREATE POLICY "Staff can view their business context" ON public.staff 
FOR SELECT USING (auth.uid() = user_id OR auth.uid() = business_id);

CREATE POLICY "Owners can manage staff" ON public.staff 
FOR ALL USING (auth.uid() = business_id);

-- Updated Policies for Existing Tables (Clients, Invoices, etc.)
-- We use public.get_current_business_id() to allow staff access

DROP POLICY IF EXISTS "Users can manage own clients" ON public.clients;
CREATE POLICY "Business members can manage clients" ON public.clients 
FOR ALL USING (user_id = public.get_current_business_id());

DROP POLICY IF EXISTS "Users can manage own invoices" ON public.invoices;
CREATE POLICY "Business members can manage invoices" ON public.invoices 
FOR ALL USING (user_id = public.get_current_business_id());

DROP POLICY IF EXISTS "Users can manage own invoice items" ON public.invoice_items;
CREATE POLICY "Business members can manage invoice items" ON public.invoice_items 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.invoices 
    WHERE public.invoices.id = public.invoice_items.invoice_id 
    AND public.invoices.user_id = public.get_current_business_id()
  )
);

-- Products & Expenses Policies
CREATE POLICY "Business members can manage products" ON public.products 
FOR ALL USING (user_id = public.get_current_business_id());

CREATE POLICY "Business members can manage expenses" ON public.expenses 
FOR ALL USING (user_id = public.get_current_business_id());
