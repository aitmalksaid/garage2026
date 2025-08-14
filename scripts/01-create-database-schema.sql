-- Création du schéma complet pour le système de gestion de garage

-- Table des clients
CREATE TABLE IF NOT EXISTS clients (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  adresse TEXT,
  telephone VARCHAR(20),
  email VARCHAR(255)
);

-- Table des fournisseurs
CREATE TABLE IF NOT EXISTS fournisseurs (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  nom VARCHAR(200) NOT NULL,
  adresse TEXT,
  telephone VARCHAR(20),
  email VARCHAR(255)
);

-- Table des experts
CREATE TABLE IF NOT EXISTS experts (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  telephone VARCHAR(20),
  email VARCHAR(255)
);

-- Table des assurances
CREATE TABLE IF NOT EXISTS assurances (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  nom VARCHAR(200) NOT NULL,
  adresse TEXT,
  telephone VARCHAR(20),
  email VARCHAR(255)
);

-- Table des voitures
CREATE TABLE IF NOT EXISTS voitures (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  immatriculation VARCHAR(20) UNIQUE NOT NULL,
  marque VARCHAR(100) NOT NULL,
  modele VARCHAR(100) NOT NULL,
  num_chassis VARCHAR(100),
  date_mec DATE,
  client_id BIGINT REFERENCES clients(id) ON DELETE CASCADE
);

-- Table des articles (catalogue de pièces)
CREATE TABLE IF NOT EXISTS articles (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT NOT NULL,
  prix_ht DECIMAL(10,2) NOT NULL DEFAULT 0,
  fournisseur_id BIGINT REFERENCES fournisseurs(id)
);

-- Table des affaires (cœur du système)
CREATE TABLE IF NOT EXISTS affaires (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  numero_affaire VARCHAR(50) UNIQUE NOT NULL,
  date_ouverture DATE DEFAULT CURRENT_DATE,
  statut VARCHAR(50) DEFAULT 'ouvert',
  client_id BIGINT REFERENCES clients(id),
  voiture_id BIGINT REFERENCES voitures(id),
  assurance_id BIGINT REFERENCES assurances(id),
  expert_id BIGINT REFERENCES experts(id),
  description TEXT
);

-- Table des devis
CREATE TABLE IF NOT EXISTS devis (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  numero_devis VARCHAR(50) UNIQUE NOT NULL,
  date_devis DATE DEFAULT CURRENT_DATE,
  statut VARCHAR(50) DEFAULT 'brouillon',
  affaire_id BIGINT REFERENCES affaires(id) ON DELETE CASCADE,
  montant_ht DECIMAL(10,2) DEFAULT 0,
  montant_tva DECIMAL(10,2) DEFAULT 0,
  montant_ttc DECIMAL(10,2) DEFAULT 0,
  mo_tolerie DECIMAL(10,2) DEFAULT 0,
  mo_peinture DECIMAL(10,2) DEFAULT 0,
  mo_mecanique DECIMAL(10,2) DEFAULT 0,
  mo_electrique DECIMAL(10,2) DEFAULT 0
);

-- Table des articles de devis
CREATE TABLE IF NOT EXISTS devis_articles (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  devis_id BIGINT REFERENCES devis(id) ON DELETE CASCADE,
  article_id BIGINT REFERENCES articles(id),
  description TEXT NOT NULL,
  quantite INTEGER NOT NULL DEFAULT 1,
  prix_ht DECIMAL(10,2) NOT NULL DEFAULT 0,
  fournisseur_id BIGINT REFERENCES fournisseurs(id),
  intervention VARCHAR(50) DEFAULT 'REMPLACEMENT'
);

-- Table des bons de commande
CREATE TABLE IF NOT EXISTS bons_commande (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  numero_bon VARCHAR(50) UNIQUE NOT NULL,
  date_commande DATE DEFAULT CURRENT_DATE,
  statut VARCHAR(50) DEFAULT 'brouillon',
  devis_id BIGINT REFERENCES devis(id),
  fournisseur_id BIGINT REFERENCES fournisseurs(id),
  montant_total DECIMAL(10,2) DEFAULT 0
);

-- Table des articles de bon de commande
CREATE TABLE IF NOT EXISTS bons_commande_articles (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  bon_commande_id BIGINT REFERENCES bons_commande(id) ON DELETE CASCADE,
  article_id BIGINT REFERENCES articles(id),
  description TEXT NOT NULL,
  quantite INTEGER NOT NULL DEFAULT 1,
  prix_unitaire DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_ht DECIMAL(10,2) NOT NULL DEFAULT 0,
  statut VARCHAR(50) DEFAULT 'en_attente',
  date_reception DATE,
  notes TEXT,
  intervention VARCHAR(50)
);

-- Table des dépenses (pour calcul des bénéfices)
CREATE TABLE IF NOT EXISTS depenses (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  affaire_id BIGINT REFERENCES affaires(id),
  type VARCHAR(100),
  description TEXT,
  montant DECIMAL(10,2) NOT NULL DEFAULT 0,
  date_depense DATE DEFAULT CURRENT_DATE,
  fournisseur_id BIGINT REFERENCES fournisseurs(id)
);

-- Table des photos
CREATE TABLE IF NOT EXISTS photos (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  url TEXT NOT NULL,
  name VARCHAR(255),
  date_photo DATE DEFAULT CURRENT_DATE,
  entity_type VARCHAR(50),
  entity_id BIGINT,
  photo_type VARCHAR(50)
);

-- Création des index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_voitures_client_id ON voitures(client_id);
CREATE INDEX IF NOT EXISTS idx_affaires_client_id ON affaires(client_id);
CREATE INDEX IF NOT EXISTS idx_affaires_voiture_id ON affaires(voiture_id);
CREATE INDEX IF NOT EXISTS idx_devis_affaire_id ON devis(affaire_id);
CREATE INDEX IF NOT EXISTS idx_devis_articles_devis_id ON devis_articles(devis_id);
CREATE INDEX IF NOT EXISTS idx_bons_commande_devis_id ON bons_commande(devis_id);
CREATE INDEX IF NOT EXISTS idx_bons_commande_articles_bon_commande_id ON bons_commande_articles(bon_commande_id);
CREATE INDEX IF NOT EXISTS idx_depenses_affaire_id ON depenses(affaire_id);
