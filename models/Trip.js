const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  conducteur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  depart: {
    ville: { type: String, required: true },
    adresse: String,
    coordonnees: {
      lat: Number,
      lng: Number
    }
  },
  arrivee: {
    ville: { type: String, required: true },
    adresse: String,
    coordonnees: {
      lat: Number,
      lng: Number
    }
  },
  dateDepart: { type: Date, required: true },
  heureDepart: { type: String, required: true },
  placesDisponibles: { type: Number, required: true, min: 1 },
  placesReservees: { type: Number, default: 0 },
  prixParPlace: { type: Number, required: true }, // en Ariary
  description: { type: String, default: '' },
  statut: {
    type: String,
    enum: ['disponible', 'complet', 'en_cours', 'termine', 'annule'],
    default: 'disponible'
  },
  // Trajets fréquents à Madagascar
  villesEtape: [String]
}, { timestamps: true });

// Index pour recherche géographique
tripSchema.index({ 'depart.ville': 1, 'arrivee.ville': 1, dateDepart: 1 });

module.exports = mongoose.model('Trip', tripSchema);
