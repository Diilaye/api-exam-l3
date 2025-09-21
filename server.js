const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

const { specs, swaggerUi } = require('./config/swagger');

// Charger les variables d'environnement
dotenv.config();

// Se connecter à la base de données
connectDB();

const app = express();

// Configuration CORS complète pour résoudre les problèmes de preflight
app.use(cors({
  origin: true, // Autoriser tous les origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'], // Inclure explicitement OPTIONS
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true, // Autoriser les cookies/tokens
  optionsSuccessStatus: 200 // Support pour les anciens navigateurs
}));

// Middleware supplémentaire pour forcer la gestion d'OPTIONS si nécessaire
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH,HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir les fichiers statiques (images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware pour les logs des requêtes
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Configuration Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customSiteTitle: 'API Exam Documentation',
  customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true
  }
}));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));

/**
 * @swagger
 * /:
 *   get:
 *     summary: Informations sur l'API
 *     description: Retourne les informations générales et la liste des endpoints disponibles
 *     tags: [Informations]
 *     responses:
 *       200:
 *         description: Informations sur l'API
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: API Node.js pour l'authentification et gestion de produits avec upload d'images
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 endpoints:
 *                   type: object
 *                   description: Liste des endpoints disponibles
 */
// Route de test
app.get('/', (req, res) => {
  res.json({
    message: 'API Node.js pour l\'authentification et gestion de produits avec upload d\'images',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/profile'
      },
      products: {
        getAll: 'GET /api/products',
        getById: 'GET /api/products/:id',
        create: 'POST /api/products (avec support multipart/form-data pour images)',
        update: 'PUT /api/products/:id (avec support multipart/form-data pour images)',
        delete: 'DELETE /api/products/:id',
        getUserProducts: 'GET /api/products/user/me'
      },
      images: {
        access: 'GET /uploads/products/:filename',
        uploadInfo: 'Formats supportés: JPEG, PNG, GIF, WebP. Taille max: 5MB par image, 5 images max par produit'
      },
      documentation: {
        swagger: 'GET /api-docs - Documentation interactive Swagger UI',
        swaggerJson: 'GET /api-docs.json - Spécification OpenAPI en JSON'
      }
    }
  });
});

/**
 * @swagger
 * /uploads/products/{filename}:
 *   get:
 *     summary: Accéder à une image de produit
 *     description: Retourne le fichier image d'un produit
 *     tags: [Images]
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: Nom du fichier image (ex uuid-timestamp.webp)
 *         example: a1b2c3d4-1234567890-image.webp
 *     responses:
 *       200:
 *         description: Image retournée avec succès
 *         content:
 *           image/webp:
 *             schema:
 *               type: string
 *               format: binary
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *           image/gif:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Image non trouvée
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *               example: Cannot GET /uploads/products/nonexistent.webp
 */

// Route pour servir la spécification OpenAPI en JSON
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});

// Middleware pour gérer les routes non trouvées
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} non trouvée`
  });
});

// Middleware global de gestion des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur globale:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Erreur serveur interne'
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📱 API disponible sur http://localhost:${PORT}`);
  console.log(`📖 Documentation des routes disponible sur http://localhost:${PORT}`);
});