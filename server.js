const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

// Charger les variables d'environnement
dotenv.config();

// Se connecter à la base de données
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques (images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware pour les logs des requêtes
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));

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
      }
    }
  });
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