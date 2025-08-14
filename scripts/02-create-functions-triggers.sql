-- Fonction pour mettre à jour le total d'un bon de commande
CREATE OR REPLACE FUNCTION update_bon_commande_total()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.bons_commande 
    SET montant_total = (
        SELECT COALESCE(SUM(total_ht), 0)
        FROM public.bons_commande_articles 
        WHERE bon_commande_id = COALESCE(NEW.bon_commande_id, OLD.bon_commande_id)
    )
    WHERE id = COALESCE(NEW.bon_commande_id, OLD.bon_commande_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement le total des bons de commande
DROP TRIGGER IF EXISTS trigger_update_bon_commande_total ON public.bons_commande_articles;
CREATE TRIGGER trigger_update_bon_commande_total
    AFTER INSERT OR UPDATE OR DELETE ON public.bons_commande_articles
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
DROP TRIGGER IF EXISTS trigger_calculate_bon_commande_article_total ON public.bons_commande_articles;
CREATE TRIGGER trigger_calculate_bon_commande_article_total
    BEFORE INSERT OR UPDATE ON public.bons_commande_articles
    FOR EACH ROW
    EXECUTE FUNCTION calculate_bon_commande_article_total();

-- Fonction pour créer automatiquement les bons de commande quand un devis est accepté
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
            FROM public.devis_articles 
            WHERE devis_id = NEW.id AND fournisseur_id IS NOT NULL
        LOOP
            -- Générer un numéro de bon de commande unique
            bon_numero := 'BC-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('bons_commande_id_seq')::TEXT, 6, '0');
            
            -- Créer le bon de commande
            INSERT INTO public.bons_commande (numero_bon, devis_id, fournisseur_id, statut)
            VALUES (bon_numero, NEW.id, fournisseur_record.fournisseur_id, 'brouillon')
            RETURNING id INTO bon_commande_id;
            
            -- Ajouter tous les articles de ce fournisseur au bon de commande
            FOR article_record IN 
                SELECT * FROM public.devis_articles 
                WHERE devis_id = NEW.id AND fournisseur_id = fournisseur_record.fournisseur_id
            LOOP
                INSERT INTO public.bons_commande_articles (
                    bon_commande_id, article_id, description, quantite, 
                    prix_unitaire, intervention, statut
                )
                VALUES (
                    bon_commande_id, article_record.article_id, article_record.description,
                    article_record.quantite, article_record.prix_ht, article_record.intervention,
                    'en_attente'
                );
            END LOOP;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour créer automatiquement les bons de commande
DROP TRIGGER IF EXISTS trigger_create_bons_commande_from_devis ON public.devis;
CREATE TRIGGER trigger_create_bons_commande_from_devis
    AFTER UPDATE ON public.devis
    FOR EACH ROW
    EXECUTE FUNCTION create_bons_commande_from_devis();
