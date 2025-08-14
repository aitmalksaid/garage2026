-- Ajouter les colonnes manquantes à la table affaires
ALTER TABLE public.affaires 
ADD COLUMN IF NOT EXISTS numero_police TEXT,
ADD COLUMN IF NOT EXISTS ref_sin TEXT;

-- Activer RLS pour maintenir la cohérence
ALTER TABLE public.affaires ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre toutes les opérations (pas d'authentification)
DROP POLICY IF EXISTS "Allow all operations on affaires" ON public.affaires;
CREATE POLICY "Allow all operations on affaires" ON public.affaires
FOR ALL USING (true) WITH CHECK (true);
