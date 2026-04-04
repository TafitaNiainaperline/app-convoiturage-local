import { Router, Response } from 'express';
import Notification from '../models/Notification';
import authMiddleware from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

// GET /api/notifications - Mes notifications
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notifications = await Notification.find({ destinataire: req.user!.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (err: any) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

// PUT /api/notifications/:id/lu - Marquer une notification comme lue
router.put('/:id/lu', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, destinataire: req.user!.id },
      { lu: true }
    );
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

// PUT /api/notifications/tout-lire - Marquer toutes comme lues
router.put('/tout-lire', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Notification.updateMany({ destinataire: req.user!.id, lu: false }, { lu: true });
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

export default router;
