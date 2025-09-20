const express = require('express');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const { upload, processImages, deleteImages, validateImageUpdate, handleMulterError } = require('../middleware/upload');

const router = express.Router();

// @route   GET /api/products
// @desc    Obtenir tous les produits (avec pagination et filtres)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Construire le filtre de recherche
    let filter = {};
    
    if (req.query.categorie) {
      filter.categorie = req.query.categorie;
    }
    
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    if (req.query.prixMin || req.query.prixMax) {
      filter.prix = {};
      if (req.query.prixMin) filter.prix.$gte = parseFloat(req.query.prixMin);
      if (req.query.prixMax) filter.prix.$lte = parseFloat(req.query.prixMax);
    }

    // Récupérer les produits avec pagination
    const products = await Product.find(filter)
      .populate('proprietaire', 'nom email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Compter le total pour la pagination
    const total = await Product.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: products,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts: total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// @route   GET /api/products/user/me
// @desc    Obtenir tous les produits de l'utilisateur connecté
// @access  Private
router.get('/user/me', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const products = await Product.find({ proprietaire: req.user.userId })
      .populate('proprietaire', 'nom email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments({ proprietaire: req.user.userId });
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: products,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts: total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des produits de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// @route   GET /api/products/:id
// @desc    Obtenir un produit par son ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('proprietaire', 'nom email');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé'
      });
    }

    res.json({
      success: true,
      data: product
    });

  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID de produit invalide'
      });
    }
    
    console.error('Erreur lors de la récupération du produit:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// @route   POST /api/products
// @desc    Créer un nouveau produit
// @access  Private
router.post('/', auth, upload, processImages, [
  body('nom').trim().isLength({ min: 2 }).withMessage('Le nom doit contenir au moins 2 caractères'),
  body('description').trim().isLength({ min: 10 }).withMessage('La description doit contenir au moins 10 caractères'),
  body('prix').isNumeric().withMessage('Le prix doit être un nombre').isFloat({ min: 0 }).withMessage('Le prix ne peut pas être négatif'),
  body('categorie').isIn(['electronique', 'vetements', 'maison', 'sport', 'livres', 'autre']).withMessage('Catégorie invalide'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Le stock doit être un nombre entier positif')
], async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Supprimer les images uploadées en cas d'erreur de validation
      if (req.processedImages && req.processedImages.length > 0) {
        const filenames = req.processedImages.map(img => img.filename);
        await deleteImages(filenames);
      }
      
      return res.status(400).json({
        success: false,
        message: 'Erreurs de validation',
        errors: errors.array()
      });
    }

    const { nom, description, prix, categorie, stock } = req.body;

    // Préparer les données du produit
    const productData = {
      nom,
      description,
      prix,
      categorie,
      stock: stock || 0,
      proprietaire: req.user.userId
    };

    // Ajouter les images si elles ont été uploadées
    if (req.processedImages && req.processedImages.length > 0) {
      productData.images = req.processedImages;
    }

    // Créer le produit
    const product = await Product.create(productData);

    // Récupérer le produit créé avec les informations du propriétaire
    const createdProduct = await Product.findById(product._id)
      .populate('proprietaire', 'nom email');

    res.status(201).json({
      success: true,
      message: 'Produit créé avec succès',
      data: createdProduct
    });

  } catch (error) {
    // Supprimer les images uploadées en cas d'erreur
    if (req.processedImages && req.processedImages.length > 0) {
      const filenames = req.processedImages.map(img => img.filename);
      await deleteImages(filenames);
    }
    
    console.error('Erreur lors de la création du produit:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création du produit'
    });
  }
});

// @route   PUT /api/products/:id
// @desc    Modifier un produit
// @access  Private (propriétaire seulement)
router.put('/:id', auth, upload, validateImageUpdate, processImages, [
  body('nom').optional().trim().isLength({ min: 2 }).withMessage('Le nom doit contenir au moins 2 caractères'),
  body('description').optional().trim().isLength({ min: 10 }).withMessage('La description doit contenir au moins 10 caractères'),
  body('prix').optional().isNumeric().withMessage('Le prix doit être un nombre').isFloat({ min: 0 }).withMessage('Le prix ne peut pas être négatif'),
  body('categorie').optional().isIn(['electronique', 'vetements', 'maison', 'sport', 'livres', 'autre']).withMessage('Catégorie invalide'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Le stock doit être un nombre entier positif')
], async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Supprimer les nouvelles images en cas d'erreur
      if (req.processedImages && req.processedImages.length > 0) {
        const filenames = req.processedImages.map(img => img.filename);
        await deleteImages(filenames);
      }
      
      return res.status(400).json({
        success: false,
        message: 'Erreurs de validation',
        errors: errors.array()
      });
    }

    // Trouver le produit
    const product = await Product.findById(req.params.id);
    if (!product) {
      // Supprimer les nouvelles images si le produit n'existe pas
      if (req.processedImages && req.processedImages.length > 0) {
        const filenames = req.processedImages.map(img => img.filename);
        await deleteImages(filenames);
      }
      
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé'
      });
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (product.proprietaire.toString() !== req.user.userId) {
      // Supprimer les nouvelles images si pas autorisé
      if (req.processedImages && req.processedImages.length > 0) {
        const filenames = req.processedImages.map(img => img.filename);
        await deleteImages(filenames);
      }
      
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Vous pouvez seulement modifier vos propres produits'
      });
    }

    // Préparer les données de mise à jour
    const updateData = { ...req.body };
    delete updateData.keepImages; // Supprimer le champ keepImages des données de mise à jour

    // Gérer les images
    let finalImages = [];
    const oldImages = product.images || [];

    // Si on garde certaines anciennes images
    if (req.keepImages && req.keepImages.length > 0) {
      finalImages = oldImages.filter(img => req.keepImages.includes(img.filename));
    }

    // Ajouter les nouvelles images
    if (req.processedImages && req.processedImages.length > 0) {
      finalImages = [...finalImages, ...req.processedImages];
    }

    // Vérifier la limite de 5 images
    if (finalImages.length > 5) {
      // Supprimer les nouvelles images en cas de dépassement
      if (req.processedImages && req.processedImages.length > 0) {
        const filenames = req.processedImages.map(img => img.filename);
        await deleteImages(filenames);
      }
      
      return res.status(400).json({
        success: false,
        message: 'Maximum 5 images par produit autorisées'
      });
    }

    // Mettre à jour les images
    updateData.images = finalImages;

    // Identifier les images à supprimer
    const imagesToDelete = oldImages.filter(img => 
      !finalImages.some(finalImg => finalImg.filename === img.filename)
    );

    // Mettre à jour le produit
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('proprietaire', 'nom email');

    // Supprimer les anciennes images du système de fichiers
    if (imagesToDelete.length > 0) {
      const filenamesToDelete = imagesToDelete.map(img => img.filename);
      await deleteImages(filenamesToDelete);
    }

    res.json({
      success: true,
      message: 'Produit mis à jour avec succès',
      data: updatedProduct
    });

  } catch (error) {
    // Supprimer les nouvelles images en cas d'erreur
    if (req.processedImages && req.processedImages.length > 0) {
      const filenames = req.processedImages.map(img => img.filename);
      await deleteImages(filenames);
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID de produit invalide'
      });
    }
    
    console.error('Erreur lors de la mise à jour du produit:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour du produit'
    });
  }
});

// @route   DELETE /api/products/:id
// @desc    Supprimer un produit
// @access  Private (propriétaire seulement)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Trouver le produit
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé'
      });
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (product.proprietaire.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Vous pouvez seulement supprimer vos propres produits'
      });
    }

    // Supprimer les images du système de fichiers
    if (product.images && product.images.length > 0) {
      const filenames = product.images.map(img => img.filename);
      await deleteImages(filenames);
    }

    // Supprimer le produit
    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Produit supprimé avec succès'
    });

  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID de produit invalide'
      });
    }
    
    console.error('Erreur lors de la suppression du produit:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la suppression du produit'
    });
  }
});

// Ajouter le middleware de gestion d'erreurs Multer
router.use(handleMulterError);

module.exports = router;