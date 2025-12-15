
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  LayoutDashboard, Wrench, Briefcase, ShoppingCart, Menu, X, Bell, Search, Settings,
  HardHat, DollarSign, LogOut, Calculator, Users, Calendar, FolderOpen, Truck, 
  FileText, UserCheck, CreditCard, Archive, ShieldCheck, ClipboardList, ArrowLeft, ChevronRight, Mic, Send, Save, Plus, CheckCircle, Trash2, User, HelpCircle, Moon, Play, StopCircle, RefreshCw, FileInput, MapPin, Volume2, Megaphone, AlertCircle, Filter, TrendingUp, Edit, ArrowUp, ArrowDown, AlertTriangle, Loader2, Mail, Lock, UserPlus, ScanFace, Fingerprint, Phone, CheckSquare, Key, MoveUp, MoveDown, Eye, EyeOff, Sparkles, Target, RefreshCcw, Shield
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { DetailedSynthesis } from './components/DetailedSynthesis';
import { 
  Site, Period, TickerMessage, StatData, DailyReport, Intervention, StockItem, 
  Transaction, Profile, Role, Notification, Technician, Client, Supplier, Chantier, Material 
} from './types';
import { 
  MOCK_STATS, MOCK_REPORTS, MOCK_TECHNICIANS, MOCK_STOCK, MOCK_INTERVENTIONS, 
  DEFAULT_TICKER_MESSAGES, MOCK_TRANSACTIONS, MOCK_CLIENTS, MOCK_SUPPLIERS, 
  MOCK_CHANTIERS, MOCK_MATERIALS 
} from './constants';
import { supabase } from './services/supabaseClient';

// --- Types for Navigation & Forms ---
interface ModuleAction {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  path: string;
  color: string;
  managedBy?: string;
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

// --- CONFIGURATION DES FORMULAIRES (CRUD) ---
const FORM_CONFIGS: Record<string, FormConfig> = {
  interventions: {
    title: 'Nouvelle Intervention',
    fields: [
      { name: 'client', label: 'Client', type: 'text' },
      { name: 'clientPhone', label: 'Tél Client', type: 'text' },
      { name: 'location', label: 'Lieu / Quartier', type: 'text' },
      { name: 'description', label: 'Description Panne', type: 'text' },
      { name: 'technicianId', label: 'ID Technicien (ex: T1)', type: 'text' },
      { name: 'date', label: 'Date Prévue', type: 'date' },
      { name: 'status', label: 'Statut', type: 'select', options: ['Pending', 'In Progress', 'Completed'] }
    ]
  },
  stocks: {
    title: 'Ajouter au Stock',
    fields: [
      { name: 'name', label: 'Nom Article', type: 'text' },
      { name: 'quantity', label: 'Quantité', type: 'number' },
      { name: 'unit', label: 'Unité (ex: pcs, m)', type: 'text' },
      { name: 'threshold', label: 'Seuil Alerte', type: 'number' },
      { name: 'site', label: 'Site', type: 'select', options: ['Abidjan', 'Bouaké'] }
    ]
  },
  technicians: {
     title: 'Nouveau Membre Équipe',
     fields: [
       { name: 'name', label: 'Nom & Prénom', type: 'text' },
       { name: 'specialty', label: 'Rôle / Spécialité', type: 'text' },
       { name: 'site', label: 'Site', type: 'select', options: ['Abidjan', 'Bouaké'] },
       { name: 'status', label: 'Statut', type: 'select', options: ['Available', 'Busy', 'Off'] }
     ]
  },
  reports: {
    title: 'Nouveau Rapport (Formulaire)',
    fields: [
      { name: 'technicianName', label: 'Nom Technicien', type: 'text' },
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'content', label: 'Détails Intervention', type: 'text' },
      { name: 'domain', label: 'Domaine', type: 'select', options: ['Electricité', 'Froid', 'Bâtiment', 'Plomberie'] },
      { name: 'revenue', label: 'Recette (FCFA)', type: 'number' },
      { name: 'expenses', label: 'Dépenses (FCFA)', type: 'number' },
      { name: 'rating', label: 'Note Satisfaction (1-5)', type: 'number' },
      { name: 'method', label: 'Méthode', type: 'select', options: ['Form'] } // Hidden or fixed normally
    ]
  },
  // --- NOUVELLES CONFIGURATIONS ---
  chantiers: {
    title: 'Nouveau Chantier',
    fields: [
      { name: 'name', label: 'Nom du Chantier', type: 'text' },
      { name: 'location', label: 'Lieu', type: 'text' },
      { name: 'client', label: 'Client', type: 'text' },
      { name: 'site', label: 'Site (Ville)', type: 'select', options: ['Abidjan', 'Bouaké'] },
      { name: 'status', label: 'État', type: 'select', options: ['En cours', 'Terminé', 'Suspendu'] },
      { name: 'date', label: 'Date de début', type: 'date' }
    ]
  },
  transactions: {
    title: 'Écriture Comptable',
    fields: [
      { name: 'label', label: 'Libellé', type: 'text' },
      { name: 'amount', label: 'Montant (FCFA)', type: 'number' },
      { name: 'type', label: 'Type', type: 'select', options: ['Recette', 'Dépense'] },
      { name: 'category', label: 'Catégorie', type: 'select', options: ['Vente', 'Achat', 'Salaire', 'Loyer', 'Autre'] },
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'site', label: 'Site', type: 'select', options: ['Abidjan', 'Bouaké'] }
    ]
  },
  employees: {
    title: 'Dossier RH',
    fields: [
      { name: 'full_name', label: 'Nom Complet', type: 'text' },
      { name: 'role', label: 'Poste', type: 'text' },
      { name: 'phone', label: 'Téléphone', type: 'text' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'site', label: 'Site', type: 'select', options: ['Abidjan', 'Bouaké'] },
      { name: 'salary', label: 'Salaire Base (FCFA)', type: 'number' },
      { name: 'date_hired', label: 'Date Embauche', type: 'date' }
    ]
  },
  payrolls: {
    title: 'Bulletin de Paie',
    fields: [
      { name: 'employee_name', label: 'Employé', type: 'text' },
      { name: 'amount', label: 'Montant Net (FCFA)', type: 'number' },
      { name: 'period', label: 'Mois concerné', type: 'text', placeholder: 'Ex: Mars 2024' },
      { name: 'date', label: 'Date paiement', type: 'date' },
      { name: 'status', label: 'Statut', type: 'select', options: ['Payé', 'En attente'] }
    ]
  },
  clients: {
    title: 'Nouveau Client',
    fields: [
      { name: 'name', label: 'Nom Client / Entreprise', type: 'text' },
      { name: 'phone', label: 'Téléphone', type: 'text' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'address', label: 'Adresse', type: 'text' },
      { name: 'site', label: 'Ville', type: 'select', options: ['Abidjan', 'Bouaké'] },
      { name: 'type', label: 'Type', type: 'select', options: ['Particulier', 'Entreprise'] }
    ]
  },
  caisse: {
    title: 'Mouvement Caisse',
    fields: [
      { name: 'label', label: 'Motif', type: 'text' },
      { name: 'amount', label: 'Montant (FCFA)', type: 'number' },
      { name: 'type', label: 'Flux', type: 'select', options: ['Entrée', 'Sortie'] },
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'operator', label: 'Opérateur', type: 'text' }
    ]
  },
  suppliers: {
    title: 'Nouveau Fournisseur',
    fields: [
      { name: 'name', label: 'Nom Entreprise', type: 'text' },
      { name: 'contact', label: 'Contact Principal', type: 'text' },
      { name: 'phone', label: 'Téléphone', type: 'text' },
      { name: 'category', label: 'Spécialité', type: 'select', options: ['Électricité', 'Plomberie', 'Froid', 'Matériaux', 'Divers'] },
      { name: 'site', label: 'Zone', type: 'select', options: ['Abidjan', 'Bouaké', 'National'] }
    ]
  },
  purchases: {
    title: 'Bon d\'Achat',
    fields: [
      { name: 'item_name', label: 'Article / Service', type: 'text' },
      { name: 'supplier', label: 'Fournisseur', type: 'text' },
      { name: 'quantity', label: 'Quantité', type: 'number' },
      { name: 'cost', label: 'Coût Total (FCFA)', type: 'number' },
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'status', label: 'Statut', type: 'select', options: ['Commandé', 'Reçu', 'Annulé'] }
    ]
  }
};

// --- Menu Configuration ---
const MAIN_MENU: MenuItem[] = [
  { id: 'accueil', label: 'Accueil', icon: LayoutDashboard, path: '/', description: 'Vue d\'ensemble', colorClass: 'text-orange-500' },
  { id: 'techniciens', label: 'Techniciens', icon: HardHat, path: '/techniciens', description: 'Gestion opérationnelle', colorClass: 'text-gray-600' },
  { id: 'comptabilite', label: 'Comptabilité', icon: Calculator, path: '/comptabilite', description: 'Finance & RH', colorClass: 'text-gray-600' },
  { id: 'secretariat', label: 'Secrétariat', icon: FolderOpen, path: '/secretariat', description: 'Administration', colorClass: 'text-gray-600' },
  { id: 'quincaillerie', label: 'Quincaillerie', icon: ShoppingCart, path: '/quincaillerie', description: 'Logistique & Stocks', colorClass: 'text-gray-600' },
  { id: 'equipe', label: 'Notre Équipe', icon: Users, path: '/equipe', description: 'Membres & Rôles', colorClass: 'text-gray-600' },
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
      color: 'bg-gray-700' 
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
    { id: 'bilan', label: 'Bilan Financier', description: 'Journal des transactions', icon: DollarSign, path: '/comptabilite/bilan', color: 'bg-green-600' },
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

// --- Helper: Date Filter ---
const isInPeriod = (dateStr: string, period: Period): boolean => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (period === Period.DAY) {
    return itemDate.getTime() === today.getTime();
  } else if (period === Period.WEEK) {
    const day = today.getDay();
    const diffToMonday = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today);
    monday.setDate(diffToMonday);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    monday.setHours(0,0,0,0);
    friday.setHours(23,59,59,999);
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

// --- Helper: Permission Check (STRICT) ---
const getPermission = (path: string, role: Role): { canWrite: boolean } => {
  // RESTRICTIONS LEVÉES : Tout le monde a les droits d'écriture partout
  return { canWrite: true };
};

// --- Admin Panel Modal ---
const AdminPanelModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) fetchUsers();
  }, [isOpen]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('full_name');
    if (data) setUsers(data);
    setLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: Role) => {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    if (!error) {
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } else {
      alert("Erreur lors de la mise à jour du rôle.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-green-900/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-xl w-full max-w-2xl p-6 shadow-2xl animate-fade-in flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-green-900 dark:text-white flex items-center gap-2">
            <Shield className="text-ebf-orange" /> Administration & Droits
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500"><X /></button>
        </div>
        
        <div className="overflow-y-auto custom-scrollbar flex-1">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
              <tr>
                <th className="p-3 text-left text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Utilisateur</th>
                <th className="p-3 text-left text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Email / Tél</th>
                <th className="p-3 text-left text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Rôle (Accès)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan={3} className="p-4 text-center"><Loader2 className="animate-spin mx-auto text-ebf-green"/></td></tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className="hover:bg-orange-50 dark:hover:bg-gray-800">
                    <td className="p-3">
                      <div className="font-bold text-green-900 dark:text-white">{user.full_name || 'Sans nom'}</div>
                      <div className="text-xs text-gray-400">{user.site}</div>
                    </td>
                    <td className="p-3 text-sm text-gray-600 dark:text-gray-300">{user.email || user.phone}</td>
                    <td className="p-3">
                      <select 
                        value={user.role} 
                        onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                        className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-sm font-bold text-green-900 dark:text-white focus:border-ebf-orange outline-none"
                      >
                        <option value="Visiteur">Visiteur</option>
                        <option value="Technicien">Technicien</option>
                        <option value="Secretaire">Secretaire</option>
                        <option value="Magasinier">Magasinier</option>
                        <option value="Admin">Administrateur</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400">
          * Les modifications de rôle sont immédiates.
        </div>
      </div>
    </div>
  );
};

// --- EBF Vector Logo (Globe + Plug) ---
const EbfSvgLogo = ({ size }: { size: 'small' | 'normal' | 'large' }) => {
    // Scaling factor
    const scale = size === 'small' ? 0.6 : size === 'large' ? 1.5 : 1;
    const width = 200 * scale;
    const height = 100 * scale;
    
    return (
        <svg width={width} height={height} viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="globeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor:'#3b82f6', stopOpacity:1}} />
                    <stop offset="100%" style={{stopColor:'#16a34a', stopOpacity:1}} />
                </linearGradient>
            </defs>
            {/* Globe */}
            <circle cx="40" cy="40" r="30" fill="url(#globeGrad)" />
            {/* Continents (Stylized) */}
            <path d="M25,30 Q35,20 45,30 T55,45 T40,60 T25,45" fill="#4ade80" opacity="0.8"/>
            <path d="M50,20 Q60,15 65,25" fill="none" stroke="#a3e635" strokeWidth="2"/>
            
            {/* Cord */}
            <path d="M40,70 C40,90 80,90 80,50 L80,40" fill="none" stroke="black" strokeWidth="4" strokeLinecap="round"/>
            
            {/* Plug - SQUARE (rx=0) */}
            <rect x="70" y="20" width="20" height="25" rx="0" fill="#e5e5e5" stroke="#9ca3af" strokeWidth="2" />
            <path d="M75,20 L75,10 M85,20 L85,10" stroke="#374151" strokeWidth="3" />
            
            {/* Cord Line */}
            <line x1="100" y1="10" x2="100" y2="80" stroke="black" strokeWidth="3" />
            
            {/* E.B.F Letters */}
            <text x="110" y="55" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="40" fill="#008000">E</text>
            <text x="135" y="55" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="40" fill="#000">.</text>
            <text x="145" y="55" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="40" fill="#FF0000">B</text>
            <text x="170" y="55" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="40" fill="#000">.</text>
            <text x="180" y="55" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="40" fill="#008000">F</text>
            
            {/* Banner Text */}
            <rect x="110" y="70" width="90" height="15" fill="#FF0000" />
            <text x="155" y="81" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="7" fill="white" textAnchor="middle">
                Electricité - Bâtiment - Froid
            </text>
        </svg>
    );
};

const EbfLogo = ({ size = 'normal' }: { size?: 'small' | 'normal' | 'large' }) => {
  const [imgError, setImgError] = useState(false);
  
  // Fallback to SVG if image fails
  if (imgError) {
      return <EbfSvgLogo size={size} />;
  }

  return (
    <div className="flex items-center justify-center">
        <img 
            src="/logo.png" 
            alt="EBF Logo" 
            className={`${size === 'small' ? 'h-10' : size === 'large' ? 'h-32' : 'h-16'} w-auto object-contain transition-transform duration-300 hover:scale-105`}
            onError={() => setImgError(true)} 
        />
    </div>
  );
};

// --- Module Placeholder (Generic List View) ---
const ModulePlaceholder = ({ title, subtitle, items = [], onBack, color, currentSite, currentPeriod, onAdd, onDelete, readOnly }: any) => {
    // Basic filtering based on Site and Date if available in items
    const filteredItems = items.filter((item: any) => {
        // Site filter
        if (currentSite && item.site && currentSite !== Site.GLOBAL && item.site !== currentSite) return false;
        // Period filter (only if item has a date)
        if (currentPeriod && item.date && !isInPeriod(item.date, currentPeriod)) return false;
        return true;
    });

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 bg-white rounded-full hover:bg-orange-50 shadow-sm transition border border-gray-100"><ArrowLeft size={20} className="text-gray-600 hover:text-ebf-orange"/></button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            {title}
                            {readOnly && <span className="flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded border border-gray-200 ml-2"><Lock size={12}/> Lecture Seule</span>}
                        </h2>
                        <p className="text-gray-500">{subtitle}</p>
                    </div>
                </div>
                {!readOnly && onAdd && (
                    <button onClick={onAdd} className={`${color} text-white px-4 py-2 rounded-lg font-bold shadow-md hover:opacity-90 transition flex items-center gap-2 transform hover:-translate-y-0.5`}>
                        <Plus size={18}/> Ajouter
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border-b border-gray-100 dark:border-gray-600">
                            <tr>
                                <th className="p-4 text-left text-xs font-bold uppercase text-gray-500 dark:text-gray-300">ID</th>
                                <th className="p-4 text-left text-xs font-bold uppercase text-gray-500 dark:text-gray-300">Nom / Libellé</th>
                                <th className="p-4 text-left text-xs font-bold uppercase text-gray-500 dark:text-gray-300">Détails</th>
                                <th className="p-4 text-left text-xs font-bold uppercase text-gray-500 dark:text-gray-300">Site</th>
                                <th className="p-4 text-left text-xs font-bold uppercase text-gray-500 dark:text-gray-300">Statut / Montant</th>
                                {!readOnly && onDelete && <th className="p-4 text-right text-xs font-bold uppercase text-gray-500 dark:text-gray-300">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {filteredItems.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-400">Aucune donnée trouvée.</td></tr>
                            ) : (
                                filteredItems.map((item: any) => (
                                    <tr key={item.id} className="hover:bg-orange-50/30 dark:hover:bg-gray-750 transition">
                                        <td className="p-4 text-sm font-mono text-gray-400">#{item.id.substring(0, 4)}</td>
                                        <td className="p-4">
                                            <p className="font-bold text-gray-800 dark:text-white">
                                                {item.name || item.client || item.full_name || item.label || item.item_name || item.employee_name || 'Sans Nom'}
                                            </p>
                                            {item.clientPhone && <p className="text-xs text-gray-500">{item.clientPhone}</p>}
                                            {item.role && <p className="text-xs text-gray-500">{item.role}</p>}
                                        </td>
                                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                                            {item.description || item.specialty || item.unit || item.category || item.supplier || '-'}
                                            {item.date && <span className="block text-xs text-gray-400">{item.date}</span>}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${item.site === 'Abidjan' ? 'bg-orange-100 text-orange-700 border border-orange-200' : item.site === 'Bouaké' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600'}`}>
                                                {item.site || 'Global'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {item.amount !== undefined || item.cost !== undefined || item.salary !== undefined ? (
                                                 <span className={`font-bold font-mono ${(item.type === 'Dépense' || item.type === 'Sortie') ? 'text-red-600' : 'text-green-700'}`}>
                                                    {(item.amount || item.cost || item.salary).toLocaleString()} F
                                                 </span>
                                            ) : item.status ? (
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${item.status === 'Available' || item.status === 'Completed' || item.status === 'Payé' || item.status === 'Terminé' ? 'bg-green-100 text-green-700' : item.status === 'Busy' || item.status === 'In Progress' || item.status === 'En cours' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {item.status}
                                                </span>
                                            ) : (
                                                <span className={`font-bold ${item.quantity <= (item.threshold || 0) ? 'text-red-500' : 'text-gray-800'}`}>
                                                    {item.quantity} {item.unit}
                                                </span>
                                            )}
                                        </td>
                                        {!readOnly && onDelete && (
                                            <td className="p-4 text-right">
                                                <button onClick={() => onDelete(item)} className="p-2 text-red-500 hover:bg-red-50 rounded transition"><Trash2 size={16}/></button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// --- Report Mode Selector ---
const ReportModeSelector = ({ reports, onSelectMode, onBack, onViewReport, readOnly }: any) => {
    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="p-2 bg-white rounded-full hover:bg-orange-50 shadow-sm transition border border-gray-100"><ArrowLeft size={20} className="text-gray-600 hover:text-ebf-orange"/></button>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    Rapports Journaliers
                    {readOnly && <span className="flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded border border-gray-200 ml-2"><Lock size={12}/> Lecture Seule</span>}
                </h2>
            </div>

            {!readOnly ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button onClick={() => onSelectMode('voice')} className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-8 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition flex flex-col items-center text-center group border border-blue-400 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><Mic size={100} /></div>
                        <div className="bg-white/20 p-4 rounded-full mb-4 group-hover:bg-white/30 transition backdrop-blur-sm"><Mic size={40} /></div>
                        <h3 className="text-2xl font-bold mb-2">Rapport Vocal</h3>
                        <p className="text-blue-100">Dictez votre rapport, l'IA le rédige pour vous.</p>
                    </button>
                    <button onClick={() => onSelectMode('form')} className="bg-gradient-to-br from-ebf-orange to-orange-600 text-white p-8 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition flex flex-col items-center text-center group border border-orange-400 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><FileText size={100} /></div>
                        <div className="bg-white/20 p-4 rounded-full mb-4 group-hover:bg-white/30 transition backdrop-blur-sm"><FileText size={40} /></div>
                        <h3 className="text-2xl font-bold mb-2">Formulaire Détaillé</h3>
                        <p className="text-orange-100">Saisie manuelle des travaux et finances.</p>
                    </button>
                </div>
            ) : (
                <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg text-orange-800 text-center">
                    <p className="font-bold flex items-center justify-center gap-2"><Lock size={16}/> Création de rapports désactivée</p>
                    <p className="text-sm">Vous n'avez pas les droits pour créer de nouveaux rapports.</p>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Historique Récent</h3>
                <div className="space-y-3">
                    {reports.slice(0, 5).map((r: any) => (
                        <div key={r.id} onClick={() => onViewReport(r)} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-orange-50 cursor-pointer transition border border-gray-100 dark:border-gray-600 group">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition ${r.method === 'Voice' ? 'bg-blue-100 text-blue-600 group-hover:bg-blue-200' : 'bg-orange-100 text-orange-600 group-hover:bg-orange-200'}`}>
                                    {r.method === 'Voice' ? <Mic size={18} /> : <FileText size={18} />}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800 dark:text-white text-sm">{r.technicianName}</p>
                                    <p className="text-xs text-gray-500">{r.date}</p>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-gray-400 group-hover:text-ebf-orange"/>
                        </div>
                    ))}
                    {reports.length === 0 && <p className="text-gray-400 text-center italic">Aucun rapport.</p>}
                </div>
            </div>
        </div>
    );
};

// --- Help Modal ---
const HelpModal = ({ isOpen, onClose }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg p-6 shadow-2xl animate-fade-in border-t-4 border-green-500">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><HelpCircle className="text-green-500"/> Aide & Support</h3>
                    <button onClick={onClose}><X className="text-gray-400 hover:text-red-500"/></button>
                </div>
                <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
                    <p><strong>Flash Info :</strong> Les messages automatiques sont générés par l'IA en fonction de la rentabilité.</p>
                    <p><strong>Mode Sombre :</strong> Activez-le dans les paramètres pour réduire la fatigue visuelle.</p>
                    <p><strong>Export PDF :</strong> Disponible dans le tableau de bord pour imprimer les rapports.</p>
                    <p className="bg-orange-50 p-2 rounded border border-orange-100 text-orange-800"><strong>Support Technique :</strong> Contactez l'admin au 07 07 00 00 00.</p>
                </div>
            </div>
        </div>
    );
};

// --- UPDATE PASSWORD SCREEN (NEW) ---
const UpdatePasswordScreen = ({ onSuccess }: { onSuccess: () => void }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
        setError('Le mot de passe doit contenir au moins 6 caractères.');
        return;
    }
    if (password !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas.');
        return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: password });
    setLoading(false);

    if (updateError) {
        setError(updateError.message);
    } else {
        alert("Mot de passe mis à jour avec succès ! Vous pouvez maintenant accéder à l'application.");
        onSuccess();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ebf-pattern p-4 font-sans relative">
       <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-orange-500/10 pointer-events-none"></div>
       <div className="glass-panel p-8 md:p-10 rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden animate-fade-in border-t-4 border-ebf-green">
          <div className="flex flex-col items-center mb-6">
             <div className="bg-white p-4 shadow-lg mb-4">
                 <EbfLogo size="normal" />
             </div>
             <h2 className="text-2xl font-extrabold text-gray-800 mt-2 tracking-tight">Nouveau Mot de Passe</h2>
             <p className="text-gray-500 text-sm mt-1 font-medium">Sécurisez votre compte</p>
          </div>
          {error && (<div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded-r mb-6 text-sm font-medium flex items-center gap-2 animate-slide-in shadow-sm"><AlertCircle size={18} className="flex-shrink-0"/> <span>{error}</span></div>)}
          
          <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1">Nouveau mot de passe</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 text-gray-400" size={18}/>
                        <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-ebf-orange focus:border-transparent outline-none transition text-gray-900 font-medium shadow-sm" placeholder="••••••••" />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1">Confirmer mot de passe</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 text-gray-400" size={18}/>
                        <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-ebf-orange focus:border-transparent outline-none transition text-gray-900 font-medium shadow-sm" placeholder="••••••••" />
                    </div>
                </div>
                
                <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-ebf-green to-emerald-600 text-white font-bold py-3.5 rounded-xl hover:shadow-lg hover:from-green-600 hover:to-emerald-700 transition duration-300 transform hover:-translate-y-0.5 mt-2 flex items-center justify-center gap-2 shadow-green-200">
                    {loading ? <Loader2 className="animate-spin" size={20}/> : "Mettre à jour & Accéder"}
                </button>
            </form>
       </div>
    </div>
  );
};

// --- Login Screen (Redesigned - Rich & Vibrant) ---
const LoginScreen = ({ onLoginSuccess }: { onLoginSuccess: () => void }) => {
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Role>('Visiteur');
  const [site, setSite] = useState<Site>(Site.ABIDJAN);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccessMsg('');

    const cleanIdentifier = identifier.trim();
    const cleanPassword = password.trim();
    const cleanName = fullName.trim();

    try {
      if (isResetMode) {
        if (authMethod !== 'email') throw new Error("La réinitialisation n'est disponible que par Email.");
        // Redirect to same URL but standard handling will pick it up
        const { error } = await supabase.auth.resetPasswordForEmail(cleanIdentifier, { redirectTo: window.location.origin });
        if (error) throw error;
        setSuccessMsg("Lien envoyé ! Vérifiez vos emails."); setLoading(false); return;
      }

      if (isSignUp) {
        const metadata = { full_name: cleanName, role: role, site: site };
        let signUpResp;
        if (authMethod === 'email') {
          signUpResp = await supabase.auth.signUp({ email: cleanIdentifier, password: cleanPassword, options: { data: metadata } });
        } else {
          signUpResp = await supabase.auth.signUp({ phone: cleanIdentifier, password: cleanPassword, options: { data: metadata } });
        }

        if (signUpResp.error) throw signUpResp.error;

        // CRITICAL: Check if we have a session immediately
        if (signUpResp.data.session) {
             const userId = signUpResp.data.user?.id;
             if (userId) {
                 await supabase.from('profiles').upsert([{
                     id: userId,
                     email: authMethod === 'email' ? cleanIdentifier : '',
                     phone: authMethod === 'phone' ? cleanIdentifier : '',
                     full_name: cleanName,
                     role: role,
                     site: site
                 }]);
                 
                 if (role !== 'Visiteur') {
                     let specialty = role as string;
                     if (role === 'Admin') specialty = 'Administration';
                     await supabase.from('technicians').upsert([{
                         id: userId,
                         name: cleanName,
                         specialty: specialty,
                         site: site,
                         status: 'Available'
                     }]);
                 }
             }
             // DIRECT SUCCESS LOGIN
             onLoginSuccess();
             return; 
        } else {
             // NO SESSION = CONFIRMATION REQUIRED BY SERVER
             setIsSignUp(false);
             setSuccessMsg("Inscription réussie ! Vérifiez vos emails pour valider le compte avant de vous connecter.");
        }

      } else {
        const { data, error: err } = await supabase.auth.signInWithPassword(
            authMethod === 'email' ? { email: cleanIdentifier, password: cleanPassword } : { phone: cleanIdentifier, password: cleanPassword }
        );
        
        if (err) throw err;
        onLoginSuccess();
      }
    } catch (err: any) {
        console.error("Auth Error:", err);
        let userMsg = "Une erreur technique est survenue.";
        // Normalize error message
        const msg = err.message || err.error_description || JSON.stringify(err);

        if (msg.includes("Invalid login credentials") || msg.includes("invalid_grant")) {
            userMsg = "Email ou mot de passe incorrect.";
        } else if (msg.includes("Email not confirmed")) {
            userMsg = "Votre email n'est pas encore confirmé. Vérifiez votre boîte mail (et les spams).";
        } else if (msg.includes("User already registered")) {
            userMsg = "Un compte existe déjà avec cet email/téléphone. Connectez-vous.";
        } else if (msg.includes("Password should be at least")) {
            userMsg = "Le mot de passe doit contenir au moins 6 caractères.";
        } else if (msg.includes("Phone signups are disabled")) {
            userMsg = "L'inscription par téléphone est désactivée. Utilisez l'email.";
        } else if (msg.includes("Failed to fetch") || msg.includes("Network request failed")) {
            userMsg = "Problème de connexion internet. Vérifiez votre réseau.";
        } else if (msg.includes("Too many requests") || msg.includes("rate_limit")) {
            userMsg = "Trop de tentatives. Veuillez patienter quelques minutes.";
        }

        setError(userMsg);
    } finally {
      setLoading(false); // STOP LOADING IN ALL CASES
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ebf-pattern p-4 font-sans relative">
       <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-orange-500/10 pointer-events-none"></div>
       <div className="glass-panel p-8 md:p-10 rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden animate-fade-in border-t-4 border-ebf-orange">
          <div className="flex flex-col items-center mb-8">
             {/* Logo SANS rounded-full - Square container */}
             <div className="bg-white p-4 shadow-lg mb-4">
                 <EbfLogo size="normal" />
             </div>
             <h2 className="text-2xl font-extrabold text-gray-800 mt-2 tracking-tight">
                 {isResetMode ? "Récupération" : (isSignUp ? "Rejoindre l'équipe" : "Espace Connexion")}
             </h2>
             <p className="text-gray-500 text-sm mt-1 font-medium">Gérez vos activités en temps réel</p>
          </div>
          {error && (<div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded-r mb-6 text-sm font-medium flex items-center gap-2 animate-slide-in shadow-sm"><AlertCircle size={18} className="flex-shrink-0"/> <span>{error}</span></div>)}
          {successMsg && (<div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-3 rounded-r mb-6 text-sm font-medium flex items-center gap-2 animate-slide-in shadow-sm"><CheckCircle size={18} className="flex-shrink-0"/> <span>{successMsg}</span></div>)}
          {!isResetMode && (
            <div className="flex p-1 bg-gray-100 rounded-lg mb-6 shadow-inner">
               <button onClick={() => setAuthMethod('email')} className={`flex-1 py-2 rounded-md text-sm font-bold transition-all duration-300 ${authMethod === 'email' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Email</button>
               <button onClick={() => setAuthMethod('phone')} className={`flex-1 py-2 rounded-md text-sm font-bold transition-all duration-300 ${authMethod === 'phone' ? 'bg-white text-ebf-orange shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Téléphone</button>
            </div>
          )}
          <form onSubmit={handleAuth} className="space-y-4">
                {isSignUp && (
                    <div className="space-y-4 animate-fade-in">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1">Nom Complet</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 text-gray-400" size={18}/>
                                <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-ebf-orange focus:border-transparent outline-none transition text-gray-900 font-medium shadow-sm" placeholder="Ex: Jean Kouassi" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1">Rôle</label>
                                <select value={role} onChange={e => setRole(e.target.value as Role)} className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-ebf-orange outline-none text-gray-900 font-medium appearance-none cursor-pointer shadow-sm">
                                    <option value="Visiteur">Visiteur</option>
                                    <option value="Technicien">Technicien</option>
                                    <option value="Secretaire">Secretaire</option>
                                    <option value="Magasinier">Magasinier</option>
                                    <option value="Admin">Admin</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1">Site</label>
                                <select value={site} onChange={e => setSite(e.target.value as Site)} className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-ebf-orange outline-none text-gray-900 font-medium appearance-none cursor-pointer shadow-sm">
                                    <option value="Abidjan">Abidjan</option>
                                    <option value="Bouaké">Bouaké</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1">{authMethod === 'email' ? 'Adresse Email' : 'Numéro de Téléphone'}</label>
                    <div className="relative">
                        {authMethod === 'email' ? <Mail className="absolute left-3 top-3 text-gray-400" size={18}/> : <Phone className="absolute left-3 top-3 text-gray-400" size={18}/>}
                        <input required value={identifier} onChange={e => setIdentifier(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-ebf-orange focus:border-transparent outline-none transition text-gray-900 font-medium shadow-sm" placeholder={authMethod === 'email' ? 'exemple@ebf.ci' : '0707070707'} />
                    </div>
                </div>
                {!isResetMode && (
                <div>
                    <div className="flex justify-between items-center mb-1.5 ml-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Mot de passe</label>
                        {!isSignUp && <button type="button" onClick={() => setIsResetMode(true)} className="text-xs text-ebf-orange font-bold hover:underline">Oublié ?</button>}
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 text-gray-400" size={18}/>
                        <input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-ebf-orange focus:border-transparent outline-none transition text-gray-900 font-medium shadow-sm" placeholder="••••••••" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                             {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>
                )}
                <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-ebf-orange to-orange-600 text-white font-bold py-3.5 rounded-xl hover:shadow-lg hover:from-orange-600 hover:to-orange-700 transition duration-300 transform hover:-translate-y-0.5 mt-2 flex items-center justify-center gap-2 shadow-orange-200">
                    {loading ? <Loader2 className="animate-spin" size={20}/> : (isResetMode ? "Envoyer le lien" : (isSignUp ? "Créer mon compte" : "Se Connecter"))}
                </button>
            </form>
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
             <button onClick={() => { 
                 if (successMsg && !successMsg.includes("Inscription réussie")) {
                     setSuccessMsg('');
                     setIsSignUp(false);
                 } else if (successMsg && successMsg.includes("Inscription réussie")) {
                     setSuccessMsg('');
                     // Keep on login screen
                 } else {
                     setIsSignUp(!isSignUp); 
                     setIsResetMode(false); 
                     setError('');
                 }
             }} className="text-sm font-semibold text-gray-500 hover:text-orange-600 transition">
                {successMsg && !successMsg.includes("Inscription réussie") ? (
                    <span className="flex items-center justify-center gap-2 font-bold text-orange-600"><ArrowLeft size={16}/> Retour à la connexion</span>
                ) : (isSignUp ? "Déjà un compte ? Se connecter" : "Pas encore de compte ? S'inscrire")}
             </button>
          </div>
       </div>
    </div>
  );
};

// --- Onboarding Flow ---
const OnboardingFlow = ({ role, onComplete }: { role: string, onComplete: () => void }) => {
  const [step, setStep] = useState<'message' | 'biometric'>('message');
  const [error, setError] = useState('');

  useEffect(() => {
    if (step === 'message') {
      const timer = setTimeout(() => {
         setStep('biometric');
      }, 3000); 
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleEnableBiometrics = () => {
    if (window.PublicKeyCredential) {
      localStorage.setItem('ebf_biometric_active', 'true');
      onComplete();
    } else {
      setError("Votre appareil ne supporte pas l'authentification biométrique sécurisée.");
    }
  };

  const handleSkip = () => {
     localStorage.setItem('ebf_biometric_active', 'false');
     onComplete();
  };

  return (
     <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gray-900/50 backdrop-blur-md transition-all duration-700">
        {step === 'message' && (
           <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-lg w-full text-center border-t-4 border-ebf-green animate-fade-in relative overflow-hidden mx-4">
              <div className="mx-auto bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-sm border border-green-100">
                  <CheckCircle className="text-green-600 h-10 w-10" />
              </div>
              <h3 className="text-2xl font-extrabold text-gray-800 mb-4">Connexion réussie</h3>
              <div className="text-gray-600 text-lg leading-relaxed">
                 Vous allez vous connecter en tant que<br/>
                 <span className="text-ebf-orange font-black text-2xl uppercase tracking-wide mt-2 block transform scale-105 transition-transform">
                    {role}
                 </span>
              </div>
           </div>
        )}

        {step === 'biometric' && (
           <div className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl max-w-md w-full mx-4 border-t-4 border-ebf-orange animate-slide-in relative overflow-hidden">
               <div className="absolute -top-10 -right-10 text-gray-50 opacity-50 pointer-events-none">
                  <ScanFace size={200} />
               </div>
               <div className="flex justify-center mb-8 relative z-10">
                  <div className="p-5 bg-orange-50 rounded-full text-ebf-orange shadow-inner ring-1 ring-orange-100">
                     <Fingerprint size={56} />
                  </div>
               </div>
               <h3 className="text-2xl font-bold text-center text-gray-800 mb-3 relative z-10">Connexion Rapide</h3>
               {error && <p className="text-red-500 bg-red-50 p-3 rounded-lg text-sm text-center mb-4 font-bold relative z-10">{error}</p>}
               <p className="text-gray-500 text-center mb-10 leading-relaxed relative z-10">
                  Souhaitez-vous activer la connexion par <strong className="text-gray-800">empreinte digitale</strong> ou <strong className="text-gray-800">reconnaissance faciale</strong> ?
               </p>
               <div className="space-y-3 relative z-10">
                  <button onClick={handleEnableBiometrics} className="w-full bg-ebf-orange text-white font-bold py-3.5 rounded-xl hover:bg-orange-600 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-3">
                     <ScanFace size={22}/> Oui, activer
                  </button>
                  <button onClick={handleSkip} className="w-full bg-white text-gray-500 font-bold py-3.5 rounded-xl hover:bg-gray-50 border border-gray-200 transition-colors">
                     Plus tard
                  </button>
               </div>
           </div>
        )}
     </div>
  );
};

// --- Loading Screen ---
const LoadingScreen = () => (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-ebf-pattern">
        <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center backdrop-blur-sm border border-gray-100">
            <Loader2 size={48} className="text-ebf-orange animate-spin mb-4"/>
            <p className="text-gray-700 font-bold animate-pulse text-lg">Chargement EBF Manager...</p>
        </div>
    </div>
);

// --- Confirmation Modal ---
const ConfirmationModal = ({ 
  isOpen, onClose, onConfirm, title, message 
}: { isOpen: boolean, onClose: () => void, onConfirm: () => void, title: string, message: string }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl w-full max-w-sm p-6 shadow-2xl animate-fade-in border-t-4 border-red-500">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600"><AlertTriangle size={28} /></div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
          <div className="flex gap-4 w-full">
            <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-bold">Annuler</button>
            <button onClick={() => { onConfirm(); onClose(); }} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-bold shadow-md">Supprimer</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Add Item Modal (Generic) ---
const AddModal = ({ isOpen, onClose, config, onSubmit, loading }: any) => {
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (isOpen) setFormData({}); 
  }, [isOpen]);

  const handleSubmit = () => {
    if (config.title.includes('Rapport') && !formData.method) {
        formData.method = 'Form';
    }
    onSubmit(formData);
  };

  if (!isOpen || !config) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-6 shadow-2xl animate-fade-in border-t-4 border-ebf-orange">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{config.title}</h3>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          {config.fields.map((field: FormField) => (
             <div key={field.name}>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{field.label}</label>
                {field.type === 'select' ? (
                   <select 
                     className="w-full border border-gray-200 p-2.5 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-ebf-orange focus:border-ebf-orange outline-none"
                     onChange={e => setFormData({...formData, [field.name]: e.target.value})}
                     value={formData[field.name] || ''}
                   >
                     <option value="">Sélectionner...</option>
                     {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                   </select>
                ) : (
                   <input 
                     type={field.type} 
                     className="w-full border border-gray-200 p-2.5 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-ebf-orange focus:border-ebf-orange outline-none"
                     onChange={e => setFormData({...formData, [field.name]: e.target.value})}
                     value={formData[field.name] || ''}
                     placeholder={field.placeholder || ''}
                   />
                )}
             </div>
          ))}
        </div>
        <div className="mt-6 flex gap-3">
           <button onClick={onClose} className="flex-1 py-2.5 border border-gray-300 rounded-lg font-bold text-gray-600 hover:bg-gray-50">Annuler</button>
           <button onClick={handleSubmit} disabled={loading} className="flex-1 py-2.5 bg-ebf-orange text-white rounded-lg font-bold hover:bg-orange-600 transition shadow-md">
             {loading ? <Loader2 className="animate-spin mx-auto"/> : "Ajouter"}
           </button>
        </div>
      </div>
    </div>
  );
};

const AppContent = ({ session, onLogout, userRole, userProfile }: { session: any, onLogout: () => void, userRole: Role, userProfile: Profile | null }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [currentPath, setCurrentPath] = useState('/');
  const [currentSite, setCurrentSite] = useState<Site>(userProfile?.site || Site.ABIDJAN);
  const [currentPeriod, setCurrentPeriod] = useState<Period>(Period.DAY);
  
  // Data States
  const [stats, setStats] = useState<StatData[]>(MOCK_STATS);
  const [reports, setReports] = useState<DailyReport[]>(MOCK_REPORTS);
  const [technicians, setTechnicians] = useState<Technician[]>(MOCK_TECHNICIANS);
  const [stock, setStock] = useState<StockItem[]>(MOCK_STOCK);
  const [interventions, setInterventions] = useState<Intervention[]>(MOCK_INTERVENTIONS);
  const [tickerMessages, setTickerMessages] = useState<TickerMessage[]>(DEFAULT_TICKER_MESSAGES);
  
  // Other data states for generic lists
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(MOCK_SUPPLIERS);
  const [chantiers, setChantiers] = useState<Chantier[]>(MOCK_CHANTIERS);
  const [materials, setMaterials] = useState<Material[]>(MOCK_MATERIALS);

  // Modal States
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalConfig, setAddModalConfig] = useState<FormConfig | null>(null);
  const [reportMode, setReportMode] = useState<'list' | 'create'>('list'); // for reports module
  const [creationMethod, setCreationMethod] = useState<'voice' | 'form' | null>(null);
  const [viewReport, setViewReport] = useState<DailyReport | null>(null);

  // Navigation Helper
  const navigate = (path: string) => {
    setCurrentPath(path);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const handleAddItem = (configKey: string) => {
    if (FORM_CONFIGS[configKey]) {
      setAddModalConfig(FORM_CONFIGS[configKey]);
      setShowAddModal(true);
    }
  };

  const handleSaveItem = async (formData: any) => {
    // Basic ID generation and adding to local state
    const newItem = { ...formData, id: Math.random().toString(36).substr(2, 9), site: formData.site || currentSite };
    
    // Determine which state to update based on config title or field context
    // This is a simplified logic for the prototype
    if (addModalConfig?.title.includes('Intervention')) setInterventions([newItem, ...interventions]);
    else if (addModalConfig?.title.includes('Stock')) setStock([newItem, ...stock]);
    else if (addModalConfig?.title.includes('Technicien')) setTechnicians([newItem, ...technicians]);
    else if (addModalConfig?.title.includes('Rapport')) setReports([newItem, ...reports]);
    else if (addModalConfig?.title.includes('Chantier')) setChantiers([newItem, ...chantiers]);
    else if (addModalConfig?.title.includes('Client')) setClients([newItem, ...clients]);
    else if (addModalConfig?.title.includes('Fournisseur')) setSuppliers([newItem, ...suppliers]);
    else if (addModalConfig?.title.includes('Transaction') || addModalConfig?.title.includes('Comptable')) setTransactions([newItem, ...transactions]);
    
    setShowAddModal(false);
  };

  // Determine active menu item
  const activeMenuId = MAIN_MENU.find(m => currentPath === m.path || (m.path !== '/' && currentPath.startsWith(m.path)))?.id || 'accueil';

  // Render Content
  const renderContent = () => {
    // 1. Dashboard
    if (currentPath === '/') {
      return (
        <Dashboard 
          data={stats} 
          reports={reports} 
          tickerMessages={tickerMessages} 
          stock={stock}
          currentSite={currentSite} 
          currentPeriod={currentPeriod} 
          onSiteChange={setCurrentSite} 
          onPeriodChange={setCurrentPeriod} 
          onNavigate={navigate}
          onDeleteReport={(id) => setReports(reports.filter(r => r.id !== id))}
        />
      );
    }

    // 2. Synthesis
    if (currentPath === '/synthesis') {
      return (
        <DetailedSynthesis 
          data={stats} 
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

    // 3. Sub-Modules (Generic View)
    // Check if path matches a sub-module
    for (const [section, modules] of Object.entries(MODULE_ACTIONS)) {
       const matchedModule = modules.find(m => m.path === currentPath);
       if (matchedModule) {
          // Special case for Reports
          if (matchedModule.id === 'rapports') {
             if (reportMode === 'list') {
                 return (
                    <ReportModeSelector 
                       reports={reports} 
                       onSelectMode={(mode: any) => { setCreationMethod(mode); handleAddItem('reports'); }} 
                       onBack={() => navigate('/techniciens')}
                       onViewReport={setViewReport}
                       readOnly={false} // Check permissions if needed
                    />
                 );
             }
          }

          // Generic List
          let items: any[] = [];
          let configKey = '';
          
          switch(matchedModule.id) {
             case 'interventions': items = interventions; configKey = 'interventions'; break;
             case 'materiel': items = materials; break; // No add modal config for materials yet in FORM_CONFIGS?
             case 'chantiers': items = chantiers; configKey = 'chantiers'; break;
             case 'bilan': items = transactions; configKey = 'transactions'; break;
             case 'clients': items = clients; configKey = 'clients'; break;
             case 'stocks': items = stock; configKey = 'stocks'; break;
             case 'fournisseurs': items = suppliers; configKey = 'suppliers'; break;
             case 'achats': items = []; configKey = 'purchases'; break; // purchases state missing
             // ...
          }
          
          return (
             <ModulePlaceholder 
                title={matchedModule.label} 
                subtitle={matchedModule.description} 
                items={items} 
                onBack={() => navigate('/' + section)} 
                color={matchedModule.color.replace('bg-', 'bg-')} 
                currentSite={currentSite} 
                currentPeriod={currentPeriod}
                onAdd={configKey ? () => handleAddItem(configKey) : undefined}
                onDelete={undefined} // Implement if needed
             />
          );
       }
    }

    // 4. Main Section Landing (Menu Grid)
    const section = MAIN_MENU.find(m => m.path === currentPath);
    if (section && MODULE_ACTIONS[section.id]) {
       return (
          <div className="animate-fade-in">
             <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <section.icon className={section.colorClass} /> {section.label}
             </h2>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MODULE_ACTIONS[section.id].map(action => (
                   <button 
                      key={action.id}
                      onClick={() => navigate(action.path)}
                      className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-xl transition-all border-l-4 border-transparent hover:border-ebf-orange text-left group"
                   >
                      <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                         <action.icon size={24} />
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">{action.label}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{action.description}</p>
                      {action.managedBy && <span className="inline-block mt-3 text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-500 px-2 py-1 rounded">{action.managedBy}</span>}
                   </button>
                ))}
             </div>
          </div>
       );
    }
    
    // Default / 404
    return <div className="p-8 text-center text-gray-500">Page en construction ou non trouvée.</div>;
  };

  return (
    <div className="flex h-screen bg-ebf-pattern overflow-hidden font-sans">
       {/* Sidebar */}
       <aside className={`fixed md:relative z-30 w-64 h-full bg-white dark:bg-gray-900 shadow-2xl flex flex-col transition-all duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-20 lg:w-64'}`}>
          <div className="p-4 flex flex-col items-center border-b border-gray-100 dark:border-gray-800">
             <div className="mb-2 hidden lg:block md:hidden">
                <EbfLogo size="small" />
             </div>
             <div className="lg:hidden md:block hidden">
                {/* Small logo for collapsed state */}
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-xs">EBF</div>
             </div>
             <div className="block md:hidden">
                <EbfLogo size="small" />
             </div>
          </div>
          
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
             {MAIN_MENU.map(item => (
                <button 
                   key={item.id}
                   onClick={() => navigate(item.path)}
                   className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group ${activeMenuId === item.id ? 'bg-orange-50 text-ebf-orange font-bold shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                   title={item.label}
                >
                   <item.icon size={22} className={`flex-shrink-0 ${activeMenuId === item.id ? 'text-ebf-orange' : 'text-gray-400 group-hover:text-gray-600'}`} />
                   <span className={`ml-3 whitespace-nowrap overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 md:hidden lg:block lg:opacity-100 lg:w-auto'}`}>
                      {item.label}
                   </span>
                   {activeMenuId === item.id && isSidebarOpen && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-ebf-orange"></div>}
                </button>
             ))}
          </nav>

          <div className="p-4 border-t border-gray-100 dark:border-gray-800">
             <button onClick={onLogout} className="w-full flex items-center p-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors">
                <LogOut size={22} />
                <span className={`ml-3 font-medium transition-all ${isSidebarOpen ? 'block' : 'hidden md:hidden lg:block'}`}>Déconnexion</span>
             </button>
          </div>
       </aside>

       {/* Main Content */}
       <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          {/* Top Bar */}
          <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 md:px-6 z-20">
             <div className="flex items-center">
                <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="mr-4 p-2 rounded-lg hover:bg-gray-100 text-gray-600 md:hidden">
                   <Menu size={24} />
                </button>
                <h1 className="text-xl font-bold text-gray-800 dark:text-white hidden sm:block">
                   {MAIN_MENU.find(m => m.path === currentPath)?.label || 'EBF Manager'}
                </h1>
             </div>

             <div className="flex items-center space-x-2 md:space-x-4">
                <button onClick={() => setShowHelp(true)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition relative group">
                   <HelpCircle size={20} />
                   <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
                </button>
                <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition relative">
                   <Bell size={20} />
                   <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                </button>
                <div 
                   className="flex items-center gap-3 pl-2 border-l border-gray-200 ml-2 cursor-pointer hover:bg-gray-50 p-1 rounded-lg transition"
                   onClick={() => setShowAdminPanel(true)}
                >
                   <div className="text-right hidden md:block">
                      <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">{userProfile?.full_name || 'Utilisateur'}</p>
                      <p className="text-xs text-gray-500">{userRole}</p>
                   </div>
                   <div className="w-9 h-9 bg-gradient-to-tr from-ebf-green to-emerald-400 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                      {userProfile?.full_name?.charAt(0) || 'U'}
                   </div>
                </div>
             </div>
          </header>

          {/* Page Content Scrollable Area */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar relative">
             {renderContent()}
          </main>
       </div>

       {/* Modals */}
       <AdminPanelModal isOpen={showAdminPanel} onClose={() => setShowAdminPanel(false)} />
       <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
       <AddModal 
          isOpen={showAddModal} 
          onClose={() => setShowAddModal(false)} 
          config={addModalConfig} 
          onSubmit={handleSaveItem}
          loading={false}
       />
       {/* View Report Modal (Simplified) */}
       {viewReport && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setViewReport(null)} />
             <div className="relative bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg p-6 shadow-2xl animate-fade-in border-t-4 border-blue-500">
                <div className="flex justify-between items-start mb-4">
                   <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Détail du Rapport</h3>
                      <p className="text-sm text-gray-500">{viewReport.date} • {viewReport.technicianName}</p>
                   </div>
                   <button onClick={() => setViewReport(null)}><X className="text-gray-400 hover:text-red-500"/></button>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg mb-4 text-gray-700 text-sm leading-relaxed">
                   {viewReport.content}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                   <div className="bg-green-50 p-2 rounded border border-green-100">
                      <span className="block text-xs font-bold text-green-700 uppercase">Recette</span>
                      <span className="font-mono font-bold text-green-900">{viewReport.revenue?.toLocaleString()} FCFA</span>
                   </div>
                   <div className="bg-red-50 p-2 rounded border border-red-100">
                      <span className="block text-xs font-bold text-red-700 uppercase">Dépense</span>
                      <span className="font-mono font-bold text-red-900">{viewReport.expenses?.toLocaleString()} FCFA</span>
                   </div>
                </div>
             </div>
          </div>
       )}
    </div>
  );
};

// --- App Wrapper with State Machine ---
export default function App() {
  const [appState, setAppState] = useState<'LOADING' | 'LOGIN' | 'ONBOARDING' | 'APP' | 'UPDATE_PASSWORD'>('LOADING');
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<Role>('Visiteur');
  const [userProfile, setUserProfile] = useState<Profile | null>(null);

  // Helper to fetch profile data
  const fetchUserProfile = async (userId: string) => {
      let { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      
      // Fallback: Create profile if it doesn't exist
      if (!data) {
          const { data: userData } = await supabase.auth.getUser();
          const meta = userData.user?.user_metadata;
          if (meta) {
              const newProfile = {
                  id: userId,
                  full_name: meta.full_name || 'Utilisateur',
                  role: meta.role || 'Visiteur',
                  site: meta.site || 'Global',
                  email: userData.user?.email
              };
              const { error: insertError } = await supabase.from('profiles').insert([newProfile]);
              if (!insertError) data = newProfile as any;
          }
      }

      if (data) {
          setUserRole(data.role);
          setUserProfile(data);
          
          // Ensure user is in 'Notre Équipe' if not Visitor
          if (data.role !== 'Visiteur') {
               const { data: tech } = await supabase.from('technicians').select('id').eq('id', userId).single();
               if (!tech) {
                   let specialty = data.role;
                   if (data.role === 'Admin') specialty = 'Administration';
                   
                   await supabase.from('technicians').insert([{
                       id: userId,
                       name: data.full_name,
                       specialty: specialty,
                       site: data.site,
                       status: 'Available'
                   }]);
               }
          }
          return data;
      }
      return null;
  };

  // Main Effect to check Session on Load
  useEffect(() => {
    const init = async () => {
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      
      if (existingSession) {
         setSession(existingSession);
         // Check if this is a recovery session (link clicked in email)
         // Supabase sends recovery event usually, but if page reloads, check scope?
         // Reliable method is event listener below.
         
         const profile = await fetchUserProfile(existingSession.user.id);
         setAppState('APP');
      } else {
         setAppState('LOGIN');
      }
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT') {
            setSession(null);
            setUserProfile(null);
            setAppState('LOGIN');
        } else if (event === 'PASSWORD_RECOVERY') {
            setSession(session);
            setAppState('UPDATE_PASSWORD'); // Force password update screen
        } else if (event === 'SIGNED_IN') {
             // Normal sign in
             if (session) {
                 setSession(session);
                 await fetchUserProfile(session.user.id);
                 // Only go to onboarding if previously in login
                 setAppState(prev => prev === 'LOGIN' ? 'ONBOARDING' : 'APP');
             }
        }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleExplicitLoginSuccess = async () => {
      setAppState('LOADING');
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
          setSession(session);
          await fetchUserProfile(session.user.id);
          setAppState('ONBOARDING');
      } else {
          setAppState('LOGIN');
      }
  };

  const handleOnboardingComplete = () => {
      setAppState('APP');
  };

  const handlePasswordUpdateSuccess = () => {
      setAppState('APP'); // Go to app after password update
  };

  if (appState === 'LOADING') return <LoadingScreen />;
  if (appState === 'LOGIN') return <LoginScreen onLoginSuccess={handleExplicitLoginSuccess} />;
  if (appState === 'UPDATE_PASSWORD') return <UpdatePasswordScreen onSuccess={handlePasswordUpdateSuccess} />;
  if (appState === 'ONBOARDING') return <OnboardingFlow role={userRole} onComplete={handleOnboardingComplete} />;

  return (
    <AppContent 
        session={session} 
        onLogout={() => supabase.auth.signOut()} 
        userRole={userRole} 
        userProfile={userProfile} 
    />
  );
}
