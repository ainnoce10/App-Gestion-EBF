
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

// --- Components ---

// Component defined here to resolve errors on line 230, 265, 268 in original App.tsx
/**
 * Composant de logo interne pour EBF Manager.
 */
const EbfLogo = ({ size = 'small' }: { size?: 'small' | 'large' }) => {
  const isLarge = size === 'large';
  return (
    <div className="flex items-center gap-2">
      <div className={`${isLarge ? 'w-12 h-12' : 'w-8 h-8'} bg-ebf-orange rounded-lg flex items-center justify-center shadow-lg transform rotate-3`}>
        <span className={`${isLarge ? 'text-2xl' : 'text-lg'} font-black text-white`}>E</span>
      </div>
      <div className="flex flex-col">
        <span className={`${isLarge ? 'text-2xl' : 'text-lg'} font-black tracking-tighter text-green-950 flex items-center`}>
          EBF <span className="text-ebf-orange ml-1">MANAGER</span>
        </span>
        {isLarge && <span className="text-[10px] font-bold text-gray-400 tracking-[0.2em] -mt-1 uppercase">Excellence Bâtiment Froid</span>}
      </div>
    </div>
  );
};

// --- Types for Navigation & Forms ---
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

const FORM_CONFIGS: Record<string, FormConfig> = {
  interventions: { title: 'Intervention', fields: [{ name: 'client', label: 'Client', type: 'text' }, { name: 'clientPhone', label: 'Tél Client', type: 'text' }, { name: 'location', label: 'Lieu', type: 'text' }, { name: 'description', label: 'Description', type: 'text' }, { name: 'date', label: 'Date', type: 'date' }, { name: 'status', label: 'Statut', type: 'select', options: ['Pending', 'In Progress', 'Completed'] }] },
  stocks: { title: 'Article de Stock', fields: [{ name: 'name', label: 'Nom Article', type: 'text' }, { name: 'quantity', label: 'Quantité', type: 'number' }, { name: 'unit', label: 'Unité', type: 'text' }, { name: 'threshold', label: 'Seuil Alerte', type: 'number' }, { name: 'site', label: 'Site', type: 'select', options: ['Abidjan', 'Bouaké'] }] },
  technicians: { title: 'Membre Équipe', fields: [{ name: 'name', label: 'Nom & Prénom', type: 'text' }, { name: 'specialty', label: 'Spécialité', type: 'text' }, { name: 'site', label: 'Site', type: 'select', options: ['Abidjan', 'Bouaké'] }, { name: 'status', label: 'Statut', type: 'select', options: ['Available', 'Busy', 'Off'] }] },
  reports: { title: 'Rapport Journalier', fields: [{ name: 'technicianName', label: 'Nom Technicien', type: 'text' }, { name: 'date', label: 'Date', type: 'date' }, { name: 'content', label: 'Contenu', type: 'text' }, { name: 'revenue', label: 'Recette', type: 'number' }, { name: 'expenses', label: 'Dépenses', type: 'number' }] },
  chantiers: { title: 'Chantier', fields: [{ name: 'name', label: 'Nom Chantier', type: 'text' }, { name: 'client', label: 'Client', type: 'text' }, { name: 'status', label: 'Statut', type: 'select', options: ['En cours', 'Terminé', 'Suspendu'] }] },
  transactions: { title: 'Écriture Comptable', fields: [{ name: 'label', label: 'Libellé', type: 'text' }, { name: 'amount', label: 'Montant', type: 'number' }, { name: 'type', label: 'Type', type: 'select', options: ['Recette', 'Dépense'] }, { name: 'category', label: 'Catégorie', type: 'select', options: ['Vente', 'Achat', 'Salaire', 'Loyer'] }] },
  employees: { title: 'Dossier Employé', fields: [{ name: 'full_name', label: 'Nom Complet', type: 'text' }, { name: 'role', label: 'Poste', type: 'text' }, { name: 'phone', label: 'Tél', type: 'text' }, { name: 'salary', label: 'Salaire', type: 'number' }] },
  clients: { title: 'Client', fields: [{ name: 'name', label: 'Nom', type: 'text' }, { name: 'phone', label: 'Téléphone', type: 'text' }, { name: 'email', label: 'Email', type: 'email' }, { name: 'address', label: 'Adresse', type: 'text' }] },
  suppliers: { title: 'Fournisseur', fields: [{ name: 'name', label: 'Entreprise', type: 'text' }, { name: 'contact', label: 'Contact', type: 'text' }, { name: 'category', label: 'Spécialité', type: 'select', options: ['Électricité', 'Plomberie', 'Divers'] }] },
  purchases: { title: 'Bon d\'Achat', fields: [{ name: 'item_name', label: 'Article', type: 'text' }, { name: 'supplier', label: 'Fournisseur', type: 'text' }, { name: 'cost', label: 'Coût', type: 'number' }] },
  caisse: { title: 'Caisse', fields: [{ name: 'label', label: 'Motif', type: 'text' }, { name: 'amount', label: 'Montant', type: 'number' }, { name: 'type', label: 'Flux', type: 'select', options: ['Entrée', 'Sortie'] }] }
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
    { id: 'materiel', label: 'Matériel', icon: Truck, path: '/techniciens/materiel', color: 'bg-blue-600' },
    { id: 'chantiers', label: 'Chantiers', icon: ShieldCheck, path: '/techniciens/chantiers', color: 'bg-green-600' },
  ],
  comptabilite: [
    { id: 'bilan', label: 'Bilan Financier', icon: DollarSign, path: '/comptabilite/bilan', color: 'bg-green-600' },
    { id: 'rh', label: 'Ressources Humaines', icon: Users, path: '/comptabilite/rh', color: 'bg-purple-600' },
    { id: 'paie', label: 'Paie', icon: CreditCard, path: '/comptabilite/paie', color: 'bg-orange-500' },
  ],
  secretariat: [
    { id: 'planning', label: 'Planning', icon: Calendar, path: '/secretariat/planning', color: 'bg-indigo-500' },
    { id: 'clients', label: 'Clients', icon: UserCheck, path: '/secretariat/clients', color: 'bg-blue-500' },
    { id: 'caisse', label: 'Caisse', icon: Archive, path: '/secretariat/caisse', color: 'bg-gray-600' },
  ],
  quincaillerie: [
    { id: 'stocks', label: 'Stocks', icon: ClipboardList, path: '/quincaillerie/stocks', color: 'bg-orange-600' },
    { id: 'fournisseurs', label: 'Fournisseurs', icon: Truck, path: '/quincaillerie/fournisseurs', color: 'bg-green-600' },
    { id: 'achats', label: 'Achats', icon: FileText, path: '/quincaillerie/achats', color: 'bg-red-500' },
  ]
};

const ModulePlaceholder = ({ title, subtitle, items = [], onBack, color, currentSite, onAdd, onEdit, onDelete, readOnly }: any) => {
    const filteredItems = items.filter((item: any) => !currentSite || currentSite === Site.GLOBAL || item.site === currentSite);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 bg-white rounded-full border hover:text-ebf-orange transition shadow-sm"><ArrowLeft size={20}/></button>
                    <div><h2 className="text-2xl font-bold text-gray-800 dark:text-white">{title}</h2><p className="text-sm text-gray-500">{subtitle}</p></div>
                </div>
                {!readOnly && onAdd && (
                    <button onClick={onAdd} className={`${color} text-white px-4 py-2 rounded-lg font-bold shadow hover:opacity-90 transition flex items-center gap-2`}><Plus size={18}/> Ajouter</button>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow border overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 text-left text-xs font-bold uppercase text-gray-500">ID</th>
                            <th className="p-4 text-left text-xs font-bold uppercase text-gray-500">Nom / Libellé</th>
                            <th className="p-4 text-left text-xs font-bold uppercase text-gray-500">Détails</th>
                            <th className="p-4 text-left text-xs font-bold uppercase text-gray-500">Site</th>
                            <th className="p-4 text-right text-xs font-bold uppercase text-gray-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {filteredItems.map((item: any) => (
                            <tr key={item.id} className="hover:bg-gray-50/50">
                                <td className="p-4 text-xs font-mono text-gray-400">#{item.id.substring(0, 4)}</td>
                                <td className="p-4 font-bold">{item.name || item.client || item.full_name || item.label}</td>
                                <td className="p-4 text-sm text-gray-600">{item.description || item.specialty || `${item.quantity} ${item.unit}` || '-'}</td>
                                <td className="p-4"><span className={`text-[10px] font-bold px-2 py-1 rounded-full ${item.site === 'Abidjan' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>{item.site || 'Global'}</span></td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-1">
                                        {!readOnly && onEdit && <button onClick={() => onEdit(item)} className="p-2 text-blue-500 hover:bg-blue-50 rounded transition"><Edit size={16}/></button>}
                                        {!readOnly && onDelete && <button onClick={() => onDelete(item)} className="p-2 text-red-500 hover:bg-red-50 rounded transition"><Trash2 size={16}/></button>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const FormModal = ({ isOpen, onClose, config, initialData, onSubmit, loading }: any) => {
    const [formData, setFormData] = useState<any>({});

    useEffect(() => {
        if (initialData) setFormData(initialData);
        else setFormData({});
    }, [initialData, isOpen]);

    if (!isOpen || !config) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl relative">
                <h3 className="text-xl font-bold mb-6">{initialData ? 'Modifier' : 'Nouveau'} {config.title}</h3>
                <form onSubmit={(e: any) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
                    {config.fields.map((f: FormField) => (
                        <div key={f.name}>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{f.label}</label>
                            {f.type === 'select' ? (
                                <select className="w-full border p-2.5 rounded-lg bg-gray-50 outline-none focus:ring-2 focus:ring-ebf-orange focus:bg-white" value={formData[f.name] || ''} onChange={e => setFormData({...formData, [f.name]: e.target.value})}>
                                    <option value="">Sélectionner...</option>
                                    {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            ) : (
                                <input type={f.type} required className="w-full border p-2.5 rounded-lg bg-gray-50 outline-none focus:ring-2 focus:ring-ebf-orange focus:bg-white" value={formData[f.name] || ''} onChange={e => setFormData({...formData, [f.name]: e.target.value})} />
                            )}
                        </div>
                    ))}
                    <div className="flex gap-3 pt-6">
                        <button type="button" onClick={onClose} className="flex-1 py-3 border rounded-xl font-bold text-gray-600">Annuler</button>
                        <button type="submit" disabled={loading} className="flex-1 py-3 bg-ebf-orange text-white rounded-xl font-bold shadow-lg shadow-orange-200">
                            {loading ? <Loader2 className="animate-spin mx-auto"/> : (initialData ? 'Mettre à jour' : 'Ajouter')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AppContent = ({ onLogout, userRole, userProfile }: any) => {
  const [currentPath, setCurrentPath] = useState('/');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentSite, setCurrentSite] = useState<Site>(Site.GLOBAL);
  const [darkMode, setDarkMode] = useState(false);
  const [data, setData] = useState<any>({ interventions: [], stocks: [], technicians: [], reports: [], transactions: [], chantiers: [], ticker_messages: [], employees: [], clients: [], suppliers: [], purchases: [], caisse: [] });
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [crudTarget, setCrudTarget] = useState('');
  const [itemToEdit, setItemToEdit] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchAll = async () => {
      const tables = Object.keys(data);
      const results: any = {};
      for (const t of tables) { const { data: d } = await supabase.from(t).select('*'); results[t] = d || []; }
      setData(results);
  };

  useEffect(() => {
    fetchAll();
    const sub = supabase.channel('ebf-v5').on('postgres_changes', { event: '*', schema: 'public' }, () => fetchAll()).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  const handleAction = async (formData: any) => {
      setLoading(true);
      const table = crudTarget;
      let error;
      if (itemToEdit) {
          ({ error } = await supabase.from(table).update(formData).eq('id', itemToEdit.id));
      } else {
          const payload = { ...formData, site: formData.site || (currentSite !== Site.GLOBAL ? currentSite : Site.ABIDJAN) };
          ({ error } = await supabase.from(table).insert([payload]));
      }
      setLoading(false);
      if (error) alert(error.message);
      else setIsFormOpen(false);
  };

  const deleteItem = async (item: any, table: string) => {
      if (confirm("Supprimer définitivement ?")) {
          await supabase.from(table).delete().eq('id', item.id);
      }
  };

  const handleNavigate = (path: string) => { setCurrentPath(path); setIsMenuOpen(false); };

  const renderContent = () => {
    if (currentPath === '/') return <Dashboard data={[]} reports={data.reports} tickerMessages={data.ticker_messages} stock={data.stocks} currentSite={currentSite} currentPeriod={Period.MONTH} onSiteChange={setCurrentSite} onPeriodChange={() => {}} onNavigate={handleNavigate} onDeleteReport={(id) => supabase.from('reports').delete().eq('id', id)} />;
    
    const section = currentPath.substring(1);
    if (MODULE_ACTIONS[section]) return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">{MODULE_ACTIONS[section].map((a: any) => (<button key={a.id} onClick={() => handleNavigate(a.path)} className="bg-white p-6 rounded-xl shadow border hover:border-ebf-orange text-left group transition"><div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${a.color} text-white shadow-md`}><a.icon size={24} /></div><h3 className="font-bold text-lg group-hover:text-ebf-orange">{a.label}</h3></button>))}</div>;

    const sub = currentPath.split('/').pop() || '';
    const tableMap: any = { rapports: 'reports', materiel: 'materials', bilan: 'transactions', rh: 'employees', paie: 'payrolls', achats: 'purchases' };
    const target = tableMap[sub] || sub;
    
    if (FORM_CONFIGS[target]) return <ModulePlaceholder title={target.toUpperCase()} items={data[target] || []} onBack={() => handleNavigate('/' + currentPath.split('/')[1])} color="bg-ebf-orange" currentSite={currentSite} onAdd={() => { setItemToEdit(null); setCrudTarget(target); setIsFormOpen(true); }} onEdit={(item: any) => { setItemToEdit(item); setCrudTarget(target); setIsFormOpen(true); }} onDelete={(item: any) => deleteItem(item, target)} />;
    
    return <div className="py-20 text-center text-gray-400">Module en construction...</div>;
  };

  return (
    <div className={`flex h-screen bg-gray-50 ${darkMode ? 'dark bg-gray-900' : ''}`}>
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-green-950 text-white transform transition-transform lg:translate-x-0 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full shadow-2xl'}`}>
        <div className="h-20 flex items-center px-6 bg-white border-b"><EbfLogo size="small"/></div>
        <nav className="p-4 space-y-1">
          {MAIN_MENU.map(m => (<button key={m.id} onClick={() => handleNavigate(m.path)} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${currentPath === m.path ? 'bg-ebf-orange font-bold shadow-lg' : 'text-gray-300 hover:bg-green-900'}`}><m.icon size={20} /><span>{m.label}</span></button>))}
        </nav>
      </aside>
      <div className="flex-1 flex flex-col lg:ml-64">
        <header className="bg-white border-b h-16 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
           <div className="flex items-center gap-4"><button onClick={() => setIsMenuOpen(true)} className="lg:hidden p-2 text-gray-600"><Menu/></button><h2 className="font-bold text-green-950">EBF Manager</h2></div>
           <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block"><p className="text-xs font-bold text-gray-800">{userProfile?.full_name}</p><p className="text-[10px] text-ebf-orange uppercase font-bold">{userRole}</p></div>
              <button onClick={onLogout} className="p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition"><LogOut size={20}/></button>
           </div>
        </header>
        <main className="p-6 flex-1 overflow-y-auto">{renderContent()}</main>
      </div>
      <FormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} config={FORM_CONFIGS[crudTarget]} initialData={itemToEdit} onSubmit={handleAction} loading={loading} />
    </div>
  );
};

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
        setSession(s);
        if (s) supabase.from('profiles').select('*').eq('id', s.user.id).single().then(({data}) => { setUserProfile(data); setLoading(false); });
        else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="h-screen flex flex-col items-center justify-center bg-green-950 text-white gap-4"><EbfLogo size="large"/><Loader2 className="animate-spin"/></div>;
  if (!session) return <div className="h-screen flex items-center justify-center bg-gray-100 p-4">
    <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md text-center border-t-8 border-ebf-orange">
      <EbfLogo size="large"/><p className="text-gray-400 mt-2 mb-8 uppercase tracking-widest text-xs font-bold">Portail Interne EBF</p>
      <form onSubmit={async (e: any) => { e.preventDefault(); const { error } = await supabase.auth.signInWithPassword({ email: e.target.email.value, password: e.target.password.value }); if (error) alert("Identifiants incorrects."); }} className="space-y-4 text-left">
        <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label><input name="email" type="email" required className="w-full p-3 border rounded-xl bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-ebf-orange"/></div>
        <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mot de passe</label><input name="password" type="password" required className="w-full p-3 border rounded-xl bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-ebf-orange"/></div>
        <button type="submit" className="w-full bg-ebf-green text-white py-4 rounded-xl font-bold mt-4 shadow-lg hover:bg-green-700 transition transform hover:-translate-y-0.5">SE CONNECTER</button>
      </form>
    </div>
  </div>;

  return <AppContent session={session} onLogout={() => supabase.auth.signOut()} userRole={userProfile?.role || 'Visiteur'} userProfile={userProfile} />;
}
