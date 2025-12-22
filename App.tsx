
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, Wrench, Menu, Bell, HardHat, DollarSign, LogOut, 
  Calculator, Users, Calendar, FolderOpen, Truck, FileText, UserCheck, 
  CreditCard, Archive, ShieldCheck, ClipboardList, ArrowLeft, ChevronRight, 
  Mic, Trash2, User, HelpCircle, Moon, AlertCircle, TrendingUp, Edit, 
  AlertTriangle, Loader2, Mail, Lock, Phone, Eye, EyeOff, ScanFace, 
  Fingerprint, CheckCircle, X, Megaphone, Activity, Sparkles, Target, ShoppingCart
} from 'lucide-react';
import { Dashboard } from './Dashboard';
import { DetailedSynthesis } from './DetailedSynthesis';
import { Site, Period, TickerMessage, StatData, DailyReport, Intervention, StockItem, Transaction, Profile, Role, Notification, Technician } from './types';
import { supabase } from './services/supabaseClient';
import { 
  DEFAULT_TICKER_MESSAGES, MOCK_STATS, MOCK_STOCK, MOCK_TECHNICIANS, 
  MOCK_INTERVENTIONS, MOCK_REPORTS, MOCK_TRANSACTIONS, MOCK_CLIENTS,
  MOCK_SUPPLIERS, MOCK_CHANTIERS, MOCK_MATERIALS
} from './constants';

// --- Global Menu Definition ---
const MAIN_MENU = [
  { id: 'accueil', label: 'Accueil', icon: LayoutDashboard, path: '/' },
  { id: 'techniciens', label: 'Technique', icon: HardHat, path: '/techniciens' },
  { id: 'comptabilite', label: 'Compta/RH', icon: Calculator, path: '/comptabilite' },
  { id: 'secretariat', label: 'Secrétariat', icon: FolderOpen, path: '/secretariat' },
  { id: 'quincaillerie', label: 'Stocks', icon: ShoppingCart, path: '/quincaillerie' },
];

export default function App() {
  const [currentPath, setCurrentPath] = useState('/');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentSite, setCurrentSite] = useState<Site>(Site.GLOBAL);
  const [currentPeriod, setCurrentPeriod] = useState<Period>(Period.MONTH);
  const [reports, setReports] = useState<DailyReport[]>(MOCK_REPORTS);
  const [stock, setStock] = useState<StockItem[]>(MOCK_STOCK);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);

  const handleNavigate = (path: string) => { 
    setCurrentPath(path); 
    setIsMenuOpen(false); 
  };

  const renderContent = () => {
     if (currentPath === '/') return (
       <Dashboard 
         data={MOCK_STATS} 
         reports={reports} 
         tickerMessages={DEFAULT_TICKER_MESSAGES} 
         stock={stock} 
         currentSite={currentSite} 
         currentPeriod={currentPeriod} 
         onSiteChange={setCurrentSite} 
         onPeriodChange={setCurrentPeriod} 
         onNavigate={handleNavigate} 
         onDeleteReport={(id) => setReports(prev => prev.filter(r => r.id !== id))}
       />
     );
     
     if (currentPath === '/synthesis') return (
       <DetailedSynthesis 
         data={MOCK_STATS} 
         reports={reports} 
         currentSite={currentSite} 
         currentPeriod={currentPeriod} 
         onSiteChange={setCurrentSite} 
         onPeriodChange={setCurrentPeriod} 
         onNavigate={handleNavigate} 
         onViewReport={(r) => alert(`Détail: ${r.content}`)} 
       />
     );

     return (
       <div className="flex flex-col items-center justify-center py-20 text-gray-400">
         <ShieldCheck size={64} className="opacity-20 mb-4"/>
         <p className="text-xl font-bold italic">Module "{currentPath}" en cours de déploiement...</p>
         <button onClick={() => handleNavigate('/')} className="mt-4 text-orange-500 font-bold hover:underline">Retour Accueil</button>
       </div>
     );
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-green-950 text-white transform transition-transform lg:translate-x-0 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-6 text-2xl font-black border-b border-white/10 tracking-tighter flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center text-white font-bold">E</div>
            EBF MANAGER
          </div>
          <nav className="p-4 space-y-2">
            {MAIN_MENU.map(m => (
              <button 
                key={m.id} 
                onClick={() => handleNavigate(m.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${currentPath === m.path ? 'bg-orange-500 text-white' : 'text-gray-300 hover:bg-green-900'}`}
              >
                <m.icon size={20}/> {m.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col lg:ml-64 relative">
          <header className="h-16 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-20">
            <button onClick={() => setIsMenuOpen(true)} className="lg:hidden p-2 text-gray-600"><Menu/></button>
            <div className="font-black text-green-950">EBF PILOTAGE CENTRAL</div>
            <div className="flex items-center gap-4 text-gray-500">
                <Bell size={20} className="cursor-pointer hover:text-orange-500 transition"/>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 border border-green-200 cursor-pointer">
                    <User size={18}/>
                </div>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-6">
              {renderContent()}
          </main>
        </div>

        {/* Overlay mobile */}
        {isMenuOpen && (
          <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsMenuOpen(false)} />
        )}
    </div>
  );
}
