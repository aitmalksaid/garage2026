-- Drop and recreate trigger to fix ambiguous column reference
DROP TRIGGER IF EXISTS create_bon_commande_on_devis_accepte ON devis;
DROP FUNCTION IF EXISTS create_bon_commande_from_devis();

-- Create corrected function without ambiguous column references
CREATE OR REPLACE FUNCTION create_bon_commande_from_devis()
RETURNS TRIGGER AS $$
DECLARE
    fournisseur_record RECORD;
    new_bon_commande_id BIGINT;
    article_record RECORD;
    next_bon_number TEXT;
BEGIN
    -- Only proceed if status is 'accepte'
    IF NEW.statut = 'accepte' THEN
        -- Get distinct suppliers from devis articles
        FOR fournisseur_record IN 
            SELECT DISTINCT da.fournisseur_id, f.nom as fournisseur_nom
            FROM devis_articles da
            LEFT JOIN fournisseurs f ON f.id = da.fournisseur_id
            WHERE da.devis_id = NEW.id AND da.fournisseur_id IS NOT NULL
        LOOP
            -- Generate unique bon number
            SELECT COALESCE('BC' || LPAD((MAX(CAST(SUBSTRING(numero_bon FROM 3) AS INTEGER)) + 1)::TEXT, 8, '0'), 'BC00000001')
            INTO next_bon_number
            FROM bons_commande 
            WHERE numero_bon ~ '^BC[0-9]+$';

            -- Create bon de commande for this supplier
            INSERT INTO bons_commande (
                numero_bon, 
                date_commande, 
                statut, 
                devis_id, 
                fournisseur_id, 
                montant_total
            ) VALUES (
                next_bon_number,
                CURRENT_DATE,
                'brouillon',
                NEW.id,
                fournisseur_record.fournisseur_id,
                0 -- Will be updated below
            ) RETURNING id INTO new_bon_commande_id;

            -- Insert articles for this bon de commande
            FOR article_record IN 
                SELECT da.*, a.description as article_description
                FROM devis_articles da
                LEFT JOIN articles a ON a.id = da.article_id
                WHERE da.devis_id = NEW.id AND da.fournisseur_id = fournisseur_record.fournisseur_id
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
                ) VALUES (
                    new_bon_commande_id,
                    article_record.article_id,
                    COALESCE(article_record.description, article_record.article_description),
                    article_record.quantite,
                    article_record.prix_ht,
                    article_record.quantite * article_record.prix_ht,
                    'en_attente',
                    article_record.intervention
                );
            END LOOP;

            -- Update total for this bon de commande
            UPDATE bons_commande 
            SET montant_total = (
                SELECT COALESCE(SUM(total_ht), 0) 
                FROM bons_commande_articles 
                WHERE bons_commande_articles.bon_commande_id = new_bon_commande_id
            )
            WHERE id = new_bon_commande_id;

        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER create_bon_commande_on_devis_accepte
    AFTER INSERT OR UPDATE ON devis
    FOR EACH ROW
    EXECUTE FUNCTION create_bon_commande_from_devis();
