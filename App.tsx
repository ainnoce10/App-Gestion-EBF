import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, Wrench, Briefcase, ShoppingCart, Menu, X, Bell, Search, Settings,
  HardHat, DollarSign, LogOut, Calculator, Users, Calendar, FolderOpen, Truck, 
  FileText, UserCheck, CreditCard, Archive, ShieldCheck, ClipboardList, ArrowLeft, ChevronRight, Mic, Send, Save, Plus, CheckCircle, Trash2, User, HelpCircle, Moon, Play, StopCircle, RefreshCw, FileInput, MapPin, Volume2, Megaphone, AlertCircle, Filter, TrendingUp, Edit, ArrowUp, ArrowDown, AlertTriangle, Loader2, Mail, Lock, UserPlus, ScanFace, Fingerprint, Phone, CheckSquare, Key, MoveUp, MoveDown, Eye, EyeOff, Sparkles, Target, RefreshCcw, Shield
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { DetailedSynthesis } from './components/DetailedSynthesis';
import { Site, Period, TickerMessage, StatData, DailyReport, Intervention, StockItem, Transaction, Profile, Role, Notification, Technician } from './types';
import { supabase } from './services/supabaseClient';
import { processVoiceReport } from './services/geminiService';
// Added MOCK_REPORTS to the import list
import { DEFAULT_TICKER_MESSAGES, MOCK_STATS, MOCK_STOCK, MOCK_TECHNICIANS, MOCK_INTERVENTIONS, MOCK_REPORTS } from './constants';

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

// --- CONFIGURATION DES FORMULAIRES (CRUD) ---
const FORM_CONFIGS: Record<string, FormConfig> = {
  interventions: {
    title: 'Nouvelle Intervention',
    fields: [
      { name: 'client', label: 'Client', type: 'text' },
      { name: 'clientPhone', label: 'Tél Client', type: 'text' },
      { name: 'location', label: 'Lieu / Quartier', type: 'text' },
      { name: 'description', label: 'Description Panne', type: 'text' },
      { name: 'technicianId', label: 'ID Technicien (ex: T1)', type: 'text' },
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
    title: 'Nouveau Rapport (Formulaire)',
    fields: [
      { name: 'technicianName', label: 'Nom Technicien', type: 'text' },
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'content', label: 'Détails Intervention', type: 'text' },
      { name: 'domain', label: 'Domaine', type: 'select', options: ['Electricité', 'Froid', 'Bâtiment', 'Plomberie'] },
      { name: 'revenue', label: 'Recette (FCFA)', type: 'number' },
      { name: 'expenses', label: 'Dépenses (FCFA)', type: 'number' },
      { name: 'rating', label: 'Note Satisfaction (1-5)', type: 'number' },
      { name: 'method', label: 'Méthode', type: 'select', options: ['Form'] }
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
  },
  employees: {
    title: 'Dossier RH',
    fields: [
      { name: 'full_name', label: 'Nom Complet', type: 'text' },
      { name: 'role', label: 'Poste', type: 'text' },
      { name: 'phone', label: 'Téléphone', type: 'text' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'site', label: 'Site', type: 'select', options: ['Abidjan', 'Bouaké'] },
      { name: 'salary', label: 'Salaire Base (FCFA)', type: 'number' },
      { name: 'date_hired', label: 'Date Embauche', type: 'date' }
    ]
  }
};

const MAIN_MENU: MenuItem[] = [
  { id: 'accueil', label: 'Accueil', icon: LayoutDashboard, path: '/', description: 'Vue d\'ensemble', colorClass: 'text-orange-500' },
  { id: 'techniciens', label: 'Techniciens', icon: HardHat, path: '/techniciens', description: 'Gestion opérationnelle', colorClass: 'text-gray-600' },
  { id: 'comptabilite', label: 'Comptabilité', icon: Calculator, path: '/comptabilite', description: 'Finance & RH', colorClass: 'text-gray-600' },
  { id: 'secretariat', label: 'Secrétariat', icon: FolderOpen, path: '/secretariat', description: 'Administration', colorClass: 'text-gray-600' },
  { id: 'quincaillerie', label: 'Quincaillerie', icon: ShoppingCart, path: '/quincaillerie', description: 'Logistique & Stocks', colorClass: 'text-gray-600' },
];

const MODULE_ACTIONS: Record<string, ModuleAction[]> = {
  techniciens: [
    { id: 'interventions', label: 'Interventions', description: 'Planning des interventions', icon: Wrench, path: '/techniciens/interventions', color: 'bg-orange-500' },
    { id: 'rapports', label: 'Rapports Journaliers', description: 'Vocal ou Formulaire', icon: FileText, path: '/techniciens/rapports', color: 'bg-gray-700' },
    { id: 'materiel', label: 'Matériel', description: 'Inventaire & Affectation', icon: Truck, path: '/techniciens/materiel', color: 'bg-blue-600' },
    { id: 'chantiers', label: 'Chantiers', description: 'Suivi & Exécution', icon: ShieldCheck, path: '/techniciens/chantiers', color: 'bg-green-600' },
  ],
  comptabilite: [
    { id: 'bilan', label: 'Bilan Financier', description: 'Transactions', icon: DollarSign, path: '/comptabilite/bilan', color: 'bg-green-600' },
    { id: 'rh', label: 'RH', description: 'Dossiers personnel', icon: Users, path: '/comptabilite/rh', color: 'bg-purple-600' },
  ],
  secretariat: [
    { id: 'planning', label: 'Planning', description: 'Agenda', icon: Calendar, path: '/secretariat/planning', color: 'bg-indigo-500' },
    { id: 'clients', label: 'Clients', description: 'Base de données', icon: UserCheck, path: '/secretariat/clients', color: 'bg-blue-500' },
  ],
  quincaillerie: [
    { id: 'stocks', label: 'Stocks', description: 'État en temps réel', icon: ClipboardList, path: '/quincaillerie/stocks', color: 'bg-orange-600' },
  ]
};

// --- App Wrapper with State Machine ---
export default function App() {
  const [appState, setAppState] = useState<'LOADING' | 'LOGIN' | 'ONBOARDING' | 'APP'>('LOADING');
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<Role>('Visiteur');
  const [userProfile, setUserProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const init = async () => {
      // Simulation d'une session chargée ou récupération
      setTimeout(() => {
        setAppState('LOGIN');
      }, 1000);
    };
    init();
  }, []);

  const handleLoginSuccess = () => {
    setUserRole('Admin');
    setUserProfile({ 
      id: '1', 
      full_name: 'Admin EBF', 
      email: 'admin@ebf.ci', 
      role: 'Admin', 
      site: Site.ABIDJAN 
    });
    setAppState('APP');
  };

  if (appState === 'LOADING') return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-green-50">
      <Loader2 size={48} className="text-ebf-orange animate-spin mb-4"/>
      <p className="text-gray-700 font-bold">Chargement EBF Manager...</p>
    </div>
  );

  if (appState === 'LOGIN') return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
      <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md border-t-4 border-ebf-orange text-center">
        <h1 className="text-3xl font-black text-green-950 mb-2">EBF MANAGER</h1>
        <p className="text-gray-500 mb-8">Connectez-vous pour accéder au pilotage</p>
        <button 
          onClick={handleLoginSuccess}
          className="w-full bg-ebf-orange text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-orange-200 transition transform hover:-translate-y-1"
        >
          Accéder à la plateforme
        </button>
      </div>
    </div>
  );

  return (
    <AppContent 
        session={session} 
        onLogout={() => setAppState('LOGIN')} 
        userRole={userRole} 
        userProfile={userProfile} 
    />
  );
}

const AppContent = ({ onLogout, userRole, userProfile }: any) => {
  const [currentPath, setCurrentPath] = useState('/');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentSite, setCurrentSite] = useState<Site>(Site.GLOBAL);
  const [currentPeriod, setCurrentPeriod] = useState<Period>(Period.MONTH);
  const [reports, setReports] = useState<DailyReport[]>(MOCK_REPORTS);
  const [stock, setStock] = useState<StockItem[]>(MOCK_STOCK);

  const handleNavigate = (path: string) => { setCurrentPath(path); setIsMenuOpen(false); };

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

     const section = currentPath.split('/')[1];
     if (MODULE_ACTIONS[section]) {
       return (
         <div className="space-y-6 animate-fade-in">
           <div className="flex items-center gap-4">
              <button onClick={() => handleNavigate('/')} className="p-2 bg-white rounded-full border"><ArrowLeft/></button>
              <h2 className="text-2xl font-bold capitalize">Module {section}</h2>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {MODULE_ACTIONS[section].map(action => (
                <button 
                  key={action.id} 
                  onClick={() => handleNavigate(action.path)}
                  className="bg-white p-6 rounded-2xl shadow-md border hover:border-ebf-orange transition flex flex-col items-center gap-4"
                >
                  <div className={`${action.color} p-4 rounded-xl text-white`}><action.icon size={32}/></div>
                  <div className="text-center">
                    <h3 className="font-bold text-lg">{action.label}</h3>
                    <p className="text-sm text-gray-500">{action.description}</p>
                  </div>
                </button>
              ))}
           </div>
         </div>
       );
     }

     return <div className="text-center py-20 text-gray-400 italic">Module en développement...</div>;
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-green-950 text-white transform transition-transform lg:translate-x-0 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-6 text-2xl font-black border-b border-white/10 tracking-tighter">EBF MANAGER</div>
          <nav className="p-4 space-y-2">
            {MAIN_MENU.map(m => (
              <button 
                key={m.id} 
                onClick={() => handleNavigate(m.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${currentPath === m.path ? 'bg-ebf-orange text-white' : 'text-gray-300 hover:bg-green-900'}`}
              >
                <m.icon size={20}/> {m.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col lg:ml-64 relative">
          <header className="h-16 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-20">
            <button onClick={() => setIsMenuOpen(true)} className="lg:hidden p-2"><Menu/></button>
            <div className="font-black text-green-950">TABLEAU DE BORD</div>
            <button onClick={onLogout} className="flex items-center gap-2 text-red-500 font-bold hover:bg-red-50 px-3 py-1 rounded-lg">
              <LogOut size={18}/> Quitter
            </button>
          </header>
          <main className="flex-1 overflow-y-auto p-6 bg-ebf-pattern">
              {renderContent()}
          </main>
        </div>
    </div>
  );
};
