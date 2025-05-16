DROP TABLE IF EXISTS sous_taches CASCADE;
DROP TABLE IF EXISTS taches CASCADE;
DROP TABLE IF EXISTS utilisateur CASCADE;

CREATE TABLE utilisateur (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(30) NOT NULL,
    prenom VARCHAR(30) NOT NULL,
    courriel VARCHAR(255) UNIQUE NOT NULL,
    cle_api VARCHAR(40) NOT NULL,
    password VARCHAR(100) NOT NULL
);

CREATE TABLE taches (
    id SERIAL PRIMARY KEY,
    utilisateur_id INTEGER NOT NULL,
    titre VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    date_debut DATE,
    date_echeance DATE,
    complete BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id) ON DELETE CASCADE
);

CREATE TABLE sous_taches (
    id SERIAL PRIMARY KEY,
    tache_id INTEGER NOT NULL,
    titre VARCHAR(100) NOT NULL,
    complete BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (tache_id) REFERENCES taches(id) ON DELETE CASCADE
);

INSERT INTO utilisateur (nom, prenom, courriel, cle_api, password)
VALUES ('brenotest', 'brebreno', 'brenotest@example.com', 'cle1234567890breno', 'brenobreno');

INSERT INTO taches (utilisateur_id, titre, description, date_debut, date_echeance)
VALUES (1, 'Épicérie', 'Acheter des choses essentielles', '2025-04-15', '2025-04-18');

INSERT INTO taches (utilisateur_id, titre, description, date_debut, date_echeance, complete)
VALUES (1, 'test', 'Acheter des choses essentielles', '2025-04-15', '2025-04-18', true);


INSERT INTO sous_taches (tache_id, titre)
VALUES (1, 'Acheter du lait'), (1, 'Acheter du pain');


SELECT id, nom, prenom, courriel, cle_api FROM utilisateur;

