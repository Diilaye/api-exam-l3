#!/bin/bash

# Script de test simple pour l'API
API_URL="http://localhost:4051"

echo "=== Test de l'API Node.js ==="
echo "API URL: $API_URL"
echo ""

# Test 1: Route racine
echo "1. Test de la route racine..."
curl -s $API_URL/ | jq . 2>/dev/null || curl -s $API_URL/
echo ""

# Test 2: Inscription
echo "2. Test d'inscription..."
EMAIL="test$(date +%s)@example.com"
REGISTER_RESPONSE=$(curl -s -X POST $API_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Utilisateur Test",
    "email": "'$EMAIL'",
    "motDePasse": "motdepasse123"
  }')

echo $REGISTER_RESPONSE | jq . 2>/dev/null || echo $REGISTER_RESPONSE
echo ""

# Extraire le token
TOKEN=$(echo $REGISTER_RESPONSE | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')

if [ ! -z "$TOKEN" ]; then
    echo "Token obtenu: ${TOKEN:0:20}..."
    echo ""
    
    # Test 3: Création d'un produit
    echo "3. Test de création de produit..."
    PRODUCT_RESPONSE=$(curl -s -X POST $API_URL/api/products \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d '{
        "nom": "iPhone 14",
        "description": "Smartphone Apple dernière génération avec puce A16",
        "prix": 999.99,
        "categorie": "electronique",
        "stock": 5
      }')
    
    echo $PRODUCT_RESPONSE | jq . 2>/dev/null || echo $PRODUCT_RESPONSE
    echo ""
    
    # Test 4: Liste des produits
    echo "4. Test de récupération des produits..."
    curl -s $API_URL/api/products | jq . 2>/dev/null || curl -s $API_URL/api/products
    echo ""
    
else
    echo "Erreur: Impossible d'obtenir le token d'authentification"
fi

echo "=== Tests terminés ==="