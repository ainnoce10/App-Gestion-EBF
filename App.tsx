
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
import { MOCK_STOCK } from './constants';

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

// --- Helper pour le filtrage par période (Copied from DetailedSynthesis) ---
const isInPeriod = (dateStr: string, period: Period): boolean => {
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

// --- CATALOGUE QUINCAILLERIE (MODERNE) ---
const HardwareCatalog = ({ items, onBack, onAddToCart, currentSite }: any) => {
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('Tous');
    const [maxPrice, setMaxPrice] = useState(1000000);
    const [onlyInStock, setOnlyInStock] = useState(false);

    const categories = ['Tous', ...Array.from(new Set(items.map((i: any) => i.category)))];

    const filteredItems = items.filter((item: any) => {
        const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                             item.description?.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = category === 'Tous' || item.category === category;
        const matchesPrice = item.price <= maxPrice;
        const matchesStock = onlyInStock ? item.quantity > 0 : true;
        const matchesSite = currentSite === Site.GLOBAL || item.site === currentSite;
        return matchesSearch && matchesCategory && matchesPrice && matchesStock && matchesSite;
    });

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 bg-white rounded-full hover:bg-orange-50 shadow-sm transition border border-gray-100">
                        <ArrowLeft size={20} className="text-gray-600 hover:text-ebf-orange"/>
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Catalogue Quincaillerie</h2>
                        <p className="text-gray-500 text-sm">Matériels et équipements professionnels</p>
                    </div>
                </div>
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-3 text-gray-400" size={18}/>
                    <input 
                        type="text" 
                        placeholder="Rechercher un article..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-ebf-orange outline-none shadow-sm"
                    />
                </div>
            </div>

            {/* Advanced Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                    <Filter size={16} className="text-ebf-orange" />
                    <span className="text-xs font-bold uppercase text-gray-400">Filtres:</span>
                </div>
                
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-400">CATÉGORIE</label>
                    <select 
                        value={category} 
                        onChange={(e) => setCategory(e.target.value)}
                        className="text-sm font-medium border-none bg-gray-50 rounded-lg p-1.5 focus:ring-0 outline-none"
                    >
                        {/* Fix: Cast c to string for the key to avoid 'unknown' type error */}
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

                <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative flex items-center">
                        <input 
                            type="checkbox" 
                            checked={onlyInStock} 
                            onChange={() => setOnlyInStock(!onlyInStock)} 
                            className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                        <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                    </div>
                    <span className="text-sm font-bold text-gray-600">En stock uniquement</span>
                </label>
            </div>

            {/* Grid Catalog */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredItems.length === 0 ? (
                    <div className="col-span-full py-20 text-center">
                        <ImageIcon size={48} className="mx-auto text-gray-200 mb-4" />
                        <p className="text-gray-400 font-medium">Aucun article ne correspond à votre recherche.</p>
                    </div>
                ) : (
                    filteredItems.map((item: any) => (
                        <div key={item.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col">
                            {/* Product Image */}
                            <div className="relative h-48 bg-gray-100 overflow-hidden">
                                {item.imageUrl ? (
                                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <ImageIcon size={48} />
                                    </div>
                                )}
                                <div className="absolute top-3 left-3 flex gap-2">
                                    <span className="bg-white/90 backdrop-blur-sm text-gray-700 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
                                        <Tag size={10} className="text-ebf-orange"/> {item.category}
                                    </span>
                                </div>
                                {item.quantity <= item.threshold && (
                                    <div className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 animate-pulse">
                                        <AlertTriangle size={10}/> Stock Faible
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-gray-800 dark:text-white group-hover:text-ebf-orange transition-colors">{item.name}</h3>
                                    <span className="text-sm font-black text-green-700 bg-green-50 px-2 py-1 rounded">{item.price.toLocaleString()} F</span>
                                </div>
                                <p className="text-xs text-gray-500 line-clamp-2 mb-4 flex-1">{item.description || 'Matériel certifié EBF, robuste et fiable pour vos chantiers.'}</p>
                                
                                <div className="flex items-center justify-between text-[11px] mb-4 text-gray-400 font-bold border-t pt-4">
                                    <div className="flex items-center gap-1">
                                        <Archive size={12}/> {item.quantity} {item.unit} dispos
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <MapPin size={12}/> {item.site}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => onAddToCart(item)}
                                        className="flex-1 bg-ebf-orange text-white py-2.5 rounded-xl font-bold text-sm shadow-md shadow-orange-100 hover:bg-orange-600 transition flex items-center justify-center gap-2"
                                    >
                                        <ShoppingCart size={16}/> Panier
                                    </button>
                                    <a 
                                        href={item.specsUrl || '#'} 
                                        target="_blank" 
                                        className="p-2.5 bg-gray-50 text-gray-400 hover:bg-ebf-green hover:text-white rounded-xl transition border border-gray-100"
                                        title="Fiche technique"
                                    >
                                        <FileText size={18}/>
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// --- Module Placeholder (Generic List View) ---
const ModulePlaceholder = ({ title, subtitle, items = [], onBack, color, currentSite, currentPeriod, onAdd, onDelete, readOnly }: any) => {
    const filteredItems = items.filter((item: any) => {
        if (currentSite && item.site && currentSite !== Site.GLOBAL && item.site !== currentSite) return false;
        // Fix: Use the local isInPeriod helper to filter items by period
        if (currentPeriod && item.date && !isInPeriod(item.date, currentPeriod)) return false;
        return true;
    });
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 bg-white rounded-full hover:bg-orange-50 shadow-sm transition border border-gray-100"><ArrowLeft size={20} className="text-gray-600 hover:text-ebf-orange"/></button>
                    <div><h2 className="text-2xl font-bold text-gray-800 dark:text-white">{title}</h2><p className="text-gray-500">{subtitle}</p></div>
                </div>
                {!readOnly && onAdd && (
                    <button onClick={onAdd} className={`${color} text-white px-4 py-2 rounded-lg font-bold shadow-md hover:opacity-90 transition flex items-center gap-2`}><Plus size={18}/> Ajouter</button>
                )}
            </div>
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100 text-left">
                        <tr>
                            <th className="p-4 text-xs font-bold uppercase text-gray-400">ID</th>
                            <th className="p-4 text-xs font-bold uppercase text-gray-400">Libellé</th>
                            <th className="p-4 text-xs font-bold uppercase text-gray-400">Détails</th>
                            <th className="p-4 text-xs font-bold uppercase text-gray-400">Site</th>
                            <th className="p-4 text-right text-xs font-bold uppercase text-gray-400">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredItems.map((item: any) => (
                            <tr key={item.id} className="hover:bg-orange-50/20">
                                <td className="p-4 text-xs font-mono text-gray-400">#{item.id.substring(0, 4)}</td>
                                <td className="p-4 font-bold">{item.name || item.client || item.label}</td>
                                <td className="p-4 text-sm text-gray-600">{item.description || item.specialty || '-'}</td>
                                <td className="p-4"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700">{item.site}</span></td>
                                <td className="p-4 text-right"><button onClick={() => onDelete(item)} className="p-1.5 text-red-500 hover:bg-red-50 rounded transition"><Trash2 size={16}/></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
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
  const [stock, setStock] = useState<StockItem[]>(MOCK_STOCK);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const handleNavigate = (path: string) => { setCurrentPath(path); setIsMenuOpen(false); };
  const toggleTheme = () => { setDarkMode(!darkMode); document.documentElement.classList.toggle('dark'); };
  
  const handleAddToCart = (item: any) => {
      setCart(prev => [...prev, item]);
      alert(`${item.name} ajouté au panier !`);
  };

  const renderContent = () => {
     if (currentPath === '/') return <Dashboard data={[]} reports={reports} tickerMessages={[]} stock={stock} currentSite={currentSite} currentPeriod={currentPeriod} onSiteChange={setCurrentSite} onPeriodChange={setCurrentPeriod} onNavigate={handleNavigate} onDeleteReport={() => {}} />;
     if (currentPath === '/synthesis') return <DetailedSynthesis data={[]} reports={reports} currentSite={currentSite} currentPeriod={currentPeriod} onSiteChange={setCurrentSite} onPeriodChange={setCurrentPeriod} onNavigate={handleNavigate} onViewReport={() => {}} />;
     
     const section = currentPath.split('/')[1];
     if (MODULE_ACTIONS[section] && currentPath.split('/').length === 2) {
         return (
             <div className="space-y-6 animate-fade-in">
                 <div className="flex items-center gap-2 mb-4">
                     <button onClick={() => handleNavigate('/')} className="p-2 hover:bg-gray-100 rounded-full transition"><ArrowLeft size={20}/></button>
                     <h2 className="text-2xl font-bold text-gray-800 capitalize">Module {section}</h2>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {MODULE_ACTIONS[section].map((action) => (
                        <button key={action.id} onClick={() => handleNavigate(action.path)} className="bg-white hover:bg-orange-50 p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-orange-200 transition text-left group">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${action.color} text-white shadow-lg`}><action.icon size={24} /></div>
                            <h3 className="text-xl font-bold mb-1 text-gray-800 group-hover:text-ebf-orange">{action.label}</h3>
                            <p className="text-gray-500 text-sm">{action.description}</p>
                        </button>
                    ))}
                 </div>
             </div>
         );
     }

     if (currentPath === '/quincaillerie/stocks') return <HardwareCatalog items={stock} onBack={() => handleNavigate('/quincaillerie')} onAddToCart={handleAddToCart} currentSite={currentSite} />;
     
     // Panier Summary Sticky
     const CartFloating = () => (
         cart.length > 0 && (
             <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-green-950 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 z-50 animate-slide-in border-2 border-ebf-orange max-w-lg w-full">
                 <div className="relative">
                    <ShoppingCart size={28} className="text-ebf-orange" />
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">{cart.length}</span>
                 </div>
                 <div className="flex-1">
                     <p className="font-bold text-sm">Panier Actif</p>
                     <p className="text-xs text-gray-400">Dernier ajout: {cart[cart.length - 1].name}</p>
                 </div>
                 <button onClick={() => alert('Validation panier en cours...')} className="bg-ebf-orange text-white px-4 py-2 rounded-xl font-bold hover:bg-orange-600 transition shadow-lg shadow-orange-950/20">Valider</button>
                 <button onClick={() => setCart([])} className="text-gray-400 hover:text-white transition"><Trash2 size={20}/></button>
             </div>
         )
     );

     return (
        <div className="p-10 text-center text-gray-400">
            <Wrench size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-medium">Module "{currentPath}" bientôt disponible.</p>
            <button onClick={() => handleNavigate('/')} className="mt-4 text-ebf-orange font-bold hover:underline">Retour Accueil</button>
            <CartFloating />
        </div>
     );
  };

  return (
    <div className={`flex h-screen bg-gray-50 ${darkMode ? 'dark' : ''}`}>
        <aside className="fixed inset-y-0 left-0 z-40 w-64 bg-green-950 text-white transform lg:translate-x-0 transition-transform shadow-2xl flex flex-col">
            <div className="h-20 flex items-center justify-center px-6"><EbfLogo size="normal" /></div>
            <nav className="p-4 space-y-2 flex-1">
                {MAIN_MENU.map(item => (
                    <button key={item.id} onClick={() => handleNavigate(item.path)} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${currentPath === item.path ? 'bg-ebf-orange text-white shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                        <item.icon size={20} />
                        <span className="font-bold">{item.label}</span>
                    </button>
                ))}
            </nav>
            <div className="p-4 border-t border-white/10">
                <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition font-bold"><LogOut size={20}/> Déconnexion</button>
            </div>
        </aside>
        <div className="flex-1 flex flex-col lg:ml-64 relative">
             <header className="bg-white/90 backdrop-blur-sm border-b h-16 flex items-center justify-between px-6 sticky top-0 z-30">
                <h1 className="font-black text-green-950 tracking-tight">EBF CENTRAL HUB</h1>
                <div className="flex items-center gap-4">
                    <button onClick={toggleTheme} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition">{darkMode ? <Moon size={20}/> : <Settings size={20}/>}</button>
                    <div className="w-px h-8 bg-gray-100"></div>
                    <div className="flex items-center gap-2">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-bold text-gray-900">{userProfile?.full_name}</p>
                            <p className="text-[10px] text-ebf-orange font-bold uppercase tracking-widest">{userRole}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-lg border-2 border-green-200">
                            {userProfile?.full_name?.charAt(0)}
                        </div>
                    </div>
                </div>
             </header>
             <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-ebf-pattern">
                {renderContent()}
                {cart.length > 0 && currentPath.includes('quincaillerie') && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-green-950 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 z-50 animate-slide-in border-2 border-ebf-orange max-w-lg w-full lg:ml-32">
                        <div className="relative">
                           <ShoppingCart size={28} className="text-ebf-orange" />
                           <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">{cart.length}</span>
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-sm">Panier ({cart.length})</p>
                            <p className="text-xs text-gray-400 truncate">Articles prêts pour commande</p>
                        </div>
                        <button onClick={() => alert('Validation panier en cours...')} className="bg-ebf-orange text-white px-4 py-2 rounded-xl font-bold hover:bg-orange-600 transition shadow-lg">Valider</button>
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
        <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md text-center border-t-8 border-ebf-orange">
            <EbfLogo size="large" />
            <h2 className="text-2xl font-black text-green-950 mt-6 mb-2">CONNEXION EBF</h2>
            <p className="text-gray-500 text-sm mb-8 font-medium">Gestion Technique & Opérationnelle</p>
            <button 
                onClick={() => setAppState('APP')}
                className="w-full bg-ebf-orange text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-orange-100 hover:bg-orange-600 transition transform hover:-translate-y-1"
            >
                DÉMARRER LA SESSION
            </button>
        </div>
    </div>
  );

  if (appState === 'LOADING') return <div className="h-screen flex items-center justify-center bg-green-50"><Loader2 className="animate-spin text-ebf-orange" size={48}/></div>;
  if (appState === 'LOGIN') return <LoginScreen />;

  return <AppContent session={session} onLogout={() => setAppState('LOGIN')} userRole={userRole} userProfile={userProfile} />;
}
