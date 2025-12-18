import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, Wrench, Briefcase, ShoppingCart, Menu, X, Bell, Search, Settings,
  HardHat, DollarSign, LogOut, Calculator, Users, Calendar, FolderOpen, Truck, 
  FileText, UserCheck, CreditCard, Archive, ShieldCheck, ClipboardList, ArrowLeft, 
  Mic, StopCircle, Loader2, User, ShoppingBag, Waves, ChevronRight, Plus, Trash2,
  CheckCircle, AlertTriangle, Filter, TrendingUp, Save, Send, MapPin, Phone, 
  Key, Shield, CreditCard as CardIcon, Briefcase as BriefcaseIcon
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { DetailedSynthesis } from './components/DetailedSynthesis';
import { Site, Period, TickerMessage, StatData, DailyReport, StockItem, Profile, CartItem, Role } from './types';
import { supabase } from './services/supabaseClient';
import { processVoiceReport } from './services/geminiService';
import { DEFAULT_TICKER_MESSAGES, MOCK_STATS, MOCK_STOCK, MOCK_TECHNICIANS, MOCK_INTERVENTIONS } from './constants';

// --- Helper Functions ---
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// --- Module Configuration ---
const MODULES = [
  { id: 'accueil', label: 'Accueil', icon: LayoutDashboard, path: '/', color: 'text-ebf-orange' },
  { id: 'techniciens', label: 'Techniciens', icon: HardHat, path: '/techniciens', color: 'text-gray-600' },
  { id: 'comptabilite', label: 'Comptabilité', icon: Calculator, path: '/comptabilite', color: 'text-gray-600' },
  { id: 'secretariat', label: 'Secrétariat', icon: FolderOpen, path: '/secretariat', color: 'text-gray-600' },
  { id: 'quincaillerie', label: 'Quincaillerie', icon: ShoppingCart, path: '/quincaillerie', color: 'text-gray-600' },
];

const MODULE_ACTIONS: Record<string, any[]> = {
  techniciens: [
    { id: 'interventions', label: 'Interventions', description: 'Planning & Exécution', icon: Wrench, path: '/techniciens/interventions', color: 'bg-orange-500' },
    { id: 'rapports', label: 'Rapports Journaliers', description: 'Vocal ou Manuel', icon: FileText, path: '/techniciens/rapports', color: 'bg-gray-700' },
    { id: 'materiel', label: 'Matériel', description: 'Inventaire & Affectation', icon: Truck, path: '/techniciens/materiel', color: 'bg-blue-600' },
    { id: 'chantiers', label: 'Chantiers', description: 'Suivi des travaux', icon: ShieldCheck, path: '/techniciens/chantiers', color: 'bg-green-600' },
  ],
  comptabilite: [
    { id: 'bilan', label: 'Bilan Financier', description: 'Recettes & Dépenses', icon: DollarSign, path: '/comptabilite/bilan', color: 'bg-green-600' },
    { id: 'rh', label: 'Ressources Humaines', description: 'Employés & Dossiers', icon: Users, path: '/comptabilite/rh', color: 'bg-purple-600' },
    { id: 'paie', label: 'Paie & Salaires', description: 'Virements & Bulletins', icon: CreditCard, path: '/comptabilite/paie', color: 'bg-orange-500' },
  ],
  secretariat: [
    { id: 'planning', label: 'Planning Équipe', description: 'Vue d\'ensemble', icon: Calendar, path: '/secretariat/planning', color: 'bg-indigo-500' },
    { id: 'clients', label: 'Gestion Clients', description: 'Base de données', icon: UserCheck, path: '/secretariat/clients', color: 'bg-blue-500' },
    { id: 'caisse', label: 'Petite Caisse', description: 'Suivi des flux', icon: Archive, path: '/secretariat/caisse', color: 'bg-gray-600' },
  ],
  quincaillerie: [
    { id: 'stocks', label: 'Stocks', description: 'État en temps réel', icon: ClipboardList, path: '/quincaillerie/stocks', color: 'bg-orange-600' },
    { id: 'fournisseurs', label: 'Fournisseurs', description: 'Liste des partenaires', icon: Truck, path: '/quincaillerie/fournisseurs', color: 'bg-green-600' },
    { id: 'achats', label: 'Bons d\'achat', description: 'Commandes en cours', icon: FileText, path: '/quincaillerie/achats', color: 'bg-red-500' },
  ]
};

// --- Modal Components ---
const VoiceRecorderModal = ({ isOpen, onClose, onFinish }: { isOpen: boolean, onClose: () => void, onFinish: (report: Partial<DailyReport>) => void }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      startRecording();
    } else {
      stopRecording();
    }
    return () => stopRecording();
  }, [isOpen]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setIsProcessing(true);
        try {
          const base64 = await blobToBase64(audioBlob);
          const report = await processVoiceReport(base64, 'audio/webm');
          onFinish(report);
        } catch (err) {
          alert("L'IA n'a pas pu analyser l'audio. Essayez de parler plus distinctement.");
        } finally {
          setIsProcessing(false);
          onClose();
        }
      };
      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      timerRef.current = window.setInterval(() => setDuration(d => d + 1), 1000);
    } catch (err) {
      alert("Accès microphone refusé. Vérifiez vos paramètres.");
      onClose();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-green-950/80 backdrop-blur-md">
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl border-t-4 border-ebf-orange">
        {isProcessing ? (
          <div className="space-y-6">
            <Loader2 size={64} className="text-ebf-orange animate-spin mx-auto" />
            <h3 className="text-xl font-bold">Analyse Gemini...</h3>
            <p className="text-gray-500">Extraction des données de votre rapport.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative flex justify-center items-center">
              <div className="absolute w-24 h-24 bg-orange-200 rounded-full animate-ping opacity-20" />
              <div className="z-10 bg-ebf-orange text-white p-6 rounded-full shadow-lg"><Mic size={40} /></div>
            </div>
            <h3 className="text-2xl font-bold">Enregistrement...</h3>
            <p className="text-4xl font-mono font-bold text-ebf-orange">
              {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
            </p>
            <button onClick={stopRecording} className="w-full bg-red-600 text-white font-bold py-4 rounded-2xl hover:bg-red-700 transition flex items-center justify-center gap-2">
              <StopCircle size={24} /> Terminer l'intervention
            </button>
            <button onClick={onClose} className="text-gray-400 font-bold">Annuler</button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Login Component ---
const LoginScreen = ({ onLogin }: { onLogin: (role: Role) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulation d'auth
    setTimeout(() => {
      onLogin('Admin');
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ebf-pattern p-4">
      <div className="glass-panel p-10 rounded-3xl shadow-2xl w-full max-w-md border-t-4 border-ebf-orange">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-white p-4 shadow-lg mb-4 rounded-xl flex items-center justify-center">
            <span className="text-3xl font-black text-ebf-green">E<span className="text-ebf-orange">.B.</span>F</span>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-800">MANAGER V1.0</h2>
          <p className="text-gray-500 text-sm mt-1">Plateforme de Gestion Centralisée</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-3.5 text-gray-400" size={18} />
            <input 
              required type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-ebf-orange" 
              placeholder="Email professionnel" 
            />
          </div>
          <div className="relative">
            <Key className="absolute left-3 top-3.5 text-gray-400" size={18} />
            <input 
              required type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-ebf-orange" 
              placeholder="Mot de passe" 
            />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-ebf-orange text-white font-bold py-4 rounded-xl hover:shadow-lg transition flex justify-center items-center">
            {loading ? <Loader2 className="animate-spin" /> : "Se Connecter"}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- Main App Component ---
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Set to true for dev
  const [currentPath, setCurrentPath] = useState('/');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentSite, setCurrentSite] = useState<Site>(Site.GLOBAL);
  const [currentPeriod, setCurrentPeriod] = useState<Period>(Period.MONTH);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [userProfile] = useState<Profile>({ id: '1', full_name: 'Directeur EBF', email: 'dg@ebf.ci', role: 'Admin', site: Site.ABIDJAN });
  
  const [stock, setStock] = useState<StockItem[]>(MOCK_STOCK);
  const [reports, setReports] = useState<DailyReport[]>([]);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: s } = await supabase.from('stocks').select('*'); if (s && s.length > 0) setStock(s);
        const { data: r } = await supabase.from('reports').select('*').order('date', { ascending: false }); if (r && r.length > 0) setReports(r);
      } catch (e) {
        console.warn("Using local mock data (Supabase connection not active)");
      }
    };
    init();
  }, []);

  const handleVoiceFinish = async (processed: Partial<DailyReport>) => {
    const report = { 
      id: crypto.randomUUID(), 
      technicianName: processed.technicianName || userProfile.full_name,
      date: new Date().toISOString().split('T')[0],
      method: 'Voice' as const,
      site: userProfile.site,
      ...processed 
    };
    
    try {
      const { error } = await supabase.from('reports').insert([report]);
      if (!error) {
        setReports(prev => [report as DailyReport, ...prev]);
        alert("Rapport vocal enregistré avec succès !");
      }
    } catch (e) {
      setReports(prev => [report as DailyReport, ...prev]);
      alert("Rapport enregistré localement.");
    }
  };

  const renderModuleView = (moduleId: string) => {
    const actions = MODULE_ACTIONS[moduleId];
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center gap-4">
           <button onClick={() => setCurrentPath('/')} className="p-2 bg-white rounded-full border shadow-sm"><ArrowLeft size={20}/></button>
           <h2 className="text-2xl font-bold capitalize">{moduleId}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           {actions.map(action => (
             <button 
              key={action.id} 
              onClick={() => setCurrentPath(action.path)}
              className="bg-white p-6 rounded-2xl shadow hover:shadow-xl transition flex flex-col items-center text-center gap-4 group border border-gray-100"
             >
                <div className={`${action.color} p-5 rounded-2xl text-white group-hover:scale-110 transition shadow-lg`}>
                  <action.icon size={36}/>
                </div>
                <div>
                   <h3 className="text-xl font-bold text-gray-800">{action.label}</h3>
                   <p className="text-gray-500 text-sm mt-1">{action.description}</p>
                </div>
                <ChevronRight size={20} className="text-gray-300 group-hover:text-ebf-orange group-hover:translate-x-1 transition" />
             </button>
           ))}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (currentPath === '/') return (
      <Dashboard 
        data={MOCK_STATS} reports={reports} tickerMessages={DEFAULT_TICKER_MESSAGES} stock={stock} 
        currentSite={currentSite} currentPeriod={currentPeriod} 
        onSiteChange={setCurrentSite} onPeriodChange={setCurrentPeriod} 
        onNavigate={setCurrentPath} onDeleteReport={(id) => setReports(prev => prev.filter(r => r.id !== id))} 
      />
    );
    
    if (currentPath === '/synthesis') return (
      <DetailedSynthesis 
        data={MOCK_STATS} reports={reports} currentSite={currentSite} currentPeriod={currentPeriod}
        onSiteChange={setCurrentSite} onPeriodChange={setCurrentPeriod} onNavigate={setCurrentPath}
        onViewReport={(r) => alert(JSON.stringify(r, null, 2))}
      />
    );

    if (['/techniciens', '/comptabilite', '/secretariat', '/quincaillerie'].includes(currentPath)) {
      return renderModuleView(currentPath.substring(1));
    }

    if (currentPath === '/techniciens/rapports') return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center gap-4">
            <button onClick={() => setCurrentPath('/techniciens')} className="p-2 bg-white rounded-full border shadow-sm"><ArrowLeft size={20}/></button>
            <h2 className="text-2xl font-bold">Rapports Journaliers</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <button onClick={() => setIsVoiceOpen(true)} className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-12 rounded-3xl shadow-xl flex flex-col items-center gap-6 hover:scale-105 transition border border-blue-400 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 text-white/10 group-hover:rotate-12 transition"><Mic size={150}/></div>
            <Mic size={64} /> 
            <div className="text-center z-10">
              <h3 className="text-3xl font-bold">Rapport Vocal</h3>
              <p className="opacity-90 mt-2 text-lg">Dictée intelligente analysée par l'IA Gemini</p>
            </div>
          </button>
          <button onClick={() => alert("Formulaire détaillé en cours de maintenance")} className="bg-gradient-to-br from-ebf-orange to-orange-600 text-white p-12 rounded-3xl shadow-xl flex flex-col items-center gap-6 hover:scale-105 transition border border-orange-400 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 text-white/10 group-hover:rotate-12 transition"><FileText size={150}/></div>
            <FileText size={64} /> 
            <div className="text-center z-10">
              <h3 className="text-3xl font-bold">Saisie Manuelle</h3>
              <p className="opacity-90 mt-2 text-lg">Formulaire structuré pour interventions complexes</p>
            </div>
          </button>
        </div>
      </div>
    );

    return (
      <div className="flex flex-col items-center justify-center py-32 text-gray-400 space-y-4">
        <Loader2 size={64} className="animate-spin text-ebf-orange opacity-20" />
        <p className="text-2xl font-bold italic">Module "{currentPath}" en cours de déploiement...</p>
        <button onClick={() => setCurrentPath('/')} className="text-ebf-orange font-bold hover:underline">Retourner à l'accueil</button>
      </div>
    );
  };

  if (!isLoggedIn) return <LoginScreen onLogin={() => setIsLoggedIn(true)} />;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* --- Sidebar --- */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-green-950 text-white transform transition-transform duration-300 lg:translate-x-0 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 h-20 flex items-center border-b border-white/5">
          <span className="text-2xl font-black tracking-tighter text-white">E<span className="text-ebf-orange">.B.</span>F <span className="text-xs font-normal opacity-50 ml-1">MANAGER</span></span>
        </div>
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-160px)] custom-scrollbar">
          {MODULES.map(m => (
            <button 
              key={m.id} 
              onClick={() => { setCurrentPath(m.path); setIsMenuOpen(false); }} 
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all font-semibold ${currentPath === m.path || (m.path !== '/' && currentPath.startsWith(m.path)) ? 'bg-ebf-orange text-white shadow-lg scale-[1.02]' : 'text-gray-300 hover:bg-green-900'}`}
            >
              <m.icon size={22}/> <span>{m.label}</span>
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 w-full p-6 border-t border-white/5 bg-green-950/80 backdrop-blur-md">
            <button onClick={() => setIsLoggedIn(false)} className="w-full flex items-center gap-3 text-red-400 hover:text-red-300 transition font-bold">
                <LogOut size={20}/> Déconnexion
            </button>
        </div>
      </aside>

      {/* --- Main Area --- */}
      <div className="flex-1 flex flex-col lg:ml-64 relative">
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMenuOpen(true)} className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-xl"><Menu/></button>
            <div className="hidden sm:flex items-center gap-2">
               <span className="w-2 h-2 bg-ebf-orange rounded-full animate-pulse"></span>
               <h1 className="font-black text-green-950 text-xl tracking-tight">CENTRE DE PILOTAGE</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4 md:gap-6">
             <div className="relative group cursor-pointer">
                 <Bell size={24} className="text-gray-400 group-hover:text-ebf-orange transition"/>
                 <span className="absolute -top-1 -right-1 bg-red-500 w-4 h-4 rounded-full border-2 border-white text-[10px] flex items-center justify-center font-bold text-white">3</span>
             </div>
             <div className="h-10 w-px bg-gray-100"></div>
             <div className="flex items-center gap-3">
                 <div className="text-right hidden sm:block">
                    <p className="text-sm font-black text-gray-800 leading-none">{userProfile.full_name}</p>
                    <p className="text-[10px] text-ebf-orange uppercase font-black tracking-widest mt-1.5">{userProfile.role}</p>
                 </div>
                 <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-700 border-2 border-green-200 shadow-sm overflow-hidden group">
                    <User size={24} className="group-hover:scale-110 transition"/>
                 </div>
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-ebf-pattern">
            {renderContent()}
        </main>
      </div>

      {/* --- Voice Recorder Overlay --- */}
      <VoiceRecorderModal isOpen={isVoiceOpen} onClose={() => setIsVoiceOpen(false)} onFinish={handleVoiceFinish} />
    </div>
  );
}
