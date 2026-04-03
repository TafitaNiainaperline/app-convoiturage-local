import mongoose, { Document, Schema } from 'mongoose';
import { TripStatut } from '../types';

interface ICoordonnees {
  lat?: number;
  lng?: number;
}

interface ILieu {
  ville: string;
  adresse?: string;
  coordonnees?: ICoordonnees;
}

export interface ITrip extends Document {
  conducteur: mongoose.Types.ObjectId;
  depart: ILieu;
  arrivee: ILieu;
  dateDepart: Date;
  heureDepart: string;
  placesDisponibles: number;
  placesReservees: number;
  prixParPlace: number;
  description: string;
  statut: TripStatut;
  villesEtape: string[];
  createdAt: Date;
  updatedAt: Date;
}

const tripSchema = new Schema<ITrip>({
  conducteur: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  depart: {
    ville: { type: String, required: true },
    adresse: String,
    coordonnees: { lat: Number, lng: Number },
  },
  arrivee: {
    ville: { type: String, required: true },
    adresse: String,
    coordonnees: { lat: Number, lng: Number },
  },
  dateDepart: { type: Date, required: true },
  heureDepart: { type: String, required: true },
  placesDisponibles: { type: Number, required: true, min: 1 },
  placesReservees: { type: Number, default: 0 },
  prixParPlace: { type: Number, required: true },
  description: { type: String, default: '' },
  statut: {
    type: String,
    enum: ['disponible', 'complet', 'en_cours', 'termine', 'annule'],
    default: 'disponible',
  },
  villesEtape: [String],
}, { timestamps: true });

tripSchema.index({ 'depart.ville': 1, 'arrivee.ville': 1, dateDepart: 1 });

export default mongoose.model<ITrip>('Trip', tripSchema);
