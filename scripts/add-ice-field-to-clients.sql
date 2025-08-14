-- Ajouter le champ ICE à la table clients
ALTER TABLE clients ADD COLUMN ice TEXT;

-- Ajouter un commentaire pour documenter le champ
COMMENT ON COLUMN clients.ice IS 'Identifiant Commun de l''Entreprise (ICE) - Non obligatoire';
