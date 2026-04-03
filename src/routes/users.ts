import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import User from '../models/User';
import authMiddleware from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req: AuthRequest, file, cb) => {
    cb(null, `${req.user!.id}-${Date.now()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// GET /api/users/profil - Profil de l'utilisateur connecté
router.get('/profil', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!.id).select('-motDePasse');
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

// PUT /api/users/profil - Modifier son profil
router.put('/profil', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { motDePasse, ...updates } = req.body;
    const user = await User.findByIdAndUpdate(req.user!.id, updates, { new: true }).select('-motDePasse');
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

// POST /api/users/photo - Upload photo de profil
router.post('/photo', authMiddleware, upload.single('photo'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const photoUrl = `/uploads/${req.file!.filename}`;
    await User.findByIdAndUpdate(req.user!.id, { photo: photoUrl });
    res.json({ photo: photoUrl });
  } catch (err: any) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

// GET /api/users/:id - Profil public d'un utilisateur
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).select('nom prenom photo note nbAvis vehicule role createdAt');
    if (!user) {
      res.status(404).json({ message: 'Utilisateur introuvable.' });
      return;
    }
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

export default router;
