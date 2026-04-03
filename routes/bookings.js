const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Trip = require('../models/Trip');
const authMiddleware = require('../middleware/auth');

// POST /api/bookings - Réserver un trajet
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { trajetId, nbPlaces, modePaiement, message } = req.body;

    const trajet = await Trip.findById(trajetId);
    if (!trajet) return res.status(404).json({ message: 'Trajet introuvable.' });

    const restantes = trajet.placesDisponibles - trajet.placesReservees;
    if (nbPlaces > restantes) {
      return res.status(400).json({ message: `Seulement ${restantes} place(s) disponible(s).` });
    }

    // Vérifier que le conducteur ne réserve pas son propre trajet
    if (trajet.conducteur.toString() === req.user.id) {
      return res.status(400).json({ message: 'Vous ne pouvez pas réserver votre propre trajet.' });
    }

    const prixTotal = nbPlaces * trajet.prixParPlace;
    const reservation = new Booking({
      trajet: trajetId,
      passager: req.user.id,
      nbPlaces,
      prixTotal,
      modePaiement,
      message
    });

    await reservation.save();

    // Mettre à jour les places réservées
    trajet.placesReservees += nbPlaces;
    if (trajet.placesReservees >= trajet.placesDisponibles) {
      trajet.statut = 'complet';
    }
    await trajet.save();

    res.status(201).json(reservation);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

// GET /api/bookings/mes-reservations - Réservations du passager connecté
router.get('/mes-reservations', authMiddleware, async (req, res) => {
  try {
    const reservations = await Booking.find({ passager: req.user.id })
      .populate('trajet')
      .sort({ createdAt: -1 });
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

// GET /api/bookings/trajet/:tripId - Réservations d'un trajet (conducteur)
router.get('/trajet/:tripId', authMiddleware, async (req, res) => {
  try {
    const trajet = await Trip.findOne({ _id: req.params.tripId, conducteur: req.user.id });
    if (!trajet) return res.status(403).json({ message: 'Non autorisé.' });

    const reservations = await Booking.find({ trajet: req.params.tripId })
      .populate('passager', 'nom prenom photo telephone note');
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

// PUT /api/bookings/:id/statut - Confirmer ou refuser une réservation
router.put('/:id/statut', authMiddleware, async (req, res) => {
  try {
    const { statut } = req.body;
    const reservation = await Booking.findById(req.params.id).populate('trajet');

    if (!reservation) return res.status(404).json({ message: 'Réservation introuvable.' });

    // Seul le conducteur peut confirmer/refuser
    if (reservation.trajet.conducteur.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Non autorisé.' });
    }

    reservation.statut = statut;
    await reservation.save();
    res.json(reservation);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

// DELETE /api/bookings/:id - Annuler une réservation (passager)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const reservation = await Booking.findOne({ _id: req.params.id, passager: req.user.id });
    if (!reservation) return res.status(404).json({ message: 'Réservation introuvable.' });

    reservation.statut = 'annule';
    await reservation.save();

    // Libérer les places
    await Trip.findByIdAndUpdate(reservation.trajet, {
      $inc: { placesReservees: -reservation.nbPlaces },
      statut: 'disponible'
    });

    res.json({ message: 'Réservation annulée.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

module.exports = router;
