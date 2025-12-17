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
import { Site, Period, TickerMessage, StatData, DailyReport, Intervention, StockItem, Transaction, Profile, Role, Notification, Technician } from './types';
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

// --- Helper: Permission Check (UNRESTRICTED) ---
const getPermission = (path: string, role: Role): { canWrite: boolean } => {
  return { canWrite: true };
};

// --- EBF Vector Logo (Globe + Plug) ---
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
            <path d="M50,20 Q60,15 65,25" fill="none" stroke="#a3e635" strokeWidth="2"/>
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

// --- Missing Components Implementation ---

const ReportModeSelector = ({ reports, onSelectMode, onBack, onViewReport, readOnly }: any) => {
  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
             <button onClick={onBack} className="p-2 bg-white rounded-full hover:bg-orange-50 shadow-sm transition border border-gray-100"><ArrowLeft size={20} className="text-gray-600 hover:text-ebf-orange"/></button>
             <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Rapports Journaliers</h2>
        </div>
        
        {!readOnly && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button onClick={() => onSelectMode('form')} className="p-8 bg-white dark:bg-gray-800 rounded-xl shadow-md border-2 border-transparent hover:border-ebf-orange transition group flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <FileText size={32} className="text-ebf-orange"/>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">Rapport Formulaire</h3>
                    <p className="text-gray-500 mt-2">Saisie détaillée textuelle</p>
                </button>
                <button onClick={() => onSelectMode('voice')} className="p-8 bg-white dark:bg-gray-800 rounded-xl shadow-md border-2 border-transparent hover:border-blue-500 transition group flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Mic size={32} className="text-blue-600"/>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">Rapport Vocal</h3>
                    <p className="text-gray-500 mt-2">Dictée rapide assistée par IA</p>
                </button>
            </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <h3 className="font-bold text-gray-700 dark:text-gray-200">Historique des Rapports</h3>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {reports.map((r: DailyReport) => (
                    <div key={r.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer" onClick={() => onViewReport(r)}>
                        <div className="flex items-center gap-4">
                             <div className={`w-10 h-10 rounded-full flex items-center justify-center ${r.method === 'Voice' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-ebf-orange'}`}>
                                 {r.method === 'Voice' ? <Mic size={18} /> : <FileText size={18} />}
                             </div>
                             <div>
                                 <p className="font-bold text-gray-800 dark:text-white">{r.technicianName}</p>
                                 <p className="text-xs text-gray-500">{r.date} • {r.site}</p>
                             </div>
                        </div>
                        <ChevronRight size={16} className="text-gray-400" />
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

const HeaderWithNotif = ({ title, onMenuClick, onLogout, notifications, userProfile, userRole, markNotificationAsRead, onOpenProfile, onOpenFlashInfo, onOpenHelp, darkMode, onToggleTheme, onResetBiometrics }: any) => {
    return (
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100 dark:border-gray-700 h-16 flex items-center justify-between px-4 sticky top-0 z-30">
            <div className="flex items-center">
                <button onClick={onMenuClick} className="mr-4 lg:hidden text-gray-500 hover:text-ebf-orange transition"><Menu /></button>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-700 to-green-500 hidden md:block">{title}</h1>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
                <button onClick={onToggleTheme} className="p-2 text-gray-400 hover:text-ebf-orange hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition">
                    {darkMode ? <Sparkles size={20} /> : <Moon size={20} />}
                </button>
                <button onClick={onOpenHelp} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-full transition hidden sm:block">
                    <HelpCircle size={20} />
                </button>
                {/* Notification Dropdown */}
                <div className="relative group">
                    <button className="p-2 text-gray-400 hover:text-ebf-orange hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition relative">
                        <Bell size={20} />
                        {notifications.filter((n: Notification) => !n.read).length > 0 && (
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                        )}
                    </button>
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right z-50">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800 dark:text-white">Notifications</h3>
                            <span className="text-xs text-gray-400">{notifications.length} recents</span>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                            {notifications.length === 0 ? <div className="p-4 text-center text-gray-400 text-sm">Aucune notification</div> : notifications.map((n: Notification) => (
                                <div key={n.id} onClick={() => markNotificationAsRead(n)} className={`p-4 border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer ${!n.read ? 'bg-orange-50/50 dark:bg-gray-700/50' : ''}`}>
                                    <div className="flex gap-3">
                                        <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${n.type === 'alert' ? 'bg-red-500' : n.type === 'success' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                                        <div>
                                            <p className={`text-sm ${!n.read ? 'font-bold text-gray-800 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>{n.title}</p>
                                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{n.message}</p>
                                            <p className="text-[10px] text-gray-400 mt-2">{new Date(n.created_at).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Profile Dropdown */}
                <div className="relative group pl-2 border-l border-gray-200 dark:border-gray-700">
                    <button className="flex items-center space-x-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ebf-green to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                            {userProfile?.full_name?.charAt(0) || <User size={16} />}
                        </div>
                        <div className="text-left hidden md:block">
                             <p className="text-xs font-bold text-gray-800 dark:text-white">{userProfile?.full_name || 'Utilisateur'}</p>
                             <p className="text-[10px] text-gray-500">{userRole}</p>
                        </div>
                        <ChevronRight size={14} className="text-gray-400" />
                    </button>
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right z-50 p-2">
                        <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700 mb-2">
                            <p className="font-bold text-gray-800 dark:text-white">{userProfile?.full_name}</p>
                            <p className="text-xs text-gray-500">{userProfile?.email}</p>
                        </div>
                        <button onClick={onOpenProfile} className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2"><User size={16}/> Mon Profil</button>
                        {(userRole === 'Admin' || userRole === 'DG') && (
                            <button onClick={onOpenFlashInfo} className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2"><Megaphone size={16}/> Flash Info</button>
                        )}
                         <button onClick={onResetBiometrics} className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2"><Fingerprint size={16}/> Reset Biométrie</button>
                        <div className="border-t border-gray-100 dark:border-gray-700 my-2"></div>
                        <button onClick={onLogout} className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 text-sm text-red-600 flex items-center gap-2"><LogOut size={16}/> Déconnexion</button>
                    </div>
                </div>
            </div>
        </header>
    );
};

const ProfileModal = ({ isOpen, onClose, profile }: any) => {
    if(!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-ebf-green to-emerald-600 relative">
                     <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white"><X size={20}/></button>
                     <div className="absolute -bottom-10 left-6 w-20 h-20 rounded-full border-4 border-white dark:border-gray-800 bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-600">
                         {profile?.full_name?.charAt(0)}
                     </div>
                </div>
                <div className="pt-12 pb-6 px-6">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">{profile?.full_name}</h2>
                    <p className="text-sm text-gray-500 mb-6">{profile?.email} • {profile?.role}</p>
                    <div className="space-y-3">
                         <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                             <span className="text-sm text-gray-500 dark:text-gray-400">Site</span>
                             <span className="text-sm font-bold text-gray-800 dark:text-white">{profile?.site}</span>
                         </div>
                         <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                             <span className="text-sm text-gray-500 dark:text-gray-400">Téléphone</span>
                             <span className="text-sm font-bold text-gray-800 dark:text-white">{profile?.phone || 'N/A'}</span>
                         </div>
                         <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                             <span className="text-sm text-gray-500 dark:text-gray-400">Date embauche</span>
                             <span className="text-sm font-bold text-gray-800 dark:text-white">{profile?.date_hired || 'N/A'}</span>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const HelpModal = ({ isOpen, onClose }: any) => {
    if(!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative">
                 <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20}/></button>
                 <div className="flex items-center gap-3 mb-4">
                     <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><HelpCircle size={24}/></div>
                     <h2 className="text-xl font-bold text-gray-800 dark:text-white">Aide & Support</h2>
                 </div>
                 <p className="text-gray-600 dark:text-gray-300 mb-4">Bienvenue sur EBF Manager. Voici quelques conseils pour démarrer :</p>
                 <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300 list-disc list-inside mb-6">
                     <li>Utilisez le menu latéral pour naviguer entre les modules.</li>
                     <li>La synthèse détaillée offre des graphiques avancés.</li>
                     <li>En cas de problème technique, contactez le support IT au 0707070707.</li>
                 </ul>
                 <button onClick={onClose} className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg transition">Fermer</button>
            </div>
        </div>
    );
};

const FlashInfoModal = ({ isOpen, onClose, messages, onSaveMessage, onDeleteMessage }: any) => {
    const [text, setText] = useState('');
    const [type, setType] = useState('info');
    if(!isOpen) return null;
    
    const handleSave = () => {
        if(text) { onSaveMessage(text, type); setText(''); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl p-6 relative max-h-[80vh] flex flex-col">
                 <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20}/></button>
                 <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><Megaphone size={20} className="text-ebf-orange"/> Gestion Flash Info</h2>
                 
                 <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4">
                     <div className="flex gap-2 mb-2">
                         <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Nouveau message..." className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-ebf-orange outline-none" />
                         <select value={type} onChange={(e) => setType(e.target.value)} className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-ebf-orange outline-none">
                             <option value="info">Info</option>
                             <option value="alert">Alerte</option>
                             <option value="success">Succès</option>
                         </select>
                         <button onClick={handleSave} className="bg-green-600 text-white px-4 rounded hover:bg-green-700 transition">Ajouter</button>
                     </div>
                 </div>

                 <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                     {messages.filter((m: any) => m.isManual).length === 0 ? <p className="text-gray-400 text-center italic">Aucun message manuel configuré.</p> : messages.filter((m: any) => m.isManual).map((m: any) => (
                         <div key={m.id} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded shadow-sm">
                             <div className="flex items-center gap-3">
                                 <span className={`w-2 h-2 rounded-full ${m.type === 'alert' ? 'bg-red-500' : m.type === 'success' ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                                 <span className="text-sm font-medium text-gray-800">{m.text}</span>
                             </div>
                             <button onClick={() => onDeleteMessage(m.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                         </div>
                     ))}
                 </div>
            </div>
        </div>
    );
};

const AddModal = ({ isOpen, onClose, config, onSubmit, loading }: any) => {
    const [formData, setFormData] = useState<any>({});
    
    useEffect(() => {
        setFormData({});
    }, [isOpen]);

    if(!isOpen || !config) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-