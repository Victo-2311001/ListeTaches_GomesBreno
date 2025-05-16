import express from 'express';
import cors from 'cors';
import fs from 'fs';
import morgan from 'morgan';
import listeRouter from './src/routes/liste.route.js'

//De notes de cours:
//Documentation:
import swaggerUi from 'swagger-ui-express';
// Le fichier qui contient la documentation au format JSON, ajustez selon votre projet
const swaggerDocument = JSON.parse(fs.readFileSync('./src/config/documentation.json', 'utf8'));

// Options le l'interface, changez le titre "Demo API" pour le nom de votre projet 
const swaggerOptions = {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "Demo API"
};
//------------

//Créer une application express
const app = express();

app.use(cors());

//Importer les middlewares
app.use(express.json());

//Notes de cours:
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));

//De notes de cours
//MORGAN:
const accessLogStream = fs.createWriteStream('./access.log', { flags: 'a' });
app.use(morgan('dev', { stream: accessLogStream }));

const erreurLogStream = fs.createWriteStream('./erreur.log', { flags: 'a' });

app.use((err, req, res, next) => {
    if (res.statusCode == 500) {
        morgan('dev', { stream: erreurLogStream })(req, res, next);
    } else {
        next(err);
    }
});
//------------------

app.use('/api/liste', listeRouter);

app.get('/api', (req, res) => {
    res.send("<h1>Serveur API - Liste de tâches!</h1>")
});

//Démarrer le serveur
const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Serveur démarré: http://127.0.0.1:${PORT}/api`);
});
