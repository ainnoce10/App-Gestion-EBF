
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  LayoutDashboard, Wrench, Briefcase, ShoppingCart, Menu, X, Bell, Search, Settings,
  HardHat, DollarSign, LogOut, Calculator, Users, Calendar, FolderOpen, Truck, 
  FileText, UserCheck, CreditCard, Archive, ShieldCheck, ClipboardList, ArrowLeft, ChevronRight, Mic, Send, Save, Plus, CheckCircle, Trash2, User, HelpCircle, Moon, Play, StopCircle, RefreshCw, FileInput, MapPin, Volume2, Megaphone, AlertCircle, Filter, TrendingUp, Edit, ArrowUp, ArrowDown, AlertTriangle, Loader2, Mail, Lock, UserPlus, ScanFace, Fingerprint, Phone, CheckSquare, Key, MoveUp, MoveDown, Eye, EyeOff, Sparkles, Target, RefreshCcw, Shield, Camera, Award, Unlock, Smartphone, Image
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { DetailedSynthesis } from './components/DetailedSynthesis';
import { Site, Period, TickerMessage, StatData, DailyReport, Intervention, StockItem, Transaction, Profile, Role, Notification, Technician, UserPermissions } from './types';
import { supabase } from './services/supabaseClient';
import { MOCK_STATS, MOCK_REPORTS, MOCK_TECHNICIANS, MOCK_STOCK, MOCK_INTERVENTIONS, DEFAULT_TICKER_MESSAGES } from './constants';

// --- Types for Navigation & Forms ---
interface ModuleAction {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  path: string;
  color: string;
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
      { name: 'method', label: 'Méthode', type: 'select', options: ['Form'] }
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
    { id: 'interventions', label: 'Interventions', description: 'Planning des interventions', icon: Wrench, path: '/techniciens/interventions', color: 'bg-orange-500' },
    { id: 'rapports', label: 'Rapports Journaliers', description: 'Vocal ou Formulaire détaillé', icon: FileText, path: '/techniciens/rapports', color: 'bg-gray-700' },
    { id: 'chantiers', label: 'Chantiers', description: 'Suivi & Exécution', icon: ShieldCheck, path: '/techniciens/chantiers', color: 'bg-green-600' },
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

// --- Module Placeholder (SANS RESTRICTION) ---
const ModulePlaceholder = ({ title, subtitle, items = [], onBack, color, currentSite, currentPeriod, onAdd, onDelete }: any) => {
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
                        </h2>
                        <p className="text-gray-500">{subtitle}</p>
                    </div>
                </div>
                {onAdd && (
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
                                {onDelete && <th className="p-4 text-right text-xs font-bold uppercase text-gray-500 dark:text-gray-300">Actions</th>}
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
                                            {item.description || item.specialty || item.unit || item.category || item.supplier || item.location || '-'}
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
                                                    {item.quantity || 0} {item.unit}
                                                </span>
                                            )}
                                        </td>
                                        {onDelete && (
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

// --- Report Mode Selector (SANS RESTRICTION) ---
const ReportModeSelector = ({ reports, onSelectMode, onBack, onViewReport }: any) => {
    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="p-2 bg-white rounded-full hover:bg-orange-50 shadow-sm transition border border-gray-100"><ArrowLeft size={20} className="text-gray-600 hover:text-ebf-orange"/></button>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    Rapports Journaliers
                </h2>
            </div>

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

// --- SETTINGS MODAL (SIMPLE) ---
const SettingsModal = ({ isOpen, onClose, userProfile, onUpdateProfile, onLogout }: any) => {
    const [editName, setEditName] = useState(userProfile?.full_name || '');
    const [editPhone, setEditPhone] = useState(userProfile?.phone || '');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSaveProfile = async () => {
        setLoading(true);
        try {
            const updates = { 
                id: userProfile.id,
                full_name: editName,
                phone: editPhone,
                updated_at: new Date()
            };
            const { error } = await supabase.from('profiles').upsert(updates);
            if (error) throw error;
            onUpdateProfile({ ...userProfile, full_name: editName, phone: editPhone });
            alert('Profil mis à jour !');
        } catch (error) {
            alert('Erreur lors de la mise à jour.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-gray-800 rounded-xl w-full max-w-md shadow-2xl animate-fade-in flex flex-col p-6">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-red-500"><X size={20}/></button>
                <h3 className="font-bold text-xl mb-6 flex items-center gap-2 text-gray-800 dark:text-white"><Settings className="text-ebf-orange"/> Paramètres</h3>
                
                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nom Complet</label>
                        <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full p-2 border rounded-lg" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Téléphone</label>
                        <input type="text" value={editPhone} onChange={e => setEditPhone(e.target.value)} className="w-full p-2 border rounded-lg" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                        <input type="text" value={userProfile?.email} disabled className="w-full p-2 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed" />
                    </div>
                </div>

                <div className="flex gap-4">
                     <button onClick={handleSaveProfile} disabled={loading} className="flex-1 py-2 bg-ebf-orange text-white rounded-lg font-bold shadow hover:bg-orange-600 transition disabled:opacity-50">
                        {loading ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                    <button onClick={onLogout} className="flex-1 py-2 border border-red-200 text-red-500 hover:bg-red-50 rounded-lg font-bold">
                        Déconnexion
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Login Screen (SIMPLE) ---
const LoginScreen = ({ onLoginSuccess }: { onLoginSuccess: () => void }) => {
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [site, setSite] = useState<Site>(Site.ABIDJAN);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccessMsg('');

    const cleanIdentifier = identifier.trim();
    const cleanPassword = password.trim();
    const cleanName = fullName.trim();

    try {
      if (isSignUp) {
        // Inscription Simple
        const metadata = { full_name: cleanName, role: 'Membre', site: site }; 
        let signUpResp;
        if (authMethod === 'email') {
          signUpResp = await supabase.auth.signUp({ email: cleanIdentifier, password: cleanPassword, options: { data: metadata } });
        } else {
          signUpResp = await supabase.auth.signUp({ phone: cleanIdentifier, password: cleanPassword, options: { data: metadata } });
        }

        if (signUpResp.error) throw signUpResp.error;

        if (signUpResp.data.session) {
             const userId = signUpResp.data.user?.id;
             if (userId) {
                 await supabase.from('profiles').upsert([{
                     id: userId,
                     email: authMethod === 'email' ? cleanIdentifier : '',
                     phone: authMethod === 'phone' ? cleanIdentifier : '',
                     full_name: cleanName,
                     role: 'Membre',
                     site: site
                 }]);
             }
             onLoginSuccess();
        } else {
             // Fallback si pas de session auto (rare si config ok)
             setSuccessMsg("Inscription réussie ! Connectez-vous.");
             setIsSignUp(false);
        }

      } else {
        // Connexion Simple
        const { error: err } = await supabase.auth.signInWithPassword(
            authMethod === 'email' ? { email: cleanIdentifier, password: cleanPassword } : { phone: cleanIdentifier, password: cleanPassword }
        );
        if (err) throw err;
        onLoginSuccess();
      }
    } catch (err: any) {
        console.error("Auth Error:", err);
        setError(err.message || "Erreur de connexion/inscription");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ebf-pattern p-4 font-sans relative">
       <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-orange-500/10 pointer-events-none"></div>
       <div className="glass-panel p-8 md:p-10 rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden animate-fade-in border-t-4 border-ebf-orange">
          <div className="flex flex-col items-center mb-8">
             <div className="bg-white p-4 shadow-lg mb-4">
                 <EbfLogo size="normal" />
             </div>
             <h2 className="text-2xl font-extrabold text-gray-800 mt-2 tracking-tight">
                 {isSignUp ? "Créer un compte" : "Connexion EBF"}
             </h2>
             <p className="text-gray-500 text-sm mt-1 font-medium">Gérez vos activités en temps réel</p>
          </div>
          {error && (<div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded-r mb-6 text-sm font-medium flex items-center gap-2 animate-slide-in shadow-sm"><AlertCircle size={18} className="flex-shrink-0"/> <span>{error}</span></div>)}
          {successMsg && (<div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-3 rounded-r mb-6 text-sm font-medium flex items-center gap-2 animate-slide-in shadow-sm"><CheckCircle size={18} className="flex-shrink-0"/> <span>{successMsg}</span></div>)}
          
            <div className="flex p-1 bg-gray-100 rounded-lg mb-6 shadow-inner">
               <button onClick={() => setAuthMethod('email')} className={`flex-1 py-2 rounded-md text-sm font-bold transition-all duration-300 ${authMethod === 'email' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Email</button>
               <button onClick={() => setAuthMethod('phone')} className={`flex-1 py-2 rounded-md text-sm font-bold transition-all duration-300 ${authMethod === 'phone' ? 'bg-white text-ebf-orange shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Téléphone</button>
            </div>
          
          <form onSubmit={handleAuth} className="space-y-4">
                {isSignUp && (
                    <div className="space-y-4 animate-fade-in">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1">Nom Complet</label>
                            <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-ebf-orange focus:border-transparent outline-none transition text-gray-900 font-medium shadow-sm" placeholder="Ex: Jean Kouassi" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1">Site</label>
                            <select value={site} onChange={e => setSite(e.target.value as Site)} className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-ebf-orange outline-none text-gray-900 font-medium appearance-none cursor-pointer shadow-sm">
                                <option value="Abidjan">Abidjan</option>
                                <option value="Bouaké">Bouaké</option>
                            </select>
                        </div>
                    </div>
                )}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1">{authMethod === 'email' ? 'Adresse Email' : 'Numéro de Téléphone'}</label>
                    <input required value={identifier} onChange={e => setIdentifier(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-ebf-orange focus:border-transparent outline-none transition text-gray-900 font-medium shadow-sm" placeholder={authMethod === 'email' ? 'exemple@ebf.ci' : '0707070707'} />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1">Mot de passe</label>
                    <div className="relative">
                        <input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-ebf-orange focus:border-transparent outline-none transition text-gray-900 font-medium shadow-sm" placeholder="••••••••" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                             {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-ebf-orange to-orange-600 text-white font-bold py-3.5 rounded-xl hover:shadow-lg hover:from-orange-600 hover:to-orange-700 transition duration-300 transform hover:-translate-y-0.5 mt-2 flex items-center justify-center gap-2 shadow-orange-200 disabled:opacity-70 disabled:cursor-not-allowed">
                    {loading ? <Loader2 className="animate-spin" size={20}/> : (isSignUp ? "Créer mon compte" : "Se Connecter")}
                </button>
            </form>
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
             <button onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccessMsg(''); }} className="text-sm font-semibold text-gray-500 hover:text-orange-600 transition">
                {isSignUp ? "Déjà un compte ? Se connecter" : "Pas encore de compte ? S'inscrire"}
             </button>
          </div>
       </div>
    </div>
  );
};

const App = () => {
    const [session, setSession] = useState<any>(null);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [currentPath, setCurrentPath] = useState('/');
    const [currentSite, setCurrentSite] = useState<Site>(Site.GLOBAL);
    const [currentPeriod, setCurrentPeriod] = useState<Period>(Period.DAY);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // --- REAL-TIME DATA STATE FOR ALL MODULES ---
    const [stats, setStats] = useState<StatData[]>(MOCK_STATS);
    const [reports, setReports] = useState<DailyReport[]>(MOCK_REPORTS);
    const [technicians, setTechnicians] = useState<Technician[]>(MOCK_TECHNICIANS);
    const [stock, setStock] = useState<StockItem[]>(MOCK_STOCK);
    const [interventions, setInterventions] = useState<Intervention[]>(MOCK_INTERVENTIONS);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    
    // NOUVEAUX ÉTATS POUR LES AUTRES MODULES
    const [employees, setEmployees] = useState<any[]>([]);
    const [payrolls, setPayrolls] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [purchases, setPurchases] = useState<any[]>([]);
    const [chantiers, setChantiers] = useState<any[]>([]);
    const [caisse, setCaisse] = useState<any[]>([]);

    const [tickerMessages, setTickerMessages] = useState<TickerMessage[]>(DEFAULT_TICKER_MESSAGES);
    const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);

    // Fetch session & Profile
    useEffect(() => {
        const initSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            if (session?.user) {
                const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
                if (data) setUserProfile(data);
            }
        };
        initSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            if (session?.user) {
                const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
                if (data) setUserProfile(data);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // --- FETCH DATA FOR ALL TABLES ---
    useEffect(() => {
        if (!session) return;

        const fetchData = async () => {
             // 1. Basic Data
             const { data: r } = await supabase.from('reports').select('*');
             if(r) setReports(r);
             
             const { data: t } = await supabase.from('technicians').select('*');
             if(t) setTechnicians(t);

             const { data: s } = await supabase.from('stocks').select('*');
             if(s) setStock(s);

             const { data: i } = await supabase.from('interventions').select('*');
             if(i) setInterventions(i);

             const { data: trans } = await supabase.from('transactions').select('*');
             if(trans) setTransactions(trans);

             // 2. Extended Modules
             const { data: emp } = await supabase.from('employees').select('*');
             if(emp) setEmployees(emp);

             const { data: pay } = await supabase.from('payrolls').select('*');
             if(pay) setPayrolls(pay);

             const { data: cli } = await supabase.from('clients').select('*');
             if(cli) setClients(cli);

             const { data: sup } = await supabase.from('suppliers').select('*');
             if(sup) setSuppliers(sup);

             const { data: pur } = await supabase.from('purchases').select('*');
             if(pur) setPurchases(pur);

             const { data: chan } = await supabase.from('construction_sites').select('*');
             if(chan) setChantiers(chan);
             
             const { data: cai } = await supabase.from('caisse').select('*');
             if(cai) setCaisse(cai);
        };

        fetchData();

        // REALTIME SUBSCRIPTIONS FOR ALL
        const channels = [
            supabase.channel('public:reports').on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, payload => {
                if(payload.eventType === 'INSERT') setReports(prev => [payload.new as DailyReport, ...prev]);
                if(payload.eventType === 'DELETE') setReports(prev => prev.filter(i => i.id !== payload.old.id));
            }).subscribe(),
            supabase.channel('public:interventions').on('postgres_changes', { event: '*', schema: 'public', table: 'interventions' }, payload => {
                if(payload.eventType === 'INSERT') setInterventions(prev => [payload.new as Intervention, ...prev]);
            }).subscribe(),
            supabase.channel('public:employees').on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, payload => {
                if(payload.eventType === 'INSERT') setEmployees(prev => [payload.new, ...prev]);
            }).subscribe(),
             supabase.channel('public:construction_sites').on('postgres_changes', { event: '*', schema: 'public', table: 'construction_sites' }, payload => {
                if(payload.eventType === 'INSERT') setChantiers(prev => [payload.new, ...prev]);
            }).subscribe()
        ];

        return () => { channels.forEach(c => c.unsubscribe()); };

    }, [session]);

    // Calculate Real-time Stats based on Reports + Transactions + Interventions
    const calculatedStats = useMemo(() => {
        const tempStats: StatData[] = [];
        
        transactions.forEach(t => {
            let stat = tempStats.find(s => s.date === t.date && s.site === t.site);
            if (!stat) {
                stat = { date: t.date, site: t.site, revenue: 0, expenses: 0, profit: 0, interventions: 0 };
                tempStats.push(stat);
            }
            if (t.type === 'Recette') stat.revenue += t.amount;
            if (t.type === 'Dépense') stat.expenses += t.amount;
        });

        reports.forEach(r => {
            if(!r.date) return;
            let stat = tempStats.find(s => s.date === r.date && s.site === r.site);
            if (!stat) {
                 stat = { date: r.date, site: r.site, revenue: 0, expenses: 0, profit: 0, interventions: 0 };
                 tempStats.push(stat);
            }
            if(r.revenue) stat.revenue += r.revenue;
            if(r.expenses) stat.expenses += r.expenses;
        });
        
        interventions.forEach(i => {
             let stat = tempStats.find(s => s.date === i.date && s.site === i.site);
             if (!stat) {
                 stat = { date: i.date, site: i.site, revenue: 0, expenses: 0, profit: 0, interventions: 0 };
                 tempStats.push(stat);
             }
             stat.interventions += 1;
        });

        tempStats.forEach(s => s.profit = s.revenue - s.expenses);
        return tempStats.sort((a,b) => b.date.localeCompare(a.date));

    }, [transactions, reports, interventions]);

    const displayStats = calculatedStats.length > 0 ? calculatedStats : stats;
    
    // Auto Ticker Logic
    const generateAutoTickerMessages = (data: StatData[]) => {
      const messages: TickerMessage[] = [];
      const totalRevenue = data.reduce((acc, curr) => acc + curr.revenue, 0);
      const totalProfit = data.reduce((acc, curr) => acc + curr.profit, 0);
      
      if (totalRevenue > 0) {
        const profitMargin = (totalProfit / totalRevenue) * 100;
        if (profitMargin > 0) {
          messages.push({
            id: 'auto-profit',
            text: `👏 Performance : Marge bénéficiaire de +${profitMargin.toFixed(1)}% enregistrée.`,
            type: 'success',
            display_order: 1,
            isManual: false
          });
        } else {
           messages.push({
            id: 'auto-loss',
            text: `⚠️ Attention : Marge négative de ${profitMargin.toFixed(1)}% sur la période.`,
            type: 'alert',
            display_order: 1,
            isManual: false
          });
        }
      }
      setTickerMessages(prev => {
        const manuals = prev.filter(m => m.isManual);
        return [...manuals, ...messages];
      });
    };

    useEffect(() => {
      if (displayStats.length > 0) generateAutoTickerMessages(displayStats);
      else {
         setTickerMessages([{
            id: 'welcome-default', 
            text: 'Bienvenue sur EBF Manager. Le système est prêt et connecté.', 
            type: 'info', 
            display_order: 0, 
            isManual: false 
        }]);
      }
    }, [displayStats]);


    const handleLogout = async () => {
        await supabase.auth.signOut();
        setSession(null);
    };

    const handleDeleteReport = (id: string) => {
        setReports(prev => prev.filter(r => r.id !== id));
    };

    // Generic Handlers for CRUD (Simulated for UI, needs Supabase wiring for real app)
    const handleAdd = (path: string) => {
        alert("Fonctionnalité d'ajout activée pour " + path);
    };
    const handleDelete = (item: any) => {
        if(confirm("Supprimer cet élément ?")) {
             alert("Élément supprimé");
        }
    };


    if (!session) {
        return <LoginScreen onLoginSuccess={() => supabase.auth.getSession().then(({ data: { session } }) => setSession(session))} />;
    }

    // Router Logic
    const renderContent = () => {
        // ACCES TOTAL PAR DÉFAUT
        const canAdd = () => handleAdd(currentPath);
        const canDelete = (item: any) => handleDelete(item);

        if (currentPath === '/') {
            return <Dashboard 
                     data={displayStats} 
                     reports={reports} 
                     tickerMessages={tickerMessages} 
                     stock={stock}
                     currentSite={currentSite} 
                     currentPeriod={currentPeriod} 
                     onSiteChange={setCurrentSite} 
                     onPeriodChange={setCurrentPeriod}
                     onNavigate={setCurrentPath}
                     onDeleteReport={handleDeleteReport}
                   />;
        }
        if (currentPath === '/synthesis') {
            return <DetailedSynthesis 
                     data={displayStats} 
                     reports={reports} 
                     currentSite={currentSite} 
                     currentPeriod={currentPeriod} 
                     onSiteChange={setCurrentSite} 
                     onPeriodChange={setCurrentPeriod}
                     onNavigate={setCurrentPath}
                     onViewReport={setSelectedReport}
                   />;
        }

        // --- MODULES (Tous actifs et modifiables) ---
        if (currentPath === '/technicians') return <ModulePlaceholder title="Techniciens" subtitle="Gestion des équipes" items={technicians} onBack={() => setCurrentPath('/')} color="bg-gray-600" currentSite={currentSite} currentPeriod={currentPeriod} onAdd={canAdd} onDelete={canDelete} />;
        if (currentPath === '/technicians/interventions') return <ModulePlaceholder title="Interventions" subtitle="Planning" items={interventions} onBack={() => setCurrentPath('/technicians')} color="bg-orange-500" currentSite={currentSite} currentPeriod={currentPeriod} onAdd={canAdd} onDelete={canDelete} />;
        if (currentPath === '/technicians/rapports') return <ReportModeSelector reports={reports} onSelectMode={() => {}} onBack={() => setCurrentPath('/technicians')} onViewReport={setSelectedReport} />;
        if (currentPath === '/technicians/chantiers') return <ModulePlaceholder title="Chantiers" subtitle="Suivi des chantiers" items={chantiers} onBack={() => setCurrentPath('/technicians')} color="bg-green-600" currentSite={currentSite} currentPeriod={currentPeriod} onAdd={canAdd} onDelete={canDelete} />;

        if (currentPath === '/comptabilite/bilan') return <ModulePlaceholder title="Bilan Financier" subtitle="Transactions" items={transactions} onBack={() => setCurrentPath('/comptabilite')} color="bg-green-600" currentSite={currentSite} currentPeriod={currentPeriod} onAdd={canAdd} onDelete={canDelete} />;
        if (currentPath === '/comptabilite/rh') return <ModulePlaceholder title="Ressources Humaines" subtitle="Employés" items={employees} onBack={() => setCurrentPath('/comptabilite')} color="bg-purple-600" currentSite={currentSite} currentPeriod={currentPeriod} onAdd={canAdd} onDelete={canDelete} />;
        if (currentPath === '/comptabilite/paie') return <ModulePlaceholder title="Paie & Salaires" subtitle="Historique" items={payrolls} onBack={() => setCurrentPath('/comptabilite')} color="bg-orange-500" currentSite={currentSite} currentPeriod={currentPeriod} onAdd={canAdd} onDelete={canDelete} />;

        if (currentPath === '/secretariat/clients') return <ModulePlaceholder title="Clients" subtitle="Base de données" items={clients} onBack={() => setCurrentPath('/secretariat')} color="bg-blue-500" currentSite={currentSite} currentPeriod={currentPeriod} onAdd={canAdd} onDelete={canDelete} />;
        if (currentPath === '/secretariat/caisse') return <ModulePlaceholder title="Petite Caisse" subtitle="Flux journaliers" items={caisse} onBack={() => setCurrentPath('/secretariat')} color="bg-gray-600" currentSite={currentSite} currentPeriod={currentPeriod} onAdd={canAdd} onDelete={canDelete} />;
        if (currentPath === '/secretariat/planning') return <ModulePlaceholder title="Planning Global" subtitle="Vue Agenda" items={interventions} onBack={() => setCurrentPath('/secretariat')} color="bg-indigo-500" currentSite={currentSite} currentPeriod={currentPeriod} onAdd={canAdd} onDelete={canDelete} />;

        if (currentPath === '/quincaillerie/stocks') return <ModulePlaceholder title="Stocks" subtitle="Inventaire matériel" items={stock} onBack={() => setCurrentPath('/quincaillerie')} color="bg-orange-600" currentSite={currentSite} currentPeriod={currentPeriod} onAdd={canAdd} onDelete={canDelete} />;
        if (currentPath === '/quincaillerie/fournisseurs') return <ModulePlaceholder title="Fournisseurs" subtitle="Partenaires" items={suppliers} onBack={() => setCurrentPath('/quincaillerie')} color="bg-green-600" currentSite={currentSite} currentPeriod={currentPeriod} onAdd={canAdd} onDelete={canDelete} />;
        if (currentPath === '/quincaillerie/achats') return <ModulePlaceholder title="Achats" subtitle="Commandes" items={purchases} onBack={() => setCurrentPath('/quincaillerie')} color="bg-red-500" currentSite={currentSite} currentPeriod={currentPeriod} onAdd={canAdd} onDelete={canDelete} />;

        if (currentPath === '/equipe') return <ModulePlaceholder title="Notre Équipe" subtitle="Liste des membres" items={technicians} onBack={() => setCurrentPath('/')} color="bg-gray-600" currentSite={currentSite} currentPeriod={currentPeriod} onAdd={canAdd} onDelete={canDelete} />;

        // Fallback
        const activeModule = Object.values(MODULE_ACTIONS).flat().find(m => m.path === currentPath);
        if (activeModule) {
             return <ModulePlaceholder title={activeModule.label} subtitle={activeModule.description} items={[]} onBack={() => setCurrentPath('/')} color={activeModule.color.replace('bg-', 'bg-')} currentSite={currentSite} currentPeriod={currentPeriod} onAdd={canAdd} onDelete={canDelete} />;
        }

        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Wrench size={48} className="mb-4 opacity-20" />
                <h3 className="text-lg font-bold">Module inconnu</h3>
                <button onClick={() => setCurrentPath('/')} className="mt-4 text-ebf-orange hover:underline">Retour Accueil</button>
            </div>
        );
    };

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden font-sans text-gray-900">
            {/* Sidebar Mobile Overlay */}
            {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />}
            
            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-green-950 shadow-2xl transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col border-r border-gray-800`}>
                <div className="p-6 border-b border-gray-800 flex flex-col items-center">
                    <div className="bg-white p-2 mb-2">
                         <EbfLogo size="small" />
                    </div>
                    <p className="text-xs font-bold text-gray-400 mt-2 tracking-widest uppercase">Manager Pro</p>
                </div>
                
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                    {MAIN_MENU.map(item => (
                        <div key={item.id}>
                            <button 
                                onClick={() => {
                                    if (item.path !== currentPath) {
                                        setCurrentPath(item.path);
                                    }
                                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                                }}
                                className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 group ${currentPath.startsWith(item.path) && item.path !== '/' ? 'bg-ebf-orange text-white font-bold shadow-lg' : (currentPath === item.path ? 'bg-ebf-orange text-white font-bold shadow-lg' : 'text-gray-300 hover:bg-gray-800')}`}
                            >
                                <item.icon size={20} className={`mr-3 transition-colors ${currentPath === item.path || currentPath.startsWith(item.path) ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                                <span className="flex-1 text-left">{item.label}</span>
                                {currentPath.startsWith(item.path) && item.path !== '/' && <ChevronRight size={16} className="text-white" />}
                            </button>
                            
                            {/* Submenu rendering if active */}
                            {currentPath.startsWith(item.path) && item.path !== '/' && MODULE_ACTIONS[item.id] && (
                                <div className="ml-9 mt-1 space-y-1 border-l-2 border-gray-700 pl-2 animate-fade-in">
                                    {MODULE_ACTIONS[item.id].map(sub => (
                                        <button 
                                            key={sub.id}
                                            onClick={() => { setCurrentPath(sub.path); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
                                            className={`w-full text-left p-2 rounded-md text-sm transition flex items-center ${currentPath === sub.path ? 'text-ebf-orange font-bold bg-gray-800 shadow-sm' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full mr-2 ${currentPath === sub.path ? 'bg-ebf-orange' : 'bg-gray-500'}`}></span>
                                            {sub.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-800 bg-black/20">
                     <div className="mb-4">
                        <button 
                            onClick={() => setShowSettings(true)}
                            className={`w-full flex items-center justify-between p-3 rounded-lg text-sm font-bold transition bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white`}
                        >
                            <span className="flex items-center gap-2">
                                <Settings size={18}/> Paramètres
                            </span>
                        </button>
                     </div>

                    <div className="flex items-center mb-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-600 to-gray-700 flex items-center justify-center text-white font-bold text-xs shadow-md border border-gray-500">
                            <User size={14}/>
                        </div>
                        <div className="ml-3 truncate">
                            <p className="text-sm font-bold text-white truncate w-32">{userProfile?.full_name || 'Utilisateur'}</p>
                            <p className="text-xs text-green-500 font-medium">En ligne</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-gray-900 relative">
                {/* Header Mobile */}
                <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 py-3 px-4 flex items-center justify-between md:hidden z-30 sticky top-0">
                    <div className="flex items-center">
                        <button onClick={() => setIsSidebarOpen(true)} className="p-2 mr-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                            <Menu size={24} />
                        </button>
                        <span className="font-bold text-gray-800">EBF Manager</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-ebf-orange">
                        <Bell size={18} />
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
                    <div className="max-w-7xl mx-auto">
                        {renderContent()}
                    </div>
                </main>
            </div>
            
            {/* SETTINGS MODAL */}
            <SettingsModal 
                isOpen={showSettings} 
                onClose={() => setShowSettings(false)}
                userProfile={userProfile}
                onUpdateProfile={setUserProfile}
                onLogout={handleLogout}
            />

            {/* Modals placed at root level */}
            {selectedReport && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setSelectedReport(null)} />
                    <div className="relative bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg p-6 shadow-2xl animate-fade-in">
                        <button onClick={() => setSelectedReport(null)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500"><X size={20}/></button>
                        <h3 className="text-xl font-bold text-green-900 dark:text-white mb-4 flex items-center gap-2">
                            <FileText size={20} className="text-ebf-orange"/> Détail Rapport
                        </h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500 uppercase font-bold">Technicien</p>
                                    <p className="font-bold text-gray-800">{selectedReport.technicianName}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500 uppercase font-bold">Date</p>
                                    <p className="font-bold text-gray-800">{selectedReport.date}</p>
                                </div>
                            </div>
                            <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg">
                                <p className="text-xs text-orange-800 uppercase font-bold mb-1">Contenu</p>
                                <p className="text-gray-800 italic">"{selectedReport.content}"</p>
                            </div>
                            {selectedReport.revenue !== undefined && (
                                <div className="flex justify-between items-center border-t border-gray-100 pt-3">
                                    <span className="text-sm text-gray-500">Recette déclarée</span>
                                    <span className="font-bold text-green-600 text-lg">{selectedReport.revenue.toLocaleString()} F</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
