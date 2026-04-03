const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Config upload photo
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB max

// GET /api/users/profil - Profil de l'utilisateur connecté
router.get('/profil', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-motDePasse');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

// PUT /api/users/profil - Modifier son profil
router.put('/profil', authMiddleware, async (req, res) => {
  try {
    const { motDePasse, ...updates } = req.body; // on exclut motDePasse ici
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-motDePasse');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

// POST /api/users/photo - Upload photo de profil
router.post('/photo', authMiddleware, upload.single('photo'), async (req, res) => {
  try {
    const photoUrl = `/uploads/${req.file.filename}`;
    await User.findByIdAndUpdate(req.user.id, { photo: photoUrl });
    res.json({ photo: photoUrl });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

// GET /api/users/:id - Profil public d'un utilisateur
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('nom prenom photo note nbAvis vehicule role createdAt');
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

module.exports = router;
