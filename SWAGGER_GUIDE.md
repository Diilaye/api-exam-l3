# Guide Swagger UI - API Documentation Interactive

Ce guide explique comment utiliser la documentation interactive Swagger UI pour tester l'API.

## 🚀 Accès à la Documentation

Une fois le serveur démarré, accédez à :
- **Interface Swagger UI** : `http://localhost:4051/api-docs`
- **Spécification JSON** : `http://localhost:4051/api-docs.json`

## 📋 Fonctionnalités Swagger UI

### 1. Navigation par Tags
Les endpoints sont organisés par catégories :
- **Authentification** : Inscription, connexion, profil
- **Produits** : CRUD complet avec upload d'images
- **Images** : Accès aux fichiers statiques
- **Informations** : Endpoint racine avec infos générales

### 2. Test des Endpoints

#### Endpoints Publics (sans authentification)
- `GET /` - Informations sur l'API
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/products` - Liste des produits
- `GET /api/products/{id}` - Détails d'un produit

#### Endpoints Privés (avec authentification)
- `GET /api/auth/profile` - Profil utilisateur
- `POST /api/products` - Créer un produit
- `PUT /api/products/{id}` - Modifier un produit
- `DELETE /api/products/{id}` - Supprimer un produit
- `GET /api/products/user/me` - Mes produits

### 3. Authentification dans Swagger

#### Étape 1 : Obtenir un token
1. Utilisez l'endpoint `POST /api/auth/login` ou `POST /api/auth/register`
2. Dans la réponse, copiez la valeur du champ `token`

#### Étape 2 : Configurer l'authentification
1. Cliquez sur le bouton **"Authorize"** 🔒 en haut de la page
2. Dans le champ "Value", entrez : `Bearer VOTRE_TOKEN_ICI`
3. Cliquez sur "Authorize" puis "Close"

#### Étape 3 : Tester les endpoints protégés
Une fois authentifié, vous pouvez tester tous les endpoints privés.

### 4. Upload d'Images avec Swagger

#### Endpoints supportant l'upload :
- `POST /api/products` - Création avec images
- `PUT /api/products/{id}` - Modification avec images

#### Comment uploader des images :
1. Cliquez sur "Try it out" sur l'endpoint
2. Remplissez les champs texte (nom, description, prix, etc.)
3. Dans le champ "images", cliquez sur "Choose Files"
4. Sélectionnez jusqu'à 5 images (JPEG, PNG, GIF, WebP)
5. Cliquez sur "Execute"

#### Gestion des images existantes (PUT) :
- **Nouvelles images** : Utilisez le champ "images"
- **Conserver certaines images** : Utilisez le champ "keepImages" avec un JSON array
  ```json
  ["filename1.webp", "filename2.webp"]
  ```

## 📝 Exemples de Test

### 1. Workflow Complet
```
1. POST /api/auth/register (créer un compte)
2. POST /api/auth/login (obtenir un token)
3. Authorize avec le token
4. POST /api/products (créer un produit avec images)
5. GET /api/products/user/me (voir mes produits)
6. PUT /api/products/{id} (modifier le produit)
7. DELETE /api/products/{id} (supprimer le produit)
```

### 2. Test des Filtres de Produits
```
GET /api/products?categorie=electronique
GET /api/products?search=iPhone
GET /api/products?prixMin=100&prixMax=1000
GET /api/products?page=2&limit=5
```

### 3. Test des Erreurs
```
POST /api/auth/login (avec de mauvais identifiants)
POST /api/products (sans authentification)
PUT /api/products/{id} (modifier le produit d'un autre utilisateur)
```

## 🔍 Fonctionnalités Avancées

### Schémas de Données
- Cliquez sur les schémas en bas de la page pour voir la structure complète
- **User** : Modèle utilisateur avec validation
- **Product** : Modèle produit avec images
- **Image** : Métadonnées des fichiers uploadés

### Codes de Réponse
Chaque endpoint documente :
- **200/201** : Succès avec exemples
- **400** : Erreurs de validation
- **401** : Problèmes d'authentification
- **403** : Problèmes d'autorisation
- **404** : Ressource non trouvée
- **500** : Erreurs serveur

### Options Avancées
- **Filter** : Filtre par tags ou endpoints
- **Try it out** : Test direct depuis l'interface
- **Download** : Téléchargement de la spécification OpenAPI
- **Persist Authorization** : Sauvegarde du token entre les sessions

## 🛠️ Développement

### Modifier la Documentation
La documentation est générée à partir des commentaires JSDoc dans :
- `routes/auth.js` - Routes d'authentification
- `routes/products.js` - Routes des produits
- `server.js` - Routes générales
- `config/swagger.js` - Configuration et schémas

### Format des Commentaires
```javascript
/**
 * @swagger
 * /endpoint:
 *   method:
 *     summary: Description courte
 *     description: Description détaillée
 *     tags: [TagName]
 *     parameters:
 *       - in: path/query/body
 *         name: paramName
 *         required: true/false
 *         schema:
 *           type: string/number/object
 *     responses:
 *       200:
 *         description: Succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SchemaName'
 */
```

### Redémarrage Requis
Après modification de la documentation JSDoc :
1. Arrêter le serveur (`Ctrl+C`)
2. Redémarrer avec `node server.js`
3. Actualiser la page Swagger UI

## 🎯 Conseils d'Utilisation

1. **Commencez par l'authentification** : Testez d'abord register/login
2. **Utilisez l'autorisation globale** : Plus pratique que d'ajouter le token à chaque endpoint
3. **Testez les cas d'erreur** : Essayez des données invalides pour voir les validations
4. **Explorez les schémas** : Comprenez la structure des données avant de tester
5. **Utilisez les filtres** : Notamment sur les listes de produits
6. **Testez l'upload** : Utilisez de vraies images pour voir le traitement automatique

## 🐛 Résolution de Problèmes

### Token Expiré
Si vous obtenez des erreurs 401 :
1. Vérifiez la validité du token
2. Reconnectez-vous pour obtenir un nouveau token
3. Réautorisez dans Swagger UI

### Upload d'Images
Si l'upload échoue :
1. Vérifiez le format de l'image (JPEG, PNG, GIF, WebP)
2. Vérifiez la taille (max 5MB par image)
3. Vérifiez le nombre d'images (max 5 par produit)

### Erreurs 403
Si vous ne pouvez pas modifier/supprimer :
1. Assurez-vous d'être authentifié
2. Vérifiez que vous êtes le propriétaire du produit
3. Utilisez vos propres produits pour les tests

La documentation Swagger UI rend l'API très facile à tester et comprendre ! 🎉