import db from '../config/dp_pg.js';
//https://refine.dev/blog/node-js-uuid/#2-uuid-npm-package => Source pour le uuid (Création de la cle_api)
import { v4 as uuidv4 } from 'uuid';
//https://www.freecodecamp.org/news/how-to-hash-passwords-with-bcrypt-in-nodejs/
import bcrypt from 'bcrypt';

//UTILISATEURS:
const ajoutUtilisateur = async (nom, prenom, courriel, password) => {
    return new Promise (async (resolve, reject) => {
        const cle_api = uuidv4();

        const passwordHashe = await bcrypt.hash(password, 10);
        const requete = `INSERT INTO utilisateur (nom, prenom, courriel, cle_api, password) VALUES ($1, $2, $3, $4, $5) RETURNING *;`;
        const params = [nom, prenom, courriel, cle_api, passwordHashe]

        db.query(requete, params)
            .then(resultat => resolve(resultat.rows[0]))
            .catch(erreur => {
                console.error(`Erreur PostgreSQL : ${erreur.code} - ${erreur.message}`);
                //https://stackoverflow.com/questions/47961531/postgresexception-23505-duplicate-key-value-violates-unique-constraint-pk-cou/47965378
                if (erreur.code == '23505') {
                    reject({
                        message: "Veuillez en choisir un autre courriel, celui là est déjà utilisé."
                    });
                } else {
                    reject({
                        message: "Erreur pour l'ajout de l'utilisateur."
                    });
                }
            });
    });
};

const recupererCleApi = (courriel, password) => {
    return new Promise (async (resolve, reject) => {
        const requete = `SELECT cle_api, nom, prenom, password FROM utilisateur WHERE courriel = $1;`;
        const params = [courriel]

        db.query(requete, params)
            .then(async resultat => {
                if (resultat.rows.length == 0) {
                    reject({
                        message: "Le courriel ou le mot de passe n'est pas correct"
                    });
                } else {
                    const utilisateur = resultat.rows[0];
                    //https://www.geeksforgeeks.org/password-verification-in-node-js/
                    const motDePasseValide = await bcrypt.compare(password, utilisateur.password);
                    if (!motDePasseValide) {
                        reject({
                            message: "Le courriel ou le mot de passe n'est pas correct"
                        });
                    } else {
                        resolve(utilisateur);
                    }
                }
            })
            .catch(erreur => {
                console.error(`Erreur PostgreSQL : ${erreur.code} - ${erreur.message}`);
                reject({message: "Erreur pour la récupération de la clé API."});
            });
    });
};

const regenererCleApi = (courriel, password) => {
    return new Promise(async (resolve, reject) => {
        const requete = `SELECT * FROM utilisateur WHERE courriel = $1`;
        const params = [courriel];

        try {
            const resultat = await db.query(requete, params);

            if (resultat.rows.length == 0) {
                reject({ message: "Utilisateur n'existe pas." });
                return;
            }

            const utilisateur = resultat.rows[0];

            const motDePasseValide = await bcrypt.compare(password, utilisateur.password);
            if (!motDePasseValide) {
                reject({ message: "Mot de passe invalide." });
                return;
            }

            const nouvelleCle = uuidv4();
            const requeteUpdate = `UPDATE utilisateur SET cle_api = $1 WHERE courriel = $2 RETURNING cle_api`;
            const paramsUpdate = [nouvelleCle, courriel];

            db.query(requeteUpdate, paramsUpdate)
                .then(result => resolve(result.rows[0]))
                .catch(erreur => {
                    console.error(`Erreur PostgreSQL : ${erreur.code} - ${erreur.message}`);
                    reject({ message: "Erreur pour le renouvellement de la clé API." });
                });

        } catch (erreur) {
            console.error("Erreur serveur :", erreur);
            reject({ message: "Erreur dans le traitement." });
        }
    });
};

//TÂCHES:
const afficherListeTaches = (cle_api, toutes) => {
    return new Promise(async (resolve, reject) => {
        let requete = "";

        if (toutes){
            //Toutes les tâches
            requete = `SELECT taches.titre, taches.id FROM taches
            INNER JOIN utilisateur ON taches.utilisateur_id = utilisateur.id
            WHERE utilisateur.cle_api = $1;`;
        }
        else{
            //Seulement les tâches incomplètes
            requete = `SELECT taches.titre, taches.id FROM taches
            INNER JOIN utilisateur ON taches.utilisateur_id = utilisateur.id
            WHERE utilisateur.cle_api = $1 AND taches.complete = false;`;
        }

        const params = [cle_api];

        db.query(requete, params)
            .then(resultat => resolve(resultat.rows))
            .catch(erreur => {
                console.error(`Erreur PostgreSQL : ${erreur.code} - ${erreur.message}`);
                reject({
                    message: "Erreur pour l'affichage des tâches."
                });
            });
    });
};

const afficherDetailTache = (cle_api, tache_id) => {
    return new Promise(async (resolve, reject) => {
        const requete =
         `SELECT taches.titre AS tache_titre, taches.description AS tache_description, taches.complete AS tache_complete, taches.date_debut, taches.date_echeance,
        sous_taches.id AS sous_tache_id, sous_taches.titre AS sous_tache_titre, sous_taches.complete AS sous_tache_complete FROM taches
        INNER JOIN utilisateur ON taches.utilisateur_id = utilisateur.id
        LEFT JOIN sous_taches ON taches.id = sous_taches.tache_id
        WHERE utilisateur.cle_api = $1
        AND taches.id = $2;`
        ;

        const params = [cle_api, tache_id];

        db.query(requete, params)
            .then(resultat => resolve(resultat.rows))
            .catch(erreur => {
                console.error(`Erreur PostgreSQL : ${erreur.code} - ${erreur.message}`);
                reject({
                    message: "Erreur pour la récupération du détail de la tâche."
                });
            });
    });
};

const ajouterTache = (cle_api, tache) => {
    return new Promise(async (resolve, reject) => {
            
        //Trouver le id selon la cle_api pour ajouter dans la tâche qui vas être crée
        const requeteId = `SELECT id FROM utilisateur WHERE cle_api = $1;`;
        const resultatRequeteId = await db.query(requeteId, [cle_api]);

        //Si on trouve pas d'id selon la cle_api
        if (resultatRequeteId.rows.length == 0) {
            return reject({message: "Clé API invalide."});
        }

        const id = resultatRequeteId.rows[0].id;

        const requeteInsert = 
        `INSERT INTO taches (utilisateur_id, titre, description, date_debut, date_echeance)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;`;

        const params = [
            id,
            tache.titre,
            tache.description,
            tache.date_debut,
            tache.date_echeance
        ];

        db.query(requeteInsert, params)
            .then(resultat => resolve(resultat.rows[0]))
            .catch(erreur => {
                console.error(`Erreur PostgreSQL : ${erreur.code} - ${erreur.message}`);
                reject({
                    message: "Erreur pour la création de la tâche."
                });
            });
    });
};

const supprimerTache = (cle_api, tache_id) => {
    return new Promise (async(resolve, reject) => {

        //Trouver le id selon la cle_api pour supprmer la tâche
        const requeteId = `SELECT id FROM utilisateur WHERE cle_api = $1;`;
        const resultatRequeteId = await db.query(requeteId, [cle_api]);

        //Si on trouve pas d'id selon la cle_api
        if (resultatRequeteId.rows.length == 0) {
            return reject({message: "Clé API invalide."});
        }

        const id = resultatRequeteId.rows[0].id;

        const requeteDelete = `DELETE FROM taches WHERE utilisateur_id = $1 AND id = $2 RETURNING *`;
        const params = [id, tache_id]

        db.query(requeteDelete, params)
            .then(resultat => resolve(resultat.rows[0]))
            .catch(erreur => {
                console.error(`Erreur PostgreSQL : ${erreur.code} - ${erreur.message}`);
                reject({
                    message: "Erreur pour supprimer la tâche."
                });
            });
    });
};

const modifierStatutTache = (cle_api, tache_id, nouveauStatut) => {
    return new Promise(async (resolve, reject) => {
        //Trouver le id de l'utilisateur via la clé API
        const requeteId = `SELECT id FROM utilisateur WHERE cle_api = $1;`;
        const resultatRequeteId = await db.query(requeteId, [cle_api]);

        //Si aucun utilisateur avec cette clé API
        if (resultatRequeteId.rows.length == 0) {
            return reject({ message: "Clé API invalide." });
        }

        const utilisateur_id = resultatRequeteId.rows[0].id;

        const requeteUpdate = 
        `UPDATE taches SET complete = $1
         WHERE utilisateur_id = $2 AND id = $3
         RETURNING *;`;

        const params = [nouveauStatut, utilisateur_id, tache_id];

        db.query(requeteUpdate, params)
            .then(resultat => {
                if (resultat.rows.length == 0) {
                    return reject({ message: "Tâche introuvable." });
                }
                resolve(resultat.rows[0]);
            })
            .catch(erreur => {
                console.error(`Erreur PostgreSQL : ${erreur.code} - ${erreur.message}`);
                reject({
                    message: "Erreur pour modifier le statut de la tâche."
                });
            });
    });
};

const modifierTache = (cle_api, tache_id, { titre, description, date_debut, date_echeance }) => {
    return new Promise(async (resolve, reject) => {
        //Trouver le id de l'utilisateur via la clé API
        const requeteId = `SELECT id FROM utilisateur WHERE cle_api = $1;`;
        const resultatRequeteId = await db.query(requeteId, [cle_api]);

        //Si aucun utilisateur avec cette clé API
        if (resultatRequeteId.rows.length == 0) {
            return reject({ message: "Clé API invalide." }); 
        }

        const utilisateur_id = resultatRequeteId.rows[0].id;

        //https://www.geeksforgeeks.org/postgresql-coalesce/
        const requeteUpdate =
        `UPDATE taches SET 
        titre = COALESCE($1, titre), 
        description = COALESCE($2, description), 
        date_debut = COALESCE($3, date_debut), 
        date_echeance = COALESCE($4, date_echeance)
        WHERE utilisateur_id = $5 AND id = $6 
        RETURNING *;`;

        const params = [titre, description, date_debut, date_echeance, utilisateur_id, tache_id];

        db.query(requeteUpdate, params)
            .then(resultat => {
                if (resultat.rows.length == 0) {
                    return reject({ message: "Tâche introuvable." });
                }
                resolve(resultat.rows[0]);
            })
            .catch(erreur => {
                console.error(`Erreur PostgreSQL : ${erreur.code} - ${erreur.message}`);
                reject({
                    message: "Erreur pour modifier la tâche."
                });
            });
    });
};

//SOUS-TÂCHES:
const ajouterSousTache = (cle_api, tache_id, sousTache) => {
    return new Promise(async (resolve, reject) => {
            
        //Trouver le id selon la cle_api pour ajouter dans la tâche qui vas être crée
        const requeteIdUtilisateur = `SELECT id FROM utilisateur WHERE cle_api = $1;`;
        const resultatRequeteId = await db.query(requeteIdUtilisateur, [cle_api]);

        //Si on trouve pas d'id selon la cle_api
        if (resultatRequeteId.rows.length == 0) {
            return reject({message: "Clé API invalide."});
        }

        const id = resultatRequeteId.rows[0].id;
            
        //Vérifier si la tâche appartient bien à cet utilisateur
        const requeteTache = `SELECT * FROM taches WHERE id = $1 AND utilisateur_id = $2;`;
        const resultatRequeteTache = await db.query(requeteTache, [tache_id, id]);
      
        if (resultatRequeteTache.rows.length == 0) {
            return reject({ message: "Tâche introuvable." });
        }

        const requeteInsert = 
        `INSERT INTO sous_taches (tache_id, titre)
        VALUES ($1, $2)
        RETURNING *;`;

        const params = [
            tache_id,
            sousTache.titre
        ];

        db.query(requeteInsert, params)
            .then(resultat => resolve(resultat.rows[0]))
            .catch(erreur => {
                console.error(`Erreur PostgreSQL : ${erreur.code} - ${erreur.message}`);
                reject({
                    message: "Erreur pour la création de la sous-tâche."
                });
            });
    });
};

const supprimerSousTache = (cle_api, tache_id, soustache_id) => {
    return new Promise (async(resolve, reject) => {

        //Trouver le id selon la cle_api pour supprmer la tâche
        const requeteId = `SELECT id FROM utilisateur WHERE cle_api = $1;`;
        const resultatRequeteId = await db.query(requeteId, [cle_api]);

        //Si on trouve pas d'id selon la cle_api
        if (resultatRequeteId.rows.length == 0) {
            return reject({message: "Clé API invalide."});
        }

        const id = resultatRequeteId.rows[0].id;
         
        //Vérifier si la tâche appartient bien à cet utilisateur
        const requeteTache = `SELECT * FROM taches WHERE id = $1 AND utilisateur_id = $2;`;
        const resultatRequeteTache = await db.query(requeteTache, [tache_id, id]);
      
        if (resultatRequeteTache.rows.length == 0) {
            return reject({ message: "Tâche introuvable." });
        }
         
        //Vérifier si la sous-tâche existe dans la tâche
        const requeteSousTache = `SELECT * FROM sous_taches WHERE id = $1 AND tache_id = $2;`;
        const resultatRequeteSousTache = await db.query(requeteSousTache, [soustache_id, tache_id]);

        if (resultatRequeteSousTache.rows.length == 0) {
            return reject({ message: "Sous-tâche introuvable pour cette tâche." });
        }

        const requeteDelete = `DELETE FROM sous_taches WHERE id = $1 RETURNING *`;
        const params = [soustache_id]

        db.query(requeteDelete, params)
            .then(resultat => resolve(resultat.rows[0]))
            .catch(erreur => {
                console.error(`Erreur PostgreSQL : ${erreur.code} - ${erreur.message}`);
                reject({
                    message: "Erreur pour supprimer la sous-tâche."
                });
            });
    });
};

const modifierStatutSousTache = (cle_api, tache_id, soustache_id, nouveauStatut) => {
    return new Promise(async (resolve, reject) => {
        //Trouver le id de l'utilisateur via la clé API
        const requeteId = `SELECT id FROM utilisateur WHERE cle_api = $1;`;
        const resultatRequeteId = await db.query(requeteId, [cle_api]);

        //Si aucun utilisateur avec cette clé API
        if (resultatRequeteId.rows.length == 0) {
            return reject({ message: "Clé API invalide." });
        }

        const id = resultatRequeteId.rows[0].id;

        //Vérifier si la tâche appartient bien à cet utilisateur
        const requeteTache = `SELECT * FROM taches WHERE id = $1 AND utilisateur_id = $2;`;
        const resultatRequeteTache = await db.query(requeteTache, [tache_id, id]);
      
        if (resultatRequeteTache.rows.length == 0) {
            return reject({ message: "Sous-tâche introuvable." });
        }

        //Vérifier si la sous-tâche existe dans la tâche
        const requeteSousTache = `SELECT * FROM sous_taches WHERE id = $1 AND tache_id = $2;`;
        const resultatRequeteSousTache = await db.query(requeteSousTache, [soustache_id, tache_id]);

        if (resultatRequeteSousTache.rows.length == 0) {
            return reject({ message: "Sous-tâche introuvable pour cette tâche." });
        }

        const requeteUpdate = 
        `UPDATE sous_taches SET complete = $1
         WHERE id = $2
         RETURNING *;`;

        const params = [nouveauStatut, soustache_id];

        db.query(requeteUpdate, params)
            .then(resultat => {
                if (resultat.rows.length == 0) {
                    return reject({ message: "Sous-tâche introuvable." });
                }
                resolve(resultat.rows[0]);
            })
            .catch(erreur => {
                console.error(`Erreur PostgreSQL : ${erreur.code} - ${erreur.message}`);
                reject({
                    message: "Erreur pour modifier le statut de la sous-tâche."
                });
            });
    });
};

const modifierSousTache = (cle_api, tache_id, soustache_id, { titre }) => {
    return new Promise(async (resolve, reject) => {
         //Trouver le id de l'utilisateur via la clé API
        const requeteId = `SELECT id FROM utilisateur WHERE cle_api = $1;`;
        const resultatRequeteId = await db.query(requeteId, [cle_api]);

        //Si aucun utilisateur avec cette clé API
        if (resultatRequeteId.rows.length == 0) {
            return reject({ message: "Clé API invalide." });
        }

        const id = resultatRequeteId.rows[0].id;

        //Vérifier si la tâche appartient bien à cet utilisateur
        const requeteTache = `SELECT * FROM taches WHERE id = $1 AND utilisateur_id = $2;`;
        const resultatRequeteTache = await db.query(requeteTache, [tache_id, id]);
      
        if (resultatRequeteTache.rows.length == 0) {
            return reject({ message: "Sous-tâche introuvable." });
        }

        //Vérifier si la sous-tâche existe dans la tâche
        const requeteSousTache = `SELECT * FROM sous_taches WHERE id = $1 AND tache_id = $2;`;
        const resultatRequeteSousTache = await db.query(requeteSousTache, [soustache_id, tache_id]);

        if (resultatRequeteSousTache.rows.length == 0) {
            return reject({ message: "Sous-tâche introuvable pour cette tâche." });
        }


        //https://www.geeksforgeeks.org/postgresql-coalesce/
        const requeteUpdate =
        `UPDATE sous_taches SET 
        titre = $1
        WHERE id = $2
        RETURNING *;`;

        const params = [titre, soustache_id];

        db.query(requeteUpdate, params)
            .then(resultat => {
                if (resultat.rows.length == 0) {
                    return reject({ message: "Sous-tâche introuvable." });
                }
                resolve(resultat.rows[0]);
            })
            .catch(erreur => {
                console.error(`Erreur PostgreSQL : ${erreur.code} - ${erreur.message}`);
                reject({
                    message: "Erreur pour modifier la sous-tâche."
                });
            });
    });
};

export default {
    //UTILISATEURS:
    ajoutUtilisateur,
    recupererCleApi,
    regenererCleApi,
    //TÂCHES:
    afficherListeTaches,
    afficherDetailTache,
    ajouterTache,
    supprimerTache,
    modifierStatutTache,
    modifierTache,
    //SOUS-TÂCHES:
    ajouterSousTache,
    supprimerSousTache,
    modifierStatutSousTache,
    modifierSousTache
}