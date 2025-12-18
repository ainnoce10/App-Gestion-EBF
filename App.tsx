
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  LayoutDashboard, Wrench, Briefcase, ShoppingCart, Menu, X, Bell, Search, Settings,
  HardHat, DollarSign, LogOut, Calculator, Users, Calendar, FolderOpen, Truck, 
  FileText, UserCheck, CreditCard, Archive, ShieldCheck, ClipboardList, ArrowLeft, ChevronRight, Mic, Send, Save, Plus, CheckCircle, Trash2, User, HelpCircle, Moon, Play, StopCircle, RefreshCw, FileInput, MapPin, Volume2, Megaphone, AlertCircle, Filter, TrendingUp, Edit, ArrowUp, ArrowDown, AlertTriangle, Loader2, Mail, Lock, UserPlus, ScanFace, Fingerprint, Phone, CheckSquare, Key, MoveUp, MoveDown, Eye, EyeOff, Sparkles, Target, RefreshCcw, Shield, ShoppingBag, Minus
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { DetailedSynthesis } from './components/DetailedSynthesis';
import { Site, Period, TickerMessage, StatData, DailyReport, Intervention, StockItem, Transaction, Profile, Role, Notification, Technician, CartItem } from './types';
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
    { id: 'interventions', label: 'Interventions', description: 'Planning des interventions', managedBy: 'Géré par le Superviseur', icon: Wrench, path: '/techniciens/interventions', color: 'bg-orange-500' },
    { id: 'rapports', label: 'Rapports Journaliers', description: 'Vocal ou Formulaire détaillé', managedBy: 'Géré par les Techniciens', icon: FileText, path: '/techniciens/rapports', color: 'bg-gray-700' },
    { id: 'materiel', label: 'Matériel', description: 'Inventaire & Affectation', managedBy: 'Géré par le Magasinier', icon: Truck, path: '/techniciens/materiel', color: 'bg-blue-600' },
    { id: 'chantiers', label: 'Chantiers', description: 'Suivi & Exécution', managedBy: 'Géré par le Chef de Chantier', icon: ShieldCheck, path: '/techniciens/chantiers', color: 'bg-green-600' },
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

// --- Helper: Permission Check (UNRESTRICTED) ---
const getPermission = (path: string, role: Role): { canWrite: boolean } => {
  return { canWrite: true };
};

// --- EBF Vector Logo ---
const EbfSvgLogo = ({ size }: { size: 'small' | 'normal' | 'large' }) => {
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
            <circle cx="40" cy="40" r="30" fill="url(#globeGrad)" />
            <path d="M25,30 Q35,20 45,30 T55,45 T40,60 T25,45" fill="#4ade80" opacity="0.8"/>
            <path d="M40,70 C40,90 80,90 80,50 L80,40" fill="none" stroke="black" strokeWidth="4" strokeLinecap="round"/>
            <rect x="70" y="20" width="20" height="25" rx="0" fill="#e5e5e5" stroke="#9ca3af" strokeWidth="2" />
            <path d="M75,20 L75,10 M85,20 L85,10" stroke="#374151" strokeWidth="3" />
            <line x1="100" y1="10" x2="100" y2="80" stroke="black" strokeWidth="3" />
            <text x="110" y="55" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="40" fill="#008000">E</text>
            <text x="135" y="55" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="40" fill="#000">.</text>
            <text x="145" y="55" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="40" fill="#FF0000">B</text>
            <text x="170" y="55" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="40" fill="#000">.</text>
            <text x="180" y="55" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="40" fill="#008000">F</text>
            <rect x="110" y="70" width="90" height="15" fill="#FF0000" />
            <text x="155" y="81" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="7" fill="white" textAnchor="middle">
                Electricité - Bâtiment - Froid
            </text>
        </svg>
    );
};

const EbfLogo = ({ size = 'normal' }: { size?: 'small' | 'normal' | 'large' }) => {
  const [imgError, setImgError] = useState(false);
  if (imgError) return <EbfSvgLogo size={size} />;
  return (
    <div className="flex items-center justify-center">
        <img src="/logo.png" alt="EBF Logo" className={`${size === 'small' ? 'h-10' : size === 'large' ? 'h-32' : 'h-16'} w-auto object-contain transition-transform duration-300 hover:scale-105`} onError={() => setImgError(true)} />
    </div>
  );
};

// --- Module Placeholder (Generic List View) ---
const ModulePlaceholder = ({ title, subtitle, items = [], onBack, color, currentSite, currentPeriod, onAdd, onDelete, onAddToCart, readOnly }: any) => {
    const filteredItems = items.filter((item: any) => {
        if (currentSite && item.site && currentSite !== Site.GLOBAL && item.site !== currentSite) return false;
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
                                {!readOnly && <th className="p-4 text-right text-xs font-bold uppercase text-gray-500 dark:text-gray-300">Actions</th>}
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
                                        </td>
                                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                                            {item.description || item.specialty || item.unit || item.category || item.supplier || '-'}
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
                                        {!readOnly && (
                                            <td className="p-4 text-right flex justify-end gap-2">
                                                {onAddToCart && (
                                                    <button onClick={() => onAddToCart(item)} className="p-2 text-ebf-orange hover:bg-orange-100 rounded transition flex items-center gap-1 font-bold text-xs">
                                                        <ShoppingBag size={16}/> <span className="hidden sm:inline">Panier</span>
                                                    </button>
                                                )}
                                                {onDelete && (
                                                    <button onClick={() => onDelete(item)} className="p-2 text-red-500 hover:bg-red-50 rounded transition"><Trash2 size={16}/></button>
                                                )}
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
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2"> Rapports Journaliers </h2>
            </div>
            {!readOnly ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button onClick={() => onSelectMode('voice')} className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-8 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition flex flex-col items-center text-center group border border-blue-400 relative overflow-hidden">
                        <div className="bg-white/20 p-4 rounded-full mb-4 group-hover:bg-white/30 transition backdrop-blur-sm"><Mic size={40} /></div>
                        <h3 className="text-2xl font-bold mb-2">Rapport Vocal</h3>
                        <p className="text-blue-100">Dictez votre rapport, l'IA le rédige pour vous.</p>
                    </button>
                    <button onClick={() => onSelectMode('form')} className="bg-gradient-to-br from-ebf-orange to-orange-600 text-white p-8 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition flex flex-col items-center text-center group border border-orange-400 relative overflow-hidden">
                        <div className="bg-white/20 p-4 rounded-full mb-4 group-hover:bg-white/30 transition backdrop-blur-sm"><FileText size={40} /></div>
                        <h3 className="text-2xl font-bold mb-2">Formulaire Détaillé</h3>
                        <p className="text-orange-100">Saisie manuelle des travaux et finances.</p>
                    </button>
                </div>
            ) : null}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Historique Récent</h3>
                <div className="space-y-3">
                    {reports.slice(0, 5).map((r: any) => (
                        <div key={r.id} onClick={() => onViewReport(r)} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-orange-50 cursor-pointer transition border border-gray-100 dark:border-gray-600 group">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition ${r.method === 'Voice' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                                    {r.method === 'Voice' ? <Mic size={18} /> : <FileText size={18} />}
                                </div>
                                <div><p className="font-bold text-gray-800 dark:text-white text-sm">{r.technicianName}</p><p className="text-xs text-gray-500">{r.date}</p></div>
                            </div>
                            <ChevronRight size={18} className="text-gray-400 group-hover:text-ebf-orange"/>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- Cart Modal ---
const CartModal = ({ isOpen, onClose, items, onUpdateQuantity, onRemove, onClear, onFinalize }: { isOpen: boolean, onClose: () => void, items: CartItem[], onUpdateQuantity: (id: string, delta: number) => void, onRemove: (id: string) => void, onClear: () => void, onFinalize: () => void }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-end">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-gray-800 w-full max-w-md h-full shadow-2xl animate-slide-in flex flex-col">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-ebf-orange text-white">
                    <h3 className="text-xl font-bold flex items-center gap-2"><ShoppingBag /> Mon Panier</h3>
                    <button onClick={onClose}><X size={24}/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <ShoppingBag size={64} className="mb-4 opacity-20"/>
                            <p className="font-bold text-lg">Le panier est vide</p>
                            <p className="text-sm">Ajoutez des articles de la quincaillerie.</p>
                        </div>
                    ) : (
                        items.map(item => (
                            <div key={item.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl border border-gray-100 dark:border-gray-600 flex justify-between items-center group">
                                <div>
                                    <p className="font-bold text-gray-800 dark:text-white">{item.name}</p>
                                    <p className="text-xs text-gray-500">{item.site} • {item.quantity} {item.unit} en stock</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center bg-white dark:bg-gray-800 border rounded-lg p-1">
                                        <button onClick={() => onUpdateQuantity(item.id, -1)} className="p-1 hover:text-ebf-orange transition"><Minus size={16}/></button>
                                        <span className="w-8 text-center font-bold text-sm">{item.requestedQuantity}</span>
                                        <button onClick={() => onUpdateQuantity(item.id, 1)} className="p-1 hover:text-ebf-orange transition"><Plus size={16}/></button>
                                    </div>
                                    <button onClick={() => onRemove(item.id)} className="text-red-500 hover:bg-red-50 p-2 rounded transition"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                {items.length > 0 && (
                    <div className="p-6 border-t border-gray-100 dark:border-gray-700 space-y-3">
                        <button onClick={onFinalize} className="w-full bg-ebf-green text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 flex items-center justify-center gap-2">
                            <CheckCircle size={20}/> Valider la demande
                        </button>
                        <button onClick={onClear} className="w-full text-red-500 font-bold py-2 text-sm hover:underline">Vider le panier</button>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Login & Onboarding (Simplified for brevity) ---
const LoginScreen = ({ onLoginSuccess }: { onLoginSuccess: () => void }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: identifier, password });
    if (error) alert(error.message); else onLoginSuccess();
    setLoading(false);
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-ebf-pattern p-4">
       <div className="glass-panel p-10 rounded-3xl shadow-2xl w-full max-w-md border-t-4 border-ebf-orange">
          <div className="flex flex-col items-center mb-8"><div className="bg-white p-4 shadow-lg mb-4"><EbfLogo size="normal" /></div><h2 className="text-2xl font-extrabold text-gray-800 mt-2">EBF Manager</h2></div>
          <form onSubmit={handleAuth} className="space-y-4">
                <input required value={identifier} onChange={e => setIdentifier(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" placeholder="Email" />
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" placeholder="Mot de passe" />
                <button type="submit" disabled={loading} className="w-full bg-ebf-orange text-white font-bold py-3.5 rounded-xl hover:shadow-lg transition"> {loading ? <Loader2 className="animate-spin mx-auto"/> : "Se Connecter"} </button>
            </form>
       </div>
    </div>
  );
};

// --- App Container ---
const AppContent = ({ onLogout, userRole, userProfile }: any) => {
  const [currentPath, setCurrentPath] = useState('/');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentSite, setCurrentSite] = useState<Site>(Site.GLOBAL);
  const [currentPeriod, setCurrentPeriod] = useState<Period>(Period.MONTH);
  const [darkMode, setDarkMode] = useState(false);
  
  const [stats, setStats] = useState<StatData[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [tickerMessages, setTickerMessages] = useState<TickerMessage[]>([]);
  
  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Other modules states... (Simplified)
  const [chantiers, setChantiers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [caisse, setCaisse] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [crudTarget, setCrudTarget] = useState('');
  const [crudLoading, setCrudLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: stockData } = await supabase.from('stocks').select('*'); if (stockData) setStock(stockData);
      const { data: reportsData } = await supabase.from('reports').select('*'); if (reportsData) setReports(reportsData);
      const { data: transData } = await supabase.from('transactions').select('*'); if (transData) setTransactions(transData);
      // ... others
    };
    fetchData();
  }, []);

  const addToCart = (item: StockItem) => {
      setCart(prev => {
          const existing = prev.find(i => i.id === item.id);
          if (existing) {
              return prev.map(i => i.id === item.id ? {...i, requestedQuantity: i.requestedQuantity + 1} : i);
          }
          return [...prev, {...item, requestedQuantity: 1}];
      });
      setIsCartOpen(true);
  };

  const updateCartQuantity = (id: string, delta: number) => {
      setCart(prev => prev.map(i => {
          if (i.id === id) {
              const newQty = Math.max(1, i.requestedQuantity + delta);
              return {...i, requestedQuantity: newQty};
          }
          return i;
      }));
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id));
  const clearCart = () => setCart([]);
  const finalizeCart = () => {
      alert("Demande de matériel validée ! Un bon de sortie a été généré.");
      clearCart();
      setIsCartOpen(false);
  };

  const handleNavigate = (path: string) => { setCurrentPath(path); setIsMenuOpen(false); };

  const renderContent = () => {
     if (currentPath === '/') return <Dashboard data={stats} reports={reports} tickerMessages={tickerMessages} stock={stock} currentSite={currentSite} currentPeriod={currentPeriod} onSiteChange={setCurrentSite} onPeriodChange={setCurrentPeriod} onNavigate={handleNavigate} onDeleteReport={()=>{}} />;
     if (currentPath === '/quincaillerie/stocks') return <ModulePlaceholder title="Stocks Quincaillerie" subtitle="Inventaire" items={stock} onBack={() => handleNavigate('/quincaillerie')} color="bg-orange-600" currentSite={currentSite} onAdd={() => {setCrudTarget('stocks'); setIsAddOpen(true);}} onDelete={()=>{}} onAddToCart={addToCart} />;
     
     // Other modules...
     return <div className="text-center mt-20 text-gray-400 font-bold">Module en cours de chargement...</div>;
  };

  return (
    <div className={`flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors ${darkMode ? 'dark' : ''}`}>
        <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-green-950 text-white transform transition-transform duration-300 lg:translate-x-0 lg:static ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
            <div className="h-20 px-6 flex items-center bg-white/5"><div className="transform scale-75 origin-left bg-white p-2"><EbfLogo size="small" /></div></div>
            <div className="p-4 flex-1 overflow-y-auto">
                <nav className="space-y-2">
                    {MAIN_MENU.map(item => (
                        <button key={item.id} onClick={() => handleNavigate(item.path)} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${currentPath === item.path ? 'bg-ebf-orange text-white font-bold' : 'text-gray-300 hover:bg-green-900'}`}>
                            <item.icon size={20} /> <span>{item.label}</span>
                        </button>
                    ))}
                </nav>
            </div>
        </aside>
        <div className="flex-1 flex flex-col overflow-hidden relative">
             <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sticky top-0 z-30 shadow-sm">
                <button onClick={() => setIsMenuOpen(true)} className="lg:hidden p-2 text-gray-600"><Menu/></button>
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsCartOpen(true)} className="relative p-2 hover:bg-orange-50 rounded-full transition text-ebf-orange group">
                        <ShoppingBag size={24}/>
                        {cart.length > 0 && <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce">{cart.length}</span>}
                    </button>
                    <div className="hidden md:block text-right">
                        <p className="text-sm font-bold text-gray-800">{userProfile?.full_name}</p>
                        <p className="text-[10px] text-ebf-orange font-bold uppercase tracking-wider">{userRole}</p>
                    </div>
                </div>
             </header>
             <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 bg-ebf-pattern">{renderContent()}</main>
        </div>
        <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} items={cart} onUpdateQuantity={updateCartQuantity} onRemove={removeFromCart} onClear={clearCart} onFinalize={finalizeCart} />
    </div>
  );
};

export default function App() {
  const [appState, setAppState] = useState<'LOADING' | 'LOGIN' | 'APP'>('LOADING');
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({data}) => {
          if (data) { setUserProfile(data); setAppState('APP'); } else setAppState('LOGIN');
        });
      } else setAppState('LOGIN');
    });
  }, []);
  if (appState === 'LOADING') return <div className="h-screen flex items-center justify-center font-bold text-ebf-orange">Chargement...</div>;
  if (appState === 'LOGIN') return <LoginScreen onLoginSuccess={() => window.location.reload()} />;
  return <AppContent userRole={userProfile?.role} userProfile={userProfile} onLogout={() => supabase.auth.signOut()} />;
}
