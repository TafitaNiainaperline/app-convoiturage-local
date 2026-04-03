const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  trajet: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  passager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  nbPlaces: { type: Number, required: true, min: 1 },
  prixTotal: { type: Number, required: true },
  statut: {
    type: String,
    enum: ['en_attente', 'confirme', 'refuse', 'annule', 'termine'],
    default: 'en_attente'
  },
  modePaiement: {
    type: String,
    enum: ['mvola', 'orange_money', 'especes'],
    default: 'especes'
  },
  paiementEffectue: { type: Boolean, default: false },
  message: { type: String, default: '' } // message du passager au conducteur
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
