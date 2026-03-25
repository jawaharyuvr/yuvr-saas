-- Database Schema for yuvr's Invoice Generator

-- Users table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT UNIQUE,
  company_name TEXT,
  logo_url TEXT,
  phone TEXT,
  bio TEXT,
  brand_color TEXT DEFAULT '#6366f1',
  custom_font TEXT DEFAULT 'Inter',
  invoice_template TEXT DEFAULT 'modern',
  api_key TEXT UNIQUE,
  subscription_status TEXT DEFAULT 'free',
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Clients table
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  tax_id TEXT,
  tax_type TEXT DEFAULT 'GST' CHECK (tax_type IN ('GST', 'VAT', 'NONE')),
  region TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'unpaid' CHECK (status IN ('paid', 'unpaid', 'overdue')),
  tax_rate DECIMAL(5,2) DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  due_reminder_sent BOOLEAN DEFAULT FALSE,
  overdue_reminder_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, invoice_number)
);

-- Estimates table
CREATE TABLE IF NOT EXISTS public.estimates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients ON DELETE SET NULL,
  estimate_number TEXT NOT NULL,
  expiry_date DATE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'declined', 'converted')),
  tax_rate DECIMAL(5,2) DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, estimate_number)
);

-- Estimate Items table
CREATE TABLE IF NOT EXISTS public.estimate_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  estimate_id UUID REFERENCES public.estimates ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Invoice Items table
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES public.invoices ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can manage own clients" ON public.clients 
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own invoices" ON public.invoices 
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own invoice items" ON public.invoice_items 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.invoices 
    WHERE public.invoices.id = public.invoice_items.invoice_id 
    AND public.invoices.user_id = auth.uid()
  )
);

ALTER TABLE public.estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own estimates" ON public.estimates 
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own estimate items" ON public.estimate_items 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.estimates 
    WHERE public.estimates.id = public.estimate_items.estimate_id 
    AND public.estimates.user_id = auth.uid()
  )
);
