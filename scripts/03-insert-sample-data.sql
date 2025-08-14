-- Insertion de données d'exemple pour tester le système

-- Insertion de clients d'exemple
INSERT INTO clients (nom, prenom, adresse, telephone, email) VALUES
('Dupont', 'Jean', '123 Rue de la Paix, 75001 Paris', '0123456789', 'jean.dupont@email.com'),
('Martin', 'Marie', '456 Avenue des Champs, 69000 Lyon', '0987654321', 'marie.martin@email.com'),
('Bernard', 'Pierre', '789 Boulevard Saint-Michel, 13000 Marseille', '0147258369', 'pierre.bernard@email.com'),
('Lefevre', 'Claire', '321 Rue Victor Hugo, 33000 Bordeaux', '0556789123', 'claire.lefevre@email.com'),
('Rousseau', 'Thomas', '654 Place de la République, 67000 Strasbourg', '0388456789', 'thomas.rousseau@email.com');

-- Insertion de fournisseurs d'exemple
INSERT INTO fournisseurs (nom, adresse, telephone, email) VALUES
('Pièces Auto Pro', '12 Zone Industrielle, 94000 Créteil', '0145678901', 'contact@piecesautopro.fr'),
('Garage Supply', '34 Rue de l''Industrie, 59000 Lille', '0320456789', 'info@garagesupply.fr'),
('Auto Parts France', '56 Avenue de la République, 31000 Toulouse', '0561234567', 'vente@autopartsfrance.fr'),
('Carrosserie Discount', '78 Boulevard des Artisans, 44000 Nantes', '0240123456', 'commande@carrosserie-discount.fr');

-- Insertion d'experts d'exemple
INSERT INTO experts (nom, prenom, telephone, email) VALUES
('Leroy', 'Antoine', '0156789012', 'antoine.leroy@expert.fr'),
('Moreau', 'Sophie', '0234567890', 'sophie.moreau@expertise.fr'),
('Petit', 'Michel', '0345678901', 'michel.petit@expert-auto.fr'),
('Dubois', 'Isabelle', '0456789012', 'isabelle.dubois@expertise-auto.fr');

-- Insertion d'assurances d'exemple
INSERT INTO assurances (nom, adresse, telephone, email) VALUES
('Assurance Générale', '100 Rue de Rivoli, 75001 Paris', '0800123456', 'contact@assurance-generale.fr'),
('Mutuelle Auto', '200 Avenue de la Liberté, 69000 Lyon', '0800234567', 'info@mutuelle-auto.fr'),
('Protection Plus', '300 Boulevard Haussmann, 75008 Paris', '0800345678', 'service@protection-plus.fr'),
('Sécurité Auto', '400 Rue de la Paix, 13000 Marseille', '0800456789', 'contact@securite-auto.fr');

-- Insertion de voitures d'exemple
INSERT INTO voitures (immatriculation, marque, modele, num_chassis, date_mec, client_id) VALUES
('AB-123-CD', 'Renault', 'Clio', 'VF1CB0E0H12345678', '2018-03-15', 1),
('EF-456-GH', 'Peugeot', '308', 'VF3LC9HZ8HS123456', '2020-07-22', 2),
('IJ-789-KL', 'Citroën', 'C4', 'VF7N1HZ8VHS654321', '2019-11-10', 3),
('MN-012-OP', 'Volkswagen', 'Golf', 'WVWZZZ1JZ1W123456', '2021-05-18', 4),
('QR-345-ST', 'BMW', 'Série 3', 'WBA3A5G50ENS12345', '2019-09-12', 5);

-- Insertion d'articles d'exemple
INSERT INTO articles (description, prix_ht, fournisseur_id) VALUES
('Pare-choc avant Renault Clio', 250.00, 1),
('Phare avant droit Peugeot 308', 180.00, 2),
('Rétroviseur gauche Citroën C4', 95.00, 3),
('Peinture carrosserie - Pot 1L', 45.00, 1),
('Mastic de carrosserie', 25.00, 2),
('Capot moteur Volkswagen Golf', 420.00, 4),
('Aile avant droite BMW Série 3', 380.00, 1),
('Pare-brise Renault Clio', 150.00, 3),
('Feu arrière gauche Peugeot 308', 85.00, 2),
('Poignée de porte extérieure', 35.00, 4);

-- Insertion d'affaires d'exemple
INSERT INTO affaires (numero_affaire, date_ouverture, statut, client_id, voiture_id, assurance_id, expert_id, description) VALUES
('AFF-2024-001', '2024-01-15', 'en_cours', 1, 1, 1, 1, 'Accident léger - Pare-choc avant endommagé'),
('AFF-2024-002', '2024-01-20', 'ouvert', 2, 2, 2, 2, 'Bris de glace - Phare avant à remplacer'),
('AFF-2024-003', '2024-01-25', 'prepare', 3, 3, 3, 3, 'Rayure portière - Retouche peinture nécessaire'),
('AFF-2024-004', '2024-02-01', 'envoye', 4, 4, 4, 4, 'Choc arrière - Capot et aile à remplacer'),
('AFF-2024-005', '2024-02-05', 'accepte', 5, 5, 1, 2, 'Accident parking - Rétroviseur et poignée cassés');

-- Insertion de devis d'exemple
INSERT INTO devis (numero_devis, date_devis, statut, affaire_id, montant_ht, montant_tva, montant_ttc, mo_tolerie, mo_peinture, mo_mecanique, mo_electrique) VALUES
('DEV-2024-001', '2024-01-16', 'envoye', 1, 350.00, 70.00, 420.00, 100.00, 50.00, 0.00, 0.00),
('DEV-2024-002', '2024-01-21', 'brouillon', 2, 280.00, 56.00, 336.00, 0.00, 0.00, 100.00, 0.00),
('DEV-2024-003', '2024-01-26', 'accepte', 3, 150.00, 30.00, 180.00, 50.00, 75.00, 0.00, 0.00),
('DEV-2024-004', '2024-02-02', 'envoye', 4, 950.00, 190.00, 1140.00, 200.00, 150.00, 50.00, 0.00),
('DEV-2024-005', '2024-02-06', 'accepte', 5, 180.00, 36.00, 216.00, 80.00, 0.00, 0.00, 20.00);

-- Insertion d'articles de devis d'exemple
INSERT INTO devis_articles (devis_id, article_id, description, quantite, prix_ht, fournisseur_id, intervention) VALUES
(1, 1, 'Pare-choc avant Renault Clio', 1, 250.00, 1, 'REMPLACEMENT'),
(2, 2, 'Phare avant droit Peugeot 308', 1, 180.00, 2, 'REMPLACEMENT'),
(3, 4, 'Peinture carrosserie - Pot 1L', 2, 22.50, 1, 'REPARATION'),
(4, 6, 'Capot moteur Volkswagen Golf', 1, 420.00, 4, 'REMPLACEMENT'),
(4, 7, 'Aile avant droite BMW Série 3', 1, 380.00, 1, 'REMPLACEMENT'),
(5, 3, 'Rétroviseur gauche Citroën C4', 1, 95.00, 3, 'REMPLACEMENT'),
(5, 10, 'Poignée de porte extérieure', 1, 35.00, 4, 'REMPLACEMENT');

-- Insertion de dépenses d'exemple pour le calcul des bénéfices
INSERT INTO depenses (affaire_id, type, description, montant, date_depense, fournisseur_id) VALUES
(1, 'Pièces', 'Achat pare-choc Renault Clio', 200.00, '2024-01-17', 1),
(1, 'Main d''œuvre', 'Heures de travail tôlerie', 80.00, '2024-01-18', NULL),
(3, 'Pièces', 'Peinture et consommables', 35.00, '2024-01-27', 1),
(3, 'Main d''œuvre', 'Heures de travail peinture', 60.00, '2024-01-28', NULL),
(5, 'Pièces', 'Rétroviseur et poignée', 110.00, '2024-02-07', 3),
(5, 'Main d''œuvre', 'Installation et réglages', 40.00, '2024-02-08', NULL);
