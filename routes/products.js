const express = require('express');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const { upload, processImages, deleteImages, validateImageUpdate, handleMulterError } = require('../middleware/upload');

const router = express.Router();

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Obtenir tous les produits
 *     description: Récupère la liste des produits avec pagination et filtres optionnels
 *     tags: [Produits]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Nombre d'éléments par page
 *       - in: query
 *         name: categorie
 *         schema:
 *           type: string
 *           enum: [electronique, vetements, maison, sport, livres, autre]
 *         description: Filtrer par catégorie
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Recherche textuelle dans nom et description
 *       - in: query
 *         name: prixMin
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Prix minimum
 *       - in: query
 *         name: prixMax
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Prix maximum
 *     responses:
 *       200:
 *         description: Liste des produits récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductListResponse'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

/**
 * @swagger
 * /api/products/user/me:
 *   get:
 *     summary: Obtenir mes produits
 *     description: Récupère tous les produits de l'utilisateur connecté
 *     tags: [Produits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Nombre d'éléments par page
 *     responses:
 *       200:
 *         description: Produits de l'utilisateur récupérés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductListResponse'
 *       401:
 *         description: Token manquant ou invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Obtenir un produit par ID
 *     description: Récupère les détails d'un produit spécifique
 *     tags: [Produits]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du produit (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Produit récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: ID de produit invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Produit non trouvé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Créer un nouveau produit
 *     description: Crée un nouveau produit avec upload d'images optionnel (maximum 5 images)
 *     tags: [Produits]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - nom
 *               - description
 *               - prix
 *               - categorie
 *             properties:
 *               nom:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Nom du produit
 *                 example: iPhone 14 Pro
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 500
 *                 description: Description du produit
 *                 example: Smartphone Apple avec puce A16 Bionic
 *               prix:
 *                 type: number
 *                 minimum: 0
 *                 description: Prix en euros
 *                 example: 1199.99
 *               categorie:
 *                 type: string
 *                 enum: [electronique, vetements, maison, sport, livres, autre]
 *                 description: Catégorie du produit
 *                 example: electronique
 *               stock:
 *                 type: integer
 *                 minimum: 0
 *                 description: Quantité en stock
 *                 example: 15
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 maxItems: 5
 *                 description: Images du produit (JPEG, PNG, GIF, WebP - 5MB max chacune)
 *     responses:
 *       201:
 *         description: Produit créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Produit créé avec succès
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Erreurs de validation ou de fichier
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Token manquant ou invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Modifier un produit
 *     description: Met à jour un produit existant avec gestion intelligente des images (propriétaire seulement)
 *     tags: [Produits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du produit à modifier
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               nom:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Nouveau nom du produit
 *                 example: iPhone 14 Pro Max
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 500
 *                 description: Nouvelle description
 *                 example: Version améliorée avec écran plus grand
 *               prix:
 *                 type: number
 *                 minimum: 0
 *                 description: Nouveau prix
 *                 example: 1399.99
 *               categorie:
 *                 type: string
 *                 enum: [electronique, vetements, maison, sport, livres, autre]
 *                 description: Nouvelle catégorie
 *               stock:
 *                 type: integer
 *                 minimum: 0
 *                 description: Nouveau stock
 *                 example: 8
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 maxItems: 5
 *                 description: Nouvelles images à ajouter
 *               keepImages:
 *                 type: string
 *                 description: JSON array des noms de fichiers à conserver
 *                 example: '["filename1.webp", "filename2.webp"]'
 *     responses:
 *       200:
 *         description: Produit mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Produit mis à jour avec succès
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Erreurs de validation ou ID invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Token manquant ou invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Accès refusé (pas propriétaire)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Produit non trouvé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     summary: Supprimer un produit
 *     description: Supprime un produit et toutes ses images (propriétaire seulement)
 *     tags: [Produits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du produit à supprimer
 *     responses:
 *       200:
 *         description: Produit supprimé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Produit supprimé avec succès
 *       400:
 *         description: ID de produit invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Token manquant ou invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Accès refusé (pas propriétaire)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Produit non trouvé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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