
import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, Wrench, Briefcase, ShoppingCart, Menu, X, Bell, Search, Settings,
  HardHat, DollarSign, LogOut, Calculator, Users, Calendar, FolderOpen, Truck, 
  FileText, UserCheck, CreditCard, Archive, ShieldCheck, ClipboardList, ArrowLeft, 
  Mic, StopCircle, Loader2, User, ShoppingBag, Waves
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { DetailedSynthesis } from './components/DetailedSynthesis';
import { Site, Period, TickerMessage, StatData, DailyReport, StockItem, Profile, CartItem } from './types';
import { supabase } from './services/supabaseClient';
import { processVoiceReport } from './services/geminiService';
import { DEFAULT_TICKER_MESSAGES, MOCK_STATS } from './constants';

// --- Helper: Blob to Base64 ---
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
const MODULE_ACTIONS = {
  techniciens: [
    { id: 'interventions', label: 'Interventions', description: 'Planning', icon: Wrench, path: '/techniciens/interventions', color: 'bg-orange-500' },
    { id: 'rapports', label: 'Rapports', description: 'Vocal ou Manuel', icon: FileText, path: '/techniciens/rapports', color: 'bg-gray-700' },
    { id: 'materiel', label: 'Matériel', description: 'Inventaire', icon: Truck, path: '/techniciens/materiel', color: 'bg-blue-600' },
  ],
  quincaillerie: [
    { id: 'stocks', label: 'Stocks', description: 'État en temps réel', icon: ClipboardList, path: '/quincaillerie/stocks', color: 'bg-orange-600' },
  ]
};

const MAIN_MENU = [
  { id: 'accueil', label: 'Accueil', icon: LayoutDashboard, path: '/' },
  { id: 'techniciens', label: 'Techniciens', icon: HardHat, path: '/techniciens' },
  { id: 'quincaillerie', label: 'Quincaillerie', icon: ShoppingCart, path: '/quincaillerie' },
];

// --- Modal: Enregistreur Vocal ---
const VoiceRecorderModal = ({ isOpen, onClose, onFinish }: { isOpen: boolean, onClose: () => void, onFinish: (report: Partial<DailyReport>) => void }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) startRecording();
    else stopRecording();
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
          alert("L'IA n'a pas pu analyser l'audio.");
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
      alert("Erreur microphone.");
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
            <h3 className="text-xl font-bold">Analyse Gemini en cours...</h3>
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
              <StopCircle size={24} /> Terminer
            </button>
            <button onClick={onClose} className="text-gray-400 font-bold">Annuler</button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main App ---
export default function App() {
  const [currentPath, setCurrentPath] = useState('/');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentSite, setCurrentSite] = useState<Site>(Site.GLOBAL);
  const [currentPeriod, setCurrentPeriod] = useState<Period>(Period.MONTH);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [userProfile] = useState<Profile>({ id: '1', full_name: 'Admin EBF', email: 'admin@ebf.ci', role: 'Admin', site: Site.ABIDJAN });
  
  const [stock, setStock] = useState<StockItem[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);

  useEffect(() => {
    const init = async () => {
      const { data: s } = await supabase.from('stocks').select('*'); if (s) setStock(s);
      const { data: r } = await supabase.from('reports').select('*').order('date', { ascending: false }); if (r) setReports(r);
    };
    init();
  }, []);

  const handleVoiceFinish = async (processed: Partial<DailyReport>) => {
    const report = { 
      id: crypto.randomUUID(), 
      technicianName: processed.technicianName || userProfile.full_name,
      date: new Date().toISOString().split('T')[0],
      method: 'Voice',
      site: userProfile.site,
      ...processed 
    };
    const { error } = await supabase.from('reports').insert([report]);
    if (!error) {
      setReports(prev => [report as DailyReport, ...prev]);
      alert("Rapport enregistré !");
    }
  };

  const renderContent = () => {
    if (currentPath === '/') return (
      <Dashboard 
        data={MOCK_STATS} reports={reports} tickerMessages={DEFAULT_TICKER_MESSAGES} stock={stock} 
        currentSite={currentSite} currentPeriod={currentPeriod} 
        onSiteChange={setCurrentSite} onPeriodChange={setCurrentPeriod} 
        onNavigate={setCurrentPath} onDeleteReport={() => {}} 
      />
    );
    if (currentPath === '/synthesis') return (
      <DetailedSynthesis 
        data={MOCK_STATS} reports={reports} currentSite={currentSite} currentPeriod={currentPeriod}
        onSiteChange={setCurrentSite} onPeriodChange={setCurrentPeriod} onNavigate={setCurrentPath}
        onViewReport={() => {}}
      />
    );
    if (currentPath === '/techniciens') return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {MODULE_ACTIONS.techniciens.map(a => (
          <button key={a.id} onClick={() => setCurrentPath(a.path)} className="bg-white p-6 rounded-2xl shadow hover:shadow-xl transition flex items-center gap-6">
            <div className={`${a.color} p-4 rounded-xl text-white`}><a.icon size={32}/></div>
            <div className="text-left"><h3 className="font-bold text-xl">{a.label}</h3><p className="text-gray-500 text-sm">{a.description}</p></div>
          </button>
        ))}
      </div>
    );
    if (currentPath === '/techniciens/rapports') return (
      <div className="space-y-8">
        <h2 className="text-2xl font-bold">Rapports Journaliers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button onClick={() => setIsVoiceOpen(true)} className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-10 rounded-3xl shadow-lg flex flex-col items-center gap-4 hover:scale-105 transition">
            <Mic size={48} /> <div className="text-center"><h3 className="text-2xl font-bold">Rapport Vocal</h3><p>Dictée intelligente via Gemini</p></div>
          </button>
          <button className="bg-gradient-to-br from-ebf-orange to-orange-600 text-white p-10 rounded-3xl shadow-lg flex flex-col items-center gap-4 hover:scale-105 transition">
            <FileText size={48} /> <div className="text-center"><h3 className="text-2xl font-bold">Formulaire</h3><p>Saisie manuelle détaillée</p></div>
          </button>
        </div>
      </div>
    );
    return <div className="text-center py-20 text-gray-400 font-bold">Module en développement...</div>;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-green-950 text-white transform transition lg:translate-x-0 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 text-2xl font-bold border-b border-white/10">EBF Manager</div>
        <nav className="p-4 space-y-2">
          {MAIN_MENU.map(m => (
            <button key={m.id} onClick={() => { setCurrentPath(m.path); setIsMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${currentPath === m.path ? 'bg-ebf-orange' : 'hover:bg-green-900'}`}>
              <m.icon size={20}/> {m.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col lg:ml-64">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6">
          <button onClick={() => setIsMenuOpen(true)} className="lg:hidden p-2"><Menu/></button>
          <div className="font-extrabold text-green-950">EBF MANAGER</div>
          <div className="flex items-center gap-3">
             <div className="text-right hidden sm:block"><p className="text-sm font-bold">{userProfile.full_name}</p><p className="text-xs text-ebf-orange uppercase font-bold">{userProfile.role}</p></div>
             <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700"><User/></div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-ebf-pattern">{renderContent()}</main>
      </div>

      <VoiceRecorderModal isOpen={isVoiceOpen} onClose={() => setIsVoiceOpen(false)} onFinish={handleVoiceFinish} />
    </div>
  );
}
