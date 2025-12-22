
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, Wrench, Briefcase, ShoppingCart, Search, Settings,
  HardHat, DollarSign, LogOut, Calculator, Users, Calendar, FolderOpen, Truck, 
  FileText, UserCheck, CreditCard, Archive, ShieldCheck, ClipboardList, ArrowLeft, 
  Plus, Trash2, Moon, Play, StopCircle, RefreshCw, MapPin, Volume2, Megaphone, 
  AlertCircle, Filter, TrendingUp, Edit, ArrowUp, ArrowDown, AlertTriangle, Loader2, 
  Mail, Lock, UserPlus, Phone, CheckSquare, Key, Eye, EyeOff, Sparkles, Target, 
  Shield, ExternalLink, Image as ImageIcon, Tag
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { DetailedSynthesis } from './components/DetailedSynthesis';
import { Site, Period, TickerMessage, StatData, DailyReport, Intervention, StockItem, Transaction, Profile, Role, Notification, Technician } from './types';
import { supabase } from './services/supabaseClient';
import { MOCK_STOCK, MOCK_INTERVENTIONS, MOCK_REPORTS, MOCK_TECHNICIANS, DEFAULT_TICKER_MESSAGES } from './constants';

// --- Menu Configuration ---
interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  colorClass: string;
}

const MAIN_MENU: MenuItem[] = [
  { id: 'accueil', label: 'Accueil', icon: LayoutDashboard, path: '/', colorClass: 'text-orange-500' },
  { id: 'techniciens', label: 'Techniciens', icon: HardHat, path: '/techniciens', colorClass: 'text-gray-600' },
  { id: 'comptabilite', label: 'Comptabilité', icon: Calculator, path: '/comptabilite', colorClass: 'text-gray-600' },
  { id: 'secretariat', label: 'Secrétariat', icon: FolderOpen, path: '/secretariat', colorClass: 'text-gray-600' },
  { id: 'quincaillerie', label: 'Quincaillerie', icon: ShoppingCart, path: '/quincaillerie', colorClass: 'text-gray-600' },
  { id: 'equipe', label: 'Notre Équipe', icon: Users, path: '/equipe', colorClass: 'text-gray-600' },
];

const MODULE_ACTIONS: Record<string, any[]> = {
  techniciens: [
    { id: 'interventions', label: 'Interventions', icon: Wrench, path: '/techniciens/interventions', color: 'bg-orange-500', description: 'Planning terrain' },
    { id: 'rapports', label: 'Rapports Journaliers', icon: FileText, path: '/techniciens/rapports', color: 'bg-gray-700', description: 'Vocal ou Formulaire' },
    { id: 'materiel', label: 'Matériel Affecté', icon: Truck, path: '/techniciens/materiel', color: 'bg-blue-600', description: 'Inventaire agents' },
    { id: 'chantiers', label: 'Chantiers', icon: ShieldCheck, path: '/techniciens/chantiers', color: 'bg-green-600', description: 'Suivi exécution' },
  ],
  comptabilite: [
    { id: 'bilan', label: 'Bilan Financier', icon: DollarSign, path: '/comptabilite/bilan', color: 'bg-green-600', description: 'Journal de caisse' },
    { id: 'rh', label: 'RH', icon: Users, path: '/comptabilite/rh', color: 'bg-purple-600', description: 'Dossiers personnel' },
    { id: 'paie', label: 'Paie', icon: CreditCard, path: '/comptabilite/paie', color: 'bg-orange-500', description: 'Salaires mensuels' },
  ],
  secretariat: [
    { id: 'planning', label: 'Planning', icon: Calendar, path: '/secretariat/planning', color: 'bg-indigo-500', description: 'Agenda central' },
    { id: 'clients', label: 'Clients', icon: UserCheck, path: '/secretariat/clients', color: 'bg-blue-500', description: 'Base CRM' },
    { id: 'caisse', label: 'Caisse', icon: Archive, path: '/secretariat/caisse', color: 'bg-gray-600', description: 'Petites dépenses' },
  ],
  quincaillerie: [
    { id: 'stocks', label: 'Catalogue Stocks', icon: ClipboardList, path: '/quincaillerie/stocks', color: 'bg-orange-600', description: 'Matériels & Prix' },
    { id: 'fournisseurs', label: 'Fournisseurs', icon: Truck, path: '/quincaillerie/fournisseurs', color: 'bg-green-600', description: 'Gestion achats' },
    { id: 'achats', label: 'Bons Achat', icon: FileText, path: '/quincaillerie/achats', color: 'bg-red-500', description: 'Historique' },
  ]
};

// --- EBF Logo Component ---
const EbfLogo = ({ size = 'normal' }: { size?: 'small' | 'normal' | 'large' }) => {
    const scale = size === 'small' ? 0.6 : size === 'large' ? 1.5 : 1;
    return (
        <svg width={200 * scale} height={100 * scale} viewBox="0 0 200 100">
            <circle cx="40" cy="40" r="30" fill="#FF8C00" />
            <text x="110" y="55" fontFamily="Arial" fontWeight="900" fontSize="40" fill="#008000">E</text>
            <text x="145" y="55" fontFamily="Arial" fontWeight="900" fontSize="40" fill="#FF0000">B</text>
            <text x="180" y="55" fontFamily="Arial" fontWeight="900" fontSize="40" fill="#008000">F</text>
        </svg>
    );
};

// --- Helper Functions ---
const isInPeriod = (dateStr: string, period: Period): boolean => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  if (period === Period.DAY) return dateStr === todayStr;
  if (period === Period.MONTH) return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  return true;
};

// --- MODERN HARDWARE CATALOG COMPONENT ---
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 bg-white rounded-full hover:bg-orange-50 shadow-sm border border-gray-100">
                        <ArrowLeft size={20} className="text-gray-600 hover:text-ebf-orange"/>
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Catalogue Quincaillerie</h2>
                        <p className="text-gray-500 text-sm">Gestion des matériels techniques</p>
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

            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-6">
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-400">CATÉGORIE</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="text-sm font-medium border-none bg-gray-50 rounded-lg p-1.5 outline-none">
                        {categories.map(c => <option key={c as string} value={c as string}>{c as string}</option>)}
                    </select>
                </div>
                <div className="flex flex-col gap-1 min-w-[150px]">
                    <label className="text-[10px] font-bold text-gray-400">PRIX MAX: {maxPrice.toLocaleString()} F</label>
                    <input type="range" min="0" max="500000" step="5000" value={maxPrice} onChange={(e) => setMaxPrice(parseInt(e.target.value))} className="accent-ebf-orange h-1.5" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={onlyInStock} onChange={() => setOnlyInStock(!onlyInStock)} className="w-4 h-4 accent-ebf-orange" />
                    <span className="text-sm font-bold text-gray-600">En stock</span>
                </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredItems.map((item: any) => (
                    <div key={item.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col">
                        <div className="relative h-48 bg-gray-100 overflow-hidden">
                            <img src={item.imageUrl || 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=400&auto=format&fit=crop'} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            <span className="absolute top-2 left-2 bg-white/90 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                                {item.category}
                            </span>
                        </div>
                        <div className="p-4 flex-1 flex flex-col">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-gray-800 dark:text-white text-sm">{item.name}</h3>
                                <span className="text-xs font-black text-green-700 bg-green-50 px-2 py-1 rounded">{item.price.toLocaleString()} F</span>
                            </div>
                            <p className="text-[11px] text-gray-500 mb-4 flex-1 line-clamp-2">{item.description}</p>
                            <div className="flex gap-2">
                                <button onClick={() => onAddToCart(item)} className="flex-1 bg-ebf-orange text-white py-2 rounded-lg font-bold text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-orange-600 transition">
                                    <ShoppingCart size={14}/> Panier
                                </button>
                                <a href={item.specsUrl || '#'} target="_blank" className="p-2 bg-gray-50 text-gray-400 hover:bg-green-600 hover:text-white rounded-lg transition border">
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

// --- GENERIC MODULE VIEW ---
const GenericModuleView = ({ title, subtitle, items = [], onBack, color, currentSite, currentPeriod, onAdd, onDelete }: any) => {
    const filteredItems = items.filter((item: any) => {
        if (currentSite && item.site && currentSite !== Site.GLOBAL && item.site !== currentSite) return false;
        if (currentPeriod && item.date && !isInPeriod(item.date, currentPeriod)) return false;
        return true;
    });
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 bg-white rounded-full hover:bg-orange-50 shadow-sm border border-gray-100"><ArrowLeft size={20} className="text-gray-600"/></button>
                    <div><h2 className="text-2xl font-bold text-gray-800 dark:text-white">{title}</h2><p className="text-gray-500 text-sm">{subtitle}</p></div>
                </div>
                {onAdd && <button onClick={onAdd} className={`${color} text-white px-4 py-2 rounded-lg font-bold shadow-md hover:opacity-90 transition flex items-center gap-2`}><Plus size={18}/> Ajouter</button>}
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600 text-left">
                        <tr>
                            <th className="p-4 text-xs font-bold uppercase text-gray-400">ID</th>
                            <th className="p-4 text-xs font-bold uppercase text-gray-400">Désignation</th>
                            <th className="p-4 text-xs font-bold uppercase text-gray-400">Infos</th>
                            <th className="p-4 text-xs font-bold uppercase text-gray-400">Site</th>
                            <th className="p-4 text-right text-xs font-bold uppercase text-gray-400">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                        {filteredItems.map((item: any) => (
                            <tr key={item.id} className="hover:bg-orange-50/20">
                                <td className="p-4 text-xs font-mono text-gray-400">#{item.id.substring(0, 4)}</td>
                                <td className="p-4 font-bold text-gray-800 dark:text-white">{item.name || item.client || item.label || item.full_name}</td>
                                <td className="p-4 text-gray-600 dark:text-gray-300">{item.description || item.specialty || item.role || '-'}</td>
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

// --- MAIN APPLICATION CONTENT ---
const AppContent = ({ session, onLogout, userRole, userProfile }: any) => {
  const [currentPath, setCurrentPath] = useState('/');
  const [currentSite, setCurrentSite] = useState<Site>(Site.GLOBAL);
  const [currentPeriod, setCurrentPeriod] = useState<Period>(Period.MONTH);
  const [darkMode, setDarkMode] = useState(false);
  const [cart, setCart] = useState<any[]>([]);

  // Local Data Stores
  const [stock, setStock] = useState<StockItem[]>(MOCK_STOCK);
  const [reports, setReports] = useState<DailyReport[]>(MOCK_REPORTS);
  const [interventions, setInterventions] = useState<Intervention[]>(MOCK_INTERVENTIONS);
  const [technicians, setTechnicians] = useState<Technician[]>(MOCK_TECHNICIANS);
  const [employees, setEmployees] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  
  const handleNavigate = (path: string) => setCurrentPath(path);
  const toggleTheme = () => { setDarkMode(!darkMode); document.documentElement.classList.toggle('dark'); };
  const handleAddToCart = (item: any) => { setCart(prev => [...prev, item]); alert(`${item.name} ajouté au panier !`); };

  const renderContent = () => {
     if (currentPath === '/') return <Dashboard data={[]} reports={reports} tickerMessages={DEFAULT_TICKER_MESSAGES} stock={stock} currentSite={currentSite} currentPeriod={currentPeriod} onSiteChange={setCurrentSite} onPeriodChange={setCurrentPeriod} onNavigate={handleNavigate} onDeleteReport={() => {}} />;
     if (currentPath === '/synthesis') return <DetailedSynthesis data={[]} reports={reports} currentSite={currentSite} currentPeriod={currentPeriod} onSiteChange={setCurrentSite} onPeriodChange={setCurrentPeriod} onNavigate={handleNavigate} onViewReport={() => {}} />;
     
     const section = currentPath.split('/')[1];
     if (MODULE_ACTIONS[section] && currentPath.split('/').length === 2) {
         return (
             <div className="space-y-6 animate-fade-in">
                 <div className="flex items-center gap-2 mb-4">
                     <button onClick={() => handleNavigate('/')} className="p-2 hover:bg-gray-200 rounded-full transition"><ArrowLeft size={24}/></button>
                     <h2 className="text-3xl font-black text-green-950 dark:text-white uppercase">Module {section}</h2>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {MODULE_ACTIONS[section].map((action) => (
                        <button key={action.id} onClick={() => handleNavigate(action.path)} className="bg-white dark:bg-gray-800 hover:bg-orange-50 p-6 rounded-2xl shadow-md border border-gray-100 hover:border-orange-200 transition text-left group">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${action.color} text-white shadow-xl`}><action.icon size={28} /></div>
                            <h3 className="text-xl font-black text-gray-800 dark:text-white group-hover:text-ebf-orange">{action.label}</h3>
                            <p className="text-gray-500 text-sm mt-1">{action.description}</p>
                        </button>
                    ))}
                 </div>
             </div>
         );
     }

     // --- Specific Route Rendering ---
     if (currentPath === '/quincaillerie/stocks') return <HardwareCatalog items={stock} onBack={() => handleNavigate('/quincaillerie')} onAddToCart={handleAddToCart} currentSite={currentSite} />;
     if (currentPath === '/techniciens/interventions') return <GenericModuleView title="Interventions" subtitle="Suivi des dépannages" items={interventions} onBack={() => handleNavigate('/techniciens')} color="bg-orange-500" currentSite={currentSite} currentPeriod={currentPeriod} />;
     if (currentPath === '/techniciens/rapports') return <div className="p-10 text-center"><button onClick={() => handleNavigate('/techniciens')} className="text-ebf-orange font-bold flex items-center gap-2 mx-auto"><ArrowLeft size={20}/> Retour</button><p className="mt-4">Gestion des rapports en cours...</p></div>;
     if (currentPath === '/comptabilite/rh') return <GenericModuleView title="Ressources Humaines" subtitle="Gestion du personnel" items={employees} onBack={() => handleNavigate('/comptabilite')} color="bg-purple-600" currentSite={currentSite} />;
     if (currentPath === '/secretariat/clients') return <GenericModuleView title="Gestion Clients" subtitle="Base CRM" items={clients} onBack={() => handleNavigate('/secretariat')} color="bg-blue-500" currentSite={currentSite} />;
     if (currentPath === '/equipe') return <GenericModuleView title="Notre Équipe" subtitle="Liste des techniciens et staff" items={technicians} onBack={() => handleNavigate('/')} color="bg-indigo-500" currentSite={currentSite} />;

     return (
        <div className="p-10 text-center text-gray-400">
            <Wrench size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-black text-xl">Module en cours de développement.</p>
            <button onClick={() => handleNavigate('/')} className="mt-4 bg-green-950 text-white px-6 py-2 rounded-xl font-black shadow-lg">Retour Accueil</button>
        </div>
     );
  };

  return (
    <div className={`flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors ${darkMode ? 'dark' : ''}`}>
        <aside className="fixed inset-y-0 left-0 z-40 w-64 bg-green-950 text-white transform lg:translate-x-0 transition-transform shadow-2xl flex flex-col">
            <div className="h-24 flex items-center justify-center px-6"><EbfLogo size="normal" /></div>
            <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
                {MAIN_MENU.map(item => (
                    <button key={item.id} onClick={() => handleNavigate(item.path)} className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all ${currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path)) ? 'bg-ebf-orange text-white shadow-xl scale-105 font-black' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}>
                        <item.icon size={22} />
                        <span className="text-sm">{item.label}</span>
                    </button>
                ))}
            </nav>
            <div className="p-4 border-t border-white/10">
                <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition font-black uppercase text-xs tracking-widest"><LogOut size={20}/> Déconnexion</button>
            </div>
        </aside>

        <div className="flex-1 flex flex-col lg:ml-64 relative overflow-hidden">
             <header className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-b h-20 flex items-center justify-between px-8 sticky top-0 z-30 shadow-sm">
                <div className="flex flex-col">
                    <h1 className="font-black text-2xl text-green-950 dark:text-white tracking-tighter uppercase leading-none">EBF CENTRAL HUB</h1>
                    <p className="text-[10px] text-ebf-orange font-bold uppercase tracking-[4px] mt-1">Management Système</p>
                </div>
                <div className="flex items-center gap-5">
                    <button onClick={toggleTheme} className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-full">{darkMode ? <Moon size={22}/> : <Settings size={22}/>}</button>
                    <div className="w-px h-10 bg-gray-100 dark:bg-gray-700"></div>
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-black text-gray-900 dark:text-white leading-none">{userProfile?.full_name}</p>
                            <p className="text-[10px] text-ebf-orange font-bold uppercase tracking-widest mt-1">{userRole}</p>
                        </div>
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center font-black text-xl border-4 border-white shadow-lg">
                            {userProfile?.full_name?.charAt(0)}
                        </div>
                    </div>
                </div>
             </header>

             <main className="flex-1 overflow-y-auto p-6 md:p-10 bg-ebf-pattern relative">
                <div className="max-w-7xl mx-auto">
                    {renderContent()}
                </div>
                
                {cart.length > 0 && currentPath.includes('quincaillerie') && (
                    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-green-950/95 backdrop-blur-md text-white px-8 py-5 rounded-3xl shadow-2xl flex items-center gap-8 z-50 animate-slide-in border-2 border-ebf-orange max-w-xl w-full lg:ml-32">
                        <div className="relative">
                           <div className="w-14 h-14 bg-ebf-orange rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6"><ShoppingCart size={32} className="text-white" /></div>
                           <span className="absolute -top-3 -right-3 bg-red-600 text-white text-xs w-7 h-7 rounded-full flex items-center justify-center font-black border-2 border-white">{cart.length}</span>
                        </div>
                        <div className="flex-1">
                            <p className="font-black text-lg tracking-tight leading-none">AFFECTATION ACTIVE</p>
                            <p className="text-xs text-gray-400 mt-1 italic">Matériel prêt pour validation</p>
                        </div>
                        <button onClick={() => alert('Validation validée !')} className="bg-white text-green-950 px-6 py-2.5 rounded-xl font-black text-sm hover:bg-orange-50 transition">VALIDER</button>
                        <button onClick={() => setCart([])} className="text-gray-400 hover:text-red-500 transition"><Trash2 size={24}/></button>
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
        <div className="bg-white/95 backdrop-blur-md p-12 rounded-[40px] shadow-2xl w-full max-w-md text-center border-t-[12px] border-ebf-orange">
            <EbfLogo size="large" />
            <h2 className="text-3xl font-black text-green-950 mt-8 mb-2 tracking-tighter uppercase">CONNEXION EBF</h2>
            <p className="text-gray-500 text-xs mb-10 font-bold uppercase tracking-[4px]">Management Centralisé</p>
            <button onClick={() => setAppState('APP')} className="w-full bg-green-950 text-white py-5 rounded-3xl font-black text-xl shadow-2xl hover:bg-emerald-900 transition transform hover:-translate-y-1">ENTRER DANS LE HUB</button>
            <p className="mt-8 text-[10px] text-gray-400 font-bold uppercase tracking-widest">Abidjan | Bouaké | International</p>
        </div>
    </div>
  );

  if (appState === 'LOADING') return <div className="h-screen flex items-center justify-center bg-green-50"><Loader2 className="animate-spin text-ebf-orange" size={64}/></div>;
  if (appState === 'LOGIN') return <LoginScreen />;

  return <AppContent session={session} onLogout={() => setAppState('LOGIN')} userRole={userRole} userProfile={userProfile} />;
}
