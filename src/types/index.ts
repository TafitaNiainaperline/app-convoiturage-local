import { Request } from 'express';

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export type UserRole = 'passager' | 'conducteur' | 'les_deux';
export type TripStatut = 'disponible' | 'complet' | 'en_cours' | 'termine' | 'annule';
export type BookingStatut = 'en_attente' | 'confirme' | 'refuse' | 'annule' | 'termine';
export type ModePaiement = 'mvola' | 'orange_money' | 'especes';
