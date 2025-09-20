const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Récupérer le token du header Authorization
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Vérifier si le token existe
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Accès refusé, token non fourni'
      });
    }

    try {
      // Vérifier le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Vérifier si l'utilisateur existe toujours
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Token invalide, utilisateur non trouvé'
        });
      }

      // Ajouter l'utilisateur à la requête
      req.user = decoded;
      next();

    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide'
      });
    }

  } catch (error) {
    console.error('Erreur dans le middleware d\'authentification:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

module.exports = auth;