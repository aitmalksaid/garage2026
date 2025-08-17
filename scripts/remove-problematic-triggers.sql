-- Remove all existing triggers that might cause ambiguous column references
-- Drop all existing triggers and functions related to bons de commande
DROP TRIGGER IF EXISTS trigger_create_bon_commande ON devis;
DROP TRIGGER IF EXISTS trigger_update_bon_commande_total ON bons_commande_articles;
DROP FUNCTION IF EXISTS create_bon_commande_from_devis();
DROP FUNCTION IF EXISTS update_bon_commande_total();

-- Enable RLS on all tables to ensure proper access
ALTER TABLE bons_commande ENABLE ROW LEVEL SECURITY;
ALTER TABLE bons_commande_articles ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (since we removed authentication)
CREATE POLICY "Allow all operations on bons_commande" ON bons_commande FOR ALL USING (true);
CREATE POLICY "Allow all operations on bons_commande_articles" ON bons_commande_articles FOR ALL USING (true);

-- Note: Triggers removed to prevent ambiguous column reference errors
-- Bons de commande will need to be created manually or through application logic
