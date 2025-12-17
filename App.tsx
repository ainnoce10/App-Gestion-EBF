
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

// --- CONFIGURATION DES FORMULAIRES ---
const FORM_CONFIGS: Record<string, FormConfig> = {
  interventions: {
    title: 'Nouvelle Intervention',
    fields: [
      { name: 'client', label: 'Client', type: 'text' },
      { name: 'clientPhone', label: 'Tél Client', type: 'text' },
      { name: 'location', label: 'Lieu / Quartier', type: 'text' },
      { name: 'description', label: 'Description Panne', type: 'text' },
      { name: 'technicianId', label: 'ID Technicien', type: 'text' },
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
  materials: {
    title: 'Nouveau Matériel',
    fields: [
      { name: 'name', label: 'Nom de l\'outil', type: 'text' },
      { name: 'serialNumber', label: 'N° Série / Réf', type: 'text' },
      { name: 'condition', label: 'État', type: 'select', options: ['Neuf', 'Bon', 'Usé', 'Panne'] },
      { name: 'assignedTo', label: 'Affecté à', type: 'text' },
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
    title: 'Nouveau Rapport',
    fields: [
      { name: 'technicianName', label: 'Nom Technicien', type: 'text' },
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'content', label: 'Détails Intervention', type: 'text' },
      { name: 'domain', label: 'Domaine', type: 'select', options: ['Electricité', 'Froid', 'Bâtiment', 'Plomberie'] },
      { name: 'revenue', label: 'Recette (FCFA)', type: 'number' },
      { name: 'expenses', label: 'Dépenses (FCFA)', type: 'number' }
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
    { id: 'interventions', label: 'Interventions', description: 'Planning', icon: Wrench, path: '/techniciens/interventions', color: 'bg-orange-500' },
    { id: 'rapports', label: 'Rapports Journaliers', description: 'Vocal/Formulaire', icon: FileText, path: '/techniciens/rapports', color: 'bg-gray-700' },
    { id: 'materiel', label: 'Matériel & Outils', description: 'Inventaire', icon: Truck, path: '/techniciens/materiel', color: 'bg-blue-600' },
    { id: 'chantiers', label: 'Chantiers', description: 'Suivi', icon: ShieldCheck, path: '/techniciens/chantiers', color: 'bg-green-600' },
  ],
  comptabilite: [
    { id: 'bilan', label: 'Bilan Financier', icon: DollarSign, path: '/comptabilite/bilan', color: 'bg-green-600', description: 'Journal' },
    { id: 'rh', label: 'Ressources Humaines', icon: Users, path: '/comptabilite/rh', color: 'bg-purple-600', description: 'Staff' },
    { id: 'paie', label: 'Paie & Salaires', icon: CreditCard, path: '/comptabilite/paie', color: 'bg-orange-500', description: 'Virements' },
  ],
  secretariat: [
    { id: 'planning', label: 'Planning', icon: Calendar, path: '/secretariat/planning', color: 'bg-indigo-500', description: 'Agenda' },
    { id: 'clients', label: 'Gestion Clients', icon: UserCheck, path: '/secretariat/clients', color: 'bg-blue-500', description: 'CRM' },
    { id: 'caisse', label: 'Caisse', icon: Archive, path: '/secretariat/caisse', color: 'bg-gray-600', description: 'Mouvements' },
  ],
  quincaillerie: [
    { id: 'stocks', label: 'Stocks', icon: ClipboardList, path: '/quincaillerie/stocks', color: 'bg-orange-600', description: 'Inventaire' },
    { id: 'fournisseurs', label: 'Fournisseurs', icon: Truck, path: '/quincaillerie/fournisseurs', color: 'bg-green-600', description: 'Partenaires' },
    { id: 'achats', label: 'Bons d\'achat', icon: FileText, path: '/quincaillerie/achats', color: 'bg-red-500', description: 'Commandes' },
  ]
};

const isInPeriod = (dateStr: string, period: Period): boolean => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  if (period === Period.DAY) return dateStr === todayStr;
  if (period === Period.MONTH) return dateStr.startsWith(todayStr.substring(0, 7));
  if (period === Period.YEAR) return dateStr.startsWith(todayStr.substring(0, 4));
  return true;
};

// --- Composants UI ---
const EbfLogo = ({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) => (
  <div className={`font-black tracking-tighter flex items-baseline ${size === 'small' ? 'text-xl' : size === 'large' ? 'text-5xl' : 'text-3xl'}`}>
    <span className="text-ebf-green">E</span><span className="text-ebf-orange">B</span><span className="text-ebf-green">F</span>
  </div>
);

const HeaderWithNotif = ({ 
  title, onMenuClick, onLogout, notifications, userProfile, userRole, onOpenProfile, onOpenFlashInfo, onOpenHelp, darkMode, onToggleTheme 
}: any) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
    const unreadCount = notifications.filter((n: Notification) => !n.read).length;
    const settingsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: any) => {
            if (settingsRef.current && !settingsRef.current.contains(event.target)) setShowSettingsDropdown(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 h-16 flex items-center justify-between px-4 sticky top-0 z-30 shadow-sm">
           <div className="flex items-center gap-4">
              <button onClick={onMenuClick} className="lg:hidden p-2 text-gray-600"><Menu/></button>
              <h2 className="text-lg font-extrabold text-green-950 hidden md:block tracking-tight">{title}</h2>
           </div>
           <div className="flex items-center gap-3">
               <div className="flex items-center gap-3 border-l pl-4 ml-2 border-gray-200">
                  <div className="hidden md:block text-right">
                     <p className="text-sm font-bold text-gray-800">{userProfile?.full_name || 'Utilisateur'}</p>
                     <p className="text-[10px] text-ebf-orange font-bold uppercase bg-orange-50 px-2 py-0.5 rounded-full inline-block">Role: {userRole}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-lg border border-green-200">
                      {userProfile?.full_name?.charAt(0) || <User size={20}/>}
                  </div>
               </div>
              <div className="relative ml-2">
                 <button onClick={() => setShowDropdown(!showDropdown)} className="p-2 relative hover:bg-gray-100 rounded-full transition text-gray-600">
                     <Bell size={20}/>
                     {unreadCount > 0 && <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{unreadCount}</span>}
                 </button>
                 {showDropdown && (
                     <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                         <div className="p-3 border-b bg-gray-50 flex justify-between items-center"><h3 className="font-bold text-sm">Notifications</h3></div>
                         <div className="max-h-80 overflow-y-auto">
                             {notifications.length === 0 ? <div className="p-4 text-center text-gray-400">Aucune notification</div> : 
                                 notifications.map((n: any) => (
                                     <div key={n.id} className="p-3 border-b hover:bg-gray-50 cursor-pointer">
                                         <p className="text-sm font-bold">{n.title}</p>
                                         <p className="text-xs text-gray-500">{n.message}</p>
                                     </div>
                                 ))
                             }
                         </div>
                         <button onClick={() => setShowDropdown(false)} className="w-full py-2 text-xs text-gray-500 hover:bg-gray-50">Fermer</button>
                     </div>
                 )}
              </div>
              <div className="relative" ref={settingsRef}>
                 <button onClick={() => setShowSettingsDropdown(!showSettingsDropdown)} className="p-2 hover:bg-gray-100 rounded-full transition text-gray-600">
                    <Settings size={20}/>
                 </button>
                 {showSettingsDropdown && (
                   <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                      <div className="py-2">
                         <button onClick={() => { onOpenProfile(); setShowSettingsDropdown(false); }} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-sm font-medium text-gray-700">
                             <User size={18} className="text-ebf-orange"/> Mon Profil
                         </button>
                         <button onClick={() => { onOpenFlashInfo(); setShowSettingsDropdown(false); }} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-sm font-medium text-gray-700">
                             <Megaphone size={18} className="text-blue-500"/> Gestion Flash Info
                         </button>
                         <div className="border-t my-1"></div>
                         <button onClick={onToggleTheme} className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-50 text-sm font-medium text-gray-700">
                            <div className="flex items-center gap-3"><Moon size={18} className="text-indigo-500"/> Mode Sombre</div>
                            <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${darkMode ? 'bg-indigo-500' : 'bg-gray-300'}`}><div className={`w-3 h-3 bg-white rounded-full transform transition-transform ${darkMode ? 'translate-x-4' : 'translate-x-0'}`}></div></div>
                         </button>
                         <button onClick={() => { onOpenHelp(); setShowSettingsDropdown(false); }} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-sm font-medium text-gray-700">
                             <HelpCircle size={18} className="text-green-500"/> Aide & Support
                         </button>
                         <div className="border-t my-1"></div>
                         <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 text-sm font-bold text-red-600">
                             <LogOut size={18}/> Se déconnecter
                         </button>
                      </div>
                   </div>
                 )}
              </div>
           </div>
        </header>
    )
};

const ModulePlaceholder = ({ title, subtitle, items = [], onBack, color, currentSite, onAdd, onDelete, readOnly }: any) => (
    <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="p-2 bg-white rounded-full shadow-sm border border-gray-100 hover:text-ebf-orange"><ArrowLeft size={20}/></button>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
                    <p className="text-gray-500 text-sm">{subtitle}</p>
                </div>
            </div>
            {!readOnly && onAdd && (
                <button onClick={onAdd} className={`${color} text-white px-4 py-2 rounded-lg font-bold shadow hover:opacity-90 flex items-center gap-2`}>
                    <Plus size={18}/> Ajouter
                </button>
            )}
        </div>
        <div className="bg-white rounded-xl shadow border overflow-hidden">
            <table className="w-full">
                <thead className="bg-gray-50 border-b">
                    <tr>
                        <th className="p-4 text-left text-xs font-bold uppercase text-gray-500">Nom / Libellé</th>
                        <th className="p-4 text-left text-xs font-bold uppercase text-gray-500">Détails</th>
                        <th className="p-4 text-left text-xs font-bold uppercase text-gray-500">Site</th>
                        <th className="p-4 text-right text-xs font-bold uppercase text-gray-500">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {items.filter((i:any) => currentSite === Site.GLOBAL || i.site === currentSite).map((item: any) => (
                        <tr key={item.id} className="hover:bg-orange-50/20">
                            <td className="p-4 font-bold text-gray-800">{item.name || item.client || item.label || item.full_name || 'Item'}</td>
                            <td className="p-4 text-sm text-gray-600">{item.description || item.specialty || item.date || '-'}</td>
                            <td className="p-4 text-sm">{item.site || '-'}</td>
                            <td className="p-4 text-right">
                                {!readOnly && onDelete && <button onClick={() => onDelete(item)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16}/></button>}
                            </td>
                        </tr>
                    ))}
                    {items.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-400">Aucune donnée.</td></tr>}
                </tbody>
            </table>
        </div>
    </div>
);

// Added session to props to fix 'Cannot find name session' error on line 521
const AppContent = ({ onLogout, userRole, userProfile, session }: any) => {
  const [currentPath, setCurrentPath] = useState('/');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentSite, setCurrentSite] = useState<Site>(Site.GLOBAL);
  const [currentPeriod, setCurrentPeriod] = useState<Period>(Period.MONTH);
  const [darkMode, setDarkMode] = useState(false);
  
  // États de données
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [chantiers, setChantiers] = useState<any[]>([]);
  const [tickerMessages, setTickerMessages] = useState<TickerMessage[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // États Modals
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isFlashInfoOpen, setIsFlashInfoOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [crudTarget, setCrudTarget] = useState('');
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [crudLoading, setCrudLoading] = useState(false);

  // Mapping Table -> Setter pour mise à jour instantanée
  const stateSetterMap: Record<string, any> = {
    interventions: setInterventions,
    stocks: setStock,
    materials: setMaterials,
    technicians: setTechnicians,
    reports: setReports,
    transactions: setTransactions,
    chantiers: setChantiers,
    ticker_messages: setTickerMessages
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data: interv } = await supabase.from('interventions').select('*'); if (interv) setInterventions(interv);
      const { data: st } = await supabase.from('stocks').select('*'); if (st) setStock(st);
      const { data: mat } = await supabase.from('materials').select('*'); if (mat) setMaterials(mat);
      const { data: tech } = await supabase.from('technicians').select('*'); if (tech) setTechnicians(tech);
      const { data: rep } = await supabase.from('reports').select('*'); if (rep) setReports(rep);
      const { data: trans } = await supabase.from('transactions').select('*'); if (trans) setTransactions(trans);
      const { data: chan } = await supabase.from('chantiers').select('*'); if (chan) setChantiers(chan);
      const { data: tick } = await supabase.from('ticker_messages').select('*').order('display_order'); if (tick) setTickerMessages(tick);
    };
    fetchData();

    const channel = supabase.channel('ebf-realtime')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        const setter = stateSetterMap[payload.table];
        if (!setter) return;
        if (payload.eventType === 'INSERT') setter((prev: any) => [...prev.filter((i:any) => i.id !== payload.new.id), payload.new]);
        if (payload.eventType === 'UPDATE') setter((prev: any) => prev.map((i: any) => i.id === payload.new.id ? payload.new : i));
        if (payload.eventType === 'DELETE') setter((prev: any) => prev.filter((i: any) => i.id !== payload.old.id));
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const stats = useMemo(() => {
    const map = new Map<string, StatData>();
    reports.forEach(r => {
      if (!r.date) return;
      const key = `${r.date}_${r.site}`;
      if (!map.has(key)) map.set(key, { id: key, date: r.date, site: r.site, revenue: 0, expenses: 0, profit: 0, interventions: 0 });
      const s = map.get(key)!;
      s.revenue += Number(r.revenue || 0);
      s.expenses += Number(r.expenses || 0);
      s.interventions += 1;
    });
    return Array.from(map.values()).map(s => ({ ...s, profit: s.revenue - s.expenses }));
  }, [reports]);

  // Actions CRUD Instantanées
  const confirmAdd = async (formData: any) => {
    setCrudLoading(true);
    const processed = { ...formData, site: formData.site || (currentSite !== Site.GLOBAL ? currentSite : Site.ABIDJAN) };
    const { data, error } = await supabase.from(crudTarget).insert([processed]).select();
    if (error) alert(error.message);
    else if (data) {
      const setter = stateSetterMap[crudTarget];
      if (setter) setter((prev: any) => [...prev, data[0]]);
      setIsAddOpen(false);
    }
    setCrudLoading(false);
  };

  const confirmDelete = async () => {
    setCrudLoading(true);
    const { error } = await supabase.from(crudTarget).delete().eq('id', itemToDelete.id);
    if (error) alert(error.message);
    else {
      const setter = stateSetterMap[crudTarget];
      if (setter) setter((prev: any) => prev.filter((i: any) => i.id !== itemToDelete.id));
      setIsDeleteOpen(false);
    }
    setCrudLoading(false);
  };

  const handleNavigate = (path: string) => { setCurrentPath(path); setIsMenuOpen(false); };

  const renderContent = () => {
    if (currentPath === '/') return <Dashboard data={stats} reports={reports} tickerMessages={tickerMessages} stock={stock} currentSite={currentSite} currentPeriod={currentPeriod} onSiteChange={setCurrentSite} onPeriodChange={setCurrentPeriod} onNavigate={setCurrentPath} onDeleteReport={async (id) => { await supabase.from('reports').delete().eq('id', id); setReports(prev => prev.filter(r => r.id !== id)); }} />;
    if (currentPath === '/synthesis') return <DetailedSynthesis data={stats} reports={reports} currentSite={currentSite} currentPeriod={currentPeriod} onSiteChange={setCurrentSite} onPeriodChange={setCurrentPeriod} onNavigate={setCurrentPath} onViewReport={() => {}} />;
    
    const section = currentPath.substring(1);
    if (MODULE_ACTIONS[section]) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {MODULE_ACTIONS[section].map((a: any) => (
            <button key={a.id} onClick={() => handleNavigate(a.path)} className="bg-white p-6 rounded-xl shadow-sm border hover:border-ebf-orange transition text-left group">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${a.color} text-white`}><a.icon size={24} /></div>
              <h3 className="font-bold text-lg group-hover:text-ebf-orange">{a.label}</h3>
              <p className="text-sm text-gray-500">{a.description}</p>
            </button>
          ))}
        </div>
      );
    }

    const subSection = currentPath.split('/').pop() || '';
    if (FORM_CONFIGS[subSection]) {
        let items: any[] = [];
        if (subSection === 'interventions') items = interventions;
        else if (subSection === 'stocks') items = stock;
        else if (subSection === 'materiel') items = materials;
        else if (subSection === 'rapports') items = reports;
        else if (subSection === 'chantiers') items = chantiers;
        else if (subSection === 'bilan') items = transactions;

        return <ModulePlaceholder title={FORM_CONFIGS[subSection].title} subtitle="Gestion" items={items} onBack={() => handleNavigate('/' + currentPath.split('/')[1])} color="bg-ebf-orange" currentSite={currentSite} onAdd={() => { setCrudTarget(subSection === 'bilan' ? 'transactions' : subSection === 'materiel' ? 'materials' : subSection); setIsAddOpen(true); }} onDelete={(i:any) => { setItemToDelete(i); setCrudTarget(subSection === 'bilan' ? 'transactions' : subSection === 'materiel' ? 'materials' : subSection); setIsDeleteOpen(true); }} />;
    }
    return <div className="text-center py-20 text-gray-400">Section en construction...</div>;
  };

  return (
    <div className={`flex h-screen bg-gray-50 ${darkMode ? 'dark bg-gray-900' : ''}`}>
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-green-950 text-white transform transition-transform lg:translate-x-0 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full shadow-2xl'}`}>
        <div className="h-20 flex items-center px-6 bg-white border-b"><EbfLogo size="small"/></div>
        <nav className="p-4 space-y-1">
          {MAIN_MENU.map(m => (
            <button key={m.id} onClick={() => handleNavigate(m.path)} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${currentPath === m.path || currentPath.startsWith(m.path + '/') ? 'bg-ebf-orange font-bold shadow-lg' : 'text-gray-300 hover:bg-green-900'}`}>
              <m.icon size={20} /><span>{m.label}</span>
            </button>
          ))}
        </nav>
      </aside>
      <div className="flex-1 flex flex-col lg:ml-64">
        <HeaderWithNotif 
            title="EBF Manager" 
            onMenuClick={() => setIsMenuOpen(true)} 
            onLogout={onLogout} 
            notifications={notifications} 
            userProfile={userProfile} 
            userRole={userRole} 
            onOpenProfile={() => setIsProfileOpen(true)}
            onOpenFlashInfo={() => setIsFlashInfoOpen(true)}
            onOpenHelp={() => setIsHelpOpen(true)}
            darkMode={darkMode}
            onToggleTheme={() => setDarkMode(!darkMode)}
        />
        <main className="p-6 flex-1 overflow-y-auto">{renderContent()}</main>
      </div>

      {/* Modals */}
      {isAddOpen && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl animate-fade-in">
          <h3 className="text-xl font-bold mb-6">{FORM_CONFIGS[crudTarget === 'transactions' ? 'bilan' : crudTarget === 'materials' ? 'materiel' : crudTarget]?.title || 'Ajouter'}</h3>
          <form onSubmit={(e: any) => { e.preventDefault(); confirmAdd(Object.fromEntries(new FormData(e.target))); }} className="space-y-4">
            {FORM_CONFIGS[crudTarget === 'transactions' ? 'bilan' : crudTarget === 'materials' ? 'materiel' : crudTarget]?.fields.map((f: any) => (
              <div key={f.name}>
                <label className="block text-sm font-bold mb-1">{f.label}</label>
                {f.type === 'select' ? <select name={f.name} className="w-full p-2 border rounded-lg" required>{f.options.map((o:any)=><option key={o} value={o}>{o}</option>)}</select> : <input name={f.name} type={f.type} className="w-full p-2 border rounded-lg" required/>}
              </div>
            ))}
            <div className="flex gap-2 pt-4">
              <button type="button" onClick={() => setIsAddOpen(false)} className="flex-1 py-2 border rounded-lg">Annuler</button>
              <button type="submit" className="flex-1 py-2 bg-ebf-orange text-white rounded-lg font-bold">{crudLoading ? '...' : 'Valider'}</button>
            </div>
          </form>
        </div>
      </div>}

      {isDeleteOpen && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="bg-white p-6 rounded-xl text-center max-w-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500"><AlertTriangle size={32}/></div>
          <h3 className="text-xl font-bold mb-2">Supprimer cet élément ?</h3>
          <div className="flex gap-2 mt-6">
            <button onClick={() => setIsDeleteOpen(false)} className="flex-1 py-2 border rounded-lg">Non</button>
            <button onClick={confirmDelete} className="flex-1 py-2 bg-red-500 text-white rounded-lg font-bold">{crudLoading ? '...' : 'Oui'}</button>
          </div>
        </div>
      </div>}
      
      {/* Modals Informations */}
      {isProfileOpen && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl relative">
          <button onClick={() => setIsProfileOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X/></button>
          <h3 className="text-xl font-bold mb-6">Mon Profil</h3>
          <div className="space-y-4">
            <div className="flex flex-col items-center mb-6">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center text-ebf-orange font-bold text-3xl mb-2">{userProfile?.full_name?.charAt(0) || 'U'}</div>
                <p className="font-bold text-lg">{userProfile?.full_name}</p>
                <p className="text-gray-500 text-sm">{userRole}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div><label className="text-gray-400">Email</label><p className="font-medium">{session?.user?.email}</p></div>
                <div><label className="text-gray-400">Site</label><p className="font-medium">{userProfile?.site || 'Non défini'}</p></div>
            </div>
          </div>
        </div>
      </div>}
      
      {isHelpOpen && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-2xl relative">
          <button onClick={() => setIsHelpOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X/></button>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-700"><HelpCircle/> Aide & Support</h3>
          <div className="space-y-4 text-sm">
            <p className="font-bold">Comment utiliser EBF Manager ?</p>
            <p className="text-gray-600">Naviguez via le menu latéral pour accéder aux différents modules. Le dashboard accueil vous donne une vue temps réel sur la rentabilité.</p>
            <p className="bg-orange-50 p-3 rounded-lg border border-orange-100">Contact technique : <strong>support@ebf.ci</strong></p>
          </div>
        </div>
      </div>}
      
      {isFlashInfoOpen && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white p-6 rounded-xl w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
          <button onClick={() => setIsFlashInfoOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X/></button>
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Megaphone className="text-ebf-orange"/> Gestion Flash Info</h3>
          <div className="space-y-4">
             <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Ajouter un message</p>
                <div className="flex gap-2">
                   <input id="ticker-input" placeholder="Texte du message..." className="flex-1 p-2 border rounded-lg"/>
                   <button onClick={async () => {
                       const el = document.getElementById('ticker-input') as HTMLInputElement;
                       if (el.value) {
                           await supabase.from('ticker_messages').insert([{ text: el.value, type: 'info', display_order: tickerMessages.length + 1 }]);
                           el.value = '';
                       }
                   }} className="bg-ebf-orange text-white px-4 rounded-lg font-bold">Publier</button>
                </div>
             </div>
             <div className="space-y-2">
                {tickerMessages.map((m: any) => (
                    <div key={m.id} className="p-3 border rounded-lg flex justify-between items-center group">
                        <span className="text-sm">{m.text}</span>
                        <button onClick={async () => await supabase.from('ticker_messages').delete().eq('id', m.id)} className="text-red-400 opacity-0 group-hover:opacity-100 transition"><Trash2 size={16}/></button>
                    </div>
                ))}
             </div>
          </div>
        </div>
      </div>}
    </div>
  );
};

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        if (session) {
            supabase.from('profiles').select('*').eq('id', session.user.id).single()
                .then(({data}) => { setUserProfile(data); setLoading(false); });
        } else {
            setLoading(false);
        }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        if (session) {
            supabase.from('profiles').select('*').eq('id', session.user.id).single()
                .then(({data}) => setUserProfile(data));
        }
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center bg-green-950 text-white flex-col gap-4 animate-pulse"><EbfLogo size="large"/><p className="font-bold">EBF Manager...</p></div>;
  if (!session) return <div className="h-screen flex items-center justify-center bg-ebf-pattern p-4">
    <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border text-center relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-ebf-orange"></div>
      <EbfLogo size="large" /><p className="text-gray-500 mb-8 font-medium">Gestion Technique & Immobilière</p>
      <form onSubmit={async (e: any) => { e.preventDefault(); const { error } = await supabase.auth.signInWithPassword({ email: e.target.email.value, password: e.target.password.value }); if (error) alert("Email ou mot de passe invalide."); }} className="space-y-4 text-left">
        <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Adresse Email</label><div className="relative"><Mail className="absolute left-3 top-3 text-gray-300" size={18}/><input name="email" type="email" className="w-full pl-10 p-2.5 border rounded-xl bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-ebf-orange transition" placeholder="votre@email.com" required/></div></div>
        <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Mot de passe</label><div className="relative"><Lock className="absolute left-3 top-3 text-gray-300" size={18}/><input name="password" type="password" className="w-full pl-10 p-2.5 border rounded-xl bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-ebf-orange transition" placeholder="••••••••" required/></div></div>
        <button type="submit" className="w-full bg-ebf-green text-white py-3.5 rounded-xl font-bold hover:shadow-lg transition transform hover:-translate-y-0.5 mt-2">Accéder à mon espace</button>
      </form>
      <p className="mt-8 text-xs text-gray-400">© 2024 E.B.F - Tous droits réservés</p>
    </div>
  </div>;

  return <AppContent session={session} onLogout={() => supabase.auth.signOut()} userRole={userProfile?.role || 'Collaborateur'} userProfile={userProfile} />;
}
