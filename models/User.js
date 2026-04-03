const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nom: { type: String, required: true, trim: true },
  prenom: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  telephone: { type: String, required: true },
  motDePasse: { type: String, required: true },
  photo: { type: String, default: '' },
  role: { type: String, enum: ['passager', 'conducteur', 'les_deux'], default: 'passager' },
  // Pour conducteur
  vehicule: {
    marque: String,
    modele: String,
    couleur: String,
    immatriculation: String,
    places: { type: Number, default: 4 }
  },
  note: { type: Number, default: 0 },
  nbAvis: { type: Number, default: 0 },
  actif: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
