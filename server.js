const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const tripRoutes = require('./routes/trips');
const bookingRoutes = require('./routes/bookings');
const userRoutes = require('./routes/users');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'API Covoiturage Madagascar - OK' });
});

// Socket.io - suivi trajets en temps réel
io.on('connection', (socket) => {
  console.log('Client connecté:', socket.id);

  socket.on('driver:location', (data) => {
    // data = { tripId, lat, lng }
    socket.to(`trip:${data.tripId}`).emit('driver:location', data);
  });

  socket.on('join:trip', (tripId) => {
    socket.join(`trip:${tripId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client déconnecté:', socket.id);
  });
});

// Connexion MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connecté');
    server.listen(process.env.PORT || 5000, () => {
      console.log(`Serveur lancé sur le port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => {
    console.error('Erreur MongoDB:', err.message);
    process.exit(1);
  });
