import express from 'express';
import { ajouterUnUtilisateur, recupereCleUtilisateur, regenererCleUtilisateur, 
         listeTachesUsager, detailTache, ajouterUneTache, deleteUneTache, changerStatutTache, changerTache, 
         ajouterUneSousTache, deleteUneSousTache, changerStatutSousTache, changerSousTache } from '../controllers/liste.controller.js';

const router = express.Router();

//Routes pour gestion utilisateur:

//Ajouter
router.post('/utilisateur', ajouterUnUtilisateur);
//Récupérer la cle_api
router.post('/utilisateur/cleapi', recupereCleUtilisateur)
//Régénerer une nouvelle cle_api
router.post('/utilisateur/nouvellecle', regenererCleUtilisateur);

//Routes pour les tâches:

//Afficher les tâches selon l'utilisateur (cle_api dans le header)
//Possibilité de décider si on affiche toute les tâches par le url
router.get("/taches", listeTachesUsager); 

//Afficher les détails d'une tâche par son id et le header de l'utilisateur, qui a été envoyé dans le header
router.get('/taches/:id', detailTache);

//Ajouter une tâche selon la cle_api de l'utilisateur
router.post('/taches/ajouter', ajouterUneTache);

//Supprimer une tâche selon la cle_api de l'utilisateur et l'id de la tâche
router.delete('/taches/delete/:id', deleteUneTache);

//Modifier seulement le status de la tâche selon son id -> récuperer la valeur dans le body
router.put('/taches/:id/statut', changerStatutTache);

//Modifier le restant de la tâche selon son id -> récuperer les éléments impotants dans le body
router.put('/taches/:id/modifier', changerTache);

//Routes pour les sous tâches:

//Ajouter une sous tâche selon la cle_api de l'utilisateur et l'id de la tâche
router.post('/taches/:id/soustache/ajouter', ajouterUneSousTache);

//Supprimer une sous tâche selon la cle_api de l'utilisateur et l'id de la tâche
router.delete('/taches/:idtache/soustache/delete/:idsoustache', deleteUneSousTache);

//Modifier seulement le status de la sous-tâche selon son id et id de la tâche -> récuperer la valeur dans le body
router.put('/taches/:idtache/soustache/statut/:idsoustache', changerStatutSousTache);

//Modifier le restant de la sous-tâche selon son id -> récuperer les éléments impotants dans le body
router.put('/taches/:idtache/soustache/modifier/:idsoustache', changerSousTache);


export default router;