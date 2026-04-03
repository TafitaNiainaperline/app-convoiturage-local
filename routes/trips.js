const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');
const authMiddleware = require('../middleware/auth');

// GET /api/trips - Lister les trajets (avec filtres)
router.get('/', async (req, res) => {
  try {
    const { depart, arrivee, date, places } = req.query;
    const filtre = { statut: 'disponible' };

    if (depart) filtre['depart.ville'] = new RegExp(depart, 'i');
    if (arrivee) filtre['arrivee.ville'] = new RegExp(arrivee, 'i');
    if (date) {
      const debut = new Date(date);
      const fin = new Date(date);
      fin.setDate(fin.getDate() + 1);
      filtre.dateDepart = { $gte: debut, $lt: fin };
    }
    if (places) filtre.placesDisponibles = { $gte: parseInt(places) };

    const trajets = await Trip.find(filtre)
      .populate('conducteur', 'nom prenom photo note nbAvis vehicule')
      .sort({ dateDepart: 1 });

    res.json(trajets);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

// GET /api/trips/:id - Détail d'un trajet
router.get('/:id', async (req, res) => {
  try {
    const trajet = await Trip.findById(req.params.id)
      .populate('conducteur', 'nom prenom photo note nbAvis vehicule telephone');

    if (!trajet) return res.status(404).json({ message: 'Trajet introuvable.' });

    res.json(trajet);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

// POST /api/trips - Créer un trajet (conducteur)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const trajet = new Trip({ ...req.body, conducteur: req.user.id });
    await trajet.save();
    res.status(201).json(trajet);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

// PUT /api/trips/:id - Modifier un trajet
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const trajet = await Trip.findOne({ _id: req.params.id, conducteur: req.user.id });
    if (!trajet) return res.status(404).json({ message: 'Trajet introuvable ou non autorisé.' });

    Object.assign(trajet, req.body);
    await trajet.save();
    res.json(trajet);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

// DELETE /api/trips/:id - Annuler un trajet
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const trajet = await Trip.findOne({ _id: req.params.id, conducteur: req.user.id });
    if (!trajet) return res.status(404).json({ message: 'Trajet introuvable ou non autorisé.' });

    trajet.statut = 'annule';
    await trajet.save();
    res.json({ message: 'Trajet annulé.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

// GET /api/trips/conducteur/mes-trajets - Trajets du conducteur connecté
router.get('/conducteur/mes-trajets', authMiddleware, async (req, res) => {
  try {
    const trajets = await Trip.find({ conducteur: req.user.id }).sort({ dateDepart: -1 });
    res.json(trajets);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

module.exports = router;
