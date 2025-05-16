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


