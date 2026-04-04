import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  destinataire: mongoose.Types.ObjectId;
  type: 'reservation_confirmee' | 'reservation_refusee' | 'reservation_annulee' | 'nouvelle_reservation';
  message: string;
  lu: boolean;
  trajetId?: mongoose.Types.ObjectId;
  reservationId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>({
  destinataire: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['reservation_confirmee', 'reservation_refusee', 'reservation_annulee', 'nouvelle_reservation'],
    required: true,
  },
  message: { type: String, required: true },
  lu: { type: Boolean, default: false },
  trajetId: { type: Schema.Types.ObjectId, ref: 'Trip' },
  reservationId: { type: Schema.Types.ObjectId, ref: 'Booking' },
}, { timestamps: true });

export default mongoose.model<INotification>('Notification', notificationSchema);
