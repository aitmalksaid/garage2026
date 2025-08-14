-- Création de toutes les tables manquantes pour le système de garage

-- Table des voitures
CREATE TABLE IF NOT EXISTS public.voitures (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    immatriculation TEXT UNIQUE NOT NULL,
    marque TEXT NOT NULL,
    modele TEXT NOT NULL,
    num_chassis TEXT,
    date_mec DATE,
    client_id BIGINT REFERENCES public.clients(id) ON DELETE CASCADE
);

-- Table des fournisseurs
CREATE TABLE IF NOT EXISTS public.fournisseurs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    nom TEXT NOT NULL,
    adresse TEXT,
    telephone TEXT,
    email TEXT
);

-- Table des experts
CREATE TABLE IF NOT EXISTS public.experts (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    telephone TEXT,
    email TEXT
);

-- Table des assurances
CREATE TABLE IF NOT EXISTS public.assurances (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    nom TEXT NOT NULL,
    adresse TEXT,
    telephone TEXT,
    email TEXT
);

-- Table des articles (catalogue de pièces)
CREATE TABLE IF NOT EXISTS public.articles (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    description TEXT NOT NULL,
    prix_ht NUMERIC(10,2) NOT NULL DEFAULT 0,
    fournisseur_id BIGINT REFERENCES public.fournisseurs(id)
);

-- Table des affaires (dossiers de réparation)
CREATE TABLE IF NOT EXISTS public.affaires (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    numero_affaire TEXT UNIQUE NOT NULL,
    date_ouverture DATE DEFAULT CURRENT_DATE,
    statut TEXT DEFAULT 'ouvert' CHECK (statut IN ('ouvert', 'en-cours', 'prepare', 'envoye', 'accepte', 'rejete', 'termine')),
    client_id BIGINT REFERENCES public.clients(id) ON DELETE CASCADE,
    voiture_id BIGINT REFERENCES public.voitures(id) ON DELETE CASCADE,
    assurance_id BIGINT REFERENCES public.assurances(id),
    expert_id BIGINT REFERENCES public.experts(id),
    description TEXT
);

-- Table des devis
CREATE TABLE IF NOT EXISTS public.devis (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    numero_devis TEXT UNIQUE NOT NULL,
    date_devis DATE DEFAULT CURRENT_DATE,
    statut TEXT DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'envoye', 'accepte', 'rejete')),
    affaire_id BIGINT REFERENCES public.affaires(id) ON DELETE CASCADE,
    montant_ht NUMERIC(10,2) DEFAULT 0,
    montant_tva NUMERIC(10,2) DEFAULT 0,
    montant_ttc NUMERIC(10,2) DEFAULT 0,
    mo_tolerie NUMERIC(10,2) DEFAULT 0,
    mo_peinture NUMERIC(10,2) DEFAULT 0,
    mo_mecanique NUMERIC(10,2) DEFAULT 0,
    mo_electrique NUMERIC(10,2) DEFAULT 0
);

-- Table des articles de devis
CREATE TABLE IF NOT EXISTS public.devis_articles (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    devis_id BIGINT REFERENCES public.devis(id) ON DELETE CASCADE,
    article_id BIGINT REFERENCES public.articles(id),
    description TEXT NOT NULL,
    quantite INTEGER NOT NULL DEFAULT 1,
    prix_ht NUMERIC(10,2) NOT NULL DEFAULT 0,
    fournisseur_id BIGINT REFERENCES public.fournisseurs(id),
    intervention TEXT DEFAULT 'REMPLACEMENT' CHECK (intervention IN ('REMPLACEMENT', 'OCCASION', 'REPARATION', 'NEUF'))
);

-- Table des bons de commande
CREATE TABLE IF NOT EXISTS public.bons_commande (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    numero_bon TEXT UNIQUE NOT NULL,
    date_commande DATE DEFAULT CURRENT_DATE,
    statut TEXT DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'envoye', 'termine')),
    devis_id BIGINT REFERENCES public.devis(id) ON DELETE CASCADE,
    fournisseur_id BIGINT REFERENCES public.fournisseurs(id),
    montant_total NUMERIC(10,2) DEFAULT 0
);

-- Table des articles de bons de commande
CREATE TABLE IF NOT EXISTS public.bons_commande_articles (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    bon_commande_id BIGINT REFERENCES public.bons_commande(id) ON DELETE CASCADE,
    article_id BIGINT REFERENCES public.articles(id),
    description TEXT NOT NULL,
    quantite INTEGER NOT NULL DEFAULT 1,
    prix_unitaire NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_ht NUMERIC(10,2) NOT NULL DEFAULT 0,
    statut TEXT DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'commande', 'recu', 'termine')),
    date_reception DATE,
    notes TEXT,
    intervention TEXT
);

-- Table des dépenses (pour calcul des bénéfices)
CREATE TABLE IF NOT EXISTS public.depenses (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    affaire_id BIGINT REFERENCES public.affaires(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    montant NUMERIC(10,2) NOT NULL,
    date_depense DATE DEFAULT CURRENT_DATE,
    fournisseur_id BIGINT REFERENCES public.fournisseurs(id)
);

-- Activation de RLS (Row Level Security) pour toutes les tables
ALTER TABLE public.voitures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fournisseurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assurances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devis_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bons_commande ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bons_commande_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depenses ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour permettre l'accès public (pas d'authentification)
CREATE POLICY "Allow all operations" ON public.voitures FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.fournisseurs FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.experts FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.assurances FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.articles FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.affaires FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.devis FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.devis_articles FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.bons_commande FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.bons_commande_articles FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.depenses FOR ALL USING (true);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_voitures_client_id ON public.voitures(client_id);
CREATE INDEX IF NOT EXISTS idx_voitures_immatriculation ON public.voitures(immatriculation);
CREATE INDEX IF NOT EXISTS idx_affaires_numero ON public.affaires(numero_affaire);
CREATE INDEX IF NOT EXISTS idx_affaires_client_id ON public.affaires(client_id);
CREATE INDEX IF NOT EXISTS idx_affaires_voiture_id ON public.affaires(voiture_id);
CREATE INDEX IF NOT EXISTS idx_devis_affaire_id ON public.devis(affaire_id);
CREATE INDEX IF NOT EXISTS idx_devis_articles_devis_id ON public.devis_articles(devis_id);
CREATE INDEX IF NOT EXISTS idx_bons_commande_devis_id ON public.bons_commande(devis_id);
CREATE INDEX IF NOT EXISTS idx_bons_commande_articles_bon_id ON public.bons_commande_articles(bon_commande_id);

-- Insertion de données d'exemple
INSERT INTO public.fournisseurs (nom, adresse, telephone, email) VALUES
('Pièces Auto Plus', '123 Rue de la Mécanique, 75001 Paris', '01.23.45.67.89', 'contact@piecesautoplus.fr'),
('Garage Supply', '456 Avenue des Réparations, 69000 Lyon', '04.78.90.12.34', 'info@garagesupply.fr'),
('Auto Parts Pro', '789 Boulevard de l''Automobile, 13000 Marseille', '04.91.23.45.67', 'vente@autopartspro.fr')
ON CONFLICT DO NOTHING;

INSERT INTO public.experts (nom, prenom, telephone, email) VALUES
('Dupont', 'Jean', '06.12.34.56.78', 'j.dupont@expert-auto.fr'),
('Martin', 'Sophie', '06.98.76.54.32', 's.martin@expertise-vehicule.fr'),
('Bernard', 'Pierre', '06.11.22.33.44', 'p.bernard@expert-assurance.fr')
ON CONFLICT DO NOTHING;

INSERT INTO public.assurances (nom, adresse, telephone, email) VALUES
('Assurance Auto France', '100 Rue de la Paix, 75008 Paris', '01.40.50.60.70', 'sinistres@aaf.fr'),
('Mutuelle Automobile', '200 Avenue de la République, 69003 Lyon', '04.72.80.90.00', 'contact@mutuelle-auto.fr'),
('Garantie Plus', '300 Boulevard Michelet, 13008 Marseille', '04.91.10.20.30', 'service@garantieplus.fr')
ON CONFLICT DO NOTHING;

INSERT INTO public.articles (description, prix_ht, fournisseur_id) VALUES
('Pare-choc avant', 250.00, 1),
('Phare avant droit', 120.00, 1),
('Rétroviseur gauche', 80.00, 2),
('Capot moteur', 300.00, 2),
('Aile avant droite', 180.00, 3),
('Peinture carrosserie (1L)', 45.00, 3)
ON CONFLICT DO NOTHING;

-- Insertion de quelques voitures d'exemple
INSERT INTO public.voitures (immatriculation, marque, modele, num_chassis, date_mec, client_id) VALUES
('AB-123-CD', 'Peugeot', '308', 'VF3XXXXXXXX123456', '2020-03-15', 1),
('EF-456-GH', 'Renault', 'Clio', 'VF1XXXXXXXX789012', '2019-07-22', 1)
ON CONFLICT (immatriculation) DO NOTHING;
