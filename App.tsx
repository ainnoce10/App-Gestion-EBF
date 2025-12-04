
import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  LayoutDashboard, Wrench, Briefcase, ShoppingCart, Menu, X, Bell, Search, Settings,
  HardHat, DollarSign, LogOut, Calculator, Users, Calendar, FolderOpen, Truck, 
  FileText, UserCheck, CreditCard, Archive, ShieldCheck, ClipboardList, ArrowLeft, ChevronRight, Mic, Send, Save, Plus, CheckCircle, Trash2, User, HelpCircle, Moon, Play, StopCircle, RefreshCw, FileInput, MapPin, Volume2, Megaphone, AlertCircle, Filter, TrendingUp, Edit, ArrowUp, ArrowDown, AlertTriangle
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { DetailedSynthesis } from './components/DetailedSynthesis';
import { MOCK_STATS, MOCK_TECHNICIANS, MOCK_STOCK, MOCK_INTERVENTIONS, MOCK_REPORTS, DEFAULT_TICKER_MESSAGES } from './constants';
import { Site, Period, TickerMessage } from './types';

// --- Types for Navigation & Forms ---
interface ModuleAction {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  path: string;
  color: string;
  managedBy?: string; // New field for "Géré par..."
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  description?: string;
  colorClass: string;
}

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'email';
  options?: string[];
  placeholder?: string;
}

interface FormConfig {
  title: string;
  fields: FormField[];
}

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'alert' | 'success' | 'info';
  read: boolean;
  path?: string; // Ajout du chemin de redirection
}

// --- Menu Configuration (Flat Sidebar) with Colors ---
const MAIN_MENU: MenuItem[] = [
  { id: 'accueil', label: 'Accueil', icon: LayoutDashboard, path: '/', description: 'Vue d\'ensemble', colorClass: 'text-orange-500' },
  { id: 'techniciens', label: 'Techniciens', icon: HardHat, path: '/techniciens', description: 'Gestion opérationnelle', colorClass: 'text-yellow-600' },
  { id: 'comptabilite', label: 'Comptabilité', icon: Calculator, path: '/comptabilite', description: 'Finance & RH', colorClass: 'text-green-600' },
  { id: 'secretariat', label: 'Secrétariat', icon: FolderOpen, path: '/secretariat', description: 'Administration', colorClass: 'text-blue-500' },
  { id: 'quincaillerie', label: 'Quincaillerie', icon: ShoppingCart, path: '/quincaillerie', description: 'Logistique & Stocks', colorClass: 'text-red-500' },
];

// --- Sub-Menu Configurations ---
const MODULE_ACTIONS: Record<string, ModuleAction[]> = {
  techniciens: [
    { 
      id: 'interventions', 
      label: 'Interventions', 
      description: 'Planning des interventions', 
      managedBy: 'Géré par le Superviseur',
      icon: Wrench, 
      path: '/techniciens/interventions', 
      color: 'bg-orange-500' 
    },
    { 
      id: 'rapports', 
      label: 'Rapports Journaliers', 
      description: 'Vocal ou Formulaire détaillé', 
      managedBy: 'Géré par les Techniciens',
      icon: FileText, 
      path: '/techniciens/rapports', 
      color: 'bg-indigo-600' 
    },
    { 
      id: 'materiel', 
      label: 'Matériel', 
      description: 'Inventaire & Affectation', 
      managedBy: 'Géré par le Magasinier',
      icon: Truck, 
      path: '/techniciens/materiel', 
      color: 'bg-blue-600' 
    },
    { 
      id: 'chantiers', 
      label: 'Chantiers', 
      description: 'Suivi & Exécution', 
      managedBy: 'Géré par le Chef de Chantier',
      icon: ShieldCheck, 
      path: '/techniciens/chantiers', 
      color: 'bg-green-600' 
    },
  ],
  comptabilite: [
    { id: 'bilan', label: 'Bilan Financier', description: 'Analyses des coûts et recettes', icon: DollarSign, path: '/comptabilite/bilan', color: 'bg-green-600' },
    { id: 'rh', label: 'Ressources Humaines', description: 'Dossiers du personnel', icon: Users, path: '/comptabilite/rh', color: 'bg-purple-600' },
    { id: 'paie', label: 'Paie & Salaires', description: 'Gestion des virements mensuels', icon: CreditCard, path: '/comptabilite/paie', color: 'bg-orange-500' },
  ],
  secretariat: [
    { id: 'planning', label: 'Planning', description: 'Agenda des équipes et rdv', icon: Calendar, path: '/secretariat/planning', color: 'bg-indigo-500' },
    { id: 'clients', label: 'Gestion Clients', description: 'Base de données CRM', icon: UserCheck, path: '/secretariat/clients', color: 'bg-blue-500' },
    { id: 'caisse', label: 'Caisse Menu', description: 'Suivi de la petite caisse', icon: Archive, path: '/secretariat/caisse', color: 'bg-gray-600' },
  ],
  quincaillerie: [
    { id: 'stocks', label: 'Stocks', description: 'État des stocks en temps réel', icon: ClipboardList, path: '/quincaillerie/stocks', color: 'bg-orange-600' },
    { id: 'fournisseurs', label: 'Fournisseurs', description: 'Liste et contacts partenaires', icon: Truck, path: '/quincaillerie/fournisseurs', color: 'bg-green-600' },
    { id: 'achats', label: 'Bons d\'achat', description: 'Historique des commandes', icon: FileText, path: '/quincaillerie/achats', color: 'bg-red-500' },
  ]
};

// --- Form Definitions ---
const FORM_CONFIGS: Record<string, FormConfig> = {
  '/techniciens/interventions': {
    title: 'Nouvelle Intervention',
    fields: [
      { name: 'site', label: 'Site', type: 'select', options: ['Abidjan', 'Bouaké'] },
      { name: 'client', label: 'Nom du Client', type: 'text', placeholder: 'Ex: Hôtel Ivoire' },
      { name: 'clientPhone', label: 'Numéro du Client', type: 'text', placeholder: 'Ex: 0707...' },
      { name: 'lieu', label: 'Lieu d\'intervention', type: 'text', placeholder: 'Ex: Cocody Riviera' },
      { name: 'description', label: 'Description', type: 'text', placeholder: 'Ex: Panne Clim R410' },
      { name: 'technician', label: 'Technicien', type: 'select', options: ['T1 - Kouamé', 'T2 - Diallo', 'T3 - Konan'] },
      { name: 'date', label: 'Date Prévue', type: 'date' },
      { name: 'status', label: 'Statut Initial', type: 'select', options: ['en cours', 'planifié', 'exécuté'] }
    ]
  },
  '/techniciens/materiel': {
    title: 'Ajouter Matériel',
    fields: [
      { name: 'nom', label: 'Nom de l\'outil', type: 'text', placeholder: 'Ex: Perceuse Percussion' },
      { name: 'marque', label: 'Marque', type: 'text', placeholder: 'Ex: Bosch' },
      { name: 'etat', label: 'État', type: 'select', options: ['Neuf', 'Bon', 'Usé', 'Hors Service'] },
      { name: 'detenteur', label: 'Détenteur Actuel', type: 'text' },
      { name: 'site', label: 'Site', type: 'select', options: ['Abidjan', 'Bouaké'] }
    ]
  },
  '/techniciens/chantiers': {
    title: 'Nouveau Chantier',
    fields: [
      { name: 'nom', label: 'Nom du Projet', type: 'text' },
      { name: 'lieu', label: 'Lieu', type: 'text' },
      { name: 'budget', label: 'Budget Estimé (FCFA)', type: 'number' },
      { name: 'etat', label: 'État Avancement', type: 'select', options: ['Démarrage', 'Gros Œuvre', 'Finition', 'Livré'] },
      { name: 'site', label: 'Site', type: 'select', options: ['Abidjan', 'Bouaké'] }
    ]
  },
  '/comptabilite/bilan': {
    title: 'Saisie Comptable',
    fields: [
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'type', label: 'Type', type: 'select', options: ['Recette', 'Dépense'] },
      { name: 'montant', label: 'Montant (FCFA)', type: 'number' },
      { name: 'libelle', label: 'Libellé / Motif', type: 'text' },
      { name: 'site', label: 'Site', type: 'select', options: ['Abidjan', 'Bouaké'] }
    ]
  },
  '/comptabilite/rh': {
    title: 'Nouveau Collaborateur',
    fields: [
      { name: 'name', label: 'Nom Complet', type: 'text' },
      { name: 'specialty', label: 'Spécialité', type: 'text', placeholder: 'Ex: Électricien' },
      { name: 'site', label: 'Site de rattachement', type: 'select', options: ['Abidjan', 'Bouaké'] },
      { name: 'status', label: 'Statut', type: 'select', options: ['Available', 'Congés'] }
    ]
  },
  '/comptabilite/paie': {
    title: 'Saisie Paie',
    fields: [
      { name: 'nom', label: 'Salarié', type: 'text' },
      { name: 'periode', label: 'Période', type: 'text', placeholder: 'Ex: Octobre 2023' },
      { name: 'base', label: 'Salaire Base', type: 'number' },
      { name: 'prime', label: 'Primes', type: 'number' },
      { name: 'net', label: 'Net à Payer', type: 'number' },
      { name: 'site', label: 'Site', type: 'select', options: ['Abidjan', 'Bouaké'] }
    ]
  },
  '/secretariat/clients': {
    title: 'Nouveau Client',
    fields: [
      { name: 'nom', label: 'Nom Client / Entreprise', type: 'text' },
      { name: 'tel', label: 'Téléphone', type: 'text' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'type', label: 'Type', type: 'select', options: ['Particulier', 'Entreprise', 'Administration'] },
      { name: 'site', label: 'Site', type: 'select', options: ['Abidjan', 'Bouaké'] }
    ]
  },
  '/secretariat/planning': {
    title: 'Ajout Planning',
    fields: [
      { name: 'titre', label: 'Titre Événement', type: 'text' },
      { name: 'date_debut', label: 'Début', type: 'date' },
      { name: 'date_fin', label: 'Fin', type: 'date' },
      { name: 'equipe', label: 'Équipe concernée', type: 'text' },
      { name: 'site', label: 'Site', type: 'select', options: ['Abidjan', 'Bouaké'] }
    ]
  },
  '/secretariat/caisse': {
    title: 'Mouvement Caisse',
    fields: [
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'motif', label: 'Motif', type: 'text' },
      { name: 'sens', label: 'Sens', type: 'select', options: ['Entrée', 'Sortie'] },
      { name: 'montant', label: 'Montant', type: 'number' },
      { name: 'site', label: 'Site', type: 'select', options: ['Abidjan', 'Bouaké'] }
    ]
  },
  '/quincaillerie/stocks': {
    title: 'Article Stock',
    fields: [
      { name: 'name', label: 'Nom Article', type: 'text' },
      { name: 'quantity', label: 'Quantité Initiale', type: 'number' },
      { name: 'unit', label: 'Unité', type: 'text', placeholder: 'm, kg, pcs...' },
      { name: 'threshold', label: 'Seuil Alerte', type: 'number' },
      { name: 'site', label: 'Site', type: 'select', options: ['Abidjan', 'Bouaké'] }
    ]
  },
  '/quincaillerie/fournisseurs': {
    title: 'Nouveau Fournisseur',
    fields: [
      { name: 'nom', label: 'Raison Sociale', type: 'text' },
      { name: 'contact', label: 'Contact', type: 'text' },
      { name: 'adresse', label: 'Adresse', type: 'text' },
      { name: 'specialite', label: 'Spécialité', type: 'text' },
      { name: 'site', label: 'Site', type: 'select', options: ['Abidjan', 'Bouaké'] }
    ]
  },
  '/quincaillerie/achats': {
    title: 'Bon d\'Achat',
    fields: [
      { name: 'date', label: 'Date Achat', type: 'date' },
      { name: 'fournisseur', label: 'Fournisseur', type: 'text' },
      { name: 'montant', label: 'Montant Total', type: 'number' },
      { name: 'statut', label: 'Statut Paiement', type: 'select', options: ['Payé', 'À crédit'] },
      { name: 'site', label: 'Site', type: 'select', options: ['Abidjan', 'Bouaké'] }
    ]
  }
};

// --- Helper: Date Filter ---
const isInPeriod = (dateStr: string, period: Period): boolean => {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (period === Period.DAY) {
    return itemDate.getTime() === today.getTime();
  } else if (period === Period.WEEK) {
    // Calculer le Lundi de cette semaine
    const day = today.getDay(); // 0 (Dim) - 6 (Sam)
    const diffToMonday = today.getDate() - day + (day === 0 ? -6 : 1); // Ajustement pour Lundi=1
    const monday = new Date(today);
    monday.setDate(diffToMonday);
    
    // Calculer le Vendredi de cette semaine
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    // Réinitialiser les heures pour comparaison stricte
    monday.setHours(0,0,0,0);
    friday.setHours(23,59,59,999);
    
    // Check if weekend (exclude Sat/Sun from data if business logic requires, but date check is enough)
    const itemDay = date.getDay();
    if (itemDay === 0 || itemDay === 6) return false;

    return itemDate >= monday && itemDate <= friday;
  } else if (period === Period.MONTH) {
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  } else if (period === Period.YEAR) {
    return date.getFullYear() === now.getFullYear();
  }
  return true;
};

// --- Mock Notifications ---
const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: '1', title: 'Stock Critique', message: 'Le câble 2.5mm est presque épuisé à Abidjan.', time: 'Il y a 10 min', type: 'alert', read: false, path: '/quincaillerie/stocks' },
  { id: '2', title: 'Paiement Reçu', message: 'Hôtel Ivoire a réglé la facture #4023.', time: 'Il y a 1h', type: 'success', read: false, path: '/secretariat/caisse' },
  { id: '3', title: 'Nouveau Rapport', message: 'Kouamé Jean a soumis son rapport journalier.', time: 'Il y a 2h', type: 'info', read: true, path: '/techniciens/rapports' },
];

// --- Confirmation Modal Component ---
const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onConfirm: () => void, 
  title: string, 
  message: string 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-green-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl w-full max-w-sm p-6 shadow-2xl animate-fade-in border border-red-100">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
            <AlertTriangle size={28} />
          </div>
          <h3 className="text-xl font-bold text-green-900 dark:text-white mb-2">{title}</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
          <div className="flex gap-4 w-full">
            <button 
              onClick={onClose} 
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-bold"
            >
              Annuler
            </button>
            <button 
              onClick={() => { onConfirm(); onClose(); }} 
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-bold shadow-md"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- EBF Logo Component ---
const EbfLogo = () => (
  <div className="flex items-center space-x-3">
    <div className="relative w-12 h-12 flex-shrink-0">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-800 to-green-900 shadow-md flex items-center justify-center overflow-hidden">
        <div className="w-full h-full opacity-30 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiBmaWxsPSJ3aGl0ZSI+PHBhdGggZD0iTTUwLDBhNTAsNTAsMCwxLDAsNTAsNTBNNTAsNWMtMTAuNSwwLTIwLjIsMy43LTI3LjksOS45Ii8+PC9zdmc+')]"></div>
      </div>
      <div className="absolute top-10 left-1/2 transform -translate-x-1/2 w-10 h-8 border-b-4 border-l-4 border-green-800 rounded-b-full rounded-l-full"></div>
      <div className="absolute top-2 -right-4 bg-gray-200 border border-gray-400 w-6 h-8 rounded flex justify-center items-center shadow-sm">
         <div className="w-1 h-3 bg-green-900 rounded-full"></div>
      </div>
    </div>
    <div className="h-12 w-1 bg-green-800 rounded-full"></div>
    <div className="flex flex-col">
       <div className="flex items-baseline space-x-1 text-4xl font-black tracking-tighter leading-none" style={{ fontFamily: 'Arial, sans-serif' }}>
         <span className="text-ebf-green">E</span>
         <span className="text-green-800">.</span>
         <span className="text-red-600">B</span>
         <span className="text-green-800">.</span>
         <span className="text-ebf-green">F</span>
       </div>
       <div className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wide mt-1 text-center shadow-sm">
         Electricité - Bâtiment - Froid
       </div>
    </div>
  </div>
);

// --- Component: Sidebar ---
const Sidebar = ({ isOpen, setIsOpen, currentPath, onNavigate }: { isOpen: boolean, setIsOpen: (v: boolean) => void, currentPath: string, onNavigate: (path: string) => void }) => {
  return (
    <>
      <div 
        className={`fixed inset-0 bg-green-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={() => setIsOpen(false)} 
      />
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-28 flex items-center justify-center border-b border-gray-100 dark:border-gray-800 relative bg-gradient-to-b from-white to-green-50 dark:from-gray-900 dark:to-gray-800">
           <div className="cursor-pointer transform hover:scale-105 transition duration-300" onClick={() => onNavigate('/')}>
              <EbfLogo />
           </div>
          <button onClick={() => setIsOpen(false)} className="absolute right-4 top-4 lg:hidden text-red-500 hover:text-red-700 transition">
            <X size={24} />
          </button>
        </div>
        <div className="absolute top-0 bottom-0 left-0 w-2 bg-gradient-to-b from-ebf-orange to-ebf-green"></div>
        <nav className="mt-6 px-4 pb-20 overflow-y-auto h-[calc(100vh-160px)] custom-scrollbar">
          <ul className="space-y-3">
            {MAIN_MENU.map((item) => {
              const Icon = item.icon;
              const isActive = item.path === '/' ? currentPath === '/' : currentPath.startsWith(item.path);
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      onNavigate(item.path);
                      if (window.innerWidth < 1024) setIsOpen(false);
                    }}
                    className={`w-full flex items-center space-x-4 px-4 py-4 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                      isActive 
                        ? 'bg-ebf-orange text-white shadow-lg shadow-orange-200' 
                        : 'bg-white dark:bg-gray-800 text-green-900 dark:text-gray-100 hover:bg-orange-50 dark:hover:bg-gray-700 border border-transparent hover:border-orange-100 dark:hover:border-gray-600'
                    }`}
                  >
                    <Icon size={22} className={`${isActive ? 'text-white' : item.colorClass} transition-colors`} />
                    <div className="flex flex-col items-start">
                      <span className={`font-bold text-base ${isActive ? 'text-white' : 'text-green-900 dark:text-gray-100'}`}>{item.label}</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 ml-2">
          <div className="flex items-center justify-between group cursor-pointer p-2 rounded-lg hover:bg-orange-50 dark:hover:bg-gray-800 transition border border-transparent hover:border-orange-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-ebf-green to-emerald-400 p-0.5">
                 <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                    <span className="font-bold text-ebf-green text-sm">JD</span>
                 </div>
              </div>
              <div>
                <p className="text-sm font-bold text-green-900 dark:text-gray-100">Jean Dupont</p>
                <p className="text-xs text-green-700 dark:text-gray-400">Administrateur</p>
              </div>
            </div>
            <LogOut size={18} className="text-gray-400 group-hover:text-red-500 transition" />
          </div>
        </div>
      </aside>
    </>
  );
};

// ... (VoiceReportRecorder, DetailedReportForm, ReportDetailModal, ReportModeSelector, DynamicModal components kept as is) ...
// --- Component: Flash Info Configuration Modal ---
const FlashInfoModal = ({ isOpen, onClose, messages, onUpdate }: { 
  isOpen: boolean, 
  onClose: () => void, 
  messages: TickerMessage[], 
  onUpdate: (msgs: TickerMessage[]) => void 
}) => {
  const [text, setText] = useState('');
  const [type, setType] = useState<'alert' | 'success' | 'info'>('info');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Local state for delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
        resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setText('');
    setType('info');
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (text.trim()) {
      if (editingId) {
        // Update existing message
        const updatedMessages = messages.map(msg => 
          msg.id === editingId ? { ...msg, text, type } : msg
        );
        onUpdate(updatedMessages);
      } else {
        // Add new message
        onUpdate([...messages, { id: Date.now().toString(), text, type }]);
      }
      resetForm();
    }
  };

  const handleEdit = (msg: TickerMessage) => {
    setText(msg.text);
    setType(msg.type);
    setEditingId(msg.id);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirmId(id);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmId) {
        onUpdate(messages.filter(m => m.id !== deleteConfirmId));
        if (editingId === deleteConfirmId) resetForm();
        setDeleteConfirmId(null);
    }
  };

  const moveMessage = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === messages.length - 1)) return;
    
    const newMessages = [...messages];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap
    [newMessages[index], newMessages[targetIndex]] = [newMessages[targetIndex], newMessages[index]];
    
    onUpdate(newMessages);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-green-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-fade-in flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-green-900 dark:text-white flex items-center gap-2"><Megaphone className="text-ebf-orange"/> Configurer Flash Info</h3>
          <button onClick={onClose} className="text-red-500 hover:text-red-700 transition"><X size={24}/></button>
        </div>

        <div className="flex gap-2 mb-6 items-end">
           <div className="flex-1 space-y-1">
             <label className="text-xs font-bold text-green-800 dark:text-white">Message</label>
             <input 
               type="text" 
               value={text}
               onChange={(e) => setText(e.target.value)}
               placeholder="Votre message..."
               className="w-full border border-orange-200 rounded-lg p-2 focus:ring-2 focus:ring-ebf-orange outline-none bg-white text-green-900 placeholder-green-300"
             />
           </div>
           <div className="space-y-1">
             <label className="text-xs font-bold text-green-800 dark:text-white">Type</label>
             <select 
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="border border-orange-200 rounded-lg p-2 bg-white text-green-900 outline-none h-[42px]"
             >
                <option value="info">Info</option>
                <option value="alert">Alerte</option>
                <option value="success">Succès</option>
             </select>
           </div>
           
           <div className="flex gap-1">
             {editingId && (
               <button onClick={resetForm} className="bg-gray-200 text-gray-600 p-2 rounded-lg hover:bg-gray-300 transition h-[42px]" title="Annuler">
                 <X size={20} />
               </button>
             )}
             <button onClick={handleSubmit} className={`${editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-ebf-orange hover:bg-orange-600'} text-white p-2 rounded-lg transition h-[42px] min-w-[42px] flex items-center justify-center`} title={editingId ? "Mettre à jour" : "Ajouter"}>
               {editingId ? <Save size={20} /> : <Plus size={20} />}
             </button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
           {messages.length === 0 ? <p className="text-gray-400 text-center italic">Aucun message configuré.</p> : (
             messages.map((msg, index) => (
               <div key={msg.id} className={`flex justify-between items-center p-3 rounded-lg border transition ${editingId === msg.id ? 'bg-orange-100 border-orange-300' : 'border-orange-100 dark:border-gray-700 hover:bg-orange-50 dark:hover:bg-gray-700'}`}>
                  <div className="flex items-center gap-3">
                     <span className={`w-3 h-3 rounded-full flex-shrink-0 ${
                       msg.type === 'alert' ? 'bg-red-500' : msg.type === 'success' ? 'bg-green-500' : 'bg-blue-400'
                     }`}></span>
                     <span className="text-sm font-medium text-green-800 dark:text-gray-100 line-clamp-2">{msg.text}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="flex flex-col mr-2 border-r border-gray-200 pr-2">
                       <button 
                         onClick={() => moveMessage(index, 'up')} 
                         disabled={index === 0}
                         className="text-gray-400 hover:text-blue-500 p-0.5 disabled:opacity-30 transition"
                       >
                         <ArrowUp size={14} />
                       </button>
                       <button 
                         onClick={() => moveMessage(index, 'down')} 
                         disabled={index === messages.length - 1}
                         className="text-gray-400 hover:text-blue-500 p-0.5 disabled:opacity-30 transition"
                       >
                         <ArrowDown size={14} />
                       </button>
                    </div>
                    <button onClick={() => handleEdit(msg)} className="text-gray-400 hover:text-blue-500 p-1">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDeleteClick(msg.id)} className="text-gray-400 hover:text-red-500 p-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
               </div>
             ))
           )}
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 text-right">
           <button onClick={onClose} className="px-4 py-2 bg-orange-50 hover:bg-orange-100 text-ebf-orange font-bold rounded-lg transition">Terminé</button>
        </div>
      </div>

      <ConfirmationModal 
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleConfirmDelete}
        title="Supprimer ce message ?"
        message="Cette action est irréversible. Le message sera retiré du bandeau défilant."
      />
    </div>
  );
};


// --- Component: Voice Report Recorder ---
const VoiceReportRecorder = ({ onBack, onSubmit }: { onBack: () => void, onSubmit: (report: any) => void }) => {
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'recorded'>('idle');
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (recordingState === 'recording') {
      timerRef.current = window.setInterval(() => setTimer(t => t + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [recordingState]);

  const handleStartRecording = () => {
    setRecordingState('recording');
    setTimer(0);
  };

  const handleStopRecording = () => {
    setRecordingState('recorded');
  };

  const handleReset = () => {
    setRecordingState('idle');
    setTimer(0);
  };

  const handleSubmit = () => {
    onSubmit({
      method: 'Voice',
      content: 'Rapport vocal enregistré (Simulation)',
      date: new Date().toISOString().split('T')[0],
      technicianName: 'Technicien Actuel'
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="animate-fade-in max-w-lg mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
       <div className="bg-indigo-600 p-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-1">Rapport Vocal</h2>
          <p className="text-indigo-200">Enregistrez votre journée</p>
       </div>
       
       <div className="p-8 flex flex-col items-center justify-center min-h-[300px]">
          
          {/* Visualization Circle */}
          <div className={`relative w-40 h-40 rounded-full flex items-center justify-center mb-8 transition-all duration-500 ${
            recordingState === 'recording' ? 'bg-red-50 shadow-2xl scale-110' : 
            recordingState === 'recorded' ? 'bg-green-50' : 'bg-gray-50 dark:bg-gray-700'
          }`}>
             {recordingState === 'recording' && (
               <div className="absolute inset-0 rounded-full border-4 border-red-500 opacity-20 animate-ping"></div>
             )}
             
             {recordingState === 'idle' && <Mic size={64} className="text-gray-400 dark:text-gray-300" />}
             {recordingState === 'recording' && <div className="text-4xl font-mono font-bold text-red-600">{formatTime(timer)}</div>}
             {recordingState === 'recorded' && <Play size={64} className="text-green-600 ml-2" />}
          </div>

          {/* Controls */}
          <div className="w-full flex justify-center gap-4">
             {recordingState === 'idle' && (
                <button onClick={handleStartRecording} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-4 text-xl font-bold shadow-lg transition transform hover:scale-105 flex items-center justify-center gap-3">
                   <Mic size={28} /> COMMENCER
                </button>
             )}

             {recordingState === 'recording' && (
                <button onClick={handleStopRecording} className="w-full bg-red-500 hover:bg-red-600 text-white rounded-xl py-4 text-xl font-bold shadow-lg animate-pulse flex items-center justify-center gap-3">
                   <StopCircle size={28} /> ARRÊTER
                </button>
             )}

             {recordingState === 'recorded' && (
                <div className="flex flex-col w-full gap-3">
                   <div className="flex gap-3">
                      <button onClick={handleReset} className="flex-1 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-xl py-4 font-bold flex items-center justify-center gap-2 border border-orange-200">
                         <RefreshCw size={20} /> Refaire
                      </button>
                      <button className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl py-4 font-bold flex items-center justify-center gap-2 border border-green-200">
                         <Play size={20} /> Écouter
                      </button>
                   </div>
                   <button onClick={handleSubmit} className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-4 text-xl font-bold shadow-lg flex items-center justify-center gap-3">
                      <Send size={28} /> ENVOYER
                   </button>
                </div>
             )}
          </div>
       </div>
       <div className="bg-gray-50 dark:bg-gray-900 p-4 border-t border-gray-100 dark:border-gray-700">
          <button onClick={onBack} className="w-full text-red-500 font-bold hover:text-red-700 transition">
             Annuler
          </button>
       </div>
    </div>
  );
};

// ... (DetailedReportForm)
const DetailedReportForm = ({ onBack, onSubmit }: { onBack: () => void, onSubmit: (report: any) => void }) => {
  const [domain, setDomain] = useState('');
  const [type, setType] = useState('');
  const [formData, setFormData] = useState({
    location: '',
    expenses: '',
    revenue: '',
    clientName: '',
    clientPhone: '',
    site: 'Abidjan'
  });

  const domains = ['Electricité', 'Bâtiment', 'Froid', 'Plomberie', 'Autres'];
  
  const typesMap: Record<string, string[]> = {
    'Electricité': ['Expertise', 'Rapport', 'Conception', 'Étude', 'Devis', 'Dépannages', 'Installation'],
    'Bâtiment': ['Expertise', 'Rapport', 'Conception', 'Étude', 'Devis', 'Implantation des chaises', 'Implantation des poteaux', 'Supervision'],
    'Froid': ['Expertise', 'Rapport', 'Conception', 'Étude', 'Devis', 'Dépannages', 'Installation', 'Entretien', 'Cuivrage'],
  };

  const handleDomainChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDomain(e.target.value);
    setType(''); // Reset type when domain changes
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      method: 'Form',
      technicianName: 'Technicien Connecté',
      date: new Date().toISOString().split('T')[0],
      domain,
      interventionType: type,
      ...formData,
      content: `Rapport détaillé: ${domain} - ${type}`
    });
  };

  const isManualType = !typesMap[domain];

  return (
    <div className="animate-fade-in max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="bg-orange-500 p-6 flex justify-between items-center text-white">
         <h2 className="text-xl font-bold flex items-center gap-2"><FileText /> Rapport Détaillé</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
        
        {/* Section A & B */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-green-900 dark:text-gray-100 mb-2">Domaine d'intervention</label>
            <select 
              required 
              value={domain} 
              onChange={handleDomainChange}
              className="w-full border-orange-200 rounded-lg p-3 border bg-white text-green-900 focus:ring-2 focus:ring-ebf-orange outline-none"
            >
              <option value="">Sélectionner...</option>
              {domains.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-green-900 dark:text-gray-100 mb-2">Type d'intervention</label>
            {isManualType ? (
               <input 
                 type="text" 
                 value={type} 
                 onChange={(e) => setType(e.target.value)}
                 disabled={!domain}
                 placeholder={domain ? "Saisir manuellement..." : "Choisir un domaine d'abord"}
                 className="w-full border-orange-200 rounded-lg p-3 border focus:ring-2 focus:ring-ebf-orange outline-none disabled:bg-gray-50 bg-white text-green-900 placeholder-green-300"
               />
            ) : (
              <select 
                required 
                value={type} 
                onChange={(e) => setType(e.target.value)}
                className="w-full border-orange-200 rounded-lg p-3 border bg-white text-green-900 focus:ring-2 focus:ring-ebf-orange outline-none"
              >
                <option value="">Sélectionner...</option>
                {typesMap[domain]?.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            )}
          </div>
        </div>

        {/* Section C */}
        <div>
           <label className="block text-sm font-bold text-green-900 dark:text-gray-100 mb-2">Lieu d'intervention</label>
           <input required name="location" onChange={handleChange} type="text" className="w-full border-orange-200 rounded-lg p-3 border focus:ring-2 focus:ring-ebf-orange outline-none bg-white text-green-900 placeholder-green-300" placeholder="Quartier, Ville, Repère..." />
        </div>

        {/* Section D & E */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-orange-50/20 dark:bg-gray-700 p-4 rounded-xl border border-orange-100 dark:border-gray-600">
           <div>
              <label className="block text-sm font-bold text-green-900 dark:text-gray-100 mb-2">Dépenses (FCFA)</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-green-400">💰</span>
                <input name="expenses" onChange={handleChange} type="number" className="w-full pl-10 border-orange-200 rounded-lg p-3 border focus:ring-2 focus:ring-red-500 outline-none bg-white text-green-900 placeholder-green-300" placeholder="0" />
              </div>
           </div>
           <div>
              <label className="block text-sm font-bold text-green-900 dark:text-gray-100 mb-2">Recettes (FCFA)</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-green-400">💵</span>
                <input name="revenue" onChange={handleChange} type="number" className="w-full pl-10 border-orange-200 rounded-lg p-3 border focus:ring-2 focus:ring-green-500 outline-none bg-white text-green-900 placeholder-green-300" placeholder="0" />
              </div>
           </div>
        </div>

        {/* Section F & G */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div>
              <label className="block text-sm font-bold text-green-900 dark:text-gray-100 mb-2">Nom du Client</label>
              <input required name="clientName" onChange={handleChange} type="text" className="w-full border-orange-200 rounded-lg p-3 border focus:ring-2 focus:ring-ebf-orange outline-none bg-white text-green-900 placeholder-green-300" />
           </div>
           <div>
              <label className="block text-sm font-bold text-green-900 dark:text-gray-100 mb-2">Numéro du Client</label>
              <input required name="clientPhone" onChange={handleChange} type="tel" className="w-full border-orange-200 rounded-lg p-3 border focus:ring-2 focus:ring-ebf-orange outline-none bg-white text-green-900 placeholder-green-300" />
           </div>
        </div>
        
        {/* Site - Hidden or Select */}
        <div>
            <label className="block text-sm font-bold text-green-900 dark:text-gray-100 mb-2">Site EBF</label>
            <select name="site" onChange={handleChange} className="w-full border-orange-200 rounded-lg p-3 border bg-white text-green-900 outline-none">
              <option value="Abidjan">Abidjan</option>
              <option value="Bouaké">Bouaké</option>
            </select>
        </div>

        <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
           <button type="button" onClick={onBack} className="flex-1 py-3 bg-white border border-red-200 text-red-600 rounded-lg font-bold hover:bg-red-50 transition">
             Annuler
           </button>
           <button type="submit" className="flex-1 py-3 bg-ebf-green text-white rounded-lg font-bold hover:bg-green-700 shadow-lg transition">
             Soumettre le rapport
           </button>
        </div>

      </form>
    </div>
  );
};

// ... (ReportModeSelector, DynamicModal, ReportDetailModal, ModuleMenu, ModulePlaceholder, Header, etc.)
// Re-including all necessary components to maintain file integrity.

const ReportModeSelector = ({ 
  onSelectMode, 
  onBack, 
  reports,
  onViewReport 
}: { 
  onSelectMode: (mode: 'voice' | 'form') => void, 
  onBack: () => void, 
  reports: any[],
  onViewReport: (report: any) => void
}) => {
  return (
    <div className="animate-fade-in max-w-5xl mx-auto pb-10">
      <div className="flex items-center space-x-4 mb-8">
        <button onClick={onBack} className="p-2 bg-orange-50 rounded-full shadow hover:bg-orange-100 transition border border-orange-200">
            <ArrowLeft className="text-ebf-orange" />
        </button>
        <h2 className="text-xl md:text-2xl font-bold text-green-900 dark:text-white">Choisissez le mode</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-8 md:mb-12">
         {/* Voice Mode Card */}
         <button 
           onClick={() => onSelectMode('voice')}
           className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-transparent hover:border-indigo-500 text-left h-56 md:h-80 flex flex-col justify-between"
         >
            <div className="absolute top-0 right-0 p-8 opacity-10 hidden md:block">
               <Mic size={120} className="text-indigo-600" />
            </div>
            <div className="p-6 md:p-8 relative z-10">
               <div className="w-14 h-14 md:w-20 md:h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-4 md:mb-6 text-indigo-600">
                  <Mic size={28} className="md:hidden" />
                  <Mic size={40} className="hidden md:block" />
               </div>
               <h3 className="text-xl md:text-2xl font-bold text-green-900 dark:text-white mb-1 md:mb-2 group-hover:text-indigo-600 transition">Rapport Vocal</h3>
               <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 font-medium">Pour les techniciens terrain.</p>
               <p className="text-xs md:text-sm text-indigo-500 mt-2 font-bold">Simple • Rapide • Sans écriture</p>
            </div>
            <div className="bg-indigo-50 p-3 md:p-4 flex items-center justify-between group-hover:bg-indigo-600 group-hover:text-white transition-colors">
               <span className="font-bold text-sm md:text-base">Commencer</span>
               <ChevronRight size={18} />
            </div>
         </button>

         {/* Form Mode Card */}
         <button 
           onClick={() => onSelectMode('form')}
           className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-transparent hover:border-orange-500 text-left h-56 md:h-80 flex flex-col justify-between"
         >
            <div className="absolute top-0 right-0 p-8 opacity-10 hidden md:block">
               <ClipboardList size={120} className="text-orange-600" />
            </div>
            <div className="p-6 md:p-8 relative z-10">
               <div className="w-14 h-14 md:w-20 md:h-20 bg-orange-100 rounded-full flex items-center justify-center mb-4 md:mb-6 text-orange-600">
                  <FileText size={28} className="md:hidden" />
                  <FileText size={40} className="hidden md:block" />
               </div>
               <h3 className="text-xl md:text-2xl font-bold text-green-900 dark:text-white mb-1 md:mb-2 group-hover:text-orange-600 transition">Rapport par Formulaire</h3>
               <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 font-medium">Saisie détaillée et administrative.</p>
               <p className="text-xs md:text-sm text-orange-500 mt-2 font-bold">Complet • Précis • Financier</p>
            </div>
            <div className="bg-orange-50 p-3 md:p-4 flex items-center justify-between group-hover:bg-orange-600 group-hover:text-white transition-colors">
               <span className="font-bold text-sm md:text-base">Remplir</span>
               <ChevronRight size={18} />
            </div>
         </button>
      </div>

      {/* --- New Section: Reports List --- */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-orange-100 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-orange-100 dark:border-gray-700 bg-orange-50/50 dark:bg-gray-700 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <FileText className="text-gray-500 dark:text-gray-300" size={20} />
              <h3 className="font-bold text-gray-700 dark:text-gray-200 text-lg">Historique</h3>
           </div>
           <span className="text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-600 px-2 py-1 rounded border border-orange-200 dark:border-gray-500">
             {reports.length} rapports
           </span>
        </div>
        <div className="overflow-x-auto">
           <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
             <thead className="bg-gray-50/50 dark:bg-gray-800">
               <tr>
                 <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                 <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                 <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Technicien</th>
                 <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Site</th>
                 <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contenu / Détail</th>
                 <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
               </tr>
             </thead>
             <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
               {reports.length > 0 ? reports.map((report) => (
                 <tr key={report.id} className="hover:bg-orange-50/30 dark:hover:bg-gray-700 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                       {report.method === 'Voice' ? (
                          <div className="flex items-center text-indigo-600 font-bold text-xs bg-indigo-50 px-2 py-1 rounded-full w-fit">
                             <Mic size={12} className="mr-1" /> Vocal
                          </div>
                       ) : (
                          <div className="flex items-center text-orange-600 font-bold text-xs bg-orange-50 px-2 py-1 rounded-full w-fit">
                             <FileText size={12} className="mr-1" /> Form
                          </div>
                       )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-900 dark:text-gray-200 font-medium">
                       {report.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-900 dark:text-gray-200">
                       {report.technicianName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                       <span className={`px-2 py-1 rounded-full text-xs font-bold ${report.site === 'Abidjan' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                          {report.site}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">
                       {report.method === 'Form' ? (
                         <span>{report.domain} - {report.interventionType}</span>
                       ) : (
                         <span className="italic text-gray-400">Audio enregistré...</span>
                       )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                       <button onClick={() => onViewReport(report)} className="text-ebf-green hover:text-white hover:bg-ebf-green transition font-bold text-xs border border-ebf-green px-3 py-1 rounded-md">
                         VOIR
                       </button>
                    </td>
                 </tr>
               )) : (
                 <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400 italic">
                       Aucun rapport disponible.
                    </td>
                 </tr>
               )}
             </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};


const DynamicModal = ({ 
  isOpen, 
  onClose, 
  config, 
  onSubmit 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  config: FormConfig | null, 
  onSubmit: (data: any) => void 
}) => {
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (isOpen) setFormData({});
  }, [isOpen]);

  if (!isOpen || !config) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (name: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-green-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg transform transition-all animate-fade-in flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-bold text-green-900 dark:text-white">{config.title}</h3>
          <button onClick={onClose} className="text-red-500 hover:text-red-700 transition">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <div className="space-y-4">
            {config.fields.map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-bold text-green-900 dark:text-gray-100 mb-2">{field.label}</label>
                {field.type === 'select' ? (
                  <select 
                    required
                    className="w-full border-orange-200 border rounded-lg p-3 bg-white text-green-900 focus:ring-2 focus:ring-ebf-orange focus:border-ebf-orange outline-none transition"
                    onChange={(e) => handleChange(field.name, e.target.value)}
                  >
                    <option value="">Sélectionner...</option>
                    {field.options?.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    required
                    type={field.type}
                    placeholder={field.placeholder}
                    className="w-full border-orange-200 border rounded-lg p-3 bg-white text-green-900 placeholder-green-300 focus:ring-2 focus:ring-ebf-orange outline-none transition"
                    onChange={(e) => handleChange(field.name, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-8 flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 border border-red-200 text-red-600 rounded-lg font-bold hover:bg-red-50 transition">
              Annuler
            </button>
            <button type="submit" className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-green-200 transition">
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ... ReportDetailModal ...
const ReportDetailModal = ({ isOpen, report, onClose }: { isOpen: boolean, report: any, onClose: () => void }) => {
  if (!isOpen || !report) return null;

  const isForm = report.method === 'Form';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-green-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl animate-fade-in overflow-hidden">
        
        {/* Header */}
        <div className={`p-6 flex justify-between items-center text-white ${isForm ? 'bg-orange-500' : 'bg-indigo-600'}`}>
           <div className="flex items-center gap-3">
              {isForm ? <FileText size={24} /> : <Mic size={24} />}
              <div>
                <h3 className="text-xl font-bold">Détail du Rapport</h3>
                <p className="text-xs opacity-80 uppercase tracking-wide">{isForm ? 'Rapport Formulaire' : 'Rapport Vocal'}</p>
              </div>
           </div>
           <button onClick={onClose} className="text-white/80 hover:text-white bg-white/10 rounded-full p-1"><X size={20}/></button>
        </div>

        {/* Content */}
        <div className="p-8">
           {/* Meta Data */}
           <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-300 font-bold text-lg">
                    {report.technicianName.charAt(0)}
                 </div>
                 <div>
                    <p className="font-bold text-green-900 dark:text-white">{report.technicianName}</p>
                    <p className="text-sm text-green-700 dark:text-gray-300">{report.date} • {report.site}</p>
                 </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${isForm ? 'bg-orange-100 text-orange-700' : 'bg-indigo-100 text-indigo-700'}`}>
                 {report.id}
              </div>
           </div>

           {isForm ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2 bg-gray-50 dark:bg-gray-700 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                   <h4 className="text-xs font-bold text-gray-500 dark:text-gray-300 uppercase mb-3">Intervention</h4>
                   <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600 dark:text-gray-300">Domaine:</span>
                      <span className="font-bold text-green-900 dark:text-white">{report.domain}</span>
                   </div>
                   <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600 dark:text-gray-300">Type:</span>
                      <span className="font-bold text-green-900 dark:text-white">{report.interventionType}</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-300">Lieu:</span>
                      <span className="font-bold text-green-900 dark:text-white">{report.location}</span>
                   </div>
                </div>

                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
                   <h4 className="text-xs font-bold text-red-500 uppercase mb-2">Dépenses</h4>
                   <p className="text-2xl font-bold text-red-700 dark:text-red-400">{parseInt(report.expenses || 0).toLocaleString()} FCFA</p>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-900/30">
                   <h4 className="text-xs font-bold text-green-500 uppercase mb-2">Recettes</h4>
                   <p className="text-2xl font-bold text-green-700 dark:text-green-400">{parseInt(report.revenue || 0).toLocaleString()} FCFA</p>
                </div>

                <div className="col-span-1 md:col-span-2">
                   <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Client</h4>
                   <div className="flex items-center gap-2 text-green-900 dark:text-white font-medium">
                      <UserCheck size={16} className="text-gray-400" /> 
                      {report.clientName} <span className="text-gray-300">|</span> {report.clientPhone}
                   </div>
                </div>
             </div>
           ) : (
             <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl flex flex-col items-center justify-center min-h-[200px] border border-gray-200 dark:border-gray-600">
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                   <Volume2 size={32} className="text-indigo-600" />
                </div>
                <p className="text-gray-500 italic mb-4">" {report.content} "</p>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                   <div className="w-1/3 h-full bg-indigo-500 rounded-full"></div>
                </div>
                <div className="flex justify-between w-full text-xs text-gray-400 mt-2">
                   <span>00:12</span>
                   <span>01:45</span>
                </div>
                <button className="mt-4 flex items-center gap-2 text-indigo-600 font-bold hover:underline">
                   <Play size={16} /> Écouter l'enregistrement
                </button>
             </div>
           )}

        </div>
        <div className="bg-gray-50 dark:bg-gray-900 p-4 flex justify-end">
           <button onClick={onClose} className="px-6 py-2 bg-white border border-red-200 rounded-lg text-red-600 font-bold hover:bg-red-50">Fermer</button>
        </div>
      </div>
    </div>
  );
};

// ... ModuleMenu ...
const ModuleMenu = ({ title, actions, onNavigate }: { title: string, actions: ModuleAction[], onNavigate: (path: string) => void }) => (
  <div className="animate-fade-in">
    <div className="mb-4 md:mb-8">
      <h2 className="text-2xl md:text-3xl font-bold text-green-900 dark:text-white">{title}</h2>
      <p className="text-green-700 dark:text-gray-300 mt-2 text-sm md:text-base">Sélectionnez une action pour commencer.</p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            onClick={() => onNavigate(action.path)}
            className={`group flex flex-col items-start p-4 md:p-6 ${action.color} rounded-xl shadow-lg border-2 border-transparent hover:scale-[1.02] transition-all duration-300 text-left relative overflow-hidden`}
          >
            {/* Background Icon Decoration */}
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Icon size={100} className="text-white" />
            </div>

            <div className="bg-white/20 p-3 rounded-lg text-white mb-3 backdrop-blur-sm shadow-sm">
              <Icon size={28} />
            </div>
            
            <h3 className="text-lg md:text-xl font-bold text-white mb-2 shadow-sm">
              {action.label}
            </h3>
            
            <p className="text-white/90 text-sm font-medium mb-4 leading-relaxed">
              {action.description}
            </p>

            {action.managedBy && (
              <div className="mt-auto bg-white px-3 py-1.5 rounded-full shadow-md">
                 <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">
                   {action.managedBy}
                 </span>
              </div>
            )}
            
            <div className="absolute bottom-4 right-4 text-white/50 group-hover:text-white transition-colors">
               <ChevronRight size={20} />
            </div>
          </button>
        );
      })}
    </div>
  </div>
);

// ... ModulePlaceholder ...
const ModulePlaceholder = ({ 
  title, 
  subtitle, 
  color, 
  items, 
  onBack,
  onAdd,
  onDelete // New Prop
}: { 
  title: string, 
  subtitle: string, 
  color: string, 
  items: any[],
  onBack: () => void,
  onAdd: () => void,
  onDelete: (item: any) => void
}) => {
  // Traduction des en-têtes de colonnes
  const COLUMN_LABELS: Record<string, string> = {
    site: 'Site',
    client: 'Client',
    clientPhone: 'Tél Client',
    location: 'Lieu',
    lieu: 'Lieu',
    description: 'Description',
    technicianId: 'Technicien',
    technician: 'Technicien',
    date: 'Date',
    status: 'Statut',
    name: 'Nom',
    nom: 'Nom',
    specialty: 'Spécialité',
    quantity: 'Quantité',
    threshold: 'Seuil',
    unit: 'Unité',
    montant: 'Montant',
    type: 'Type',
    libelle: 'Libellé',
    etat: 'État',
    budget: 'Budget',
    contact: 'Contact',
    adresse: 'Adresse',
    titre: 'Titre',
    equipe: 'Équipe'
  };

  const [localSite, setLocalSite] = useState<string>('All');
  const [localPeriod, setLocalPeriod] = useState<Period>(Period.MONTH);

  const filteredItems = items.filter(item => {
    // Site filter
    if (localSite !== 'All' && item.site && item.site !== localSite) return false;
    // Date filter (only if item has date)
    if (item.date && !isInPeriod(item.date, localPeriod)) return false;
    return true;
  });

  return (
    <div className="animate-fade-in space-y-4 md:space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center space-x-4 mb-2">
        <button 
          onClick={onBack}
          className="p-2 rounded-full bg-white dark:bg-gray-800 text-gray-500 hover:text-ebf-orange hover:bg-orange-50 transition shadow-sm border border-orange-100 dark:border-gray-700"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="h-6 w-px bg-gray-300 mx-2"></div>
        <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">Module</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-green-900 dark:text-white flex items-center gap-3">
            <span className={`w-3 h-6 md:h-8 rounded-full ${color}`}></span>
            {title}
          </h2>
          <p className="text-green-700 dark:text-gray-300 mt-1 ml-6 text-sm md:text-base">{subtitle}</p>
        </div>
        <button 
          onClick={onAdd}
          className="px-4 py-2 text-sm md:px-6 md:py-2.5 md:text-base text-white font-medium rounded-lg shadow-lg hover:opacity-90 transition transform hover:scale-105 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Plus size={18} />
          <span>Ajouter Nouveau</span>
        </button>
      </div>

      {/* Filters Bar for List */}
      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-gray-800 p-3 rounded-lg border border-orange-100 dark:border-gray-700 shadow-sm">
         <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <span className="text-sm font-bold text-gray-600 dark:text-gray-300">Filtres:</span>
         </div>
         <select value={localSite} onChange={(e) => setLocalSite(e.target.value)} className="bg-white border border-orange-200 rounded px-2 py-1 text-sm outline-none text-green-900">
            <option value="All">Tous Sites</option>
            <option value="Abidjan">Abidjan</option>
            <option value="Bouaké">Bouaké</option>
         </select>
         <select value={localPeriod} onChange={(e) => setLocalPeriod(e.target.value as Period)} className="bg-white border border-orange-200 rounded px-2 py-1 text-sm outline-none text-green-900">
            <option value={Period.DAY}>Aujourd'hui</option>
            <option value={Period.WEEK}>Semaine</option>
            <option value={Period.MONTH}>Mois</option>
            <option value={Period.YEAR}>Année</option>
         </select>
      </div>
      
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border-t-4 overflow-hidden`} style={{ borderColor: color.replace('bg-', '').replace('-500', '').replace('-600', '') }}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-orange-100 dark:divide-gray-700">
            <thead className="bg-orange-50 dark:bg-gray-700">
              <tr>
                {filteredItems.length > 0 ? Object.keys(filteredItems[0]).map((key) => (
                  key !== 'id' && key !== 'audioUrl' && (
                    <th key={key} className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {COLUMN_LABELS[key] || key}
                    </th>
                  )
                )) : (
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Données</th>
                )}
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
              {filteredItems.length > 0 ? filteredItems.map((item: any, idx) => (
                <tr key={idx} className="hover:bg-orange-50/20 dark:hover:bg-gray-700 transition duration-150 group">
                  {Object.entries(item).map(([key, val]: [string, any], i) => (
                    key !== 'id' && key !== 'audioUrl' && (
                      <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-green-900 dark:text-gray-200 font-medium">
                        {val}
                      </td>
                    )
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-blue-500 hover:text-blue-700 mr-3 transition bg-blue-50 px-3 py-1 rounded border border-blue-100 hover:border-blue-300">Éditer</button>
                    <button 
                      onClick={() => onDelete(item)}
                      className="text-red-500 hover:text-red-700 transition bg-red-50 px-3 py-1 rounded border border-red-100 hover:border-red-300"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={100} className="p-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-full mb-4">
                        <ClipboardList className="text-gray-400" size={32} />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 font-medium">Aucune donnée pour cette sélection.</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Essayez de changer les filtres ou ajoutez un élément.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {title === 'Stocks' && (
        <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-t-4 border-blue-500 border border-orange-100 dark:border-gray-700">
           <h3 className="text-lg font-bold text-green-900 dark:text-white mb-4 flex items-center gap-2">
             <TrendingUp size={20} className="text-blue-500" /> 
             Analyse des Stocks (Quantité vs Seuil)
           </h3>
           <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredItems} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 12}} />
                <YAxis />
                <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Legend />
                <Bar dataKey="quantity" name="En Stock" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={40} />
                <Bar dataKey="threshold" name="Seuil Critique" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
           </div>
        </div>
      )}
    </div>
  );
};

// ... (Header, ProfileModal, HelpModal, LoginScreen, AppContent, App - remain mostly unchanged, just ensuring full file is returned)

const Header = ({ 
  onMenuClick, title, onLogout, onOpenProfile, onOpenHelp, darkMode, onToggleTheme, onOpenFlashInfo, onNavigate
}: { 
  onMenuClick: () => void, 
  title: string,
  onLogout: () => void,
  onOpenProfile: () => void,
  onOpenHelp: () => void,
  darkMode: boolean,
  onToggleTheme: () => void,
  onOpenFlashInfo: () => void,
  onNavigate: (path: string) => void
}) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const notifRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({...n, read: true})));
  };

  const handleNotificationClick = (notif: Notification) => {
    if (notif.path) {
      onNavigate(notif.path);
      setIsNotifOpen(false);
      // Mark as read
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    }
  };

  return (
    <header className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-orange-100 dark:border-gray-800 h-16 md:h-20 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30 transition-all duration-300 shadow-sm">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="p-2 lg:hidden text-gray-600 hover:bg-orange-50 rounded-full transition">
          <Menu size={24} />
        </button>
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-green-900 dark:text-white tracking-tight flex items-center">
            <span className="w-2 h-6 bg-gradient-to-b from-ebf-orange to-ebf-green rounded-full mr-3 hidden md:block"></span>
            {title}
          </h2>
        </div>
      </div>
      
      <div className="flex-1 max-w-lg mx-4 hidden md:block">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-ebf-orange transition" size={18} />
          <input 
            type="text" 
            placeholder="Rechercher partout..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-orange-100 focus:border-ebf-orange/30 rounded-xl text-sm focus:ring-4 focus:ring-ebf-orange/10 outline-none transition-all duration-300 shadow-sm text-green-900 placeholder-green-300"
          />
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Notifications Button */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className={`relative p-2 md:p-2.5 rounded-full transition border ${isNotifOpen ? 'bg-orange-50 text-ebf-orange border-orange-100' : 'text-gray-500 hover:bg-orange-50 dark:hover:bg-gray-800 border-transparent hover:border-orange-100'}`}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse"></span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 top-full mt-3 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-fade-in z-50 origin-top-right">
               <div className="p-4 bg-orange-50 border-b border-orange-100 flex justify-between items-center">
                  <h3 className="font-bold text-gray-800">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-ebf-orange font-semibold hover:underline">
                      Tout marquer comme lu
                    </button>
                  )}
               </div>
               <div className="max-h-80 overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                      <Bell size={32} className="mx-auto mb-2 opacity-20" />
                      <p className="text-sm">Aucune nouvelle notification.</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {notifications.map(notif => (
                        <li 
                          key={notif.id} 
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-4 hover:bg-orange-50 transition relative group cursor-pointer ${!notif.read ? 'bg-orange-50/30' : ''}`}
                        >
                           <div className="flex gap-3">
                              <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${notif.type === 'alert' ? 'bg-red-500' : notif.type === 'success' ? 'bg-green-500' : 'bg-blue-400'}`} />
                              <div className="flex-1">
                                 <p className={`text-sm ${!notif.read ? 'font-bold text-gray-800' : 'font-medium text-gray-600'}`}>{notif.title}</p>
                                 <p className="text-xs text-gray-500 mt-1">{notif.message}</p>
                                 <p className="text-[10px] text-gray-400 mt-2">{notif.time}</p>
                              </div>
                              <button onClick={(e) => { e.stopPropagation(); clearNotification(notif.id); }} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition">
                                <X size={14} />
                              </button>
                           </div>
                        </li>
                      ))}
                    </ul>
                  )}
               </div>
               <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
                 <button className="text-xs font-bold text-gray-500 hover:text-gray-800">Voir tout l'historique</button>
               </div>
            </div>
          )}
        </div>

        {/* Settings Button */}
        <div className="relative" ref={settingsRef}>
          <button 
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`flex p-2 md:p-2.5 rounded-full transition border ${isSettingsOpen ? 'bg-green-50 text-ebf-green border-green-100' : 'text-gray-500 hover:bg-green-50 dark:hover:bg-gray-800 border-transparent hover:border-green-100'}`}
          >
            <Settings size={20} />
          </button>

          {/* Settings Dropdown */}
          {isSettingsOpen && (
             <div className="absolute right-0 top-full mt-3 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-fade-in z-50 origin-top-right">
                <div className="p-4 border-b border-gray-100">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-ebf-green flex items-center justify-center text-white font-bold">JD</div>
                      <div>
                        <p className="font-bold text-gray-800 text-sm">Jean Dupont</p>
                        <p className="text-xs text-gray-500">jean.d@ebf-ci.com</p>
                      </div>
                   </div>
                </div>
                <div className="p-2 space-y-1">
                   <button onClick={onOpenProfile} className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition">
                     <User size={16} /> <span>Mon Profil</span>
                   </button>
                   <button onClick={onOpenFlashInfo} className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition">
                     <Megaphone size={16} /> <span>Configurer Flash Info</span>
                   </button>
                   <button onClick={onToggleTheme} className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition">
                     <Moon size={16} /> <span>{darkMode ? 'Mode Clair' : 'Mode Sombre'}</span>
                   </button>
                   <button onClick={onOpenHelp} className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition">
                     <HelpCircle size={16} /> <span>Aide & Support</span>
                   </button>
                </div>
                <div className="p-2 border-t border-gray-100 bg-gray-50">
                   <button onClick={onLogout} className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm text-red-600 font-bold hover:bg-red-50 rounded-lg transition">
                     <LogOut size={16} /> <span>Se déconnecter</span>
                   </button>
                </div>
             </div>
           )}
        </div>
      </div>
    </header>
  );
};

const ProfileModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-green-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in">
        <h3 className="text-xl font-bold mb-4 text-green-900 dark:text-white">Mon Profil</h3>
        <div className="space-y-4">
           <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Nom</label><input type="text" defaultValue="Jean Dupont" className="w-full border-orange-200 border p-2 rounded focus:ring-ebf-orange focus:border-ebf-orange outline-none bg-white text-green-900" /></div>
           <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Email</label><input type="email" defaultValue="jean.d@ebf-ci.com" className="w-full border-orange-200 border p-2 rounded focus:ring-ebf-orange focus:border-ebf-orange outline-none bg-white text-green-900" /></div>
           <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Rôle</label><input type="text" disabled value="Administrateur" className="w-full border-orange-200 border p-2 rounded bg-orange-50 text-gray-500" /></div>
           <button onClick={onClose} className="w-full bg-ebf-green text-white font-bold py-2 rounded mt-2 hover:bg-green-700 transition">Enregistrer</button>
        </div>
        <button onClick={onClose} className="absolute top-4 right-4 text-red-500 hover:text-red-700"><X size={20}/></button>
      </div>
    </div>
  );
};

const HelpModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-green-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-900 dark:text-white"><HelpCircle className="text-ebf-orange"/> Aide & Support</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">Pour tout problème technique, veuillez contacter le service informatique :</p>
        <div className="bg-orange-50 dark:bg-gray-700 p-4 rounded-lg mb-4 space-y-2 border border-orange-100 dark:border-gray-600 text-green-900 dark:text-gray-200">
           <p className="flex items-center gap-2 text-sm"><strong>Email:</strong> support@ebf-ci.com</p>
           <p className="flex items-center gap-2 text-sm"><strong>Tél:</strong> +225 07 07 07 07</p>
        </div>
        <button onClick={onClose} className="w-full bg-white border border-red-200 text-red-600 font-bold py-2 rounded hover:bg-red-50 transition">Fermer</button>
      </div>
    </div>
  );
};

const LoginScreen = ({ onLogin }: { onLogin: () => void }) => (
  <div className="min-h-screen flex items-center justify-center bg-green-50/50 p-4">
     <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md text-center border-t-4 border-ebf-orange">
        <div className="flex justify-center mb-6 transform scale-125">
           <EbfLogo />
        </div>
        <h2 className="text-2xl font-bold text-green-900 mb-2">Bienvenue</h2>
        <p className="text-green-700 mb-8">Connectez-vous pour accéder à votre espace.</p>
        <div className="space-y-4 text-left">
           <div>
              <label className="block text-sm font-bold text-green-900 mb-1">Email</label>
              <input type="email" placeholder="utilisateur@ebf-ci.com" className="w-full border border-orange-200 p-3 rounded-lg focus:ring-2 focus:ring-ebf-orange outline-none bg-white text-green-900 placeholder-green-300" />
           </div>
           <div>
              <label className="block text-sm font-bold text-green-900 mb-1">Mot de passe</label>
              <input type="password" placeholder="••••••••" className="w-full border border-orange-200 p-3 rounded-lg focus:ring-2 focus:ring-ebf-orange outline-none bg-white text-green-900 placeholder-green-300" />
           </div>
           <button onClick={onLogin} className="w-full bg-gradient-to-r from-ebf-orange to-orange-600 text-white font-bold py-3 rounded-lg hover:shadow-lg transition transform hover:scale-105">
              Se Connecter
           </button>
        </div>
        <p className="mt-6 text-xs text-gray-400">© 2023 EBF Manager v1.0</p>
     </div>
  </div>
);

const AppContent = ({ onLogout }: { onLogout: () => void }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState('/');
  const [currentSite, setCurrentSite] = useState<Site>(Site.GLOBAL);
  const [currentPeriod, setCurrentPeriod] = useState<Period>(Period.MONTH);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<FormConfig | null>(null);
  const [showToast, setShowToast] = useState(false);
  
  // Settings States
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isFlashInfoOpen, setIsFlashInfoOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Data States
  const [interventions, setInterventions] = useState(MOCK_INTERVENTIONS);
  const [stock, setStock] = useState(MOCK_STOCK);
  const [technicians, setTechnicians] = useState(MOCK_TECHNICIANS);
  const [reports, setReports] = useState(MOCK_REPORTS);
  
  // Delete Confirmation State
  const [deleteModalConfig, setDeleteModalConfig] = useState<{isOpen: boolean, itemId: string | null, type: string | null}>({
    isOpen: false, itemId: null, type: null
  });
  
  // Persistence logic for Ticker Messages
  const [tickerMessages, setTickerMessages] = useState<TickerMessage[]>(() => {
    try {
      const saved = localStorage.getItem('ebf_ticker_messages');
      return saved ? JSON.parse(saved) : DEFAULT_TICKER_MESSAGES;
    } catch (error) {
      console.error("Failed to load ticker messages", error);
      return DEFAULT_TICKER_MESSAGES;
    }
  });

  useEffect(() => {
    localStorage.setItem('ebf_ticker_messages', JSON.stringify(tickerMessages));
  }, [tickerMessages]);

  const [reportMode, setReportMode] = useState<'select' | 'voice' | 'form'>('select');
  const [viewReport, setViewReport] = useState<any | null>(null);

  // Helpers
  const navigate = (path: string) => {
    setCurrentPath(path);
    setReportMode('select');
  };

  const handleAddClick = () => {
    if (FORM_CONFIGS[currentPath]) {
      setModalConfig(FORM_CONFIGS[currentPath]);
      setIsModalOpen(true);
    }
  };

  const handleFormSubmit = (data: any) => {
    setIsModalOpen(false);
    
    // Add to specific state based on path
    if (currentPath.includes('interventions')) setInterventions([...interventions, data]);
    else if (currentPath.includes('stocks')) setStock([...stock, data]);
    else if (currentPath.includes('rh')) setTechnicians([...technicians, data]);
    
    // Show Toast
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleReportSubmit = (reportData: any) => {
    setReports([
      { ...reportData, id: `R${reports.length + 1}` },
      ...reports
    ]);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    setReportMode('select');
  };

  // Generic Delete Handler for Lists
  const handleDeleteRequest = (item: any) => {
     let type = '';
     if (currentPath.includes('interventions')) type = 'intervention';
     else if (currentPath.includes('stocks')) type = 'stock';
     else if (currentPath.includes('rh')) type = 'technician';
     
     if (type) {
       setDeleteModalConfig({ isOpen: true, itemId: item.id, type });
     }
  };

  const confirmDelete = () => {
    const { itemId, type } = deleteModalConfig;
    if (!itemId || !type) return;

    if (type === 'intervention') {
      setInterventions(prev => prev.filter(i => i.id !== itemId));
    } else if (type === 'stock') {
      setStock(prev => prev.filter(s => s.id !== itemId));
    } else if (type === 'technician') {
      setTechnicians(prev => prev.filter(t => t.id !== itemId));
    }

    setDeleteModalConfig({ isOpen: false, itemId: null, type: null });
  };

  const renderContent = () => {
    // 1. Dashboard
    if (currentPath === '/') {
      return (
        <Dashboard 
          data={MOCK_STATS} 
          tickerMessages={tickerMessages}
          currentSite={currentSite} 
          currentPeriod={currentPeriod}
          onSiteChange={setCurrentSite}
          onPeriodChange={setCurrentPeriod}
          onNavigate={navigate}
        />
      );
    }

    // 2. Synthesis
    if (currentPath === '/synthesis') {
      return (
        <DetailedSynthesis 
          data={MOCK_STATS} 
          reports={reports}
          currentSite={currentSite} 
          currentPeriod={currentPeriod}
          onSiteChange={setCurrentSite}
          onPeriodChange={setCurrentPeriod}
          onNavigate={navigate}
          onViewReport={setViewReport}
        />
      );
    }

    // 3. Module Menus (Hubs)
    const moduleName = currentPath.split('/')[1];
    const isRootModule = currentPath === `/${moduleName}`;

    if (isRootModule && MODULE_ACTIONS[moduleName]) {
      const menuTitle = MAIN_MENU.find(m => m.id === moduleName)?.label || 'Module';
      return (
        <ModuleMenu 
          title={menuTitle} 
          actions={MODULE_ACTIONS[moduleName]} 
          onNavigate={navigate} 
        />
      );
    }

    // 4. Specific Pages
    
    // Special Case: Reports
    if (currentPath === '/techniciens/rapports') {
      if (reportMode === 'select') return <ReportModeSelector reports={reports} onSelectMode={setReportMode} onBack={() => navigate('/techniciens')} onViewReport={setViewReport} />;
      if (reportMode === 'voice') return <VoiceReportRecorder onBack={() => setReportMode('select')} onSubmit={handleReportSubmit} />;
      if (reportMode === 'form') return <DetailedReportForm onBack={() => setReportMode('select')} onSubmit={handleReportSubmit} />;
    }

    // Generic Lists
    let items: any[] = [];
    let title = 'Liste';
    let subtitle = 'Gestion des données';
    let color = 'bg-gray-500';

    if (currentPath === '/techniciens/interventions') {
      items = interventions; title = 'Interventions'; subtitle = 'Suivi des travaux'; color = 'bg-orange-500';
    } else if (currentPath === '/quincaillerie/stocks') {
      items = stock; title = 'Stocks'; subtitle = 'Inventaire matériel'; color = 'bg-blue-500';
    } else if (currentPath === '/comptabilite/rh') {
      items = technicians; title = 'Ressources Humaines'; subtitle = 'Personnel'; color = 'bg-purple-500';
    } else {
      // Default empty for unimplemented
      items = [];
    }

    return (
      <ModulePlaceholder 
        title={title} 
        subtitle={subtitle} 
        color={color} 
        items={items}
        onBack={() => navigate(`/${moduleName}`)}
        onAdd={handleAddClick}
        onDelete={handleDeleteRequest}
      />
    );
  };

  const getPageTitle = () => {
    if (currentPath === '/') return 'Tableau de Bord';
    if (currentPath === '/synthesis') return 'Synthèse Détaillée';
    const main = MAIN_MENU.find(m => m.path === `/${currentPath.split('/')[1]}`);
    if (!main) return 'EBF Manager';
    if (currentPath === main.path) return main.label;
    
    // Check submodules
    const subActions = Object.values(MODULE_ACTIONS).flat();
    const sub = subActions.find(a => a.path === currentPath);
    return sub ? `${main.label} > ${sub.label}` : main.label;
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900 text-white' : 'bg-gradient-to-br from-orange-50 via-white to-green-50'}`}>
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setSidebarOpen} 
        currentPath={currentPath} 
        onNavigate={navigate} 
      />
      
      <div className="lg:ml-72 min-h-screen flex flex-col transition-all duration-300">
        <Header 
          onMenuClick={() => setSidebarOpen(true)} 
          title={getPageTitle()}
          onLogout={onLogout}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenHelp={() => setIsHelpOpen(true)}
          darkMode={darkMode}
          onToggleTheme={() => setDarkMode(!darkMode)}
          onOpenFlashInfo={() => setIsFlashInfoOpen(true)}
          onNavigate={navigate}
        />
        
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
          {renderContent()}
        </main>
      </div>

      <DynamicModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        config={modalConfig} 
        onSubmit={handleFormSubmit} 
      />

      <ReportDetailModal 
        isOpen={!!viewReport} 
        report={viewReport} 
        onClose={() => setViewReport(null)} 
      />

      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <FlashInfoModal isOpen={isFlashInfoOpen} onClose={() => setIsFlashInfoOpen(false)} messages={tickerMessages} onUpdate={setTickerMessages} />

      <ConfirmationModal 
        isOpen={deleteModalConfig.isOpen}
        onClose={() => setDeleteModalConfig({...deleteModalConfig, isOpen: false})}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        message="Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible."
      />

      {showToast && (
        <div className="fixed bottom-6 right-6 bg-ebf-green text-white px-6 py-4 rounded-xl shadow-2xl animate-slide-in flex items-center gap-3 z-50">
          <CheckCircle size={24} />
          <div>
            <h4 className="font-bold">Succès !</h4>
            <p className="text-sm opacity-90">L'opération a été enregistrée.</p>
          </div>
        </div>
      )}
    </div>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;
  }

  return <AppContent onLogout={() => setIsAuthenticated(false)} />;
}

export default App;
