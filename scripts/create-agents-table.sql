-- Créer la table agents
CREATE TABLE IF NOT EXISTS public.agents (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    nom TEXT NOT NULL,
    prenom TEXT,
    telephone TEXT,
    email TEXT,
    compagnie TEXT
);

-- Activer RLS
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre toutes les opérations
CREATE POLICY "Allow all operations on agents" ON public.agents
    FOR ALL USING (true) WITH CHECK (true);

-- Insérer quelques agents d'exemple
INSERT INTO public.agents (nom, prenom, telephone, email, compagnie) VALUES
('MAMDA MARRAKECH', '', '05.24.33.44.55', 'contact@mamda.ma', 'MAMDA'),
('WAFA ASSURANCE', '', '05.22.11.22.33', 'agents@wafa.ma', 'WAFA'),
('ATLANTA ASSURANCE', '', '05.29.88.77.66', 'service@atlanta.ma', 'ATLANTA');

-- Modifier la table affaires pour utiliser agent_id au lieu d'agent
ALTER TABLE public.affaires ADD COLUMN IF NOT EXISTS agent_id BIGINT REFERENCES public.agents(id);

-- Copier les données existantes si nécessaire (optionnel)
-- UPDATE public.affaires SET agent_id = 1 WHERE agent IS NOT NULL;

-- Supprimer l'ancienne colonne agent (optionnel, à faire plus tard)
-- ALTER TABLE public.affaires DROP COLUMN IF EXISTS agent;
