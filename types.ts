
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
  specialty: string;
  status: 'Available' | 'Busy' | 'Leave';
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
  clientPhone?: string; // Added field
  location: string; 
  description: string;
  technicianId: string;
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

export interface TickerMessage {
  id: string;
  text: string;
  type: 'alert' | 'success' | 'info';
}