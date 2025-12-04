
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

export interface StatData {
  date: string;
  revenue: number;
  interventions: number;
  profit: number;
  expenses: number;
  site: Site;
}

export interface Technician {
  id: string;
  name: string;
  specialty: string; // Mapped from 'role'
  status: 'Available' | 'Busy' | 'Leave'; // Mocked or added to DB later
  site: Site;
  email?: string;
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
  technicianName?: string;
  date: string;
  status: 'Pending' | 'In Progress' | 'Completed';
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

export interface TickerMessage {
  id: string;
  text: string;
  type: 'alert' | 'success' | 'info';
}
