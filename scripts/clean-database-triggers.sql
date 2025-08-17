-- Script pour supprimer définitivement tous les triggers et tables problématiques
-- qui causent l'erreur "column reference bon_commande_id is ambiguous"

-- Supprimer tous les triggers sur toutes les tables
DROP TRIGGER IF EXISTS create_bon_commande_trigger ON devis;
DROP TRIGGER IF EXISTS devis_status_trigger ON devis;
DROP TRIGGER IF EXISTS generate_bon_commande_trigger ON devis;
DROP TRIGGER IF EXISTS auto_create_bon_commande ON devis;
DROP TRIGGER IF EXISTS create_bons_commande_on_devis_accept ON devis;

-- Supprimer toutes les fonctions liées aux bons de commande
DROP FUNCTION IF EXISTS create_bon_commande_from_devis();
DROP FUNCTION IF EXISTS generate_bon_commande();
DROP FUNCTION IF EXISTS create_bons_commande_from_devis();
DROP FUNCTION IF EXISTS auto_create_bon_commande();
DROP FUNCTION IF EXISTS create_bons_commande_on_devis_accept();

-- Supprimer les tables bons_commande qui causent les conflits
-- (nous utilisons maintenant les devis acceptés directement)
DROP TABLE IF EXISTS bons_commande_articles CASCADE;
DROP TABLE IF EXISTS bons_commande CASCADE;

-- Vérifier qu'il n'y a plus de triggers actifs
SELECT 
    schemaname,
    tablename,
    triggername
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
AND NOT t.tgisinternal;

-- Message de confirmation
SELECT 'Tous les triggers et tables problématiques ont été supprimés' as status;
