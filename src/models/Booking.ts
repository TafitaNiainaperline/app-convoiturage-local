import mongoose, { Document, Schema } from 'mongoose';
import { BookingStatut, ModePaiement } from '../types';

export interface IBooking extends Document {
  trajet: mongoose.Types.ObjectId;
  passager: mongoose.Types.ObjectId;
  nbPlaces: number;
  prixTotal: number;
  statut: BookingStatut;
  modePaiement: ModePaiement;
  paiementEffectue: boolean;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>({
  trajet: { type: Schema.Types.ObjectId, ref: 'Trip', required: true },
  passager: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  nbPlaces: { type: Number, required: true, min: 1 },
  prixTotal: { type: Number, required: true },
  statut: {
    type: String,
    enum: ['en_attente', 'confirme', 'refuse', 'annule', 'termine'],
    default: 'en_attente',
  },
  modePaiement: {
    type: String,
    enum: ['mvola', 'orange_money', 'especes'],
    default: 'especes',
  },
  paiementEffectue: { type: Boolean, default: false },
  message: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model<IBooking>('Booking', bookingSchema);
