import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import tripRoutes from './routes/trips';
import bookingRoutes from './routes/bookings';
import userRoutes from './routes/users';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/', (_req, res) => {
  res.json({ message: 'API Covoiturage Madagascar - OK' });
});

// Socket.io - suivi trajets en temps réel
io.on('connection', (socket) => {
  console.log('Client connecté:', socket.id);

  socket.on('driver:location', (data: { tripId: string; lat: number; lng: number }) => {
    socket.to(`trip:${data.tripId}`).emit('driver:location', data);
  });

  socket.on('join:trip', (tripId: string) => {
    socket.join(`trip:${tripId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client déconnecté:', socket.id);
  });
});

// Connexion MongoDB
mongoose.connect(process.env.MONGO_URI as string)
  .then(() => {
    console.log('MongoDB connecté');
    server.listen(process.env.PORT || 5000, () => {
      console.log(`Serveur lancé sur le port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err: Error) => {
    console.error('Erreur MongoDB:', err.message);
    process.exit(1);
  });
