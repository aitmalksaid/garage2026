-- Ajouter les colonnes manquantes à la table affaires
ALTER TABLE public.affaires 
ADD COLUMN IF NOT EXISTS numero_police TEXT,
ADD COLUMN IF NOT EXISTS ref_sin TEXT;

-- Mettre à jour les politiques RLS pour inclure les nouvelles colonnes
DROP POLICY IF EXISTS "Allow all operations for affaires" ON public.affaires;
CREATE POLICY "Allow all operations for affaires" ON public.affaires FOR ALL USING (true) WITH CHECK (true);
