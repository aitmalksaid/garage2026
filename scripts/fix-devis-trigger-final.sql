-- Supprimer complètement tous les triggers et fonctions problématiques
DROP TRIGGER IF EXISTS trigger_create_bon_commande_on_devis_accept ON devis;
DROP TRIGGER IF EXISTS trigger_update_bon_commande_total ON bons_commande_articles;
DROP FUNCTION IF EXISTS create_bon_commande_from_devis();
DROP FUNCTION IF EXISTS update_bon_commande_total();

-- Créer une fonction corrigée sans références ambiguës
CREATE OR REPLACE FUNCTION create_bon_commande_from_accepted_devis()
RETURNS TRIGGER AS $$
DECLARE
    new_bon_id BIGINT;
    fournisseur_record RECORD;
    article_record RECORD;
    bon_numero TEXT;
    total_montant NUMERIC := 0;
BEGIN
    -- Vérifier si le statut est passé à "accepte"
    IF NEW.statut = 'accepte' AND (OLD.statut IS NULL OR OLD.statut != 'accepte') THEN
        
        -- Pour chaque fournisseur unique dans les articles du devis
        FOR fournisseur_record IN 
            SELECT DISTINCT da.fournisseur_id
            FROM devis_articles da
            WHERE da.devis_id = NEW.id
            AND da.fournisseur_id IS NOT NULL
        LOOP
            -- Générer un numéro unique pour le bon de commande
            bon_numero := 'BC' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(nextval('bons_commande_id_seq')::TEXT, 4, '0');
            
            -- Créer le bon de commande
            INSERT INTO bons_commande (numero_bon, date_commande, statut, devis_id, fournisseur_id, montant_total)
            VALUES (bon_numero, NOW(), 'brouillon', NEW.id, fournisseur_record.fournisseur_id, 0)
            RETURNING id INTO new_bon_id;
            
            -- Réinitialiser le total pour ce bon
            total_montant := 0;
            
            -- Ajouter les articles de ce fournisseur au bon de commande
            FOR article_record IN 
                SELECT da.id, da.description, da.quantite, da.prix_ht, da.intervention
                FROM devis_articles da
                WHERE da.devis_id = NEW.id 
                AND da.fournisseur_id = fournisseur_record.fournisseur_id
            LOOP
                INSERT INTO bons_commande_articles (
                    bon_commande_id, 
                    article_id, 
                    description, 
                    quantite, 
                    prix_unitaire, 
                    total_ht, 
                    statut, 
                    intervention
                )
                VALUES (
                    new_bon_id,
                    NULL, -- article_id peut être NULL pour les articles personnalisés
                    article_record.description,
                    article_record.quantite,
                    article_record.prix_ht,
                    article_record.quantite * article_record.prix_ht,
                    'en_attente',
                    article_record.intervention
                );
                
                -- Ajouter au total
                total_montant := total_montant + (article_record.quantite * article_record.prix_ht);
            END LOOP;
            
            -- Mettre à jour le montant total du bon de commande
            UPDATE bons_commande 
            SET montant_total = total_montant 
            WHERE id = new_bon_id;
            
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger corrigé
CREATE TRIGGER trigger_create_bon_commande_on_devis_accept
    AFTER UPDATE ON devis
    FOR EACH ROW
    EXECUTE FUNCTION create_bon_commande_from_accepted_devis();

-- Créer une fonction pour mettre à jour les totaux des bons de commande
CREATE OR REPLACE FUNCTION update_bon_commande_total_amount()
RETURNS TRIGGER AS $$
DECLARE
    new_total NUMERIC := 0;
BEGIN
    -- Calculer le nouveau total pour le bon de commande
    SELECT COALESCE(SUM(bca.total_ht), 0) 
    INTO new_total
    FROM bons_commande_articles bca
    WHERE bca.bon_commande_id = COALESCE(NEW.bon_commande_id, OLD.bon_commande_id);
    
    -- Mettre à jour le montant total du bon de commande
    UPDATE bons_commande 
    SET montant_total = new_total 
    WHERE id = COALESCE(NEW.bon_commande_id, OLD.bon_commande_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour mettre à jour les totaux
CREATE TRIGGER trigger_update_bon_commande_total_amount
    AFTER INSERT OR UPDATE OR DELETE ON bons_commande_articles
    FOR EACH ROW
    EXECUTE FUNCTION update_bon_commande_total_amount();
