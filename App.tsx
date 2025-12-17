
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, Wrench, ShoppingCart, Menu, X, Bell, Settings,
  HardHat, DollarSign, LogOut, Calculator, Users, Calendar, FolderOpen, Truck, 
  FileText, UserCheck, CreditCard, Archive, ShieldCheck, ClipboardList, ArrowLeft, ChevronRight, Mic, Plus, Trash2, User, HelpCircle, Moon, Sun, Megaphone, AlertCircle, TrendingUp, AlertTriangle, Loader2, Mail, Lock, Phone, Eye, EyeOff, Sparkles
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { DetailedSynthesis } from './components/DetailedSynthesis';
import { Site, Period, TickerMessage, StatData, DailyReport, Intervention, StockItem, Transaction, Profile, Role, Notification, Technician } from './types';
import { supabase } from './services/supabaseClient';

// --- Configuration des formulaires ---
const FORM_CONFIGS: Record<string, any> = {
  interventions: { title: 'Nouvelle Intervention', fields: [{ name: 'client', label: 'Client', type: 'text' }, { name: 'clientPhone', label: 'Tél Client', type: 'text' }, { name: 'location', label: 'Lieu', type: 'text' }, { name: 'description', label: 'Panne', type: 'text' }, { name: 'technicianId', label: 'ID Tech', type: 'text' }, { name: 'date', label: 'Date', type: 'date' }, { name: 'status', label: 'Statut', type: 'select', options: ['Pending', 'In Progress', 'Completed'] }] },
  stocks: { title: 'Ajouter au Stock', fields: [{ name: 'name', label: 'Article', type: 'text' }, { name: 'quantity', label: 'Quantité', type: 'number' }, { name: 'unit', label: 'Unité', type: 'text' }, { name: 'threshold', label: 'Seuil', type: 'number' }, { name: 'site', label: 'Site', type: 'select', options: ['Abidjan', 'Bouaké'] }] },
  materials: { title: 'Nouveau Matériel', fields: [{ name: 'name', label: 'Nom', type: 'text' }, { name: 'serialNumber', label: 'S/N', type: 'text' }, { name: 'condition', label: 'État', type: 'select', options: ['Neuf', 'Bon', 'Usé', 'Panne'] }, { name: 'assignedTo', label: 'Affecté à', type: 'text' }, { name: 'site', label: 'Site', type: 'select', options: ['Abidjan', 'Bouaké'] }] },
  technicians: { title: 'Nouveau Membre', fields: [{ name: 'name', label: 'Nom', type: 'text' }, { name: 'specialty', label: 'Rôle', type: 'text' }, { name: 'site', label: 'Site', type: 'select', options: ['Abidjan', 'Bouaké'] }, { name: 'status', label: 'Statut', type: 'select', options: ['Available', 'Busy', 'Off'] }] },
  reports: { title: 'Nouveau Rapport', fields: [{ name: 'technicianName', label: 'Technicien', type: 'text' }, { name: 'date', label: 'Date', type: 'date' }, { name: 'content', label: 'Détails', type: 'text' }, { name: 'domain', label: 'Domaine', type: 'select', options: ['Electricité', 'Froid', 'Bâtiment', 'Plomberie'] }, { name: 'revenue', label: 'Recette', type: 'number' }, { name: 'expenses', label: 'Dépenses', type: 'number' }] },
  chantiers: { title: 'Nouveau Chantier', fields: [{ name: 'name', label: 'Nom', type: 'text' }, { name: 'location', label: 'Lieu', type: 'text' }, { name: 'client', label: 'Client', type: 'text' }, { name: 'site', label: 'Ville', type: 'select', options: ['Abidjan', 'Bouaké'] }, { name: 'status', label: 'État', type: 'select', options: ['En cours', 'Terminé', 'Suspendu'] }, { name: 'date', label: 'Début', type: 'date' }] },
  transactions: { title: 'Transaction', fields: [{ name: 'label', label: 'Libellé', type: 'text' }, { name: 'amount', label: 'Montant', type: 'number' }, { name: 'type', label: 'Type', type: 'select', options: ['Recette', 'Dépense'] }, { name: 'category', label: 'Catégorie', type: 'select', options: ['Vente', 'Achat', 'Salaire', 'Loyer', 'Autre'] }, { name: 'date', label: 'Date', type: 'date' }, { name: 'site', label: 'Site', type: 'select', options: ['Abidjan', 'Bouaké'] }] }
};

const MAIN_MENU = [
  { id: 'accueil', label: 'Accueil', icon: LayoutDashboard, path: '/' },
  { id: 'techniciens', label: 'Techniciens', icon: HardHat, path: '/techniciens' },
  { id: 'comptabilite', label: 'Comptabilité', icon: Calculator, path: '/comptabilite' },
  { id: 'secretariat', label: 'Secrétariat', icon: FolderOpen, path: '/secretariat' },
  { id: 'quincaillerie', label: 'Quincaillerie', icon: ShoppingCart, path: '/quincaillerie' },
  { id: 'equipe', label: 'Notre Équipe', icon: Users, path: '/equipe' },
];

const MODULE_ACTIONS: Record<string, any[]> = {
  techniciens: [
    { id: 'interventions', label: 'Interventions', icon: Wrench, path: '/techniciens/interventions', color: 'bg-orange-500' },
    { id: 'rapports', label: 'Rapports Journaliers', icon: FileText, path: '/techniciens/rapports', color: 'bg-gray-700' },
    { id: 'materiel', label: 'Matériel & Outils', icon: Truck, path: '/techniciens/materiel', color: 'bg-blue-600' },
    { id: 'chantiers', label: 'Chantiers', icon: ShieldCheck, path: '/techniciens/chantiers', color: 'bg-green-600' },
  ],
  comptabilite: [
    { id: 'bilan', label: 'Bilan Financier', icon: DollarSign, path: '/comptabilite/bilan', color: 'bg-green-600' },
    { id: 'rh', label: 'Ressources Humaines', icon: Users, path: '/comptabilite/rh', color: 'bg-purple-600' },
    { id: 'paie', label: 'Paie & Salaires', icon: CreditCard, path: '/comptabilite/paie', color: 'bg-orange-500' },
  ],
  secretariat: [
    { id: 'planning', label: 'Planning', icon: Calendar, path: '/secretariat/planning', color: 'bg-indigo-500' },
    { id: 'clients', label: 'Gestion Clients', icon: UserCheck, path: '/secretariat/clients', color: 'bg-blue-500' },
    { id: 'caisse', label: 'Caisse', icon: Archive, path: '/secretariat/caisse', color: 'bg-gray-600' },
  ],
  quincaillerie: [
    { id: 'stocks', label: 'Stocks', icon: ClipboardList, path: '/quincaillerie/stocks', color: 'bg-orange-600' },
    { id: 'fournisseurs', label: 'Fournisseurs', icon: Truck, path: '/quincaillerie/fournisseurs', color: 'bg-green-600' },
    { id: 'achats', label: 'Bons d\'achat', icon: FileText, path: '/quincaillerie/achats', color: 'bg-red-500' },
  ]
};

// --- Composants UI de base ---
const EbfLogo = ({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) => (
  <div className={`font-black tracking-tighter flex items-baseline ${size === 'small' ? 'text-xl' : size === 'large' ? 'text-5xl' : 'text-3xl'}`}>
    <span className="text-ebf-green">E</span><span className="text-ebf-orange">B</span><span className="text-ebf-green">F</span>
  </div>
);

const AppContent = ({ onLogout, userRole, userProfile }: any) => {
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
  const [tickerMessages, setTickerMessages] = useState<TickerMessage[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // États UI
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
    ticker_messages: setTickerMessages
  };

  // Chargement initial et Realtime
  useEffect(() => {
    const fetchData = async () => {
      const { data: interv } = await supabase.from('interventions').select('*'); if (interv) setInterventions(interv);
      const { data: st } = await supabase.from('stocks').select('*'); if (st) setStock(st);
      const { data: mat } = await supabase.from('materials').select('*'); if (mat) setMaterials(mat);
      const { data: tech } = await supabase.from('technicians').select('*'); if (tech) setTechnicians(tech);
      const { data: rep } = await supabase.from('reports').select('*'); if (rep) setReports(rep);
      const { data: trans } = await supabase.from('transactions').select('*'); if (trans) setTransactions(trans);
      const { data: tick } = await supabase.from('ticker_messages').select('*').order('display_order'); if (tick) setTickerMessages(tick);
    };
    fetchData();

    const channel = supabase.channel('global-ebf')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        const setter = stateSetterMap[payload.table];
        if (!setter) return;
        if (payload.eventType === 'INSERT') setter((prev: any) => [...prev.filter((i:any) => i.id !== payload.new.id), payload.new]);
        if (payload.eventType === 'UPDATE') setter((prev: any) => prev.map((i: any) => i.id === payload.new.id ? payload.new : i));
        if (payload.eventType === 'DELETE') setter((prev: any) => prev.filter((i: any) => i.id !== payload.old.id));
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Agrégation des stats pour le Dashboard
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

  // --- ACTIONS CRUD OPTIMISÉES (AFFICHAGE INSTANTANÉ) ---
  const confirmAdd = async (formData: any) => {
    setCrudLoading(true);
    const processed = { ...formData, site: formData.site || currentSite !== Site.GLOBAL ? currentSite : Site.ABIDJAN };
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

  const renderContent = () => {
    if (currentPath === '/') return <Dashboard data={stats} reports={reports} tickerMessages={tickerMessages} stock={stock} currentSite={currentSite} currentPeriod={currentPeriod} onSiteChange={setCurrentSite} onPeriodChange={setCurrentPeriod} onNavigate={setCurrentPath} onDeleteReport={async (id) => { await supabase.from('reports').delete().eq('id', id); setReports(prev => prev.filter(r => r.id !== id)); }} />;
    if (currentPath === '/synthesis') return <DetailedSynthesis data={stats} reports={reports} currentSite={currentSite} currentPeriod={currentPeriod} onSiteChange={setCurrentSite} onPeriodChange={setCurrentPeriod} onNavigate={setCurrentPath} onViewReport={() => {}} />;
    
    const section = currentPath.substring(1);
    if (MODULE_ACTIONS[section]) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {MODULE_ACTIONS[section].map((a: any) => (
            <button key={a.id} onClick={() => setCurrentPath(a.path)} className="bg-white p-6 rounded-xl shadow-sm border hover:border-ebf-orange transition text-left group">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${a.color} text-white`}><a.icon size={24} /></div>
              <h3 className="font-bold text-lg group-hover:text-ebf-orange">{a.label}</h3>
            </button>
          ))}
        </div>
      );
    }
    // Si c'est un sous-module (ex: /techniciens/interventions)
    const table = currentPath.split('/').pop() || '';
    if (FORM_CONFIGS[table]) {
      return <div className="p-4 bg-white rounded-xl shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center"><button onClick={() => setCurrentPath('/' + currentPath.split('/')[1])} className="mr-2"><ArrowLeft size={20}/></button> {FORM_CONFIGS[table].title}</h2>
          <button onClick={() => { setCrudTarget(table); setIsAddOpen(true); }} className="bg-ebf-orange text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"><Plus size={18}/> Ajouter</button>
        </div>
        <div className="space-y-2">
          {(stateSetterMap[table] ? (window as any)[table + '_data'] || [] : []).map((i: any) => (
            <div key={i.id} className="p-3 border rounded-lg flex justify-between items-center">
              <span>{i.name || i.client || i.label || i.id}</span>
              <button onClick={() => { setItemToDelete(i); setCrudTarget(table); setIsDeleteOpen(true); }} className="text-red-400"><Trash2 size={18}/></button>
            </div>
          ))}
        </div>
      </div>;
    }
    return <div className="text-center py-20 text-gray-400">Module en développement...</div>;
  };

  return (
    <div className={`flex h-screen bg-gray-50 ${darkMode ? 'dark bg-gray-900' : ''}`}>
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-green-950 text-white transform transition-transform lg:translate-x-0 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-20 flex items-center px-6 bg-white"><EbfLogo size="small"/></div>
        <nav className="p-4 space-y-1">
          {MAIN_MENU.map(m => (
            <button key={m.id} onClick={() => { setCurrentPath(m.path); setIsMenuOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${currentPath === m.path ? 'bg-ebf-orange font-bold shadow-lg' : 'text-gray-300 hover:bg-green-900'}`}>
              <m.icon size={20} /><span>{m.label}</span>
            </button>
          ))}
        </nav>
      </aside>
      <div className="flex-1 flex flex-col lg:ml-64">
        <header className="h-20 bg-white border-b px-6 flex items-center justify-between sticky top-0 z-30">
          <button onClick={() => setIsMenuOpen(true)} className="lg:hidden p-2"><Menu /></button>
          <h2 className="font-bold text-xl">EBF Manager</h2>
          <div className="flex items-center space-x-4">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 text-gray-500">{darkMode ? <Sun/> : <Moon/>}</button>
            <button onClick={onLogout} className="p-2 text-red-500"><LogOut/></button>
          </div>
        </header>
        <main className="p-6 flex-1 overflow-y-auto">{renderContent()}</main>
      </div>

      {/* Modals CRUD */}
      {isAddOpen && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl">
          <h3 className="text-xl font-bold mb-6">{FORM_CONFIGS[crudTarget].title}</h3>
          <form onSubmit={(e: any) => { e.preventDefault(); const d = new FormData(e.target); confirmAdd(Object.fromEntries(d)); }} className="space-y-4">
            {FORM_CONFIGS[crudTarget].fields.map((f: any) => (
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
          <h3 className="text-xl font-bold mb-2">Confirmer la suppression ?</h3>
          <p className="text-gray-500 mb-6 italic">Cette action est irréversible.</p>
          <div className="flex gap-2">
            <button onClick={() => setIsDeleteOpen(false)} className="flex-1 py-2 border rounded-lg">Non</button>
            <button onClick={confirmDelete} className="flex-1 py-2 bg-red-500 text-white rounded-lg font-bold">{crudLoading ? '...' : 'Oui'}</button>
          </div>
        </div>
      </div>}
    </div>
  );
};

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center bg-green-950 text-white">Initialisation...</div>;
  if (!session) return <div className="h-screen flex items-center justify-center bg-gray-50 p-4">
    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border text-center">
      <EbfLogo size="large" /><p className="text-gray-500 mb-8">Espace Professionnel</p>
      <form onSubmit={async (e: any) => { e.preventDefault(); const { error } = await supabase.auth.signInWithPassword({ email: e.target.email.value, password: e.target.password.value }); if (error) alert(error.message); }} className="space-y-4 text-left">
        <div><label className="block text-sm font-bold mb-1">Email</label><input name="email" type="email" className="w-full p-2.5 border rounded-lg" required/></div>
        <div><label className="block text-sm font-bold mb-1">Mot de passe</label><input name="password" type="password" className="w-full p-2.5 border rounded-lg" required/></div>
        <button type="submit" className="w-full bg-ebf-green text-white py-3 rounded-lg font-bold hover:bg-green-700 transition">Se connecter</button>
      </form>
    </div>
  </div>;

  return <AppContent session={session} onLogout={() => supabase.auth.signOut()} userRole="Admin" userProfile={null} />;
}
