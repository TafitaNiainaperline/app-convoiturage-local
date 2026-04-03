import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { nom, prenom, email, telephone, motDePasse, role } = req.body;

    const existant = await User.findOne({ email });
    if (existant) {
      res.status(400).json({ message: 'Email déjà utilisé.' });
      return;
    }

    const hash = await bcrypt.hash(motDePasse, 10);
    const user = new User({ nom, prenom, email, telephone, motDePasse: hash, role });
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: { id: user._id, nom, prenom, email, role },
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, motDePasse } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({ message: 'Email ou mot de passe incorrect.' });
      return;
    }

    const valide = await bcrypt.compare(motDePasse, user.motDePasse);
    if (!valide) {
      res.status(400).json({ message: 'Email ou mot de passe incorrect.' });
      return;
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user._id, nom: user.nom, prenom: user.prenom, email: user.email, role: user.role },
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

export default router;
