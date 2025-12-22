
import { Site, StatData, Technician, StockItem, Intervention, DailyReport, TickerMessage } from './types';

// Helper pour générer des dates dynamiques
const today = new Date();
const getDateStr = (daysOffset: number) => {
  const d = new Date();
  d.setDate(today.getDate() - daysOffset);
  return d.toISOString().split('T')[0];
};

export const MOCK_STATS: StatData[] = [
  { date: getDateStr(0), revenue: 150000, interventions: 5, profit: 45000, expenses: 105000, site: Site.ABIDJAN },
  { date: getDateStr(1), revenue: 200000, interventions: 8, profit: 60000, expenses: 140000, site: Site.ABIDJAN },
  { date: getDateStr(2), revenue: 120000, interventions: 4, profit: 30000, expenses: 90000, site: Site.ABIDJAN },
  { date: getDateStr(5), revenue: 300000, interventions: 10, profit: 100000, expenses: 200000, site: Site.ABIDJAN },
  { date: getDateStr(15), revenue: 450000, interventions: 12, profit: 150000, expenses: 300000, site: Site.ABIDJAN },
  { date: getDateStr(0), revenue: 80000, interventions: 3, profit: 20000, expenses: 60000, site: Site.BOUAKE },
  { date: getDateStr(1), revenue: 95000, interventions: 4, profit: 25000, expenses: 70000, site: Site.BOUAKE },
  { date: getDateStr(3), revenue: 110000, interventions: 5, profit: 35000, expenses: 75000, site: Site.BOUAKE },
  { date: getDateStr(6), revenue: 70000, interventions: 2, profit: 15000, expenses: 55000, site: Site.BOUAKE },
];

export const MOCK_TECHNICIANS: Technician[] = [
  { id: 'T1', name: 'Kouamé Jean', specialty: 'Électricité', status: 'Available', site: Site.ABIDJAN },
  { id: 'T2', name: 'Diallo Moussa', specialty: 'Plomberie', status: 'Busy', site: Site.ABIDJAN },
  { id: 'T3', name: 'Konan Yves', specialty: 'Froid', status: 'Available', site: Site.BOUAKE },
];

export const MOCK_STOCK: StockItem[] = [
  { 
    id: 'S1', 
    name: 'Câble TH 2.5mm² (100m)', 
    quantity: 500, 
    threshold: 100, 
    unit: 'rouleaux', 
    site: Site.ABIDJAN, 
    price: 32500, 
    category: 'Électricité',
    imageUrl: 'https://images.unsplash.com/photo-1558449028-b53a39d100fc?q=80&w=400&auto=format&fit=crop',
    description: 'Câble rigide pour installation domestique.',
    specsUrl: '#'
  },
  { 
    id: 'S2', 
    name: 'Disjoncteur différentiel 16A', 
    quantity: 45, 
    threshold: 50, 
    unit: 'pcs', 
    site: Site.ABIDJAN, 
    price: 12500, 
    category: 'Électricité',
    imageUrl: 'https://images.unsplash.com/photo-1621905231184-7a9494301647?q=80&w=400&auto=format&fit=crop',
    description: 'Protection contre les surcharges et court-circuits.',
    specsUrl: '#'
  },
  { 
    id: 'S3', 
    name: 'Tuyau PPR PN20 Ø32', 
    quantity: 20, 
    threshold: 30, 
    unit: 'barres', 
    site: Site.BOUAKE, 
    price: 8500, 
    category: 'Plomberie',
    imageUrl: 'https://images.unsplash.com/photo-1585333127302-d28989504838?q=80&w=400&auto=format&fit=crop',
    description: 'Tuyau haute pression pour eau chaude/froide.',
    specsUrl: '#'
  },
  { 
    id: 'S4', 
    name: 'Perceuse à percussion 750W', 
    quantity: 12, 
    threshold: 5, 
    unit: 'unités', 
    site: Site.ABIDJAN, 
    price: 45000, 
    category: 'Outillage',
    imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=400&auto=format&fit=crop',
    description: 'Usage intensif professionnel.',
    specsUrl: '#'
  },
  { 
    id: 'S5', 
    name: 'Climatiseur Split 1.5 CV', 
    quantity: 8, 
    threshold: 2, 
    unit: 'unités', 
    site: Site.ABIDJAN, 
    price: 185000, 
    category: 'Froid',
    imageUrl: 'https://images.unsplash.com/photo-1631541486061-f0941910a373?q=80&w=400&auto=format&fit=crop',
    description: 'Gaz R32, Éco-performance.',
    specsUrl: '#'
  }
];

export const MOCK_INTERVENTIONS: Intervention[] = [
  { 
    id: 'I1', 
    site: Site.ABIDJAN,
    client: 'Hôtel Ivoire', 
    clientPhone: '0707010203',
    location: 'Cocody Riviera',
    description: 'Maintenance clim', 
    technicianId: 'T1',
    date: getDateStr(0), 
    status: 'In Progress' 
  },
  { 
    id: 'I2', 
    site: Site.BOUAKE,
    client: 'Résidence Akwaba',
    clientPhone: '0505040506',
    location: 'Quartier Commerce',
    description: 'Fuite d\'eau', 
    technicianId: 'T3',
    date: getDateStr(2), 
    status: 'Pending'
  },
];

export const MOCK_REPORTS: DailyReport[] = [
  { 
    id: 'R1', technicianName: 'Kouamé Jean', date: getDateStr(0), method: 'Form', site: Site.ABIDJAN,
    content: 'Intervention difficile. Manque de gaz.',
    domain: 'Froid', interventionType: 'Dépannages', location: 'Hôtel Ivoire', expenses: 5000, revenue: 15000, clientName: 'M. Directeur', clientPhone: '0707070707'
  },
  { 
    id: 'R2', technicianName: 'Konan Yves', date: getDateStr(1), method: 'Voice', site: Site.BOUAKE,
    content: 'Installation terminée chez M. Touré. RAS. Tout fonctionne.', audioUrl: 'mock_audio.mp3'
  },
];

export const DEFAULT_TICKER_MESSAGES: TickerMessage[] = [
  { id: '1', text: 'Bienvenue sur EBF Manager v1.0', type: 'info', display_order: 1 },
  { id: '2', text: 'Félicitations ! Nous sommes à 30% de profits aujourd\'hui', type: 'success', display_order: 2 },
  { id: '3', text: 'Attention ! Stock de câble faible à Abidjan', type: 'alert', display_order: 3 },
  { id: '4', text: 'Réunion générale Lundi à 08h00', type: 'info', display_order: 4 },
];
