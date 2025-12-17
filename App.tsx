
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
interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'email';
  options?: string[];
}
interface FormConfig {
  title: string;
  fields: FormField[];
}

const FORM_CONFIGS: Record<string, FormConfig> = {
  interventions: { title: 'Nouvelle Intervention', fields: [{ name: 'client', label: 'Client', type: 'text' }, { name: 'clientPhone', label: 'Tél Client', type: 'text' }, { name: 'location', label: 'Lieu', type: 'text' }, { name: 'description', label: 'Panne', type: 'text' }, { name: 'date', label: 'Date', type: 'date' }, { name: 'status', label: 'Statut', type: 'select', options: ['Pending', 'In Progress', 'Completed'] }] },
  stocks: { title: 'Ajouter au Stock', fields: [{ name: 'name', label: 'Article', type: 'text' }, { name: 'quantity', label: 'Quantité', type: 'number' }, { name: 'unit', label: 'Unité', type: 'text' }, { name: 'site', label: 'Site', type: 'select', options: ['Abidjan', 'Bouaké'] }] },
  materials: { title: 'Nouveau Matériel', fields: [{ name: 'name', label: 'Nom', type: 'text' }, { name: 'condition', label: 'État', type: 'select', options: ['Neuf', 'Bon', 'Usé', 'Panne'] }, { name: 'site', label: 'Site', type: 'select', options: ['Abidjan', 'Bouaké'] }] },
  reports: { title: 'Nouveau Rapport', fields: [{ name: 'technicianName', label: 'Technicien', type: 'text' }, { name: 'date', label: 'Date', type: 'date' }, { name: 'content', label: 'Contenu', type: 'text' }, { name: 'revenue', label: 'Recette', type: 'number' }] },
  chantiers: { title: 'Nouveau Chantier', fields: [{ name: 'name', label: 'Nom', type: 'text' }, { name: 'client', label: 'Client', type: 'text' }, { name: 'status', label: 'État', type: 'select', options: ['En cours', 'Terminé'] }] },
  transactions: { title: 'Écriture Comptable', fields: [{ name: 'label', label: 'Libellé', type: 'text' }, { name: 'amount', label: 'Montant', type: 'number' }, { name: 'type', label: 'Type', type: 'select', options: ['Recette', 'Dépense'] }] }
};

const MAIN_MENU = [
  { id: 'accueil', label: 'Accueil', icon: LayoutDashboard, path: '/' },
  { id: 'techniciens', label: 'Techniciens', icon: HardHat, path: '/techniciens' },
  { id: 'comptabilite', label: 'Comptabilité', icon: Calculator, path: '/comptabilite' },
  { id: 'secretariat', label: 'Secrétariat', icon: FolderOpen, path: '/secretariat' },
  { id: 'quincaillerie', label: 'Quincaillerie', icon: ShoppingCart, path: '/quincaillerie' },
];

const MODULE_ACTIONS: Record<string, any[]> = {
  techniciens: [
    { id: 'interventions', label: 'Interventions', icon: Wrench, path: '/techniciens/interventions', color: 'bg-orange-500' },
    { id: 'rapports', label: 'Rapports Journaliers', icon: FileText, path: '/techniciens/rapports', color: 'bg-gray-700' },
    { id: 'materiel', label: 'Matériel & Outils', icon: Truck, path: '/techniciens/materiel', color: 'bg-blue-600' },
    { id: 'chantiers', label: 'Chantiers', icon: ShieldCheck, path: '/techniciens/chantiers', color: 'bg-green-600' },
  ],
  comptabilite: [{ id: 'bilan', label: 'Bilan Financier', icon: DollarSign, path: '/comptabilite/bilan', color: 'bg-green-600' }],
  secretariat: [{ id: 'planning', label: 'Planning', icon: Calendar, path: '/secretariat/planning', color: 'bg-indigo-500' }],
  quincaillerie: [{ id: 'stocks', label: 'Stocks', icon: ClipboardList, path: '/quincaillerie/stocks', color: 'bg-orange-600' }]
};

const EbfLogo = ({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) => (
  <div className={`font-black tracking-tighter flex items-baseline ${size === 'small' ? 'text-xl' : size === 'large' ? 'text-5xl' : 'text-3xl'}`}>
    <span className="text-ebf-green">E</span><span className="text-ebf-orange">B</span><span className="text-ebf-green">F</span>
  </div>
);

const VoiceRecorderModal = ({ isOpen, onClose, userProfile }: any) => {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [loading, setLoading] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks: BlobPart[] = [];
            recorder.ondataavailable = (e) => chunks.push(e.data);
            recorder.onstop = () => setAudioBlob(new Blob(chunks, { type: 'audio/webm' }));
            recorder.start();
            mediaRecorderRef.current = recorder;
            setIsRecording(true);
        } catch (err) { alert("Micro inaccessible"); }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
        }
    };

    const handleSave = async () => {
        if (!audioBlob) return;
        setLoading(true);
        try {
            const fileName = `voice_${Date.now()}.webm`;
            await supabase.storage.from('reports-audio').upload(fileName, audioBlob);
            const { data: { publicUrl } } = supabase.storage.from('reports-audio').getPublicUrl(fileName);
            await supabase.from('reports').insert([{
                technicianName: userProfile?.full_name || 'Inconnu',
                date: new Date().toISOString().split('T')[0],
                content: `Rapport vocal du ${new Date().toLocaleString()}`,
                method: 'Voice',
                audioUrl: publicUrl,
                site: userProfile?.site || 'Abidjan'
            }]);
            onClose();
            setAudioBlob(null);
        } catch (e) { alert("Erreur d'envoi"); }
        setLoading(false);
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl p-8 max-w-sm w-full text-center shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400"><X/></button>
                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-100'}`}>
                    <Mic className={isRecording ? 'text-white' : 'text-gray-400'} size={32}/>
                </div>
                <h3 className="font-bold text-lg mb-6">Rapport Vocal</h3>
                {!isRecording && !audioBlob && <button onClick={startRecording} className="w-full bg-ebf-orange text-white py-3 rounded-xl font-bold">Démarrer</button>}
                {isRecording && <button onClick={stopRecording} className="w-full bg-red-600 text-white py-3 rounded-xl font-bold">Arrêter</button>}
                {audioBlob && !isRecording && (
                    <div className="space-y-4">
                        <audio src={URL.createObjectURL(audioBlob)} controls className="w-full" />
                        <div className="flex gap-2">
                            <button onClick={() => setAudioBlob(null)} className="flex-1 py-2 border rounded-xl">Recommencer</button>
                            <button onClick={handleSave} disabled={loading} className="flex-1 py-2 bg-ebf-green text-white rounded-xl font-bold">{loading ? '...' : 'Envoyer'}</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const HeaderWithNotif = ({ title, onMenuClick, onLogout, notifications, userProfile, userRole, onOpenProfile, onOpenFlashInfo, onOpenHelp, darkMode, onToggleTheme }: any) => {
    const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
    const settingsRef = useRef<HTMLDivElement>(null);
    const unreadCount = notifications.filter((n: any) => !n.read).length;

    useEffect(() => {
        const handleClickOutside = (e: any) => { if (settingsRef.current && !settingsRef.current.contains(e.target)) setShowSettingsDropdown(false); };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="bg-white border-b h-16 flex items-center justify-between px-4 sticky top-0 z-30 shadow-sm">
           <div className="flex items-center gap-4">
              <button onClick={onMenuClick} className="lg:hidden p-2 text-gray-600"><Menu/></button>
              <h2 className="text-lg font-extrabold text-green-950 hidden md:block">{title}</h2>
           </div>
           <div className="flex items-center gap-3">
              <div className="hidden md:block text-right border-r pr-4 border-gray-100">
                  <p className="text-sm font-bold text-gray-800">{userProfile?.full_name}</p>
                  <p className="text-[10px] text-ebf-orange font-bold uppercase">{userRole}</p>
              </div>
              <div className="relative" ref={settingsRef}>
                 <button onClick={() => setShowSettingsDropdown(!showSettingsDropdown)} className="p-2 hover:bg-gray-100 rounded-full transition text-gray-600">
                    <Settings size={22}/>
                 </button>
                 {showSettingsDropdown && (
                   <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden animate-fade-in">
                      <button onClick={() => { onOpenProfile(); setShowSettingsDropdown(false); }} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-sm font-medium"><User size={18} className="text-ebf-orange"/> Mon Profil</button>
                      <button onClick={() => { onOpenFlashInfo(); setShowSettingsDropdown(false); }} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-sm font-medium"><Megaphone size={18} className="text-blue-500"/> Gestion Flash Info</button>
                      <button onClick={onToggleTheme} className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-50 text-sm font-medium"><div className="flex items-center gap-3"><Moon size={18} className="text-indigo-500"/> Mode Sombre</div><div className={`w-8 h-4 rounded-full p-0.5 ${darkMode ? 'bg-indigo-500' : 'bg-gray-300'}`}><div className={`w-3 h-3 bg-white rounded-full transition-transform ${darkMode ? 'translate-x-4' : ''}`}></div></div></button>
                      <button onClick={() => { onOpenHelp(); setShowSettingsDropdown(false); }} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-sm font-medium"><HelpCircle size={18} className="text-green-500"/> Aide</button>
                      <div className="border-t my-1"></div>
                      <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 text-sm font-bold text-red-600"><LogOut size={18}/> Déconnexion</button>
                   </div>
                 )}
              </div>
           </div>
        </header>
    );
};

const ModulePlaceholder = ({ title, items = [], onBack, color, onAdd, onVoiceAdd, onDelete }: any) => (
    <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="p-2 bg-white rounded-full border hover:text-ebf-orange"><ArrowLeft size={20}/></button>
                <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
            </div>
            <div className="flex gap-2">
                {onVoiceAdd && <button onClick={onVoiceAdd} className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold shadow hover:opacity-90 flex items-center gap-2"><Mic size={18}/> Rapport Vocal</button>}
                {onAdd && <button onClick={onAdd} className={`${color} text-white px-4 py-2 rounded-lg font-bold shadow hover:opacity-90 flex items-center gap-2`}><Plus size={18}/> Ajouter</button>}
            </div>
        </div>
        <div className="bg-white rounded-xl shadow overflow-hidden border">
            <table className="w-full">
                <thead className="bg-gray-50 border-b">
                    <tr><th className="p-4 text-left text-xs font-bold uppercase text-gray-500">Item</th><th className="p-4 text-left text-xs font-bold uppercase text-gray-500">Détails</th><th className="p-4 text-right text-xs font-bold uppercase text-gray-500">Actions</th></tr>
                </thead>
                <tbody className="divide-y">
                    {items.map((item: any) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                            <td className="p-4 font-bold text-gray-800">{item.name || item.client || item.technicianName || item.label}</td>
                            <td className="p-4 text-sm text-gray-600">{item.audioUrl ? <audio src={item.audioUrl} controls className="h-8"/> : item.content || item.description || item.date}</td>
                            <td className="p-4 text-right"><button onClick={() => onDelete(item)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const AppContent = ({ onLogout, userRole, userProfile, session }: any) => {
  const [currentPath, setCurrentPath] = useState('/');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentSite, setCurrentSite] = useState<Site>(Site.GLOBAL);
  const [currentPeriod, setCurrentPeriod] = useState<Period>(Period.MONTH);
  const [darkMode, setDarkMode] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [crudTarget, setCrudTarget] = useState('');
  const [data, setData] = useState<any>({ interventions: [], stocks: [], materials: [], reports: [], transactions: [], chantiers: [], ticker_messages: [] });

  useEffect(() => {
    const fetchAll = async () => {
        const tables = ['interventions', 'stocks', 'materials', 'reports', 'transactions', 'chantiers', 'ticker_messages'];
        const results: any = {};
        for (const t of tables) { const { data } = await supabase.from(t).select('*'); results[t] = data || []; }
        setData(results);
    };
    fetchAll();
    const sub = supabase.channel('realtime').on('postgres_changes', { event: '*', schema: 'public' }, () => fetchAll()).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  const stats = useMemo(() => {
    const map = new Map();
    data.reports.forEach((r: any) => {
      if (!map.has(r.date)) map.set(r.date, { id: r.date, date: r.date, revenue: 0, expenses: 0, profit: 0, interventions: 0, site: r.site });
      const s = map.get(r.date); s.revenue += Number(r.revenue || 0); s.interventions++; s.profit = s.revenue;
    });
    return Array.from(map.values());
  }, [data.reports]);

  const handleNavigate = (path: string) => { setCurrentPath(path); setIsMenuOpen(false); };

  const renderContent = () => {
    if (currentPath === '/') return <Dashboard data={stats} reports={data.reports} tickerMessages={data.ticker_messages} stock={data.stocks} currentSite={currentSite} currentPeriod={currentPeriod} onSiteChange={setCurrentSite} onPeriodChange={setCurrentPeriod} onNavigate={setCurrentPath} onDeleteReport={async (id) => { await supabase.from('reports').delete().eq('id', id); }} />;
    if (currentPath === '/synthesis') return <DetailedSynthesis data={stats} reports={data.reports} currentSite={currentSite} currentPeriod={currentPeriod} onSiteChange={setCurrentSite} onPeriodChange={setCurrentPeriod} onNavigate={setCurrentPath} onViewReport={() => {}} />;
    
    const section = currentPath.substring(1);
    if (MODULE_ACTIONS[section]) return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{MODULE_ACTIONS[section].map((a: any) => (<button key={a.id} onClick={() => handleNavigate(a.path)} className="bg-white p-6 rounded-xl shadow border hover:border-ebf-orange text-left group"><div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${a.color} text-white`}><a.icon size={24} /></div><h3 className="font-bold text-lg group-hover:text-ebf-orange">{a.label}</h3></button>))}</div>;

    const sub = currentPath.split('/').pop() || '';
    const tableMap: any = { rapports: 'reports', materiel: 'materials', bilan: 'transactions' };
    const target = tableMap[sub] || sub;
    if (FORM_CONFIGS[target]) return <ModulePlaceholder title={target} items={data[target] || []} onBack={() => handleNavigate('/' + currentPath.split('/')[1])} color="bg-ebf-orange" onAdd={() => { setCrudTarget(target); setIsAddOpen(true); }} onVoiceAdd={target === 'reports' ? () => setIsVoiceOpen(true) : null} onDelete={async (i: any) => await supabase.from(target).delete().eq('id', i.id)} />;
    return <div className="py-20 text-center text-gray-400">En cours de développement...</div>;
  };

  return (
    <div className={`flex h-screen bg-gray-50 ${darkMode ? 'dark bg-gray-900' : ''}`}>
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-green-950 text-white transform transition-transform lg:translate-x-0 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-20 flex items-center px-6 bg-white border-b"><EbfLogo size="small"/></div>
        <nav className="p-4 space-y-1">
          {MAIN_MENU.map(m => (<button key={m.id} onClick={() => handleNavigate(m.path)} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl ${currentPath === m.path ? 'bg-ebf-orange font-bold' : 'text-gray-300 hover:bg-green-900'}`}><m.icon size={20} /><span>{m.label}</span></button>))}
        </nav>
      </aside>
      <div className="flex-1 flex flex-col lg:ml-64">
        <HeaderWithNotif title="EBF Manager" onMenuClick={() => setIsMenuOpen(true)} onLogout={onLogout} notifications={[]} userProfile={userProfile} userRole={userRole} onOpenProfile={() => {}} onOpenFlashInfo={() => {}} onOpenHelp={() => {}} darkMode={darkMode} onToggleTheme={() => setDarkMode(!darkMode)} />
        <main className="p-6 flex-1 overflow-y-auto">{renderContent()}</main>
      </div>
      <VoiceRecorderModal isOpen={isVoiceOpen} onClose={() => setIsVoiceOpen(false)} userProfile={userProfile} />
      {isAddOpen && <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50"><div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl">
          <h3 className="text-xl font-bold mb-6">{FORM_CONFIGS[crudTarget]?.title}</h3>
          <form onSubmit={async (e: any) => { e.preventDefault(); const fd = Object.fromEntries(new FormData(e.target)); await supabase.from(crudTarget).insert([fd]); setIsAddOpen(false); }} className="space-y-4">
            {FORM_CONFIGS[crudTarget]?.fields.map(f => (<div key={f.name}><label className="block text-sm font-bold mb-1">{f.label}</label>{f.type === 'select' ? <select name={f.name} className="w-full p-2 border rounded-lg">{f.options?.map(o => <option key={o} value={o}>{o}</option>)}</select> : <input name={f.name} type={f.type} className="w-full p-2 border rounded-lg" required/>}</div>))}
            <div className="flex gap-2 pt-4"><button type="button" onClick={() => setIsAddOpen(false)} className="flex-1 py-2 border rounded-lg">Annuler</button><button type="submit" className="flex-1 py-2 bg-ebf-orange text-white rounded-lg font-bold">Valider</button></div>
          </form>
      </div></div>}
    </div>
  );
};

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        if (session) supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({data}) => { setUserProfile(data); setLoading(false); });
        else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center bg-green-950 text-white font-bold"><EbfLogo size="large"/></div>;
  if (!session) return <div className="h-screen flex items-center justify-center bg-gray-50 p-4">
    <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md text-center border-t-8 border-ebf-orange">
      <EbfLogo size="large"/><p className="text-gray-400 mt-2 mb-8 uppercase tracking-widest text-xs font-bold">Accès Professionnel</p>
      <form onSubmit={async (e: any) => { e.preventDefault(); const { error } = await supabase.auth.signInWithPassword({ email: e.target.email.value, password: e.target.password.value }); if (error) alert("Identifiants incorrects."); }} className="space-y-4 text-left">
        <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1">Email</label><input name="email" type="email" className="w-full p-3 border rounded-xl" required/></div>
        <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1">Mot de passe</label><input name="password" type="password" className="w-full p-3 border rounded-xl" required/></div>
        <button type="submit" className="w-full bg-ebf-green text-white py-4 rounded-xl font-bold mt-4 shadow-lg">SE CONNECTER</button>
      </form>
    </div>
  </div>;

  return <AppContent session={session} onLogout={() => supabase.auth.signOut()} userRole={userProfile?.role || 'Collaborateur'} userProfile={userProfile} />;
}
