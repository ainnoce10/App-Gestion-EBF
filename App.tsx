
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, Wrench, Menu, X, Bell, Settings,
  HardHat, DollarSign, LogOut, Calculator, Users, Calendar, FolderOpen, Truck, 
  FileText, UserCheck, CreditCard, Archive, ShieldCheck, ClipboardList, ArrowLeft, ChevronRight, Mic, Plus, Trash2, User, HelpCircle, Moon, AlertCircle, Filter, TrendingUp, Edit, AlertTriangle, Loader2, Mail, Lock, ScanFace, Fingerprint, Phone, Eye, EyeOff, ShoppingCart
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { DetailedSynthesis } from './components/DetailedSynthesis';
import { Site, Period, TickerMessage, StatData, DailyReport, Intervention, StockItem, Transaction, Profile, Role, Notification, Technician } from './types';
import { supabase } from './services/supabaseClient';

// --- Configuration des Formulaires ---
const FORM_CONFIGS: Record<string, any> = {
  interventions: {
    title: 'Nouvelle Intervention',
    fields: [
      { name: 'client', label: 'Client', type: 'text' },
      { name: 'location', label: 'Lieu', type: 'text' },
      { name: 'description', label: 'Description', type: 'text' },
      { name: 'status', label: 'Statut', type: 'select', options: ['Pending', 'In Progress', 'Completed'] }
    ]
  },
  stocks: {
    title: 'Ajouter au Stock',
    fields: [
      { name: 'name', label: 'Article', type: 'text' },
      { name: 'quantity', label: 'Quantité', type: 'number' },
      { name: 'unit', label: 'Unité', type: 'text' },
      { name: 'threshold', label: 'Seuil Alerte', type: 'number' }
    ]
  }
};

const MAIN_MENU = [
  { id: 'accueil', label: 'Accueil', icon: LayoutDashboard, path: '/', colorClass: 'text-orange-500' },
  { id: 'techniciens', label: 'Techniciens', icon: HardHat, path: '/techniciens', colorClass: 'text-gray-600' },
  { id: 'comptabilite', label: 'Comptabilité', icon: Calculator, path: '/comptabilite', colorClass: 'text-gray-600' },
  { id: 'quincaillerie', label: 'Stocks', icon: ShoppingCart, path: '/quincaillerie', colorClass: 'text-gray-600' },
];

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState('/');
  const [currentSite, setCurrentSite] = useState<Site>(Site.GLOBAL);
  const [currentPeriod, setCurrentPeriod] = useState<Period>(Period.MONTH);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center bg-green-50"><Loader2 className="animate-spin text-ebf-orange" size={48}/></div>;

  const renderContent = () => {
    if (currentPath === '/') return <Dashboard data={[]} reports={[]} tickerMessages={[]} stock={[]} currentSite={currentSite} currentPeriod={currentPeriod} onSiteChange={setCurrentSite} onPeriodChange={setCurrentPeriod} onNavigate={setCurrentPath} onDeleteReport={() => {}} />;
    if (currentPath === '/synthesis') return <DetailedSynthesis data={[]} reports={[]} currentSite={currentSite} currentPeriod={currentPeriod} onSiteChange={setCurrentSite} onPeriodChange={setCurrentPeriod} onNavigate={setCurrentPath} onViewReport={() => {}} />;
    return <div className="p-10 text-center text-gray-500">Module {currentPath} en développement... <button onClick={() => setCurrentPath('/')} className="text-ebf-orange underline">Retour</button></div>;
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-green-950 text-white transform transition-transform lg:translate-x-0 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 h-20 border-b border-white/10 flex items-center font-black text-xl">
          EBF MANAGER
        </div>
        <nav className="p-4 space-y-2">
          {MAIN_MENU.map(m => (
            <button key={m.id} onClick={() => { setCurrentPath(m.path); setIsMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${currentPath === m.path ? 'bg-ebf-orange text-white shadow-lg' : 'text-gray-400 hover:bg-white/5'}`}>
              <m.icon size={20}/> {m.label}
            </button>
          ))}
        </nav>
      </aside>
      
      <div className="flex-1 flex flex-col lg:ml-64">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-30">
          <button onClick={() => setIsMenuOpen(true)} className="lg:hidden p-2"><Menu/></button>
          <div className="font-bold text-green-950">Pilotage Central EBF</div>
          <div className="flex items-center gap-4">
             <Bell size={20} className="text-gray-400"/>
             <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold border border-green-200">
               {session?.user?.email?.charAt(0).toUpperCase() || <User size={18}/>}
             </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {renderContent()}
        </main>
      </div>
      
      {isMenuOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsMenuOpen(false)}/>}
    </div>
  );
}
