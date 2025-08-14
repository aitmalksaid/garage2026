-- Créer la table clients
CREATE TABLE IF NOT EXISTS public.clients (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    adresse TEXT,
    telephone TEXT,
    email TEXT
);

-- Activer RLS (Row Level Security)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Créer une politique pour permettre toutes les opérations (pour le développement)
CREATE POLICY "Enable all operations for clients" ON public.clients
    FOR ALL USING (true) WITH CHECK (true);

-- Insérer quelques données d'exemple
INSERT INTO public.clients (nom, prenom, adresse, telephone, email) VALUES
    ('Dupont', 'Jean', '123 Rue de la Paix, 75001 Paris', '01 23 45 67 89', 'jean.dupont@email.com'),
    ('Martin', 'Marie', '456 Avenue des Champs, 69000 Lyon', '04 56 78 90 12', 'marie.martin@email.com'),
    ('Bernard', 'Pierre', '789 Boulevard Saint-Michel, 13000 Marseille', '04 91 23 45 67', 'pierre.bernard@email.com'),
    ('Dubois', 'Sophie', '321 Rue Victor Hugo, 31000 Toulouse', '05 34 56 78 90', 'sophie.dubois@email.com'),
    ('Moreau', 'Paul', '654 Place de la République, 44000 Nantes', '02 40 12 34 56', 'paul.moreau@email.com');
