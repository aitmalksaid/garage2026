-- Ajouter les champs d'assurance à la table affaires
ALTER TABLE public.affaires 
ADD COLUMN numero_police TEXT,
ADD COLUMN ref_sin TEXT,
ADD COLUMN agent TEXT;

-- Ajouter des commentaires pour documenter les colonnes
COMMENT ON COLUMN public.affaires.numero_police IS 'Numéro de police d''assurance';
COMMENT ON COLUMN public.affaires.ref_sin IS 'Référence du sinistre';
COMMENT ON COLUMN public.affaires.agent IS 'Agent d''assurance';
