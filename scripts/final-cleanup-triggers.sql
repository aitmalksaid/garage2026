-- Script final pour supprimer définitivement tous les triggers et tables problématiques
-- qui causent l'erreur "column reference bon_commande_id is ambiguous"

-- Supprimer tous les triggers existants sur toutes les tables
DO $$ 
DECLARE
    trigger_record RECORD;
BEGIN
    -- Supprimer tous les triggers sur la table devis
    FOR trigger_record IN 
        SELECT trigger_name, event_object_table 
        FROM information_schema.triggers 
        WHERE event_object_schema = 'public' 
        AND event_object_table IN ('devis', 'devis_articles', 'bons_commande', 'bons_commande_articles')
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_record.trigger_name || ' ON ' || trigger_record.event_object_table || ' CASCADE';
    END LOOP;
END $$;

-- Supprimer toutes les fonctions liées aux bons de commande
DROP FUNCTION IF EXISTS create_bons_commande() CASCADE;
DROP FUNCTION IF EXISTS generate_bons_commande() CASCADE;
DROP FUNCTION IF EXISTS handle_devis_status_change() CASCADE;
DROP FUNCTION IF EXISTS create_bon_commande_from_devis() CASCADE;
DROP FUNCTION IF EXISTS auto_create_bons_commande() CASCADE;

-- Supprimer les tables bons_commande (nous utilisons maintenant les devis acceptés directement)
DROP TABLE IF EXISTS bons_commande_articles CASCADE;
DROP TABLE IF EXISTS bons_commande CASCADE;

-- Confirmer la suppression
SELECT 'Tous les triggers et tables problématiques ont été supprimés' as status;
