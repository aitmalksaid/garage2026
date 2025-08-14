-- Adding missing numero_police and ref_sin columns to affaires table
ALTER TABLE public.affaires 
ADD COLUMN IF NOT EXISTS numero_police TEXT,
ADD COLUMN IF NOT EXISTS ref_sin TEXT;

-- Update RLS policy to include new columns
DROP POLICY IF EXISTS "Enable all operations for affaires" ON public.affaires;
CREATE POLICY "Enable all operations for affaires" ON public.affaires
FOR ALL USING (true) WITH CHECK (true);
