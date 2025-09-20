const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Configuration de base Swagger
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Exam - Authentification et Gestion de Produits',
      version: '1.0.0',
      description: `
        API REST complète pour la gestion d'utilisateurs et de produits avec upload d'images.
        
        ## Fonctionnalités
        - Authentification JWT (inscription, connexion)
        - CRUD complet pour les produits
        - Upload et gestion d'images (jusqu'à 5 par produit)
        - Pagination et filtres de recherche
        - Autorisation basée sur le propriétaire
        
        ## Authentification
        La plupart des endpoints nécessitent un token JWT. Après connexion, utilisez le token dans l'en-tête Authorization :
        \`\`\`
        Authorization: Bearer <your-jwt-token>
        \`\`\`
        
        ## Upload d'images
        Pour les endpoints supportant l'upload d'images, utilisez \`multipart/form-data\`.
        - Formats supportés : JPEG, PNG, GIF, WebP
        - Taille max : 5MB par image
        - Nombre max : 5 images par produit
        - Traitement automatique : redimensionnement et conversion en WebP
      `,
      contact: {
        name: 'API Support',
        email: 'support@api-exam.com'
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC'
      }
    },
    servers: [
      {
        url: 'http://localhost:4051',
        description: 'Serveur de développement'
      },
      {
        url: 'http://localhost:3000',
        description: 'Serveur de développement alternatif'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtenu après connexion'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['nom', 'email', 'motDePasse'],
          properties: {
            id: {
              type: 'string',
              description: 'ID unique de l\'utilisateur (MongoDB ObjectId)',
              example: '64f8a123b456c789d012e345'
            },
            nom: {
              type: 'string',
              minLength: 2,
              maxLength: 50,
              description: 'Nom complet de l\'utilisateur',
              example: 'Jean Dupont'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Adresse email unique',
              example: 'jean.dupont@example.com'
            },
            motDePasse: {
              type: 'string',
              minLength: 6,
              format: 'password',
              description: 'Mot de passe (sera hashé)',
              example: 'motdepasse123'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Date de création du compte',
              example: '2024-01-15T10:30:00Z'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Date de dernière modification',
              example: '2024-01-15T10:30:00Z'
            }
          }
        },
        UserResponse: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: '64f8a123b456c789d012e345'
            },
            nom: {
              type: 'string',
              example: 'Jean Dupont'
            },
            email: {
              type: 'string',
              example: 'jean.dupont@example.com'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z'
            }
          }
        },
        Image: {
          type: 'object',
          properties: {
            filename: {
              type: 'string',
              description: 'Nom du fichier généré (UUID)',
              example: 'a1b2c3d4-1234567890-image.webp'
            },
            originalName: {
              type: 'string',
              description: 'Nom original du fichier uploadé',
              example: 'mon-produit.jpg'
            },
            mimetype: {
              type: 'string',
              description: 'Type MIME (toujours image/webp après traitement)',
              example: 'image/webp'
            },
            size: {
              type: 'number',
              description: 'Taille du fichier en octets',
              example: 245760
            },
            url: {
              type: 'string',
              description: 'URL d\'accès à l\'image',
              example: '/uploads/products/a1b2c3d4-1234567890-image.webp'
            }
          }
        },
        Product: {
          type: 'object',
          required: ['nom', 'description', 'prix', 'categorie'],
          properties: {
            id: {
              type: 'string',
              description: 'ID unique du produit',
              example: '64f8a123b456c789d012e345'
            },
            nom: {
              type: 'string',
              minLength: 2,
              maxLength: 100,
              description: 'Nom du produit',
              example: 'iPhone 14 Pro'
            },
            description: {
              type: 'string',
              minLength: 10,
              maxLength: 500,
              description: 'Description détaillée du produit',
              example: 'Smartphone Apple avec puce A16 Bionic et écran Super Retina XDR'
            },
            prix: {
              type: 'number',
              minimum: 0,
              description: 'Prix du produit en euros',
              example: 1199.99
            },
            categorie: {
              type: 'string',
              enum: ['electronique', 'vetements', 'maison', 'sport', 'livres', 'autre'],
              description: 'Catégorie du produit',
              example: 'electronique'
            },
            stock: {
              type: 'number',
              minimum: 0,
              description: 'Quantité en stock',
              example: 15,
              default: 0
            },
            images: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Image'
              },
              maxItems: 5,
              description: 'Images du produit (maximum 5)'
            },
            proprietaire: {
              type: 'string',
              description: 'ID du propriétaire du produit',
              example: '64f8a123b456c789d012e345'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z'
            }
          }
        },
        ProductInput: {
          type: 'object',
          required: ['nom', 'description', 'prix', 'categorie'],
          properties: {
            nom: {
              type: 'string',
              minLength: 2,
              maxLength: 100,
              example: 'iPhone 14 Pro'
            },
            description: {
              type: 'string',
              minLength: 10,
              maxLength: 500,
              example: 'Smartphone Apple avec puce A16 Bionic'
            },
            prix: {
              type: 'number',
              minimum: 0,
              example: 1199.99
            },
            categorie: {
              type: 'string',
              enum: ['electronique', 'vetements', 'maison', 'sport', 'livres', 'autre'],
              example: 'electronique'
            },
            stock: {
              type: 'number',
              minimum: 0,
              example: 15
            }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Connexion réussie'
            },
            token: {
              type: 'string',
              description: 'Token JWT pour l\'authentification',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            },
            user: {
              $ref: '#/components/schemas/UserResponse'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Erreur de validation'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    example: 'email'
                  },
                  message: {
                    type: 'string',
                    example: 'Email invalide'
                  }
                }
              }
            }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Opération réussie'
            },
            data: {
              type: 'object',
              description: 'Données de la réponse'
            }
          }
        },
        PaginationInfo: {
          type: 'object',
          properties: {
            currentPage: {
              type: 'number',
              example: 1
            },
            totalPages: {
              type: 'number',
              example: 5
            },
            totalProducts: {
              type: 'number',
              example: 47
            },
            hasNext: {
              type: 'boolean',
              example: true
            },
            hasPrev: {
              type: 'boolean',
              example: false
            }
          }
        },
        ProductListResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Product'
              }
            },
            pagination: {
              $ref: '#/components/schemas/PaginationInfo'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentification',
        description: 'Gestion des utilisateurs et authentification JWT'
      },
      {
        name: 'Produits',
        description: 'CRUD des produits avec upload d\'images'
      },
      {
        name: 'Images',
        description: 'Accès aux fichiers images'
      }
    ]
  },
  apis: [
    './routes/*.js',
    './server.js'
  ]
};

const specs = swaggerJSDoc(options);

module.exports = {
  specs,
  swaggerUi
};