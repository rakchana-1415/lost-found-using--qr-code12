-- Create users table for QR code owners
CREATE TABLE public.qr_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  unique_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create scans table to log when QR codes are scanned
CREATE TABLE public.qr_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  qr_user_id UUID NOT NULL REFERENCES public.qr_users(id) ON DELETE CASCADE,
  scanned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- Enable Row Level Security
ALTER TABLE public.qr_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_scans ENABLE ROW LEVEL SECURITY;

-- Create policies - allow anyone to create users and read user info (public app)
CREATE POLICY "Anyone can create QR users" 
ON public.qr_users 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view QR users" 
ON public.qr_users 
FOR SELECT 
USING (true);

-- Create policies for scans - allow anyone to log scans
CREATE POLICY "Anyone can create scan logs" 
ON public.qr_scans 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view scan logs" 
ON public.qr_scans 
FOR SELECT 
USING (true);

-- Create index for faster unique_code lookups
CREATE INDEX idx_qr_users_unique_code ON public.qr_users(unique_code);