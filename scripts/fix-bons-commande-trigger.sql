-- Supprimer les anciens triggers s'ils existent
DROP TRIGGER IF EXISTS trigger_create_bons_commande ON devis;
DROP TRIGGER IF EXISTS trigger_create_bons_commande_from_devis ON devis;

-- Supprimer les anciennes fonctions s'elles existent
DROP FUNCTION IF EXISTS create_bons_commande_from_devis();

-- Créer la fonction pour créer automatiquement les bons de commande quand un devis est accepté
CREATE OR REPLACE FUNCTION create_bons_commande_from_devis()
RETURNS TRIGGER AS $$
DECLARE
    fournisseur_record RECORD;
    bon_commande_id BIGINT;
    article_record RECORD;
    bon_numero VARCHAR(50);
BEGIN
    -- Vérifier si le statut passe à 'accepte'
    IF NEW.statut = 'accepte' AND (OLD.statut IS NULL OR OLD.statut != 'accepte') THEN
        
        -- Pour chaque fournisseur distinct dans les articles du devis
        FOR fournisseur_record IN 
            SELECT DISTINCT fournisseur_id 
            FROM devis_articles 
            WHERE devis_id = NEW.id AND fournisseur_id IS NOT NULL
        LOOP
            -- Générer un numéro de bon de commande unique
            bon_numero := 'BC-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD((SELECT COALESCE(MAX(id), 0) + 1 FROM bons_commande)::TEXT, 6, '0');
            
            -- Créer le bon de commande
            INSERT INTO bons_commande (numero_bon, date_commande, devis_id, fournisseur_id, statut, montant_total)
            VALUES (bon_numero, CURRENT_DATE, NEW.id, fournisseur_record.fournisseur_id, 'brouillon', 0)
            RETURNING id INTO bon_commande_id;
            
            -- Ajouter tous les articles de ce fournisseur au bon de commande
            FOR article_record IN 
                SELECT * FROM devis_articles 
                WHERE devis_id = NEW.id AND fournisseur_id = fournisseur_record.fournisseur_id
            LOOP
                INSERT INTO bons_commande_articles (
                    bon_commande_id, article_id, description, quantite, 
                    prix_unitaire, intervention, statut, total_ht
                )
                VALUES (
                    bon_commande_id, article_record.article_id, article_record.description,
                    article_record.quantite, article_record.prix_ht, article_record.intervention,
                    'en_attente', article_record.quantite * article_record.prix_ht
                );
            END LOOP;
            
            -- Fixed ambiguous column reference by qualifying with table alias
            -- Mettre à jour le montant total du bon de commande
            UPDATE bons_commande 
            SET montant_total = (
                SELECT COALESCE(SUM(bca.total_ht), 0)
                FROM bons_commande_articles bca
                WHERE bca.bon_commande_id = bon_commande_id
            )
            WHERE id = bon_commande_id;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour créer automatiquement les bons de commande
CREATE TRIGGER trigger_create_bons_commande_from_devis
    AFTER UPDATE ON devis
    FOR EACH ROW
    EXECUTE FUNCTION create_bons_commande_from_devis();

-- Fonction pour mettre à jour automatiquement le total des bons de commande
CREATE OR REPLACE FUNCTION update_bon_commande_total()
RETURNS TRIGGER AS $$
BEGIN
    -- Fixed ambiguous column reference by qualifying with table alias
    UPDATE bons_commande 
    SET montant_total = (
        SELECT COALESCE(SUM(bca.total_ht), 0)
        FROM bons_commande_articles bca
        WHERE bca.bon_commande_id = COALESCE(NEW.bon_commande_id, OLD.bon_commande_id)
    )
    WHERE id = COALESCE(NEW.bon_commande_id, OLD.bon_commande_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement le total des bons de commande
DROP TRIGGER IF EXISTS trigger_update_bon_commande_total ON bons_commande_articles;
CREATE TRIGGER trigger_update_bon_commande_total
    AFTER INSERT OR UPDATE OR DELETE ON bons_commande_articles
    FOR EACH ROW
    EXECUTE FUNCTION update_bon_commande_total();

-- Fonction pour calculer automatiquement le total_ht des articles de bon de commande
CREATE OR REPLACE FUNCTION calculate_bon_commande_article_total()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_ht = NEW.quantite * NEW.prix_unitaire;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour calculer automatiquement le total_ht
DROP TRIGGER IF EXISTS trigger_calculate_bon_commande_article_total ON bons_commande_articles;
CREATE TRIGGER trigger_calculate_bon_commande_article_total
    BEFORE INSERT OR UPDATE ON bons_commande_articles
    FOR EACH ROW
    EXECUTE FUNCTION calculate_bon_commande_article_total();
