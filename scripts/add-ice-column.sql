-- Ajouter la colonne ICE à la table clients
ALTER TABLE public.clients 
ADD COLUMN ice TEXT;

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN public.clients.ice IS 'Identifiant Commun de l''Entreprise (optionnel)';
