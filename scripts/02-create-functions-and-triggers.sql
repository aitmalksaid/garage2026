-- Fonction pour mettre à jour automatiquement le total des bons de commande
CREATE OR REPLACE FUNCTION update_bon_commande_total()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour le montant total du bon de commande
  UPDATE bons_commande 
  SET montant_total = (
    SELECT COALESCE(SUM(total_ht), 0)
    FROM bons_commande_articles 
    WHERE bon_commande_id = COALESCE(NEW.bon_commande_id, OLD.bon_commande_id)
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
CREATE OR REPLACE FUNCTION calculate_article_total()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_ht = NEW.quantite * NEW.prix_unitaire;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour calculer automatiquement le total_ht
DROP TRIGGER IF EXISTS trigger_calculate_article_total ON bons_commande_articles;
CREATE TRIGGER trigger_calculate_article_total
  BEFORE INSERT OR UPDATE ON bons_commande_articles
  FOR EACH ROW
  EXECUTE FUNCTION calculate_article_total();

-- Fonction pour créer automatiquement les bons de commande quand un devis est accepté
CREATE OR REPLACE FUNCTION create_bons_commande_from_devis()
RETURNS TRIGGER AS $$
DECLARE
  fournisseur_record RECORD;
  bon_commande_id BIGINT;
  article_record RECORD;
BEGIN
  -- Vérifier si le statut est passé à "devis accepter"
  IF NEW.statut = 'devis accepter' AND (OLD.statut IS NULL OR OLD.statut != 'devis accepter') THEN
    
    -- Pour chaque fournisseur distinct dans les articles du devis
    FOR fournisseur_record IN 
      SELECT DISTINCT fournisseur_id 
      FROM devis_articles 
      WHERE devis_id = NEW.id AND fournisseur_id IS NOT NULL
    LOOP
      -- Créer un nouveau bon de commande pour ce fournisseur
      INSERT INTO bons_commande (
        numero_bon, 
        date_commande, 
        statut, 
        devis_id, 
        fournisseur_id
      ) VALUES (
        'BC-' || NEW.numero_devis || '-' || fournisseur_record.fournisseur_id,
        CURRENT_DATE,
        'brouillon',
        NEW.id,
        fournisseur_record.fournisseur_id
      ) RETURNING id INTO bon_commande_id;
      
      -- Copier tous les articles de ce fournisseur dans le bon de commande
      FOR article_record IN 
        SELECT * FROM devis_articles 
        WHERE devis_id = NEW.id AND fournisseur_id = fournisseur_record.fournisseur_id
      LOOP
        INSERT INTO bons_commande_articles (
          bon_commande_id,
          article_id,
          description,
          quantite,
          prix_unitaire,
          intervention
        ) VALUES (
          bon_commande_id,
          article_record.article_id,
          article_record.description,
          article_record.quantite,
          article_record.prix_ht,
          article_record.intervention
        );
      END LOOP;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour créer automatiquement les bons de commande
DROP TRIGGER IF EXISTS trigger_create_bons_commande ON devis;
CREATE TRIGGER trigger_create_bons_commande
  AFTER UPDATE ON devis
  FOR EACH ROW
  EXECUTE FUNCTION create_bons_commande_from_devis();
