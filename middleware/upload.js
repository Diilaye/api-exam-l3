const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;

// Configuration du stockage multer
const storage = multer.memoryStorage();

// Filtrer les types de fichiers acceptés
const fileFilter = (req, file, cb) => {
  // Vérifier si le fichier est une image
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Seuls les fichiers image sont autorisés (JPEG, PNG, GIF, WebP)'), false);
  }
};

// Configuration multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max par image
    files: 5 // Maximum 5 images par produit
  }
});

// Middleware pour traiter les images après upload
const processImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next();
    }

    // Créer le dossier uploads s'il n'existe pas
    const uploadsDir = path.join(__dirname, '../uploads/products');
    try {
      await fs.access(uploadsDir);
    } catch (error) {
      await fs.mkdir(uploadsDir, { recursive: true });
    }

    // Traiter chaque image
    req.processedImages = [];
    
    for (const file of req.files) {
      try {
        // Générer un nom de fichier unique
        const filename = `${uuidv4()}-${Date.now()}.webp`;
        const filepath = path.join(uploadsDir, filename);

        // Redimensionner et optimiser l'image avec Sharp
        await sharp(file.buffer)
          .resize(800, 600, { // Redimensionner à 800x600 max
            fit: 'inside',
            withoutEnlargement: true
          })
          .webp({ quality: 85 }) // Convertir en WebP pour une meilleure compression
          .toFile(filepath);

        // Obtenir les informations de l'image traitée
        const stats = await fs.stat(filepath);

        // Ajouter les métadonnées de l'image
        req.processedImages.push({
          filename: filename,
          originalName: file.originalname,
          mimetype: 'image/webp',
          size: stats.size,
          url: `/uploads/products/${filename}`
        });

      } catch (error) {
        console.error('Erreur lors du traitement de l\'image:', error);
        // Continuer avec les autres images en cas d'erreur sur une image
        continue;
      }
    }

    next();

  } catch (error) {
    console.error('Erreur dans processImages middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du traitement des images'
    });
  }
};

// Middleware pour supprimer les images du système de fichiers
const deleteImages = async (imagePaths) => {
  try {
    if (!imagePaths || imagePaths.length === 0) return;

    for (const imagePath of imagePaths) {
      try {
        // Construire le chemin complet du fichier
        const fullPath = path.join(__dirname, '../uploads/products', path.basename(imagePath));
        await fs.unlink(fullPath);
      } catch (error) {
        console.error(`Erreur lors de la suppression de l'image ${imagePath}:`, error);
        // Continuer même si la suppression d'une image échoue
      }
    }
  } catch (error) {
    console.error('Erreur dans deleteImages:', error);
  }
};

// Middleware pour valider les images lors de la mise à jour
const validateImageUpdate = (req, res, next) => {
  // Si des images sont envoyées mais qu'aucune image existante n'est préservée
  if (req.files && req.files.length > 0 && !req.body.keepImages) {
    // Nouvelles images seulement
    return next();
  }
  
  // Si on garde certaines images existantes
  if (req.body.keepImages) {
    try {
      const keepImages = JSON.parse(req.body.keepImages);
      if (!Array.isArray(keepImages)) {
        return res.status(400).json({
          success: false,
          message: 'keepImages doit être un tableau'
        });
      }
      req.keepImages = keepImages;
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Format invalide pour keepImages'
      });
    }
  }
  
  next();
};

// Middleware d'erreur pour multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Fichier trop volumineux. Taille maximale: 5MB par image'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Trop d\'images. Maximum: 5 images par produit'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Champ de fichier inattendu'
      });
    }
  }

  if (error.message.includes('image')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  next(error);
};

module.exports = {
  upload: upload.array('images', 5), // Accepter jusqu'à 5 images
  processImages,
  deleteImages,
  validateImageUpdate,
  handleMulterError
};