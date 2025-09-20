# Tests pour Upload d'Images

Ce fichier contient des exemples spécifiques pour tester les fonctionnalités d'upload d'images.

## Prérequis

Avoir quelques images de test dans le dossier courant :
- `test1.jpg`
- `test2.png`
- `test3.gif`

## Variables
```bash
export API_URL="http://localhost:3000"
export TOKEN=""  # À remplir après la connexion
```

## 1. Créer un utilisateur et se connecter
```bash
# Inscription
curl -X POST $API_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Test Images",
    "email": "images'$(date +%s)'@example.com",
    "motDePasse": "password123"
  }'

# Connexion (copier le token)
curl -X POST $API_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "images'$(date +%s)'@example.com",
    "motDePasse": "password123"
  }'
```

## 2. Créer un produit avec images
```bash
curl -X POST $API_URL/api/products \
  -H "Authorization: Bearer $TOKEN" \
  -F "nom=Produit avec Images" \
  -F "description=Ce produit contient plusieurs images de démonstration" \
  -F "prix=99.99" \
  -F "categorie=electronique" \
  -F "stock=5" \
  -F "images=@test1.jpg" \
  -F "images=@test2.png"
```

## 3. Créer un produit sans images
```bash
curl -X POST $API_URL/api/products \
  -H "Authorization: Bearer $TOKEN" \
  -F "nom=Produit sans Images" \
  -F "description=Ce produit n'a pas d'images" \
  -F "prix=49.99" \
  -F "categorie=autre" \
  -F "stock=10"
```

## 4. Ajouter des images à un produit existant
```bash
# Remplacer PRODUCT_ID par l'ID d'un produit existant
curl -X PUT $API_URL/api/products/PRODUCT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -F "images=@test3.gif"
```

## 5. Modifier un produit en gardant certaines images
```bash
# Récupérer d'abord les informations du produit pour voir les noms des images
curl -X GET $API_URL/api/products/PRODUCT_ID \
  -H "Authorization: Bearer $TOKEN"

# Modifier en gardant la première image existante
curl -X PUT $API_URL/api/products/PRODUCT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -F "prix=89.99" \
  -F "images=@test1.jpg" \
  -F 'keepImages=["nom-du-fichier-existant.webp"]'
```

## 6. Remplacer toutes les images
```bash
curl -X PUT $API_URL/api/products/PRODUCT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -F "images=@test1.jpg" \
  -F "images=@test2.png" \
  -F "images=@test3.gif"
```

## 7. Récupérer un produit et voir ses images
```bash
curl -X GET $API_URL/api/products/PRODUCT_ID | jq '.data.images'
```

## 8. Accéder à une image directement
```bash
# Utiliser l'URL retournée dans la réponse du produit
curl -X GET $API_URL/uploads/products/nom-du-fichier.webp --output image-downloaded.webp
```

## 9. Tests d'erreurs

### Fichier trop volumineux (simuler avec un gros fichier)
```bash
# Créer un fichier de test de 6MB
dd if=/dev/zero of=big_file.jpg bs=1024 count=6144

curl -X POST $API_URL/api/products \
  -H "Authorization: Bearer $TOKEN" \
  -F "nom=Test Gros Fichier" \
  -F "description=Test avec fichier trop volumineux" \
  -F "prix=99.99" \
  -F "categorie=autre" \
  -F "images=@big_file.jpg"

# Nettoyer
rm big_file.jpg
```

### Trop d'images (plus de 5)
```bash
curl -X POST $API_URL/api/products \
  -H "Authorization: Bearer $TOKEN" \
  -F "nom=Trop d'Images" \
  -F "description=Test avec trop d'images" \
  -F "prix=99.99" \
  -F "categorie=autre" \
  -F "images=@test1.jpg" \
  -F "images=@test2.png" \
  -F "images=@test1.jpg" \
  -F "images=@test2.png" \
  -F "images=@test1.jpg" \
  -F "images=@test2.png"
```

### Fichier non-image
```bash
# Créer un fichier texte
echo "Ceci n'est pas une image" > not_an_image.txt

curl -X POST $API_URL/api/products \
  -H "Authorization: Bearer $TOKEN" \
  -F "nom=Fichier Texte" \
  -F "description=Test avec fichier non-image" \
  -F "prix=99.99" \
  -F "categorie=autre" \
  -F "images=@not_an_image.txt"

# Nettoyer
rm not_an_image.txt
```

## 10. Script de test complet pour images

```bash
#!/bin/bash

API_URL="http://localhost:3000"

echo "=== Test Upload d'Images ==="

# Créer des images de test simples
echo "Création d'images de test..."
convert -size 100x100 xc:red test1.jpg 2>/dev/null || echo "ImageMagick non installé, utilisez de vraies images"
convert -size 200x200 xc:green test2.png 2>/dev/null || echo "ImageMagick non installé, utilisez de vraies images"
convert -size 150x150 xc:blue test3.gif 2>/dev/null || echo "ImageMagick non installé, utilisez de vraies images"

# Inscription et connexion
echo "1. Inscription..."
EMAIL="testimg$(date +%s)@example.com"
REGISTER_RESPONSE=$(curl -s -X POST $API_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Test Images User",
    "email": "'$EMAIL'",
    "motDePasse": "password123"
  }')

TOKEN=$(echo $REGISTER_RESPONSE | jq -r .token)

if [ "$TOKEN" != "null" ] && [ ! -z "$TOKEN" ]; then
    echo "Token obtenu: ${TOKEN:0:20}..."
    
    echo "2. Création produit avec images..."
    PRODUCT_RESPONSE=$(curl -s -X POST $API_URL/api/products \
      -H "Authorization: Bearer $TOKEN" \
      -F "nom=Produit Test Images" \
      -F "description=Test d'upload d'images avec l'API" \
      -F "prix=123.45" \
      -F "categorie=electronique" \
      -F "stock=8" \
      -F "images=@test1.jpg" \
      -F "images=@test2.png")
    
    echo $PRODUCT_RESPONSE | jq .
    
    PRODUCT_ID=$(echo $PRODUCT_RESPONSE | jq -r .data._id)
    
    if [ "$PRODUCT_ID" != "null" ] && [ ! -z "$PRODUCT_ID" ]; then
        echo "3. Ajout d'une nouvelle image au produit..."
        curl -s -X PUT $API_URL/api/products/$PRODUCT_ID \
          -H "Authorization: Bearer $TOKEN" \
          -F "images=@test3.gif" | jq .
        
        echo "4. Récupération du produit avec ses images..."
        curl -s $API_URL/api/products/$PRODUCT_ID | jq '.data.images'
    fi
else
    echo "Erreur: Token non obtenu"
fi

# Nettoyer les fichiers de test
rm -f test1.jpg test2.png test3.gif

echo "=== Tests terminés ==="
```

Sauvegarder ce script dans `test_images.sh` et l'exécuter avec :
```bash
chmod +x test_images.sh
./test_images.sh
```

## Notes importantes

1. **Format de sortie** : Toutes les images sont automatiquement converties en WebP pour l'optimisation
2. **Redimensionnement** : Les images sont automatiquement redimensionnées à 800x600 pixels maximum
3. **Nommage** : Les fichiers sont renommés avec un UUID unique pour éviter les conflits
4. **Nettoyage** : Les images sont supprimées automatiquement quand un produit est supprimé
5. **Sécurité** : Seuls les propriétaires peuvent modifier les images de leurs produits