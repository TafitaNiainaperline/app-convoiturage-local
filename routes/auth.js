const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { nom, prenom, email, telephone, motDePasse, role } = req.body;

    const existant = await User.findOne({ email });
    if (existant) {
      return res.status(400).json({ message: 'Email déjà utilisé.' });
    }

    const hash = await bcrypt.hash(motDePasse, 10);
    const user = new User({ nom, prenom, email, telephone, motDePasse: hash, role });
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: { id: user._id, nom, prenom, email, role }
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, motDePasse } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect.' });
    }

    const valide = await bcrypt.compare(motDePasse, user.motDePasse);
    if (!valide) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect.' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user._id, nom: user.nom, prenom: user.prenom, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

module.exports = router;
