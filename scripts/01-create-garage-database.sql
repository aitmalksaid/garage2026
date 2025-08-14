-- Création du schéma complet pour le système de gestion de garage

-- Table des clients
CREATE TABLE IF NOT EXISTS public.clients (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    adresse TEXT,
    telephone VARCHAR(20),
    email VARCHAR(100)
);

-- Table des fournisseurs
CREATE TABLE IF NOT EXISTS public.fournisseurs (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    nom VARCHAR(100) NOT NULL,
    adresse TEXT,
    telephone VARCHAR(20),
    email VARCHAR(100)
);

-- Table des experts
CREATE TABLE IF NOT EXISTS public.experts (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    telephone VARCHAR(20),
    email VARCHAR(100)
);

-- Table des assurances
CREATE TABLE IF NOT EXISTS public.assurances (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    nom VARCHAR(100) NOT NULL,
    adresse TEXT,
    telephone VARCHAR(20),
    email VARCHAR(100)
);

-- Table des articles (catalogue de pièces)
CREATE TABLE IF NOT EXISTS public.articles (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    description TEXT NOT NULL,
    prix_ht DECIMAL(10,2) NOT NULL DEFAULT 0,
    fournisseur_id BIGINT REFERENCES public.fournisseurs(id)
);

-- Table des voitures
CREATE TABLE IF NOT EXISTS public.voitures (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    immatriculation VARCHAR(20) UNIQUE NOT NULL,
    marque VARCHAR(50) NOT NULL,
    modele VARCHAR(50) NOT NULL,
    num_chassis VARCHAR(50),
    date_mec DATE,
    client_id BIGINT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE
);

-- Table des affaires (dossiers de réparation)
CREATE TABLE IF NOT EXISTS public.affaires (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    numero_affaire VARCHAR(50) UNIQUE NOT NULL,
    date_ouverture DATE DEFAULT CURRENT_DATE,
    statut VARCHAR(20) DEFAULT 'ouvert' CHECK (statut IN ('ouvert', 'en_cours', 'prepare', 'envoye', 'accepte', 'rejete', 'termine')),
    client_id BIGINT NOT NULL REFERENCES public.clients(id),
    voiture_id BIGINT NOT NULL REFERENCES public.voitures(id),
    assurance_id BIGINT REFERENCES public.assurances(id),
    expert_id BIGINT REFERENCES public.experts(id),
    description TEXT
);

-- Table des devis
CREATE TABLE IF NOT EXISTS public.devis (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    numero_devis VARCHAR(50) UNIQUE NOT NULL,
    date_devis DATE DEFAULT CURRENT_DATE,
    statut VARCHAR(20) DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'envoye', 'accepte', 'rejete')),
    affaire_id BIGINT NOT NULL REFERENCES public.affaires(id) ON DELETE CASCADE,
    montant_ht DECIMAL(10,2) DEFAULT 0,
    montant_tva DECIMAL(10,2) DEFAULT 0,
    montant_ttc DECIMAL(10,2) DEFAULT 0,
    mo_tolerie DECIMAL(10,2) DEFAULT 0,
    mo_peinture DECIMAL(10,2) DEFAULT 0,
    mo_mecanique DECIMAL(10,2) DEFAULT 0,
    mo_electrique DECIMAL(10,2) DEFAULT 0
);

-- Table des articles de devis
CREATE TABLE IF NOT EXISTS public.devis_articles (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    devis_id BIGINT NOT NULL REFERENCES public.devis(id) ON DELETE CASCADE,
    article_id BIGINT REFERENCES public.articles(id),
    description TEXT NOT NULL,
    quantite INTEGER NOT NULL DEFAULT 1,
    prix_ht DECIMAL(10,2) NOT NULL DEFAULT 0,
    fournisseur_id BIGINT REFERENCES public.fournisseurs(id),
    intervention VARCHAR(20) DEFAULT 'REMPLACEMENT' CHECK (intervention IN ('REMPLACEMENT', 'OCCASION', 'REPARATION', 'NEUF'))
);

-- Table des bons de commande
CREATE TABLE IF NOT EXISTS public.bons_commande (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    numero_bon VARCHAR(50) UNIQUE NOT NULL,
    date_commande DATE DEFAULT CURRENT_DATE,
    statut VARCHAR(20) DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'envoye', 'termine')),
    devis_id BIGINT NOT NULL REFERENCES public.devis(id),
    fournisseur_id BIGINT NOT NULL REFERENCES public.fournisseurs(id),
    montant_total DECIMAL(10,2) DEFAULT 0
);

-- Table des articles de bon de commande
CREATE TABLE IF NOT EXISTS public.bons_commande_articles (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    bon_commande_id BIGINT NOT NULL REFERENCES public.bons_commande(id) ON DELETE CASCADE,
    article_id BIGINT REFERENCES public.articles(id),
    description TEXT NOT NULL,
    quantite INTEGER NOT NULL DEFAULT 1,
    prix_unitaire DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_ht DECIMAL(10,2) NOT NULL DEFAULT 0,
    statut VARCHAR(20) DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'commande', 'recu', 'termine')),
    date_reception DATE,
    notes TEXT,
    intervention VARCHAR(20)
);

-- Table des dépenses (pour calcul des bénéfices)
CREATE TABLE IF NOT EXISTS public.depenses (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    affaire_id BIGINT NOT NULL REFERENCES public.affaires(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    montant DECIMAL(10,2) NOT NULL,
    date_depense DATE DEFAULT CURRENT_DATE,
    fournisseur_id BIGINT REFERENCES public.fournisseurs(id)
);

-- Création des index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_voitures_client_id ON public.voitures(client_id);
CREATE INDEX IF NOT EXISTS idx_affaires_client_id ON public.affaires(client_id);
CREATE INDEX IF NOT EXISTS idx_affaires_voiture_id ON public.affaires(voiture_id);
CREATE INDEX IF NOT EXISTS idx_devis_affaire_id ON public.devis(affaire_id);
CREATE INDEX IF NOT EXISTS idx_devis_articles_devis_id ON public.devis_articles(devis_id);
CREATE INDEX IF NOT EXISTS idx_bons_commande_devis_id ON public.bons_commande(devis_id);
CREATE INDEX IF NOT EXISTS idx_bons_commande_articles_bon_commande_id ON public.bons_commande_articles(bon_commande_id);
CREATE INDEX IF NOT EXISTS idx_depenses_affaire_id ON public.depenses(affaire_id);
