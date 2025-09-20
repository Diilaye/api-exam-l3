# Exemples de requêtes pour tester l'API

Ce fichier contient des exemples de requêtes curl pour tester toutes les fonctionnalités de l'API.

## Variables
Définir ces variables avant d'exécuter les requêtes :
```bash
export API_URL="http://localhost:3000"
export TOKEN=""  # À remplir après la connexion
```

## 1. Test de base
```bash
curl -X GET $API_URL/
```

## 2. Inscription d'un utilisateur
```bash
curl -X POST $API_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Jean Dupont",
    "email": "jean.dupont@example.com",
    "motDePasse": "motdepasse123"
  }'
```

## 3. Connexion
```bash
curl -X POST $API_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jean.dupont@example.com",
    "motDePasse": "motdepasse123"
  }'
```
Copier le token de la réponse et l'assigner à TOKEN :
```bash
export TOKEN="votre-token-ici"
```

## 4. Obtenir le profil utilisateur
```bash
curl -X GET $API_URL/api/auth/profile \
  -H "Authorization: Bearer $TOKEN"
```

## 5. Créer un produit
```bash
curl -X POST $API_URL/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "nom": "iPhone 14 Pro",
    "description": "Smartphone Apple avec puce A16 Bionic, écran Super Retina XDR de 6,1 pouces",
    "prix": 1199.99,
    "categorie": "electronique",
    "stock": 5
  }'
```

## 6. Créer plusieurs produits de test
```bash
# Produit 2
curl -X POST $API_URL/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "nom": "Nike Air Max",
    "description": "Chaussures de sport confortables avec technologie Air Max",
    "prix": 129.99,
    "categorie": "sport",
    "stock": 10
  }'

# Produit 3
curl -X POST $API_URL/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "nom": "Le Petit Prince",
    "description": "Roman de Antoine de Saint-Exupéry, un classique de la littérature",
    "prix": 12.50,
    "categorie": "livres",
    "stock": 25
  }'
```

## 7. Obtenir tous les produits
```bash
curl -X GET $API_URL/api/products
```

## 8. Obtenir tous les produits avec pagination
```bash
curl -X GET "$API_URL/api/products?page=1&limit=2"
```

## 9. Rechercher des produits
```bash
# Par catégorie
curl -X GET "$API_URL/api/products?categorie=electronique"

# Par prix
curl -X GET "$API_URL/api/products?prixMin=100&prixMax=500"

# Par recherche textuelle
curl -X GET "$API_URL/api/products?search=iPhone"
```

## 10. Obtenir un produit par ID
```bash
# Remplacer PRODUCT_ID par un ID réel
curl -X GET $API_URL/api/products/PRODUCT_ID
```

## 11. Obtenir mes produits
```bash
curl -X GET $API_URL/api/products/user/me \
  -H "Authorization: Bearer $TOKEN"
```

## 12. Modifier un produit
```bash
# Remplacer PRODUCT_ID par un ID réel de vos produits
curl -X PUT $API_URL/api/products/PRODUCT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "nom": "iPhone 14 Pro Max",
    "prix": 1399.99,
    "stock": 3
  }'
```

## 13. Supprimer un produit
```bash
# Remplacer PRODUCT_ID par un ID réel de vos produits
curl -X DELETE $API_URL/api/products/PRODUCT_ID \
  -H "Authorization: Bearer $TOKEN"
```

## 14. Tests d'erreur

### Tentative de connexion avec de mauvaises informations
```bash
curl -X POST $API_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jean.dupont@example.com",
    "motDePasse": "mauvais-mot-de-passe"
  }'
```

### Tentative de création de produit sans authentification
```bash
curl -X POST $API_URL/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Test Produit",
    "description": "Description test",
    "prix": 29.99,
    "categorie": "autre"
  }'
```

### Tentative de création de produit avec des données invalides
```bash
curl -X POST $API_URL/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "nom": "T",
    "description": "Trop court",
    "prix": -10,
    "categorie": "categorie-inexistante"
  }'
```

## Script de test complet

Voici un script bash qui exécute tous les tests :

```bash
#!/bin/bash

API_URL="http://localhost:3000"

echo "=== Test de l'API ==="

echo "1. Test de base..."
curl -s $API_URL/ | jq .

echo -e "\n2. Inscription..."
REGISTER_RESPONSE=$(curl -s -X POST $API_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Test User",
    "email": "test'$(date +%s)'@example.com",
    "motDePasse": "password123"
  }')
echo $REGISTER_RESPONSE | jq .

TOKEN=$(echo $REGISTER_RESPONSE | jq -r .token)

echo -e "\n3. Création d'un produit..."
PRODUCT_RESPONSE=$(curl -s -X POST $API_URL/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "nom": "Produit Test",
    "description": "Description du produit de test",
    "prix": 99.99,
    "categorie": "autre",
    "stock": 5
  }')
echo $PRODUCT_RESPONSE | jq .

PRODUCT_ID=$(echo $PRODUCT_RESPONSE | jq -r .data._id)

echo -e "\n4. Récupération de tous les produits..."
curl -s $API_URL/api/products | jq .

echo -e "\n5. Récupération du produit créé..."
curl -s $API_URL/api/products/$PRODUCT_ID | jq .

echo -e "\n6. Modification du produit..."
curl -s -X PUT $API_URL/api/products/$PRODUCT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "prix": 79.99
  }' | jq .

echo -e "\n7. Suppression du produit..."
curl -s -X DELETE $API_URL/api/products/$PRODUCT_ID \
  -H "Authorization: Bearer $TOKEN" | jq .

echo -e "\n=== Tests terminés ==="
```

Sauvegarder ce script dans un fichier `test_api.sh` et l'exécuter avec :
```bash
chmod +x test_api.sh
./test_api.sh
```