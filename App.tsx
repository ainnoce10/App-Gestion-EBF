import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  LayoutDashboard, Wrench, Briefcase, ShoppingCart, Menu, X, Bell, Search, Settings,
  HardHat, DollarSign, LogOut, Calculator, Users, Calendar, FolderOpen, Truck, 
  FileText, UserCheck, CreditCard, Archive, ShieldCheck, ClipboardList, ArrowLeft, ChevronRight, Mic, Send, Save, Plus, CheckCircle, Trash2, User, HelpCircle, Moon, Play, StopCircle, RefreshCw, FileInput, MapPin, Volume2, Megaphone, AlertCircle, Filter, TrendingUp, Edit, ArrowUp, ArrowDown, AlertTriangle, Loader2, Mail, Lock, UserPlus, ScanFace, Fingerprint, Phone, CheckSquare, Key, MoveUp, MoveDown, Eye, EyeOff, Sparkles, Target, RefreshCcw, Shield, ShoppingBag, Minus, Waves
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { DetailedSynthesis } from './components/DetailedSynthesis';
import { Site, Period, TickerMessage, StatData, DailyReport, Intervention, StockItem, Transaction, Profile, Role, Notification, Technician, CartItem } from './types';
import { supabase } from './services/supabaseClient';
import { processVoiceReport } from './services/geminiService';

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

const isInPeriod = (dateStr: string, period: Period): boolean => {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (period === Period.DAY) {
    return itemDate.getTime() === today.getTime();
  } else if (period === Period.WEEK) {
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 7);
    return itemDate >= oneWeekAgo && itemDate <= today;
  } else if (period === Period.MONTH) {
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  } else if (period === Period.YEAR) {
    return date.getFullYear() === now.getFullYear();
  }
  return true;
};

const getPermission = (path: string, role: string) => {
    if (role === 'Admin' || role === 'DG') return { canRead: true, canWrite: true };
    if (path.startsWith('/techniciens') && role === 'Technicien') return { canRead: true, canWrite: true };
    if (path.startsWith('/quincaillerie') && role === 'Magasinier') return { canRead: true, canWrite: true };
    if (role === 'Secretaire') return { canRead: true, canWrite: path.startsWith('/secretariat') };
    return { canRead: role !== 'Visiteur', canWrite: false };
};

// --- Module Actions Configuration (FIXED SYNTAX) ---
const MODULE_ACTIONS: Record<string, any[]> = {
  techniciens: [
    { id: 'interventions', label: 'Interventions', description: 'Planning des interventions', icon: Wrench, path: '/techniciens/interventions', color: 'bg-orange-500' },
    { id: 'rapports', label: 'Rapports Journaliers', description: 'Vocal ou Formulaire détaillé', icon: FileText, path: '/techniciens/rapports', color: 'bg-gray-700' },
    { id: 'materiel', label: 'Matériel', description: 'Inventaire & Affectation', icon: Truck, path: '/techniciens/materiel', color: 'bg-blue-600' },
    { id: 'chantiers', label: 'Chantiers', description: 'Suivi & Exécution', icon: ShieldCheck, path: '/techniciens/chantiers', color: 'bg-green-600' },
  ],
  comptabilite: [
    { id: 'bilan', label: 'Bilan Financier', description: 'Recettes & Dépenses', icon: DollarSign, path: '/comptabilite/bilan', color: 'bg-green-600' },
    { id: 'rh', label: 'Ressources Humaines', description: 'Employés & Dossiers', icon: Users, path: '/comptabilite/rh', color: 'bg-purple-600' },
    { id: 'paie', label: 'Paie & Salaires', description: 'Virements & Bulletins', icon: CreditCard, path: '/comptabilite/paie', color: 'bg-orange-500' },
  ],
  secretariat: [
    { id: 'planning', label: 'Planning Équipe', description: 'Vue d\'ensemble Interventions', icon: Calendar, path: '/secretariat/planning', color: 'bg-indigo-500' },
    { id: 'clients', label: 'Gestion Clients', description: 'Base de données clients', icon: UserCheck, path: '/secretariat/clients', color: 'bg-blue-500' },
    { id: 'caisse', label: 'Petite Caisse', description: 'Suivi des flux de caisse', icon: Archive, path: '/secretariat/caisse', color: 'bg-gray-600' },
  ],
  quincaillerie: [
    { id: 'stocks', label: 'Stocks', description: 'État des stocks en temps réel', icon: ClipboardList, path: '/quincaillerie/stocks', color: 'bg-orange-600' },
    { id: 'fournisseurs', label: 'Fournisseurs', description: 'Liste et contacts partenaires', icon: Truck, path: '/quincaillerie/fournisseurs', color: 'bg-green-600' },
    { id: 'achats', label: 'Bons d\'achat', description: 'Historique des commandes', icon: FileText, path: '/quincaillerie/achats', color: 'bg-red-500' },
  ]
};

const MAIN_MENU = [
  { id: 'accueil', label: 'Accueil', icon: LayoutDashboard, path: '/', colorClass: 'text-orange-500' },
  { id: 'techniciens', label: 'Techniciens', icon: HardHat, path: '/techniciens', colorClass: 'text-gray-600' },
  { id: 'comptabilite', label: 'Comptabilité', icon: Calculator, path: '/comptabilite', colorClass: 'text-gray-600' },
  { id: 'secretariat', label: 'Secrétariat', icon: FolderOpen, path: '/secretariat', colorClass: 'text-gray-600' },
  { id: 'quincaillerie', label: 'Quincaillerie', icon: ShoppingCart, path: '/quincaillerie', colorClass: 'text-gray-600' },
];

// --- Voice Recorder Modal (INSTANT RECORDING) ---
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

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await handleAudioProcess(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      timerRef.current = window.setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone error:", err);
      alert("Erreur d'accès au microphone. Vérifiez les permissions.");
      onClose();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
  };

  const handleAudioProcess = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      const base64 = await blobToBase64(blob);
      const report = await processVoiceReport(base64, 'audio/webm');
      onFinish(report);
    } catch (err) {
      console.error("Gemini error:", err);
      alert("L'IA n'a pas pu analyser l'audio. Essayez de parler plus distinctement.");
    } finally {
      setIsProcessing(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-green-950/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl border-t-4 border-ebf-orange">
        {isProcessing ? (
          <div className="space-y-6">
            <div className="flex justify-center"><Loader2 size={64} className="text-ebf-orange animate-spin" /></div>
            <h3 className="text-xl font-bold text-green-900 dark:text-white">Analyse Gemini...</h3>
            <p className="text-gray-500">Extraction des données de votre rapport en cours.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative flex justify-center items-center">
              <div className="absolute w-32 h-32 bg-orange-100 rounded-full animate-ping opacity-20" />
              <div className="absolute w-24 h-24 bg-orange-200 rounded-full animate-pulse opacity-40" />
              <div className="z-10 bg-ebf-orange text-white p-6 rounded-full shadow-lg"><Mic size={40} /></div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-green-900 dark:text-white">Enregistrement...</h3>
              <p className="text-4xl font-mono font-bold text-ebf-orange mt-2">
                {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
              </p>
            </div>
            <p className="text-gray-500 text-sm">Mentionnez le client, le domaine (élec, froid...) et les montants encaissés.</p>
            <button onClick={stopRecording} className="w-full bg-red-600 text-white font-bold py-4 rounded-2xl hover:bg-red-700 transition flex items-center justify-center gap-2">
              <StopCircle size={24} /> Terminer l'intervention
            </button>
            <button onClick={onClose} className="text-gray-400 font-bold hover:text-gray-600 transition">Annuler</button>
          </div>
        )}
      </div>
    </div>
  );
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
            <path d="M40,70 C40,90 80,90 80,50 L80,40" fill="none" stroke="black" strokeWidth="4" strokeLinecap="round"/>
            <rect x="70" y="20" width="20" height="25" rx="0" fill="#e5e5e5" stroke="#9ca3af" strokeWidth="2" />
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
  return <EbfSvgLogo size={size} />;
};

// --- App Container ---
const AppContent = ({ onLogout, userRole, userProfile }: any) => {
  const [currentPath, setCurrentPath] = useState('/');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentSite, setCurrentSite] = useState<Site>(Site.GLOBAL);
  const [currentPeriod, setCurrentPeriod] = useState<Period>(Period.MONTH);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  const [stats, setStats] = useState<StatData[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [tickerMessages, setTickerMessages] = useState<TickerMessage[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: stockData } = await supabase.from('stocks').select('*'); if (stockData) setStock(stockData);
      const { data: reportsData } = await supabase.from('reports').select('*').order('date', { ascending: false }); if (reportsData) setReports(reportsData);
    };
    fetchData();
  }, []);

  const handleVoiceReportFinish = async (processedReport: Partial<DailyReport>) => {
    const newReport: DailyReport = {
      id: crypto.randomUUID(),
      technicianName: processedReport.technicianName || userProfile?.full_name || 'Technicien EBF',
      date: new Date().toISOString().split('T')[0],
      method: 'Voice',
      site: userProfile?.site || Site.ABIDJAN,
      ...processedReport
    };

    const { error } = await supabase.from('reports').insert([newReport]);
    if (!error) {
      setReports(prev => [newReport, ...prev]);
      alert("Rapport vocal enregistré avec succès !");
    }
  };

  const handleNavigate = (path: string) => { setCurrentPath(path); setIsMenuOpen(false); };

  const renderContent = () => {
     if (currentPath === '/') return <Dashboard data={stats} reports={reports} tickerMessages={tickerMessages} stock={stock} currentSite={currentSite} currentPeriod={currentPeriod} onSiteChange={setCurrentSite} onPeriodChange={setCurrentPeriod} onNavigate={handleNavigate} onDeleteReport={()=>{}} />;
     
     if (currentPath === '/techniciens') {
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
             {MODULE_ACTIONS.techniciens.map(action => (
                <button key={action.id} onClick={() => handleNavigate(action.path)} className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 flex items-center gap-6 hover:shadow-xl transition group">
                   <div className={`${action.color} p-4 rounded-xl text-white group-hover:scale-110 transition`}><action.icon size={32}/></div>
                   <div className="text-left">
                      <h3 className="text-xl font-bold text-gray-800">{action.label}</h3>
                      <p className="text-gray-500 text-sm">{action.description}</p>
                   </div>
                </button>
             ))}
          </div>
        );
     }

     if (currentPath === '/techniciens/rapports') {
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="flex items-center gap-3">
                <button onClick={() => handleNavigate('/techniciens')} className="p-2 bg-white rounded-full hover:bg-orange-50 shadow-sm transition border border-gray-100"><ArrowLeft size={20} /></button>
                <h2 className="text-2xl font-bold text-gray-800">Rapports Journaliers</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button onClick={() => setIsVoiceOpen(true)} className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-8 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition flex flex-col items-center text-center group border border-blue-400 relative overflow-hidden">
                    <div className="bg-white/20 p-4 rounded-full mb-4 group-hover:bg-white/30 transition backdrop-blur-sm"><Mic size={40} /></div>
                    <h3 className="text-2xl font-bold mb-2">Rapport Vocal</h3>
                    <p className="text-blue-100">Dictez votre rapport, l'IA le rédige pour vous instantanément.</p>
                </button>
                <button onClick={() => alert("Formulaire manuel en développement")} className="bg-gradient-to-br from-ebf-orange to-orange-600 text-white p-8 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition flex flex-col items-center text-center group border border-orange-400 relative overflow-hidden">
                    <div className="bg-white/20 p-4 rounded-full mb-4 group-hover:bg-white/30 transition backdrop-blur-sm"><FileText size={40} /></div>
                    <h3 className="text-2xl font-bold mb-2">Formulaire Manuel</h3>
                    <p className="text-orange-100">Saisie détaillée des travaux et chiffres.</p>
                </button>
            </div>
          </div>
        );
     }

     return <div className="text-center mt-20 text-gray-400 font-bold italic">Module "{currentPath}" en cours de déploiement...</div>;
  };

  return (
    <div className="flex h-screen bg-gray-50 transition-colors">
        <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-green-950 text-white transform transition-transform duration-300 lg:translate-x-0 lg:static ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
            <div className="h-20 px-6 flex items-center bg-white/5"><div className="transform scale-75 origin-left bg-white p-2 rounded-lg"><EbfLogo size="small" /></div></div>
            <div className="p-4 flex-1 overflow-y-auto">
                <nav className="space-y-2">
                    {MAIN_MENU.map(item => (
                        <button key={item.id} onClick={() => handleNavigate(item.path)} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${currentPath === item.path ? 'bg-ebf-orange text-white font-bold' : 'text-gray-300 hover:bg-green-900'}`}>
                            <item.icon size={20} /> <span>{item.label}</span>
                        </button>
                    ))}
                </nav>
            </div>
            <button onClick={onLogout} className="p-6 flex items-center gap-3 text-red-400 hover:text-red-300 transition border-t border-white/10"><LogOut size={20}/> Déconnexion</button>
        </aside>
        
        <div className="flex-1 flex flex-col overflow-hidden relative">
             <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sticky top-0 z-30 shadow-sm">
                <div className="flex items-center gap-4">
                  <button onClick={() => setIsMenuOpen(true)} className="lg:hidden p-2 text-gray-600"><Menu/></button>
                  <h1 className="font-extrabold text-green-950 text-lg hidden md:block tracking-tighter">EBF MANAGER</h1>
                </div>
                <div className="flex items-center gap-4">
                    <button className="relative p-2 hover:bg-orange-50 rounded-full transition text-ebf-orange">
                        <ShoppingBag size={24}/>
                        {cart.length > 0 && <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">{cart.length}</span>}
                    </button>
                    <div className="hidden md:block text-right">
                        <p className="text-sm font-bold text-gray-800">{userProfile?.full_name}</p>
                        <p className="text-[10px] text-ebf-orange font-bold uppercase tracking-wider">{userRole}</p>
                    </div>
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold border-2 border-green-200"><User size={20}/></div>
                </div>
             </header>
             <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 bg-ebf-pattern">{renderContent()}</main>
        </div>
        
        <VoiceRecorderModal 
          isOpen={isVoiceOpen} 
          onClose={() => setIsVoiceOpen(false)} 
          onFinish={handleVoiceReportFinish} 
        />
    </div>
  );
};

// --- Login Screen ---
const LoginScreen = ({ onLoginSuccess }: { onLoginSuccess: () => void }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    setTimeout(() => { onLoginSuccess(); setLoading(false); }, 1000);
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-ebf-pattern p-4">
       <div className="glass-panel p-10 rounded-3xl shadow-2xl w-full max-w-md border-t-4 border-ebf-orange">
          <div className="flex flex-col items-center mb-8"><div className="bg-white p-4 shadow-lg mb-4 rounded-xl"><EbfLogo size="normal" /></div><h2 className="text-2xl font-extrabold text-gray-800 mt-2">EBF Manager</h2></div>
          <form onSubmit={handleAuth} className="space-y-4">
                <input required value={identifier} onChange={e => setIdentifier(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-ebf-orange" placeholder="Email" />
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-ebf-orange" placeholder="Mot de passe" />
                <button type="submit" disabled={loading} className="w-full bg-ebf-orange text-white font-bold py-3.5 rounded-xl hover:shadow-lg transition"> {loading ? <Loader2 className="animate-spin mx-auto"/> : "Se Connecter"} </button>
            </form>
       </div>
    </div>
  );
};

export default function App() {
  const [appState, setAppState] = useState<'LOGIN' | 'APP'>('APP'); 
  const [userProfile, setUserProfile] = useState<Profile | null>({ id: '1', full_name: 'Admin EBF', email: 'admin@ebf.ci', role: 'Admin', site: Site.ABIDJAN });
  
  if (appState === 'LOGIN') return <LoginScreen onLoginSuccess={() => setAppState('APP')} />;
  return <AppContent userRole={userProfile?.role} userProfile={userProfile} onLogout={() => setAppState('LOGIN')} />;
}