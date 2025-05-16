import listeModel from "../models/liste.model.js";

//UTILISATEUR:
const ajouterUnUtilisateur = async (req, res) => {
    //Liste des champs requis pour créer l'utilisateur
    const champsRequis = ['nom', 'prenom', 'courriel', 'password'];

    //Trouver les champs manquants
    const champsManquant = champsRequis.filter(field => !req.body[field]);
    
    //Si des champs sont manquants
    if (champsManquant.length > 0) {
        res.status(400)
        res.send({
            erreur: "Le format des données est invalide",
            champs_manquants: champsManquant
        });
        return;
    }

    const { nom, prenom, courriel, password } = req.body;
    
    await listeModel.ajoutUtilisateur(nom, prenom, courriel, password)
    .then((utilisateur) => {
        res.status(200);
        res.send({
            utilisateur: {
                nom : utilisateur.nom,
                prenom : utilisateur.prenom,
                courriel : utilisateur.courriel,
                cle_api: utilisateur.cle_api
            },
            message: `L'utilisateur ${nom} a été crée avec succès avec la clé api: ${utilisateur.cle_api}`,
        });
    }) 
    //S'il y a eu une erreur au niveau de la requête,
    //on retourne un erreur 500 car c'est du serveur que provient l'erreur et on écrit le message dans un autre fichier.
    .catch((erreur) => {
        res.status(500)
        res.send({
            erreur: `Échec pour la création de l'utilisateur ${nom}`
        });
    });
};

const recupereCleUtilisateur = async (req, res) => {
    //Liste des champs requis pour créer l'utilisateur
    const champsRequis = ['courriel', 'password'];

    //Trouver les champs manquants
    const champsManquant = champsRequis.filter(field => !req.body[field]);
    
    //Si des champs sont manquants
    if (champsManquant.length > 0) {
        res.status(400)
        res.send({
            erreur: "Le format des données est invalide",
            champs_manquants: champsManquant
        });
        return;
    }

    const {courriel, password } = req.body;
    
    await listeModel.recupererCleApi(courriel, password)
    .then((utilisateur) => {
        res.status(200);
        res.send({
            utilisateur: {
                nom : utilisateur.nom,
                prenom : utilisateur.prenom,
                cle_api: utilisateur.cle_api
            },
        });
    }) 

    //S'il y a eu une erreur au niveau de la requête,
    //on retourne un erreur 500 car c'est du serveur que provient l'erreur et on écrit le message dans un autre fichier.
    .catch((erreur) => {
        res.status(500)
        res.send({
            erreur: `Échec pour la récupération de la clé api`
        });
    });
};

const regenererCleUtilisateur = async (req, res) => {
    //Liste des champs requis pour régénérer la clé API
    const champsRequis = ['courriel', 'password'];

    //Trouver les champs manquants
    const champsManquant = champsRequis.filter(field => !req.body[field]);

    //Si des champs sont manquants
    if (champsManquant.length > 0) {
        res.status(400);
        res.send({
            erreur: "Le format des données est invalide",
            champs_manquants: champsManquant
        });
        return;
    }

    const { courriel, password } = req.body;

    await listeModel.regenererCleApi(courriel, password)
        .then((utilisateur) => {
            res.status(200);
            res.send({
                utilisateur: {
                    nom: utilisateur.nom,
                    prenom: utilisateur.prenom,
                    Nouvelle_cle_api: utilisateur.cle_api
                },
                message: "Clé API régénérée avec succès"
            });
        })

        //S'il y a eu une erreur au niveau de la requête,
        //on retourne une erreur 500 car c'est du serveur que provient l'erreur et on écrit le message dans un autre fichier.
        .catch((erreur) => {
            res.status(500);
            res.send({
                erreur: `Échec pour la régénération de la clé API`
            });
        });
};

//TÂCHES:
const listeTachesUsager = async (req, res) => {
    //Récuperer cle_api dans le headers
    //https://stackoverflow.com/questions/13147693/how-to-extract-request-http-headers-from-a-request-using-nodejs-connect
    //predre la cle_api dans header comme valeur
    const cle_api = req.headers['cle_api'];
    //Si le parametre "toutes" = "true", alors afficherToutes sera true. Sinon, afficherToutes sera faux -> La requête change selon la valeur de afficherToutes
    const afficherToutes = req.query.toutes == 'true'; 

    //S'il manque la cle_api
    if (!cle_api) {
        res.status(401).send({ erreur: "Clé API obligatoire dans le header de la requête." });
        return;
    }

    try {
        const taches = await listeModel.afficherListeTaches(cle_api, afficherToutes);

        if (taches.length == 0) {
            res.status(404).send({ message: "L'utilisateur n'a pas de tâches en cours." });
        }

        res.status(200).send({
            taches: taches
        });

    } catch (erreur) {
        res.status(500).send({
            erreur: erreur.message || "Erreur pour la récupération de la liste de tâches."
        });
    }
};

const detailTache = async (req, res) => {
    //predre la cle_api dans header comme valeur
    const cle_api = req.headers["cle_api"];
    const tache_id = req.params.id;

    //Vérifier cle_api
    if (!cle_api) {
        return res.status(400).send({ erreur: "Clé API obligatoire dans le header de la requête." });
    }

    //Vérifier id de la tâche
    if (!tache_id) {
        return res.status(400).send({ erreur: "ID de la tâche obligatoire." });
    }

    try {
        const resultat = await listeModel.afficherDetailTache(cle_api, tache_id);
        if(resultat.length == 0){
            return res.json({ message: "Il n'a pas de tâche avec cet id." });
        }
        res.status(200).send({ details_tache: resultat });
    } catch (erreur) {
        res.status(404).send({ erreur: erreur.message });
    }
};

const ajouterUneTache = async (req, res) => {
    //predre la cle_api dans header comme valeur
    const cle_api = req.headers['cle_api'];
    //Prendre les informations pour créer la tâches dans le body
    const { titre, description, date_debut, date_echeance } = req.body;

    //Si la cle_api ou le titre de la tâche est vide:
    if (!cle_api || !titre) {
        return res.status(400).send({ erreur: "Clé API et titre sont obligatoires." });
    }

    //Création objet tâche
    const nouvelleTache = {
        titre,
        description,
        date_debut,
        date_echeance
    };

    try {
        await listeModel.ajouterTache(cle_api, nouvelleTache);

        res.status(201).send({
            message: "Tâche crée avec succès",
            tache: nouvelleTache
        });
    } catch (erreur) {
        res.status(500).send({
            erreur: "Erreur pour l'ajout de la tâche."
        });
    }
};

const deleteUneTache = async (req, res) => {
    //predre la cle_api dans header comme valeur
    const cle_api = req.headers["cle_api"];
    //id de la tâche selectionnée
    const tache_id = req.params.id;

    //Valider cle_api
    if (!cle_api) {
        return res.status(400).send({ erreur: "Clé API obligatoire dans le header." });
    }

    //Valider id de la tâche
    if (!tache_id) {
        return res.status(400).send({ erreur: "ID de la tâche manquant." });
    }

    try {
        const resultat = await listeModel.supprimerTache(cle_api, tache_id);
        
        if (!resultat) {
            return res.status(404).send({ erreur: "Tâche introuvable." });
        }

        const tache = {
            titre: resultat.titre,
            description: resultat.description,
            complete: resultat.complete
        };
        res.status(200).send({
            message: "Tâche supprimée avec succès",
            tache: tache
        });
    } catch (erreur) {
        res.status(500).send({
            erreur: "Erreur pour la suppression de la tâche."
        });
    }
    
};

const changerStatutTache = async (req, res) => {
    //predre la cle_api dans header comme valeur
    const cle_api = req.headers["cle_api"];
    //id de la tâche selectionnée
    const tache_id = req.params.id;
    //Récuperer valeur dans le body
    const { nouveauStatut } = req.body;
        
    //Valider cle_api
    if (!cle_api) {
        return res.status(400).send({ erreur: "Clé API obligatoire dans le header." });
    }
    //Valider id de la tâche
    if (!tache_id) {
        return res.status(400).send({ erreur: "ID de la tâche manquant." });
    }

    //Pour que ça marche la réponse doit être true or false
    if (nouveauStatut == true || nouveauStatut == false) {
        try {
            const resultat = await listeModel.modifierStatutTache(cle_api, tache_id, nouveauStatut);
            
            if (!resultat) {
                return res.status(404).send({ erreur: "Tâche introuvable." });
            }
    
            res.status(200).send({
                message: "Statut de la tâche modifié avec succès",
                tache: {
                    nouveauStatut: nouveauStatut
                }
            });
        } catch (erreur) {
            res.status(500).send({
                erreur: erreur.message || "Erreur pour modifier le statut de la tâche."
            });
        }
    } else {
        return res.status(400).send({ erreur: "Le statut doit être true ou false." });
    }
  
};

const changerTache = async (req, res) => {
    //predre la cle_api dans header comme valeur
    const cle_api = req.headers["cle_api"];
    //id de la tâche selectionnée
    const tache_id = req.params.id;
    //Récuper les éléments dans le body
    const { titre, description, date_debut, date_echeance } = req.body;
        
    //Valider la clé API
    if (!cle_api) {
        return res.status(400).send({ erreur: "Clé API obligatoire dans le header." });
    }

    //Valider ID de la tâche
    if (!tache_id) {
        return res.status(400).send({ erreur: "ID de la tâche manquant." });
    }

    //Valider que les champs sont présents
    if (!titre && !description && !date_debut && !date_echeance) {
        return res.status(400).send({ erreur: "Aucun champ à modifier." });
    }

    try {
        const resultat = await listeModel.modifierTache(cle_api, tache_id, {titre, description, date_debut, date_echeance });

        if (!resultat) {
            return res.status(404).send({ erreur: "Tâche introuvable." });
        }

        res.status(200).send({
            message: "Tâche modifiée avec succès",
            tache: resultat
        });
    } catch (erreur) {
        res.status(500).send({
            erreur: "Erreur pour modifier la tâche."
        });
    }
};

//SOUS-TÂCHES:
const ajouterUneSousTache = async (req, res) => {
    //predre la cle_api dans header comme valeur
    const cle_api = req.headers['cle_api'];
    const tache_id = req.params.id;
    //Prendre les informations pour créer la tâches dans le body
    const { titre }  = req.body;

    //Si la cle_api ou le id de la tâche ou le titre de la sous tâche est vide:
    if (!cle_api || !titre || !tache_id) {
        return res.status(400).send({ erreur: "Clé API, id de la tâche et titre de la sous-tâche sont obligatoires." });
    }

    //Création objet sous-tâche
    const nouvelleSousTache = {
        tache_id,
        titre
    };

    try {
        await listeModel.ajouterSousTache(cle_api, tache_id, nouvelleSousTache);

        res.status(201).send({
            message: "Sous tâche crée avec succès",
            tache: nouvelleSousTache
        });
    } catch (erreur) {
        res.status(500).send({
            erreur: "Erreur pour l'ajout de la sous tâche."
        });
    }
};

const deleteUneSousTache = async (req, res) => {
    //predre la cle_api dans header comme valeur
    const cle_api = req.headers["cle_api"];
    //id de la tâche selectionnée
    const tache_id = req.params.idtache;
    //id de la soustâche selectionnée
    const soustache_id = req.params.idsoustache;

    //Valider cle_api
    if (!cle_api) {
        return res.status(400).send({ erreur: "Clé API obligatoire dans le header." });
    }

    //Valider id de la tâche
    if (!tache_id) {
        return res.status(400).send({ erreur: "ID de la tâche manquant." });
    }

    //Valider id de la sous-tâche
    if (!soustache_id) {
        return res.status(400).send({ erreur: "ID de la sous-tâche manquant." });
    }

    try {
        const resultat = await listeModel.supprimerSousTache(cle_api, tache_id, soustache_id);
        
        if (!resultat) {
            return res.status(404).send({ erreur: "Soust-tâche introuvable." });
        }

        const soustache = {
            titre: resultat.titre,
            complete: resultat.complete
        };

        res.status(200).send({
            message: "Sous-tâche supprimée avec succès",
            soustache: soustache
        });
    } catch (erreur) {
        res.status(500).send({
            erreur: "Erreur pour la suppression de la sous-tâche."
        });
    }
};

const changerStatutSousTache = async (req, res) => {
    //predre la cle_api dans header comme valeur
    const cle_api = req.headers["cle_api"];
    //id de la tâche selectionnée
    const tache_id = req.params.idtache;
    //id de la soustâche selectionnée
    const soustache_id = req.params.idsoustache;
    //Récuperer valeur dans le body
    const { nouveauStatut } = req.body;
        
    //Valider cle_api
    if (!cle_api) {
        return res.status(400).send({ erreur: "Clé API obligatoire dans le header." });
    }
    //Valider id de la tâche
    if (!tache_id) {
        return res.status(400).send({ erreur: "ID de la tâche manquant." });
    }
    //Valider id de la sous-tâche
    if (!soustache_id) {
        return res.status(400).send({ erreur: "ID de la sous-tâche manquant." });
    }

    //Pour que ça marche la réponse doit être true or false
    if (nouveauStatut == true || nouveauStatut == false) {
        try {
            const resultat = await listeModel.modifierStatutSousTache(cle_api, tache_id, soustache_id, nouveauStatut);
            
            if (!resultat) {
                return res.status(404).send({ erreur: "Sous-tâche introuvable." });
            }
    
            res.status(200).send({
                message: "Statut de la sous-tâche modifié avec succès",
                soustache: {
                    nouveauStatut: nouveauStatut
                }
            });
        } catch (erreur) {
            res.status(500).send({
                erreur: erreur.message || "Erreur pour modifier le statut de la sous-tâche."
            });
        }
    } else {
        return res.status(400).send({ erreur: "Le statut doit être true ou false." });
    }
};

const changerSousTache = async (req, res) => {
    //predre la cle_api dans header comme valeur
    const cle_api = req.headers["cle_api"];
    //id de la tâche selectionnée
    const tache_id = req.params.idtache;
    //id de la soustâche selectionnée
    const soustache_id = req.params.idsoustache;
    //Récuper les éléments dans le body
    const { titre } = req.body;
        
    //Valider la clé API
    if (!cle_api) {
        return res.status(400).send({ erreur: "Clé API obligatoire dans le header." });
    }

    //Valider ID de la tâche
    if (!tache_id) {
        return res.status(400).send({ erreur: "ID de la tâche manquant." });
    }

    //Valider que les champs sont présents
    if (!titre) {
        return res.status(400).send({ erreur: "Aucun champ à modifier." });
    }

    try {
        const resultat = await listeModel.modifierSousTache(cle_api, tache_id, soustache_id, {titre});

        if (!resultat) {
            return res.status(404).send({ erreur: "Sous-tâche introuvable." });
        }

        res.status(200).send({
            message: "Sous-tâche modifiée avec succès",
            soustache: resultat
        });
    } catch (erreur) {
        res.status(500).send({
            erreur: "Erreur pour modifier la sous-tâche."
        });
    }
};

export {
    //UTIISATEURS:
    ajouterUnUtilisateur,
    recupereCleUtilisateur,
    regenererCleUtilisateur,
    //TÂCHES:
    listeTachesUsager,
    detailTache,
    ajouterUneTache,
    deleteUneTache,
    changerStatutTache,
    changerTache,
    //SOUS-TÂCHES:
    ajouterUneSousTache,
    deleteUneSousTache,
    changerStatutSousTache,
    changerSousTache
}