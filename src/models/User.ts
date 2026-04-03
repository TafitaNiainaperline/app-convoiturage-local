import mongoose, { Document, Schema } from 'mongoose';
import { UserRole } from '../types';

export interface IVehicule {
  marque?: string;
  modele?: string;
  couleur?: string;
  immatriculation?: string;
  places: number;
}

export interface IUser extends Document {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  motDePasse: string;
  photo: string;
  role: UserRole;
  vehicule?: IVehicule;
  note: number;
  nbAvis: number;
  actif: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  nom: { type: String, required: true, trim: true },
  prenom: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  telephone: { type: String, required: true },
  motDePasse: { type: String, required: true },
  photo: { type: String, default: '' },
  role: { type: String, enum: ['passager', 'conducteur', 'les_deux'], default: 'passager' },
  vehicule: {
    marque: String,
    modele: String,
    couleur: String,
    immatriculation: String,
    places: { type: Number, default: 4 },
  },
  note: { type: Number, default: 0 },
  nbAvis: { type: Number, default: 0 },
  actif: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model<IUser>('User', userSchema);
