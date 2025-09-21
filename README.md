# API Node.js - Authentification et Gestion de Produits

Une API REST simple développée avec Node.js, Express et MongoDB pour gérer l'authentification des utilisateurs et la gestion de produits.

## 🚀 Fonctionnalités

- **Authentification** : Inscription, connexion avec JWT
- **Gestion de Produits** : CRUD complet (Créer, Lire, Modifier, Supprimer)
- **Upload d'Images** : Support de 5 images maximum par produit
- **Traitement d'Images** : Redimensionnement automatique et optimisation
- **Autorisation** : Les utilisateurs ne peuvent modifier que leurs propres produits
- **Validation** : Validation des données avec express-validator
- **Sécurité** : Hachage des mots de passe avec bcrypt
- **Pagination** : Support de la pagination pour les listes de produits
- **CORS** : Configuration CORS avancée pour le développement et la production
- **Documentation** : API documentée avec Swagger UI

## 📋 Prérequis

- Node.js (v14 ou supérieur)
- MongoDB (local ou Atlas)
- npm ou yarn

## 🛠️ Installation

1. Cloner le projet :
```bash
git clone <url-du-repo>
cd api-exam
```

2. Installer les dépendances :
```bash
npm install
```

3. Configurer les variables d'environnement :
Créer un fichier `.env` à la racine du projet :
```env
PORT=4051
MONGODB_URI=mongodb://localhost:27017/api-exam
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

4. Démarrer MongoDB (si local) :
```bash
mongod
```

5. Lancer l'application :
```bash
# Mode développement
npm run dev

# Mode production
npm start
```

L'API sera disponible sur `http://localhost:4051`

## 📖 Documentation Interactive

L'API dispose d'une documentation interactive Swagger UI accessible à :
- **Swagger UI** : `http://localhost:4051/api-docs`
- **Spécification OpenAPI JSON** : `http://localhost:4051/api-docs.json`

La documentation Swagger permet de :
- ✅ Visualiser tous les endpoints disponibles
- ✅ Tester directement les API depuis l'interface
- ✅ Voir les schémas de données détaillés
- ✅ Comprendre les codes de réponse et erreurs
- ✅ Gérer l'authentification JWT directement

### Comment utiliser Swagger UI :
1. Aller sur `http://localhost:4051/api-docs`
2. Pour les endpoints authentifiés, cliquer sur "Authorize" 🔒
3. Entrer `Bearer <votre-token-jwt>` dans le champ Authorization
4. Tester les endpoints en cliquant sur "Try it out"

## 🌐 Configuration CORS

L'API est configurée avec **CORS ouvert** pour autoriser **tous les origins**.

### ✅ Origines Autorisées
- ✅ **TOUS les origins** (localhost, domaines externes, etc.)
- ✅ `http://localhost:3000`, `3001`, `8080`, etc. (tous les ports)
- ✅ `https://example.com`, `https://monsite.fr`, etc. (tous les domaines)
- ✅ Applications mobiles et extensions navigateur
- ✅ Postman et autres outils de test

### ⚠️ Note de Sécurité
**Configuration actuelle : PERMISSIVE (tous les origins autorisés)**
- ✅ Parfait pour le développement
- ⚠️ **Attention en production** - Voir `CORS_ALL_ORIGINS.md` pour sécuriser

### 🔧 Configuration Côté Client

#### Fetch API
```javascript
fetch('http://localhost:4051/api/products', {
  method: 'GET',
  credentials: 'include', // Important pour CORS
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-token-here'
  }
})
```

#### Axios
```javascript
// Configuration globale
axios.defaults.withCredentials = true;
axios.defaults.baseURL = 'http://localhost:4051';

// Requête avec token
axios.get('/api/products', {
  headers: { 'Authorization': 'Bearer your-token' }
});
```

### 🧪 Test CORS
Un fichier de test est disponible : `http://localhost:3000/cors-test.html`
(Nécessite de lancer un serveur web sur le port 3000)

### 🚨 Résolution de Problèmes
Si vous rencontrez des erreurs CORS :
1. Vérifiez que `NODE_ENV=development` dans votre `.env`
2. Consultez le guide complet : `CORS_TROUBLESHOOTING.md`
3. Utilisez les logs de debug qui s'affichent dans la console

## 📚 Endpoints de l'API

### 🔐 Authentification

#### Inscription
```http
POST /api/auth/register
Content-Type: application/json

{
  "nom": "John Doe",
  "email": "john@example.com",
  "motDePasse": "123456"
}
```

#### Connexion
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "motDePasse": "123456"
}
```

#### Profil utilisateur
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

### 📦 Produits

#### Obtenir tous les produits
```http
GET /api/products
# Paramètres optionnels :
# ?page=1&limit=10&categorie=electronique&search=iPhone&prixMin=100&prixMax=1000
```

#### Obtenir un produit par ID
```http
GET /api/products/:id
```

#### Créer un produit
```http
POST /api/products
Authorization: Bearer <token>
Content-Type: multipart/form-data

# Champs de données :
nom=iPhone 14
description=Smartphone Apple dernière génération
prix=999.99
categorie=electronique
stock=10

# Fichiers images (optionnel) :
images=@image1.jpg
images=@image2.png
```

#### Modifier un produit
```http
PUT /api/products/:id
Authorization: Bearer <token>
Content-Type: multipart/form-data

# Champs de données (tous optionnels) :
nom=iPhone 14 Pro
prix=1199.99

# Nouvelles images (optionnel) :
images=@new_image.jpg

# Conserver certaines images existantes (optionnel) :
keepImages=["filename1.webp", "filename2.webp"]
```

#### Supprimer un produit
```http
DELETE /api/products/:id
Authorization: Bearer <token>
```

#### Obtenir mes produits
```http
GET /api/products/user/me
Authorization: Bearer <token>
```

#### Accéder aux images
```http
GET /uploads/products/:filename
# Exemple: GET /uploads/products/uuid-timestamp.webp
```

### 🖼️ Gestion des Images

#### Formats supportés
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

#### Contraintes
- Taille maximum par image : 5MB
- Nombre maximum d'images par produit : 5
- Redimensionnement automatique : 800x600 pixels maximum
- Conversion automatique en WebP pour l'optimisation

## 📝 Structure des données

### Utilisateur
```json
{
  "id": "ObjectId",
  "nom": "String",
  "email": "String (unique)",
  "motDePasse": "String (hashé)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Produit
```json
{
  "id": "ObjectId",
  "nom": "String",
  "description": "String",
  "prix": "Number",
  "categorie": "enum ['electronique', 'vetements', 'maison', 'sport', 'livres', 'autre']",
  "stock": "Number",
  "images": [{
    "filename": "String",
    "originalName": "String", 
    "mimetype": "String",
    "size": "Number",
    "url": "String"
  }],
  "proprietaire": "ObjectId (ref: User)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

## 🔒 Authentification

L'API utilise JSON Web Tokens (JWT) pour l'authentification. Après connexion, incluez le token dans l'en-tête Authorization :

```
Authorization: Bearer <votre-token-jwt>
```

## ⚠️ Règles de validation

### Utilisateur
- **nom** : Minimum 2 caractères, maximum 50
- **email** : Format email valide, unique
- **motDePasse** : Minimum 6 caractères

### Produit
- **nom** : Minimum 2 caractères, maximum 100
- **description** : Minimum 10 caractères, maximum 500
- **prix** : Nombre positif
- **categorie** : Une des valeurs autorisées
- **stock** : Nombre entier positif

## 🧪 Tests avec curl

### Inscription
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Test User",
    "email": "test@example.com",
    "motDePasse": "123456"
  }'
```

### Connexion
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "motDePasse": "123456"
  }'
```

### Créer un produit avec images
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer <your-token>" \
  -F "nom=Test Product" \
  -F "description=Description du produit de test avec images" \
  -F "prix=29.99" \
  -F "categorie=autre" \
  -F "stock=5" \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.png"
```

### Modifier un produit en gardant certaines images
```bash
curl -X PUT http://localhost:3000/api/products/<product-id> \
  -H "Authorization: Bearer <your-token>" \
  -F "prix=39.99" \
  -F "stock=10" \
  -F "images=@/path/to/new_image.jpg" \
  -F 'keepImages=["existing-filename1.webp", "existing-filename2.webp"]'
```

## 🔧 Structure du projet

```
api-exam/
│
├── config/
│   └── db.js              # Configuration MongoDB
├── middleware/
│   └── auth.js            # Middleware d'authentification
├── models/
│   ├── User.js            # Modèle Utilisateur
│   └── Product.js         # Modèle Produit
├── routes/
│   ├── auth.js            # Routes d'authentification
│   └── products.js        # Routes des produits
├── .env                   # Variables d'environnement
├── .gitignore
├── package.json
├── server.js              # Point d'entrée de l'application
└── README.md
```

## 🛡️ Sécurité

- Mots de passe hachés avec bcrypt
- Authentification par JWT
- Validation des données d'entrée
- Protection contre les injections NoSQL
- Autorisation basée sur le propriétaire des ressources

## 📈 Améliorations possibles

- [ ] Tests unitaires et d'intégration
- [x] Upload d'images pour les produits
- [x] Documentation Swagger/OpenAPI interactive
- [ ] Support de différents formats d'images (vidéos)
- [ ] Système de commentaires et notes
- [ ] Cache avec Redis
- [ ] Rate limiting
- [ ] Logs structurés
- [ ] Monitoring et métriques
- [ ] Compression d'images avancée
- [ ] CDN pour les images

## 📄 Licence

ISC# api-exam-l3
