import { Router, Response } from 'express';
import mongoose from 'mongoose';
import Booking from '../models/Booking';
import Trip from '../models/Trip';
import Notification from '../models/Notification';
import authMiddleware from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

// POST /api/bookings - Réserver un trajet
router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { trajetId, nbPlaces, modePaiement, message } = req.body;

    const trajet = await Trip.findById(trajetId);
    if (!trajet) {
      res.status(404).json({ message: 'Trajet introuvable.' });
      return;
    }

    const restantes = trajet.placesDisponibles - trajet.placesReservees;
    if (nbPlaces > restantes) {
      res.status(400).json({ message: `Seulement ${restantes} place(s) disponible(s).` });
      return;
    }

    if (trajet.conducteur.toString() === req.user!.id) {
      res.status(400).json({ message: 'Vous ne pouvez pas réserver votre propre trajet.' });
      return;
    }

    const prixTotal = nbPlaces * trajet.prixParPlace;
    const reservation = new Booking({
      trajet: trajetId,
      passager: req.user!.id,
      nbPlaces,
      prixTotal,
      modePaiement,
      message,
    });

    await reservation.save();

    trajet.placesReservees += nbPlaces;
    if (trajet.placesReservees >= trajet.placesDisponibles) {
      trajet.statut = 'complet';
    }
    await trajet.save();

    // Notifier le conducteur d'une nouvelle réservation
    await Notification.create({
      destinataire: trajet.conducteur,
      type: 'nouvelle_reservation',
      message: `Nouvelle demande de réservation pour votre trajet ${(trajet as any).depart?.ville} → ${(trajet as any).arrivee?.ville}.`,
      trajetId: trajet._id,
      reservationId: reservation._id,
    });

    res.status(201).json(reservation);
  } catch (err: any) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

// GET /api/bookings/mes-reservations - Réservations du passager connecté
router.get('/mes-reservations', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reservations = await Booking.find({ passager: req.user!.id })
      .populate('trajet')
      .sort({ createdAt: -1 });
    res.json(reservations);
  } catch (err: any) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

// GET /api/bookings/trajet/:tripId - Réservations d'un trajet (conducteur)
router.get('/trajet/:tripId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const trajet = await Trip.findOne({ _id: req.params.tripId, conducteur: new mongoose.Types.ObjectId(req.user!.id) });
    if (!trajet) {
      res.status(403).json({ message: 'Non autorisé.' });
      return;
    }

    const reservations = await Booking.find({ trajet: req.params.tripId })
      .populate('passager', 'nom prenom photo telephone note');
    res.json(reservations);
  } catch (err: any) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

// PUT /api/bookings/:id/statut - Confirmer ou refuser une réservation
router.put('/:id/statut', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { statut } = req.body;
    const reservation = await Booking.findById(req.params.id).populate('trajet');

    if (!reservation) {
      res.status(404).json({ message: 'Réservation introuvable.' });
      return;
    }

    const trajet = reservation.trajet as any;
    if (trajet.conducteur.toString() !== req.user!.id) {
      res.status(403).json({ message: 'Non autorisé.' });
      return;
    }

    reservation.statut = statut;
    await reservation.save();

    // Notifier le passager du changement de statut
    const messages: Record<string, string> = {
      confirme: `Votre réservation pour le trajet ${trajet.depart?.ville} → ${trajet.arrivee?.ville} a été confirmée.`,
      refuse:   `Votre réservation pour le trajet ${trajet.depart?.ville} → ${trajet.arrivee?.ville} a été refusée.`,
    };
    const types: Record<string, string> = {
      confirme: 'reservation_confirmee',
      refuse:   'reservation_refusee',
    };
    if (messages[statut]) {
      await Notification.create({
        destinataire: reservation.passager,
        type: types[statut],
        message: messages[statut],
        trajetId: trajet._id,
        reservationId: reservation._id,
      });
    }

    res.json(reservation);
  } catch (err: any) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

// DELETE /api/bookings/:id - Annuler une réservation (passager)
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reservation = await Booking.findOne({ _id: req.params.id, passager: req.user!.id });
    if (!reservation) {
      res.status(404).json({ message: 'Réservation introuvable.' });
      return;
    }

    reservation.statut = 'annule';
    await reservation.save();

    const trajetAnnule = await Trip.findByIdAndUpdate(reservation.trajet, {
      $inc: { placesReservees: -reservation.nbPlaces },
      statut: 'disponible',
    });

    // Notifier le conducteur de l'annulation
    if (trajetAnnule) {
      await Notification.create({
        destinataire: trajetAnnule.conducteur,
        type: 'reservation_annulee',
        message: `Un passager a annulé sa réservation pour le trajet ${(trajetAnnule as any).depart?.ville} → ${(trajetAnnule as any).arrivee?.ville}.`,
        trajetId: trajetAnnule._id,
        reservationId: reservation._id,
      });
    }

    res.json({ message: 'Réservation annulée.' });
  } catch (err: any) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

export default router;
