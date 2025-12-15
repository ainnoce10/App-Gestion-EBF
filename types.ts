

export enum Site {
  ABIDJAN = 'Abidjan',
  BOUAKE = 'Bouaké',
  GLOBAL = 'Global'
}

export enum Period {
  DAY = 'Jour',
  WEEK = 'Semaine',
  MONTH = 'Mois',
  YEAR = 'Année'
}

export type Role = 'Admin' | 'DG' | 'Technicien' | 'Secretaire' | 'Magasinier' | 'Visiteur';

export interface UserPermissions {
  technique?: boolean;
  comptabilite?: boolean;
  secretariat?: boolean;
  quincaillerie?: boolean;
  rh?: boolean;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  site: Site;
  phone?: string;
  photo_url?: string;
  date_hired?: string;
  permissions?: UserPermissions;
}

export interface Technician {
  id: string;
  name: string;
  specialty: string;
  status: 'Available' | 'Busy' | 'Off';
  site: Site;
}

export interface StatData {
  id: string;
  date: string;
  revenue: number;
  interventions: number;
  profit: number;
  expenses: number;
  site: Site;
}

export interface StockItem {
  id: string;
  name: string;
  quantity: number;
  threshold: number;
  unit: string;
  site: Site;
}

export interface Intervention {
  id: string;
  site: Site;
  client: string;
  clientPhone?: string;
  location: string; 
  description: string;
  technicianId: string;
  technicianName?: string; // Nom affiché venant du profil
  date: string;
  status: 'Pending' | 'In Progress' | 'Completed'; // Mapped to Planifié, En cours, Exécuté
}

export interface Chantier {
  id: string;
  name: string;
  client: string;
  location: string;
  status: 'En Cours' | 'Terminé' | 'En Attente';
  budget: number;
  site: Site;
  startDate: string;
}

export interface Material {
  id: string;
  name: string;
  serialNumber?: string;
  condition: 'Neuf' | 'Bon' | 'Usé' | 'Panne';
  assignedTo?: string; // Nom technicien
  site: Site;
}

export interface DailyReport {
  id: string;
  technicianName: string;
  date: string;
  content?: string; 
  method: 'Text' | 'Voice' | 'Form';
  site: Site;
  
  // Champs détaillés
  domain?: string;
  interventionType?: string;
  location?: string;
  expenses?: number;
  revenue?: number;
  clientName?: string;
  clientPhone?: string;
  audioUrl?: string;
  rating?: number; // Note de satisfaction client (1-5)
}

export interface Transaction {
  id: string;
  type: 'Recette' | 'Dépense';
  amount: number;
  label: string;
  category: string;
  date: string;
  site: Site;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  site: Site;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  category: string;
  site: Site;
}

export interface TickerMessage {
  id: string;
  text: string;
  type: 'alert' | 'success' | 'info';
  display_order: number;
  isManual?: boolean; // Pour distinguer les messages admin des messages auto
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string; // From DB
  type: 'alert' | 'success' | 'info';
  read: boolean;
  path?: string;
}