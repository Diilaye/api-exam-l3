const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom du produit est obligatoire'],
    trim: true,
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },
  description: {
    type: String,
    required: [true, 'La description est obligatoire'],
    maxlength: [500, 'La description ne peut pas dépasser 500 caractères']
  },
  prix: {
    type: Number,
    required: [true, 'Le prix est obligatoire'],
    min: [0, 'Le prix ne peut pas être négatif']
  },
  categorie: {
    type: String,
    required: [true, 'La catégorie est obligatoire'],
    enum: ['electronique', 'vetements', 'maison', 'sport', 'livres', 'autre'],
    default: 'autre'
  },
  stock: {
    type: Number,
    required: [true, 'La quantité en stock est obligatoire'],
    min: [0, 'Le stock ne peut pas être négatif'],
    default: 0
  },
  images: [{
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    mimetype: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    url: {
      type: String,
      required: true
    }
  }],
  proprietaire: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index pour améliorer les performances de recherche
productSchema.index({ nom: 'text', description: 'text' });
productSchema.index({ proprietaire: 1 });
productSchema.index({ categorie: 1 });

module.exports = mongoose.model('Product', productSchema);