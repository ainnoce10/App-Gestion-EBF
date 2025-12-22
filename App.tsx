
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  LayoutDashboard, Wrench, Briefcase, ShoppingCart, Menu, X, Bell, Search, Settings,
  HardHat, DollarSign, LogOut, Calculator, Users, Calendar, FolderOpen, Truck, 
  FileText, UserCheck, CreditCard, Archive, ShieldCheck, ClipboardList, ArrowLeft, ChevronRight, Mic, Send, Save, Plus, CheckCircle, Trash2, User, HelpCircle, Moon, Play, StopCircle, RefreshCw, FileInput, MapPin, Volume2, Megaphone, AlertCircle, Filter, TrendingUp, Edit, ArrowUp, ArrowDown, AlertTriangle, Loader2, Mail, Lock, UserPlus, ScanFace, Fingerprint, Phone, CheckSquare, Key, MoveUp, MoveDown, Eye, EyeOff, Sparkles, Target, RefreshCcw, Shield, ExternalLink, Image as ImageIcon, Tag
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { DetailedSynthesis } from './components/DetailedSynthesis';
import { Site, Period, TickerMessage, StatData, DailyReport, Intervention, StockItem, Transaction, Profile, Role, Notification, Technician } from './types';
import { supabase } from './services/supabaseClient';
import { MOCK_STOCK, MOCK_INTERVENTIONS, MOCK_REPORTS, MOCK_TECHNICIANS } from './constants';

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

// --- CONFIGURATION DES FORMULAIRES ---
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
      { name: 'category', label: 'Catégorie', type: 'select', options: ['Électricité', 'Plomberie', 'Froid', 'Outillage', 'Sécurité'] },
      { name: 'price', label: 'Prix Unitaire (FCFA)', type: 'number' },
      { name: 'quantity', label: 'Quantité Initiale', type: 'number' },
      { name: 'unit', label: 'Unité (ex: pcs, m)', type: 'text' },
      { name: 'threshold', label: 'Seuil Alerte', type: 'number' },
      { name: 'site', label: 'Site', type: 'select', options: ['Abidjan', 'Bouaké'] }
    ]
  }
};

const MAIN_MENU: MenuItem[] = [
  { id: 'accueil', label: 'Accueil', icon: LayoutDashboard, path: '/', description: 'Vue d\'ensemble', colorClass: 'text-orange-500' },
  { id: 'techniciens', label: 'Techniciens', icon: HardHat, path: '/techniciens', description: 'Gestion opérationnelle', colorClass: 'text-gray-600' },
  { id: 'comptabilite', label: 'Comptabilité', icon: Calculator, path: '/comptabilite', description: 'Finance & RH', colorClass: 'text-gray-600' },
  { id: 'secretariat', label: 'Secrétariat', icon: FolderOpen, path: '/secretariat', description: 'Administration', colorClass: 'text-gray-600' },
  { id: 'quincaillerie', label: 'Quincaillerie', icon: ShoppingCart, path: '/quincaillerie', description: 'Logistique & Stocks', colorClass: 'text-gray-600' },
  { id: 'equipe', label: 'Notre Équipe', icon: Users, path: '/equipe', description: 'Membres & Rôles', colorClass: 'text-gray-600' },
];

const MODULE_ACTIONS: Record<string, ModuleAction[]> = {
  techniciens: [
    { id: 'interventions', label: 'Interventions', description: 'Planning des interventions', icon: Wrench, path: '/techniciens/interventions', color: 'bg-orange-500' },
    { id: 'rapports', label: 'Rapports Journaliers', description: 'Vocal ou Formulaire détaillé', icon: FileText, path: '/techniciens/rapports', color: 'bg-gray-700' },
    { id: 'materiel', label: 'Matériel Affecté', description: 'Inventaire & Affectation', icon: Truck, path: '/techniciens/materiel', color: 'bg-blue-600' },
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
    { id: 'stocks', label: 'Catalogue Matériel', description: 'Gestion & Vente directe', icon: ClipboardList, path: '/quincaillerie/stocks', color: 'bg-orange-600' },
    { id: 'fournisseurs', label: 'Fournisseurs', description: 'Liste et contacts partenaires', icon: Truck, path: '/quincaillerie/fournisseurs', color: 'bg-green-600' },
    { id: 'achats', label: 'Bons d\'achat', description: 'Historique des commandes', icon: FileText, path: '/quincaillerie/achats', color: 'bg-red-500' },
  ]
};

// --- EBF Vector Logo ---
const EbfSvgLogo = ({ size }: { size: 'small' | 'normal' | 'large' }) => {
    const scale = size === 'small' ? 0.6 : size === 'large' ? 1.5 : 1;
    const width = 200 * scale;
    const height = 100 * scale;
    return (
        <svg width={width} height={height} viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="30" fill="#FF8C00" />
            <text x="110" y="55" fontFamily="Arial" fontWeight="900" fontSize="40" fill="#008000">E</text>
            <text x="145" y="55" fontFamily="Arial" fontWeight="900" fontSize="40" fill="#FF0000">B</text>
            <text x="180" y="55" fontFamily="Arial" fontWeight="900" fontSize="40" fill="#008000">F</text>
        </svg>
    );
};

const EbfLogo = ({ size = 'normal' }: { size?: 'small' | 'normal' | 'large' }) => <EbfSvgLogo size={size} />;

// --- Helper pour le filtrage par période ---
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

// --- CATALOGUE QUINCAILLERIE (AMÉLIORÉ) ---
const HardwareCatalog = ({ items, onBack, onAddToCart, currentSite }: any) => {
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('Tous');
    const [maxPrice, setMaxPrice] = useState(1000000);
    const [onlyInStock, setOnlyInStock] = useState(false);

    const categories = ['Tous', ...Array.from(new Set(items.map((i: any) => i.category)))];

    const filteredItems = items.filter((item: any) => {
        const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                             (item.description && item.description.toLowerCase().includes(search.toLowerCase()));
        const matchesCategory = category === 'Tous' || item.category === category;
        const matchesPrice = item.price <= maxPrice;
        const matchesStock = onlyInStock ? item.quantity > 0 : true;
        const matchesSite = currentSite === Site.GLOBAL || item.site === currentSite;
        return matchesSearch && matchesCategory && matchesPrice && matchesStock && matchesSite;
    });

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header avec recherche */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 bg-white rounded-full hover:bg-orange-50 shadow-sm transition border border-gray-100">
                        <ArrowLeft size={20} className="text-gray-600 hover:text-ebf-orange"/>
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Catalogue Matériel</h2>
                        <p className="text-gray-500 text-sm">Gestion des prix et stocks</p>
                    </div>
                </div>
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-3 text-gray-400" size={18}/>
                    <input 
                        type="text" 
                        placeholder="Rechercher par nom ou description..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-ebf-orange outline-none shadow-sm"
                    />
                </div>
            </div>

            {/* Filtres avancés */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-6">
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-400">CATÉGORIE</label>
                    <select 
                        value={category} 
                        onChange={(e) => setCategory(e.target.value)}
                        className="text-sm font-medium border-none bg-gray-50 rounded-lg p-1.5 focus:ring-0 outline-none"
                    >
                        {categories.map(c => <option key={c as string} value={c as string}>{c as string}</option>)}
                    </select>
                </div>
                <div className="flex flex-col gap-1 min-w-[150px]">
                    <label className="text-[10px] font-bold text-gray-400">PRIX MAX: {maxPrice.toLocaleString()} F</label>
                    <input 
                        type="range" 
                        min="0" 
                        max="200000" 
                        step="5000" 
                        value={maxPrice} 
                        onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                        className="accent-ebf-orange h-1.5"
                    />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={onlyInStock} onChange={() => setOnlyInStock(!onlyInStock)} className="w-4 h-4 accent-ebf-orange" />
                    <span className="text-sm font-bold text-gray-600">En stock</span>
                </label>
            </div>

            {/* Grille des produits */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredItems.map((item: any) => (
                    <div key={item.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col">
                        <div className="relative h-48 bg-gray-100">
                            <img src={item.imageUrl || 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=400&auto=format&fit=crop'} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            <span className="absolute top-2 left-2 bg-white/90 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                                {item.category}
                            </span>
                        </div>
                        <div className="p-4 flex-1 flex flex-col">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-gray-800 dark:text-white text-sm">{item.name}</h3>
                                <span className="text-xs font-black text-green-700 bg-green-50 px-2 py-1 rounded">{item.price.toLocaleString()} F</span>
                            </div>
                            <p className="text-[11px] text-gray-500 mb-4 flex-1 line-clamp-2">{item.description || 'Matériel technique certifié EBF.'}</p>
                            <div className="flex gap-2">
                                <button onClick={() => onAddToCart(item)} className="flex-1 bg-ebf-orange text-white py-2 rounded-lg font-bold text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-orange-600 transition shadow-sm">
                                    <ShoppingCart size={14}/> Ajouter
                                </button>
                                <a href={item.specsUrl || '#'} target="_blank" className="p-2 bg-gray-50 text-gray-400 hover:bg-green-600 hover:text-white rounded-lg transition border border-gray-100" title="Fiche technique">
                                    <FileText size={14}/>
                                </a>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Module Placeholder (Generic Table View) ---
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
                    <div><h2 className="text-2xl font-bold text-gray-800 dark:text-white">{title}</h2><p className="text-gray-500 text-sm">{subtitle}</p></div>
                </div>
                {!readOnly && onAdd && (
                    <button onClick={onAdd} className={`${color} text-white px-4 py-2 rounded-lg font-bold shadow-md hover:opacity-90 transition flex items-center gap-2`}><Plus size={18}/> Ajouter</button>
                )}
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600 text-left">
                        <tr>
                            <th className="p-4 text-xs font-bold uppercase text-gray-400">ID</th>
                            <th className="p-4 text-xs font-bold uppercase text-gray-400">Désignation</th>
                            <th className="p-4 text-xs font-bold uppercase text-gray-400">Détails/Rôle</th>
                            <th className="p-4 text-xs font-bold uppercase text-gray-400">Site</th>
                            <th className="p-4 text-right text-xs font-bold uppercase text-gray-400">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                        {filteredItems.map((item: any) => (
                            <tr key={item.id} className="hover:bg-orange-50/20 transition">
                                <td className="p-4 text-xs font-mono text-gray-400">#{item.id.substring(0, 4)}</td>
                                <td className="p-4 font-bold text-gray-800 dark:text-white">{item.name || item.client || item.label || item.full_name}</td>
                                <td className="p-4 text-gray-600 dark:text-gray-300">{item.description || item.specialty || item.role || item.category || '-'}</td>
                                <td className="p-4"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700">{item.site}</span></td>
                                <td className="p-4 text-right">
                                    <button onClick={() => onDelete(item)} className="p-1.5 text-red-500 hover:bg-red-50 rounded transition"><Trash2 size={16}/></button>
                                </td>
                            </tr>
                        ))}
                        {filteredItems.length === 0 && (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-400">Aucune donnée disponible.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Report Mode Selector ---
const ReportModeSelector = ({ reports, onBack }: any) => {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="p-2 bg-white rounded-full hover:bg-orange-50 shadow-sm border border-gray-100"><ArrowLeft size={20}/></button>
                <h2 className="text-2xl font-bold text-gray-800">Rapports Journaliers</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-8 rounded-2xl shadow-lg flex flex-col items-center gap-4 hover:scale-105 transition group">
                    <div className="p-4 bg-white/20 rounded-full group-hover:bg-white/30 transition"><Mic size={40} /></div>
                    <div className="text-center">
                        <span className="block font-black text-xl mb-1 uppercase tracking-tight">Rapport Vocal</span>
                        <p className="text-blue-100 text-sm">Dictez votre rapport, l'IA l'analyse.</p>
                    </div>
                </button>
                <button className="bg-gradient-to-br from-ebf-orange to-orange-600 text-white p-8 rounded-2xl shadow-lg flex flex-col items-center gap-4 hover:scale-105 transition group">
                    <div className="p-4 bg-white/20 rounded-full group-hover:bg-white/30 transition"><FileText size={40} /></div>
                    <div className="text-center">
                        <span className="block font-black text-xl mb-1 uppercase tracking-tight">Formulaire Détaillé</span>
                        <p className="text-orange-100 text-sm">Saisie manuelle des interventions.</p>
                    </div>
                </button>
            </div>
        </div>
    );
};

// --- App Content & State ---
const AppContent = ({ session, onLogout, userRole, userProfile }: any) => {
  const [currentPath, setCurrentPath] = useState('/');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentSite, setCurrentSite] = useState<Site>(Site.GLOBAL);
  const [currentPeriod, setCurrentPeriod] = useState<Period>(Period.MONTH);
  const [darkMode, setDarkMode] = useState(false);
  const [cart, setCart] = useState<any[]>([]);

  // States pour les données centralisées
  const [stock, setStock] = useState<StockItem[]>(MOCK_STOCK);
  const [reports, setReports] = useState<DailyReport[]>(MOCK_REPORTS);
  const [interventions, setInterventions] = useState<Intervention[]>(MOCK_INTERVENTIONS);
  const [technicians, setTechnicians] = useState<Technician[]>(MOCK_TECHNICIANS);
  const [chantiers, setChantiers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [caisse, setCaisse] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  
  const handleNavigate = (path: string) => { setCurrentPath(path); setIsMenuOpen(false); };
  const toggleTheme = () => { setDarkMode(!darkMode); document.documentElement.classList.toggle('dark'); };
  
  const handleAddToCart = (item: any) => {
      setCart(prev => [...prev, item]);
      alert(`${item.name} ajouté au panier d'affectation !`);
  };

  const renderContent = () => {
     // ACCUEIL & SYNTHÈSE
     if (currentPath === '/') return <Dashboard data={[]} reports={reports} tickerMessages={[]} stock={stock} currentSite={currentSite} currentPeriod={currentPeriod} onSiteChange={setCurrentSite} onPeriodChange={setCurrentPeriod} onNavigate={handleNavigate} onDeleteReport={() => {}} />;
     if (currentPath === '/synthesis') return <DetailedSynthesis data={[]} reports={reports} currentSite={currentSite} currentPeriod={currentPeriod} onSiteChange={setCurrentSite} onPeriodChange={setCurrentPeriod} onNavigate={handleNavigate} onViewReport={() => {}} />;
     
     // SOUS-MENUS - GRILLES DE NAVIGATION
     const section = currentPath.split('/')[1];
     if (MODULE_ACTIONS[section] && currentPath.split('/').length === 2) {
         return (
             <div className="space-y-6 animate-fade-in">
                 <div className="flex items-center gap-2 mb-4">
                     <button onClick={() => handleNavigate('/')} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition"><ArrowLeft size={24} className="text-green-950 dark:text-white"/></button>
                     <h2 className="text-3xl font-black text-green-950 dark:text-white uppercase tracking-tighter">Module {section}</h2>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {MODULE_ACTIONS[section].map((action) => (
                        <button key={action.id} onClick={() => handleNavigate(action.path)} className="bg-white dark:bg-gray-800 hover:bg-orange-50 dark:hover:bg-gray-750 p-6 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 hover:border-orange-200 transition text-left group">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${action.color} text-white shadow-xl transform group-hover:scale-110 transition-transform`}><action.icon size={28} /></div>
                            <h3 className="text-xl font-black mb-1 text-gray-800 dark:text-white group-hover:text-ebf-orange transition-colors">{action.label}</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm leading-snug">{action.description}</p>
                        </button>
                    ))}
                 </div>
             </div>
         );
     }

     // TECHNICIENS
     if (currentPath === '/techniciens/interventions') return <ModulePlaceholder title="Interventions" subtitle="Planning en temps réel" items={interventions} onBack={() => handleNavigate('/techniciens')} color="bg-orange-500" currentSite={currentSite} currentPeriod={currentPeriod} onAdd={() => {}} onDelete={() => {}} />;
     if (currentPath === '/techniciens/rapports') return <ReportModeSelector reports={reports} onBack={() => handleNavigate('/techniciens')} />;
     if (currentPath === '/techniciens/materiel') return <ModulePlaceholder title="Matériel Affecté" subtitle="Inventaire agents" items={stock} onBack={() => handleNavigate('/techniciens')} color="bg-blue-600" currentSite={currentSite} onAdd={() => {}} onDelete={() => {}} />;
     if (currentPath === '/techniciens/chantiers') return <ModulePlaceholder title="Chantiers" subtitle="Suivi d'exécution" items={chantiers} onBack={() => handleNavigate('/techniciens')} color="bg-green-600" currentSite={currentSite} onAdd={() => {}} onDelete={() => {}} />;

     // COMPTABILITÉ
     if (currentPath === '/comptabilite/bilan') return <ModulePlaceholder title="Bilan" subtitle="Journal financier" items={transactions} onBack={() => handleNavigate('/comptabilite')} color="bg-green-600" currentSite={currentSite} currentPeriod={currentPeriod} onAdd={() => {}} onDelete={() => {}} />;
     if (currentPath === '/comptabilite/rh') return <ModulePlaceholder title="Ressources Humaines" subtitle="Personnel" items={employees} onBack={() => handleNavigate('/comptabilite')} color="bg-purple-600" currentSite={currentSite} onAdd={() => {}} onDelete={() => {}} />;
     if (currentPath === '/comptabilite/paie') return <ModulePlaceholder title="Salaires" subtitle="Historique des paies" items={payrolls} onBack={() => handleNavigate('/comptabilite')} color="bg-orange-500" onAdd={() => {}} onDelete={() => {}} />;

     // SECRÉTARIAT
     if (currentPath === '/secretariat/planning') return <div className="p-8 text-center text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">Calendrier en cours de déploiement...<button onClick={() => handleNavigate('/secretariat')} className="block mx-auto mt-4 text-ebf-orange font-bold uppercase text-xs">Retour</button></div>;
     if (currentPath === '/secretariat/clients') return <ModulePlaceholder title="Clients" subtitle="Gestion CRM" items={clients} onBack={() => handleNavigate('/secretariat')} color="bg-blue-500" currentSite={currentSite} onAdd={() => {}} onDelete={() => {}} />;
     if (currentPath === '/secretariat/caisse') return <ModulePlaceholder title="Caisse" subtitle="Petite caisse bureau" items={caisse} onBack={() => handleNavigate('/secretariat')} color="bg-gray-600" onAdd={() => {}} onDelete={() => {}} />;

     // QUINCAILLERIE (LE CATALOGUE DEMANDÉ)
     if (currentPath === '/quincaillerie/stocks') return <HardwareCatalog items={stock} onBack={() => handleNavigate('/quincaillerie')} onAddToCart={handleAddToCart} currentSite={currentSite} />;
     if (currentPath === '/quincaillerie/fournisseurs') return <ModulePlaceholder title="Fournisseurs" subtitle="Partenaires d'achat" items={suppliers} onBack={() => handleNavigate('/quincaillerie')} color="bg-green-600" onAdd={() => {}} onDelete={() => {}} />;
     if (currentPath === '/quincaillerie/achats') return <ModulePlaceholder title="Bons d'Achat" subtitle="Journal des commandes" items={purchases} onBack={() => handleNavigate('/quincaillerie')} color="bg-red-500" onAdd={() => {}} onDelete={() => {}} />;

     // ÉQUIPE
     if (currentPath === '/equipe') return <ModulePlaceholder title="Notre Équipe" subtitle="Staff technique et administratif" items={technicians} onBack={() => handleNavigate('/')} color="bg-indigo-500" currentSite={currentSite} onAdd={() => {}} onDelete={() => {}} />;

     return (
        <div className="p-10 text-center text-gray-400">
            <Wrench size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-bold text-lg">Module "{currentPath}" en cours de maintenance.</p>
            <button onClick={() => handleNavigate('/')} className="mt-4 bg-green-950 text-white px-6 py-2 rounded-lg font-bold shadow-lg">Retour à l'Accueil</button>
        </div>
     );
  };

  return (
    <div className={`flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 ${darkMode ? 'dark' : ''}`}>
        {/* Barre Latérale */}
        <aside className="fixed inset-y-0 left-0 z-40 w-64 bg-green-950 text-white transform lg:translate-x-0 transition-transform shadow-2xl flex flex-col border-r border-white/5">
            <div className="h-24 flex items-center justify-center px-6"><EbfLogo size="normal" /></div>
            <nav className="p-4 space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                {MAIN_MENU.map(item => (
                    <button key={item.id} onClick={() => handleNavigate(item.path)} className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all ${currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path)) ? 'bg-ebf-orange text-white shadow-xl scale-105 font-black' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}>
                        <item.icon size={22} />
                        <span className="text-sm tracking-tight">{item.label}</span>
                    </button>
                ))}
            </nav>
            <div className="p-4 border-t border-white/10">
                <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3.5 text-red-400 hover:bg-red-500/10 rounded-2xl transition font-black uppercase text-xs tracking-widest"><LogOut size={20}/> Déconnexion</button>
            </div>
        </aside>

        {/* Contenu Principal */}
        <div className="flex-1 flex flex-col lg:ml-64 relative overflow-hidden">
             {/* Header Dynamique */}
             <header className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-b h-20 flex items-center justify-between px-8 sticky top-0 z-30 shadow-sm border-gray-100 dark:border-gray-700">
                <div className="flex flex-col">
                    <h1 className="font-black text-2xl text-green-950 dark:text-white tracking-tighter uppercase leading-none">EBF CENTRAL HUB</h1>
                    <p className="text-[10px] text-ebf-orange font-bold uppercase tracking-[4px] mt-1">Management Systémique</p>
                </div>
                <div className="flex items-center gap-5">
                    <button onClick={toggleTheme} className="p-2.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">{darkMode ? <Moon size={22}/> : <Settings size={22}/>}</button>
                    <div className="w-px h-10 bg-gray-100 dark:bg-gray-700"></div>
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-black text-gray-900 dark:text-white leading-none">{userProfile?.full_name}</p>
                            <p className="text-[10px] text-ebf-orange font-bold uppercase tracking-widest mt-1 opacity-80">{userRole}</p>
                        </div>
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center font-black text-xl border-4 border-white shadow-lg">
                            {userProfile?.full_name?.charAt(0)}
                        </div>
                    </div>
                </div>
             </header>

             {/* Zone de rendu */}
             <main className="flex-1 overflow-y-auto p-6 md:p-10 bg-ebf-pattern relative scroll-smooth">
                <div className="max-w-7xl mx-auto">
                    {renderContent()}
                </div>
                
                {/* Panier Flottant d'affectation */}
                {cart.length > 0 && (
                    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-green-950/95 backdrop-blur-md text-white px-8 py-5 rounded-3xl shadow-2xl flex items-center gap-8 z-50 animate-slide-in border-2 border-ebf-orange max-w-xl w-full lg:ml-32">
                        <div className="relative">
                           <div className="w-14 h-14 bg-ebf-orange rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6">
                               <ShoppingCart size={32} className="text-white" />
                           </div>
                           <span className="absolute -top-3 -right-3 bg-red-600 text-white text-xs w-7 h-7 rounded-full flex items-center justify-center font-black border-2 border-white shadow-md">{cart.length}</span>
                        </div>
                        <div className="flex-1">
                            <p className="font-black text-lg tracking-tight leading-none uppercase">Affectation active</p>
                            <p className="text-xs text-gray-400 mt-1 font-medium italic">Matériel prêt pour l'envoi sur chantier</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => alert('Affectation validée pour le chantier !')} className="bg-white text-green-950 px-6 py-2.5 rounded-xl font-black text-sm hover:bg-orange-50 transition shadow-md">VALIDER</button>
                            <button onClick={() => setCart([])} className="text-gray-400 hover:text-red-500 transition"><Trash2 size={24}/></button>
                        </div>
                    </div>
                )}
             </main>
        </div>
    </div>
  );
};

export default function App() {
  const [appState, setAppState] = useState<'LOADING' | 'LOGIN' | 'APP'>('LOADING');
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<Role>('Visiteur');
  const [userProfile, setUserProfile] = useState<Profile | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
         supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({ data }) => {
            if (data) { setUserRole(data.role); setUserProfile(data); }
            setSession(session);
            setAppState('APP');
         });
      } else { setAppState('LOGIN'); }
    });
  }, []);

  const LoginScreen = () => (
    <div className="h-screen flex items-center justify-center bg-ebf-pattern p-6">
        <div className="bg-white/95 backdrop-blur-md p-12 rounded-[40px] shadow-2xl w-full max-w-md text-center border-t-[12px] border-ebf-orange relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-ebf-orange via-white to-ebf-green opacity-30"></div>
            <EbfLogo size="large" />
            <h2 className="text-3xl font-black text-green-950 mt-8 mb-2 tracking-tighter uppercase">CONNEXION EBF</h2>
            <p className="text-gray-500 text-xs mb-10 font-bold uppercase tracking-[4px]">Management Intégré</p>
            <button 
                onClick={() => setAppState('APP')}
                className="w-full bg-green-950 text-white py-5 rounded-3xl font-black text-xl shadow-2xl shadow-green-900/40 hover:bg-emerald-900 transition transform hover:-translate-y-1 active:scale-95"
            >
                ENTRER DANS LE HUB
            </button>
            <p className="mt-8 text-[10px] text-gray-400 font-bold uppercase tracking-widest">Abidjan | Bouaké | International</p>
        </div>
    </div>
  );

  if (appState === 'LOADING') return <div className="h-screen flex items-center justify-center bg-green-50"><Loader2 className="animate-spin text-ebf-orange" size={64}/></div>;
  if (appState === 'LOGIN') return <LoginScreen />;

  return <AppContent session={session} onLogout={() => setAppState('LOGIN')} userRole={userRole} userProfile={userProfile} />;
}
