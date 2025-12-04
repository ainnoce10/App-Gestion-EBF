import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  LayoutDashboard, Wrench, Briefcase, ShoppingCart, Menu, X, Bell, Search, Settings,
  HardHat, DollarSign, LogOut, Calculator, Users, Calendar, FolderOpen, Truck, 
  FileText, UserCheck, CreditCard, Archive, ShieldCheck, ClipboardList, ArrowLeft, ChevronRight, Mic, Send, Save, Plus, CheckCircle, Trash2, User, HelpCircle, Moon, Play, StopCircle, RefreshCw, FileInput, MapPin, Volume2, Megaphone, AlertCircle, Filter, TrendingUp, Edit, ArrowUp, ArrowDown, AlertTriangle, Loader2
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { DetailedSynthesis } from './components/DetailedSynthesis';
import { Site, Period, TickerMessage, StatData, DailyReport, Intervention, StockItem, Technician } from './types';
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

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'alert' | 'success' | 'info';
  read: boolean;
  path?: string;
}

// --- Menu Configuration ---
const MAIN_MENU: MenuItem[] = [
  { id: 'accueil', label: 'Accueil', icon: LayoutDashboard, path: '/', description: 'Vue d\'ensemble', colorClass: 'text-orange-500' },
  { id: 'techniciens', label: 'Techniciens', icon: HardHat, path: '/techniciens', description: 'Gestion opérationnelle', colorClass: 'text-yellow-600' },
  { id: 'comptabilite', label: 'Comptabilité', icon: Calculator, path: '/comptabilite', description: 'Finance & RH', colorClass: 'text-green-600' },
  { id: 'secretariat', label: 'Secrétariat', icon: FolderOpen, path: '/secretariat', description: 'Administration', colorClass: 'text-blue-500' },
  { id: 'quincaillerie', label: 'Quincaillerie', icon: ShoppingCart, path: '/quincaillerie', description: 'Logistique & Stocks', colorClass: 'text-red-500' },
];

// --- Sub-Menu Configurations ---
const MODULE_ACTIONS: Record<string, ModuleAction[]> = {
  techniciens: [
    { 
      id: 'interventions', 
      label: 'Interventions', 
      description: 'Planning des interventions', 
      managedBy: 'Géré par le Superviseur',
      icon: Wrench, 
      path: '/techniciens/interventions', 
      color: 'bg-orange-500' 
    },
    { 
      id: 'rapports', 
      label: 'Rapports Journaliers', 
      description: 'Vocal ou Formulaire détaillé', 
      managedBy: 'Géré par les Techniciens',
      icon: FileText, 
      path: '/techniciens/rapports', 
      color: 'bg-indigo-600' 
    },
    { 
      id: 'materiel', 
      label: 'Matériel', 
      description: 'Inventaire & Affectation', 
      managedBy: 'Géré par le Magasinier',
      icon: Truck, 
      path: '/techniciens/materiel', 
      color: 'bg-blue-600' 
    },
    { 
      id: 'chantiers', 
      label: 'Chantiers', 
      description: 'Suivi & Exécution', 
      managedBy: 'Géré par le Chef de Chantier',
      icon: ShieldCheck, 
      path: '/techniciens/chantiers', 
      color: 'bg-green-600' 
    },
  ],
  comptabilite: [
    { id: 'bilan', label: 'Bilan Financier', description: 'Analyses des coûts et recettes', icon: DollarSign, path: '/comptabilite/bilan', color: 'bg-green-600' },
    { id: 'rh', label: 'Ressources Humaines', description: 'Dossiers du personnel', icon: Users, path: '/comptabilite/rh', color: 'bg-purple-600' },
    { id: 'paie', label: 'Paie & Salaires', description: 'Gestion des virements mensuels', icon: CreditCard, path: '/comptabilite/paie', color: 'bg-orange-500' },
  ],
  secretariat: [
    { id: 'planning', label: 'Planning', description: 'Agenda des équipes et rdv', icon: Calendar, path: '/secretariat/planning', color: 'bg-indigo-500' },
    { id: 'clients', label: 'Gestion Clients', description: 'Base de données CRM', icon: UserCheck, path: '/secretariat/clients', color: 'bg-blue-500' },
    { id: 'caisse', label: 'Caisse Menu', description: 'Suivi de la petite caisse', icon: Archive, path: '/secretariat/caisse', color: 'bg-gray-600' },
  ],
  quincaillerie: [
    { id: 'stocks', label: 'Stocks', description: 'État des stocks en temps réel', icon: ClipboardList, path: '/quincaillerie/stocks', color: 'bg-orange-600' },
    { id: 'fournisseurs', label: 'Fournisseurs', description: 'Liste et contacts partenaires', icon: Truck, path: '/quincaillerie/fournisseurs', color: 'bg-green-600' },
    { id: 'achats', label: 'Bons d\'achat', description: 'Historique des commandes', icon: FileText, path: '/quincaillerie/achats', color: 'bg-red-500' },
  ]
};

// --- Form Definitions ---
const FORM_CONFIGS: Record<string, FormConfig> = {
  '/techniciens/interventions': {
    title: 'Nouvelle Intervention',
    fields: [
      { name: 'site', label: 'Site', type: 'select', options: ['Abidjan', 'Bouaké'] },
      { name: 'client', label: 'Nom du Client', type: 'text', placeholder: 'Ex: Hôtel Ivoire' },
      { name: 'clientPhone', label: 'Numéro du Client', type: 'text', placeholder: 'Ex: 0707...' },
      { name: 'lieu', label: 'Lieu d\'intervention', type: 'text', placeholder: 'Ex: Cocody Riviera' },
      { name: 'description', label: 'Description', type: 'text', placeholder: 'Ex: Panne Clim R410' },
      { name: 'technician', label: 'Technicien', type: 'select', options: ['T1', 'T2', 'T3'] }, // Idealement dynamique
      { name: 'date', label: 'Date Prévue', type: 'date' },
      { name: 'status', label: 'Statut Initial', type: 'select', options: ['Pending', 'In Progress', 'Completed'] }
    ]
  },
  '/quincaillerie/stocks': {
    title: 'Article Stock',
    fields: [
      { name: 'name', label: 'Nom Article', type: 'text' },
      { name: 'quantity', label: 'Quantité Initiale', type: 'number' },
      { name: 'unit', label: 'Unité', type: 'text', placeholder: 'm, kg, pcs...' },
      { name: 'threshold', label: 'Seuil Alerte', type: 'number' },
      { name: 'site', label: 'Site', type: 'select', options: ['Abidjan', 'Bouaké'] }
    ]
  },
};

// --- Helper: Date Filter ---
const isInPeriod = (dateStr: string, period: Period): boolean => {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (period === Period.DAY) {
    return itemDate.getTime() === today.getTime();
  } else if (period === Period.WEEK) {
    const day = today.getDay();
    const diffToMonday = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today);
    monday.setDate(diffToMonday);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    monday.setHours(0,0,0,0);
    friday.setHours(23,59,59,999);
    const itemDay = date.getDay();
    if (itemDay === 0 || itemDay === 6) return false;
    return itemDate >= monday && itemDate <= friday;
  } else if (period === Period.MONTH) {
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  } else if (period === Period.YEAR) {
    return date.getFullYear() === now.getFullYear();
  }
  return true;
};

// --- Confirmation Modal ---
const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onConfirm: () => void, 
  title: string, 
  message: string 
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-green-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl w-full max-w-sm p-6 shadow-2xl animate-fade-in border border-red-100">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
            <AlertTriangle size={28} />
          </div>
          <h3 className="text-xl font-bold text-green-900 dark:text-white mb-2">{title}</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
          <div className="flex gap-4 w-full">
            <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-bold">Annuler</button>
            <button onClick={() => { onConfirm(); onClose(); }} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-bold shadow-md">Supprimer</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- EBF Logo ---
const EbfLogo = () => (
  <div className="flex items-center space-x-3">
    <div className="relative w-12 h-12 flex-shrink-0">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-800 to-green-900 shadow-md flex items-center justify-center overflow-hidden">
        <div className="w-full h-full opacity-30 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiBmaWxsPSJ3aGl0ZSI+PHBhdGggZD0iTTUwLDBhNTAsNTAsMCwxLDAsNTAsNTBNNTAsNWMtMTAuNSwwLTIwLjIsMy43LTI3LjksOS45Ii8+PC9zdmc+')]"></div>
      </div>
      <div className="absolute top-10 left-1/2 transform -translate-x-1/2 w-10 h-8 border-b-4 border-l-4 border-green-800 rounded-b-full rounded-l-full"></div>
      <div className="absolute top-2 -right-4 bg-gray-200 border border-gray-400 w-6 h-8 rounded flex justify-center items-center shadow-sm">
         <div className="w-1 h-3 bg-green-900 rounded-full"></div>
      </div>
    </div>
    <div className="h-12 w-1 bg-green-800 rounded-full"></div>
    <div className="flex flex-col">
       <div className="flex items-baseline space-x-1 text-4xl font-black tracking-tighter leading-none" style={{ fontFamily: 'Arial, sans-serif' }}>
         <span className="text-ebf-green">E</span>
         <span className="text-green-800">.</span>
         <span className="text-red-600">B</span>
         <span className="text-green-800">.</span>
         <span className="text-ebf-green">F</span>
       </div>
       <div className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wide mt-1 text-center shadow-sm">
         Electricité - Bâtiment - Froid
       </div>
    </div>
  </div>
);

// --- Login Screen (Supabase Auth) ---
const LoginScreen = ({ onLogin }: { onLogin: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Auth listener in App will handle state change
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50/50 p-4">
       <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md text-center border-t-4 border-ebf-orange">
          <div className="flex justify-center mb-6 transform scale-125">
             <EbfLogo />
          </div>
          <h2 className="text-2xl font-bold text-green-900 mb-2">Bienvenue</h2>
          <p className="text-green-700 mb-8">Connectez-vous pour accéder à votre espace.</p>
          
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-bold">{error}</div>}

          <div className="space-y-4 text-left">
             <div>
                <label className="block text-sm font-bold text-green-900 mb-1">Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@ebf.ci" 
                  className="w-full border border-orange-200 p-3 rounded-lg focus:ring-2 focus:ring-ebf-orange outline-none bg-white text-green-900 placeholder-green-300" 
                />
             </div>
             <div>
                <label className="block text-sm font-bold text-green-900 mb-1">Mot de passe</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full border border-orange-200 p-3 rounded-lg focus:ring-2 focus:ring-ebf-orange outline-none bg-white text-green-900 placeholder-green-300" 
                />
             </div>
             <button 
                onClick={handleLogin} 
                disabled={loading}
                className="w-full bg-gradient-to-r from-ebf-orange to-orange-600 text-white font-bold py-3 rounded-lg hover:shadow-lg transition transform hover:scale-105 disabled:opacity-50 flex justify-center items-center"
             >
                {loading ? <Loader2 className="animate-spin" /> : 'Se Connecter'}
             </button>
          </div>
          <p className="mt-6 text-xs text-gray-400">© 2024 EBF Manager v2.0 (Connected)</p>
       </div>
    </div>
  );
};

// --- SUB COMPONENTS (Moved to top level) ---

const Sidebar = ({ isOpen, setIsOpen, currentPath, onNavigate }: any) => {
    return (
    <>
      <div 
        className={`fixed inset-0 bg-green-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={() => setIsOpen(false)} 
      />
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-28 flex items-center justify-center border-b border-gray-100 dark:border-gray-800 relative bg-gradient-to-b from-white to-green-50 dark:from-gray-900 dark:to-gray-800">
           <div className="cursor-pointer transform hover:scale-105 transition duration-300" onClick={() => onNavigate('/')}>
              <EbfLogo />
           </div>
          <button onClick={() => setIsOpen(false)} className="absolute right-4 top-4 lg:hidden text-red-500 hover:text-red-700 transition">
            <X size={24} />
          </button>
        </div>
        <div className="absolute top-0 bottom-0 left-0 w-2 bg-gradient-to-b from-ebf-orange to-ebf-green"></div>
        <nav className="mt-6 px-4 pb-20 overflow-y-auto h-[calc(100vh-160px)] custom-scrollbar">
          <ul className="space-y-3">
            {MAIN_MENU.map((item) => {
              const Icon = item.icon;
              const isActive = item.path === '/' ? currentPath === '/' : currentPath.startsWith(item.path);
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      onNavigate(item.path);
                      if (window.innerWidth < 1024) setIsOpen(false);
                    }}
                    className={`w-full flex items-center space-x-4 px-4 py-4 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                      isActive 
                        ? 'bg-ebf-orange text-white shadow-lg shadow-orange-200' 
                        : 'bg-white dark:bg-gray-800 text-green-900 dark:text-gray-100 hover:bg-orange-50 dark:hover:bg-gray-700 border border-transparent hover:border-orange-100 dark:hover:border-gray-600'
                    }`}
                  >
                    <Icon size={22} className={`${isActive ? 'text-white' : item.colorClass} transition-colors`} />
                    <div className="flex flex-col items-start">
                      <span className={`font-bold text-base ${isActive ? 'text-white' : 'text-green-900 dark:text-gray-100'}`}>{item.label}</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
};

const Header = ({ onMenuClick, title, onLogout, onOpenProfile, onOpenHelp, darkMode, onToggleTheme, onOpenFlashInfo, onNavigate }: any) => {
  return (
    <header className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-orange-100 dark:border-gray-800 h-16 md:h-20 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30 transition-all duration-300 shadow-sm">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="p-2 lg:hidden text-gray-600 hover:bg-orange-50 rounded-full transition">
          <Menu size={24} />
        </button>
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-green-900 dark:text-white tracking-tight flex items-center">
            <span className="w-2 h-6 bg-gradient-to-b from-ebf-orange to-ebf-green rounded-full mr-3 hidden md:block"></span>
            {title}
          </h2>
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
          <button onClick={onLogout} className="flex items-center gap-2 text-red-600 font-bold bg-red-50 px-3 py-1 rounded-lg">
             <LogOut size={16} /> <span className="hidden md:inline">Déconnexion</span>
          </button>
      </div>
    </header>
  );
};

const FlashInfoModal = ({ isOpen, onClose, messages, onUpdate }: { 
  isOpen: boolean, 
  onClose: () => void, 
  messages: TickerMessage[], 
  onUpdate: (msgs: TickerMessage[]) => void 
}) => {
  const [text, setText] = useState('');
  const [type, setType] = useState<'alert' | 'success' | 'info'>('info');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => { if (!isOpen) resetForm(); }, [isOpen]);
  const resetForm = () => { setText(''); setType('info'); setEditingId(null); };

  const handleSubmit = () => {
    if (text.trim()) {
      if (editingId) {
        onUpdate(messages.map(msg => msg.id === editingId ? { ...msg, text, type } : msg));
      } else {
        onUpdate([...messages, { id: Date.now().toString(), text, type }]);
      }
      resetForm();
    }
  };

  const handleEdit = (msg: TickerMessage) => { setText(msg.text); setType(msg.type); setEditingId(msg.id); };
  
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-green-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-fade-in flex flex-col max-h-[80vh]">
         <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-green-900 dark:text-white flex items-center gap-2"><Megaphone className="text-ebf-orange"/> Configurer Flash Info</h3>
          <button onClick={onClose} className="text-red-500 hover:text-red-700 transition"><X size={24}/></button>
        </div>
        <div className="flex gap-2 mb-6 items-end">
           <input type="text" value={text} onChange={e => setText(e.target.value)} className="flex-1 border-orange-200 border rounded p-2 bg-white text-green-900" placeholder="Message..." />
           <select value={type} onChange={e => setType(e.target.value as any)} className="border-orange-200 border rounded p-2 bg-white text-green-900"><option value="info">Info</option><option value="alert">Alerte</option><option value="success">Succès</option></select>
           <button onClick={handleSubmit} className="bg-ebf-orange text-white p-2 rounded"><Save size={20}/></button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2">
            {messages.map((msg) => (
               <div key={msg.id} className="flex justify-between items-center p-2 border rounded">
                  <span>{msg.text}</span>
                  <div className="flex gap-2">
                     <button onClick={() => handleEdit(msg)}><Edit size={16}/></button>
                     <button onClick={() => { 
                         const newMsgs = messages.filter(m => m.id !== msg.id);
                         onUpdate(newMsgs); 
                     }}><Trash2 size={16} color="red"/></button>
                  </div>
               </div>
            ))}
        </div>
      </div>
    </div>
  );
};

const ReportModeSelector = ({ onSelectMode, onBack, reports, onViewReport }: any) => {
    return (
        <div className="animate-fade-in max-w-5xl mx-auto pb-10">
           <div className="flex justify-center gap-6 mb-8">
               <button onClick={() => onSelectMode('voice')} className="p-8 bg-white shadow-xl rounded-xl border-2 hover:border-indigo-500">
                   <Mic size={40} className="text-indigo-600 mb-2" />
                   <div className="font-bold text-lg">Vocal</div>
               </button>
               <button onClick={() => onSelectMode('form')} className="p-8 bg-white shadow-xl rounded-xl border-2 hover:border-orange-500">
                   <FileText size={40} className="text-orange-600 mb-2" />
                   <div className="font-bold text-lg">Formulaire</div>
               </button>
           </div>
           {/* List */}
           <div className="bg-white rounded-xl shadow p-4">
              <h3 className="font-bold mb-4">Historique</h3>
              {reports.map((r: any) => (
                  <div key={r.id} className="flex justify-between p-3 border-b">
                      <span>{r.date} - {r.technicianName}</span>
                      <button onClick={() => onViewReport(r)} className="text-green-600 font-bold">VOIR</button>
                  </div>
              ))}
           </div>
        </div>
    );
};

const VoiceReportRecorder = ({ onBack, onSubmit }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-xl max-w-lg mx-auto">
        <h2 className="text-2xl font-bold mb-4">Rapport Vocal</h2>
        <div className="flex justify-center my-8"><Mic size={64} className="text-gray-300" /></div>
        <button onClick={() => onSubmit({method: 'Voice', content: 'Audio simulation', date: new Date().toISOString(), technicianName: 'Tech'})} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold">Envoyer (Simulé)</button>
        <button onClick={onBack} className="w-full mt-2 text-red-500">Annuler</button>
    </div>
);

const DetailedReportForm = ({ onBack, onSubmit }: any) => {
    const [formData, setFormData] = useState<any>({ site: 'Abidjan' });
    const handleChange = (e: any) => setFormData({...formData, [e.target.name]: e.target.value});
    return (
        <div className="bg-white p-6 rounded-xl shadow-xl max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-orange-600">Rapport Détaillé</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
                <input name="domain" placeholder="Domaine" onChange={handleChange} className="border p-2 rounded bg-white text-green-900" />
                <input name="interventionType" placeholder="Type" onChange={handleChange} className="border p-2 rounded bg-white text-green-900" />
                <input name="expenses" type="number" placeholder="Dépenses" onChange={handleChange} className="border p-2 rounded bg-white text-green-900" />
                <input name="revenue" type="number" placeholder="Recettes" onChange={handleChange} className="border p-2 rounded bg-white text-green-900" />
                <input name="clientName" placeholder="Client" onChange={handleChange} className="border p-2 rounded bg-white text-green-900" />
            </div>
            <button onClick={() => onSubmit({...formData, method: 'Form', date: new Date().toISOString()})} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold">Soumettre</button>
            <button onClick={onBack} className="w-full mt-2 text-red-500">Annuler</button>
        </div>
    )
};

const ModulePlaceholder = ({ title, items, onBack, onAdd, onDelete, color }: any) => {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className={`text-2xl font-bold ${color.replace('bg-', 'text-')}`}>{title}</h2>
                <button onClick={onAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus size={18}/> Ajouter</button>
            </div>
            <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-4 text-left">Info</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item: any, i: number) => (
                            <tr key={i} className="border-t">
                                <td className="p-4">
                                    {Object.values(item).slice(0, 3).join(' - ')}
                                </td>
                                <td className="p-4 text-right">
                                    <button onClick={() => onDelete(item)} className="text-red-500"><Trash2 size={18}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const DynamicModal = ({ isOpen, onClose, config, onSubmit }: any) => {
    const [data, setData] = useState<any>({});
    if (!isOpen || !config) return null;
    return (
        <div className="fixed inset-0 bg-green-900/60 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-xl w-full max-w-lg">
                <h3 className="font-bold text-xl mb-4">{config.title}</h3>
                <div className="space-y-3">
                    {config.fields.map((f: any) => (
                        <div key={f.name}>
                            <label className="block text-sm font-bold mb-1">{f.label}</label>
                            {f.type === 'select' ? (
                                <select onChange={e => setData({...data, [f.name]: e.target.value})} className="w-full border p-2 rounded bg-white text-green-900">
                                    <option value="">Choisir...</option>
                                    {f.options.map((o: string) => <option key={o} value={o}>{o}</option>)}
                                </select>
                            ) : (
                                <input type={f.type} onChange={e => setData({...data, [f.name]: e.target.value})} className="w-full border p-2 rounded bg-white text-green-900" />
                            )}
                        </div>
                    ))}
                </div>
                <div className="flex gap-2 mt-6">
                    <button onClick={onClose} className="flex-1 border p-2 rounded text-gray-600">Annuler</button>
                    <button onClick={() => onSubmit(data)} className="flex-1 bg-blue-600 text-white p-2 rounded font-bold">Enregistrer</button>
                </div>
            </div>
        </div>
    );
};

const ModuleMenu = ({ title, actions, onNavigate }: any) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {actions.map((a: any) => (
            <button key={a.id} onClick={() => onNavigate(a.path)} className={`${a.color} text-white p-6 rounded-xl text-left shadow-lg`}>
                <h3 className="font-bold text-xl mb-2">{a.label}</h3>
                <p className="opacity-90">{a.description}</p>
                {a.managedBy && <span className="inline-block bg-white text-blue-700 text-xs font-bold px-2 py-1 rounded mt-2">{a.managedBy}</span>}
            </button>
        ))}
    </div>
);

const ProfileModal = ({ isOpen, onClose }: any) => { if (!isOpen) return null; return <div className="fixed inset-0 bg-black/50" onClick={onClose}></div> };
const HelpModal = ({ isOpen, onClose }: any) => { if (!isOpen) return null; return <div className="fixed inset-0 bg-black/50" onClick={onClose}></div> };
const ReportDetailModal = ({ isOpen, onClose, report }: any) => { if (!isOpen) return null; return <div className="fixed inset-0 bg-green-900/60 flex items-center justify-center" onClick={onClose}><div className="bg-white p-6 rounded">Détails... <button onClick={onClose}>Fermer</button></div></div> };

// --- Main App Content ---
const AppContent = ({ session, onLogout }: { session: any, onLogout: () => void }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState('/');
  const [currentSite, setCurrentSite] = useState<Site>(Site.GLOBAL);
  const [currentPeriod, setCurrentPeriod] = useState<Period>(Period.MONTH);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<FormConfig | null>(null);
  const [showToast, setShowToast] = useState(false);
  
  // Settings States
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isFlashInfoOpen, setIsFlashInfoOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Data States (REAL DATA)
  const [loadingData, setLoadingData] = useState(false);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [tickerMessages, setTickerMessages] = useState<TickerMessage[]>([]);
  
  // Dashboard Derived Data
  const [dashboardStats, setDashboardStats] = useState<StatData[]>([]);

  // Delete Confirmation State
  const [deleteModalConfig, setDeleteModalConfig] = useState<{isOpen: boolean, itemId: string | null, type: string | null}>({
    isOpen: false, itemId: null, type: null
  });

  const [reportMode, setReportMode] = useState<'select' | 'voice' | 'form'>('select');
  const [viewReport, setViewReport] = useState<any | null>(null);

  // --- FETCH DATA FROM SUPABASE ---
  const fetchData = async () => {
    setLoadingData(true);
    try {
      // 1. Fetch Interventions
      const { data: inters } = await supabase.from('interventions').select('*').order('date', { ascending: false });
      if (inters) {
        setInterventions(inters.map(i => ({
          id: i.id,
          site: i.site,
          client: i.client_name,
          clientPhone: i.client_phone,
          location: i.location,
          description: i.description,
          technicianId: i.technician_id, // Map ID or Name depending on needs
          technician: 'Technicien', // Placeholder or fetch name
          date: i.scheduled_date,
          status: i.status
        })));
      }

      // 2. Fetch Stocks
      const { data: stocks } = await supabase.from('stocks').select('*');
      if (stocks) setStock(stocks);

      // 3. Fetch Reports
      const { data: reps } = await supabase.from('daily_reports').select('*').order('date', { ascending: false });
      if (reps) {
        setReports(reps.map(r => ({
          id: r.id,
          technicianName: 'Technicien', // Need join ideally
          date: r.date,
          method: r.method,
          site: r.site,
          content: r.content,
          audioUrl: r.audio_url,
          domain: r.domain,
          interventionType: r.intervention_type,
          location: r.location,
          expenses: r.expenses,
          revenue: r.revenue,
          clientName: r.client_name,
          clientPhone: r.client_phone
        })));
      }

      // 4. Fetch Ticker
      const { data: msgs } = await supabase.from('ticker_messages').select('*').order('display_order', { ascending: true });
      if (msgs) setTickerMessages(msgs);

    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Setup Realtime Subscriptions
    const channels = supabase
      .channel('public:db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        console.log('Change received!', payload);
        fetchData(); // Simplest strategy: refetch all on change
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channels);
    };
  }, []);

  // --- CALCULATE DASHBOARD STATS ---
  useEffect(() => {
    // Generate StatData from Reports (Revenue/Expenses)
    const statsMap = new Map<string, StatData>();

    reports.forEach(r => {
      if (!r.date) return;
      if (!statsMap.has(r.date)) {
        statsMap.set(r.date, {
          date: r.date,
          site: r.site as Site,
          revenue: 0,
          expenses: 0,
          profit: 0,
          interventions: 0
        });
      }
      const stat = statsMap.get(r.date)!;
      const rev = Number(r.revenue || 0);
      const exp = Number(r.expenses || 0);
      stat.revenue += rev;
      stat.expenses += exp;
      stat.profit += (rev - exp);
      stat.interventions += 1;
    });
    
    // Sort by date
    setDashboardStats(Array.from(statsMap.values()).sort((a, b) => a.date.localeCompare(b.date)));

  }, [reports]);


  // --- CRUD HANDLERS ---
  const navigate = (path: string) => {
    setCurrentPath(path);
    setReportMode('select');
  };

  const handleAddClick = () => {
    if (FORM_CONFIGS[currentPath]) {
      setModalConfig(FORM_CONFIGS[currentPath]);
      setIsModalOpen(true);
    }
  };

  const handleFormSubmit = async (data: any) => {
    setIsModalOpen(false);
    
    try {
      if (currentPath.includes('interventions')) {
        await supabase.from('interventions').insert([{
          site: data.site,
          client_name: data.client,
          client_phone: data.clientPhone,
          location: data.lieu,
          description: data.description,
          scheduled_date: data.date,
          status: data.status || 'Pending'
        }]);
      } else if (currentPath.includes('stocks')) {
        await supabase.from('stocks').insert([{
          name: data.name,
          quantity: data.quantity,
          unit: data.unit,
          threshold: data.threshold,
          site: data.site
        }]);
      }
      // Add other cases...
      
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      fetchData(); // Refresh local state
    } catch (e) {
      console.error("Insert error", e);
    }
  };

  const handleReportSubmit = async (reportData: any) => {
    try {
      await supabase.from('daily_reports').insert([{
         date: reportData.date,
         site: reportData.site,
         method: reportData.method,
         content: reportData.content,
         domain: reportData.domain,
         intervention_type: reportData.interventionType,
         location: reportData.location,
         expenses: reportData.expenses,
         revenue: reportData.revenue,
         client_name: reportData.clientName,
         client_phone: reportData.clientPhone
      }]);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      setReportMode('select');
      fetchData();
    } catch (e) {
       console.error("Report Insert Error", e);
    }
  };

  const handleTickerUpdate = async (msgs: TickerMessage[]) => {
    // Sync with DB: Strategy -> Delete all and re-insert is easiest for reordering, 
    // but Upsert is better. For simplicity, let's just use the modal logic to upsert one by one or delete.
    // Actually, the modal passes the full new list.
    
    // 1. Find deleted
    const currentIds = tickerMessages.map(m => m.id);
    const newIds = msgs.map(m => m.id);
    const toDelete = currentIds.filter(id => !newIds.includes(id));
    
    for (const id of toDelete) {
       await supabase.from('ticker_messages').delete().eq('id', id);
    }

    // 2. Upsert (Update or Insert)
    for (const msg of msgs) {
       // Check if exists to determine insert/update if UUID is not standard
       // Assuming msg.id is generated by Date.now() in frontend, it might clash with UUID. 
       // Better to let Supabase handle ID for new ones, but for reordering we need display_order.
       const { error } = await supabase.from('ticker_messages').upsert({
         id: msg.id.length < 10 ? undefined : msg.id, // Simple check if it's a temp ID
         text: msg.text,
         type: msg.type,
         display_order: msgs.indexOf(msg)
       });
    }
    
    fetchData();
  };

  const handleDeleteRequest = (item: any) => {
     let type = '';
     if (currentPath.includes('interventions')) type = 'interventions';
     else if (currentPath.includes('stocks')) type = 'stocks';
     else if (currentPath.includes('rapports')) type = 'daily_reports';
     
     if (type) {
       setDeleteModalConfig({ isOpen: true, itemId: item.id, type });
     }
  };

  const confirmDelete = async () => {
    const { itemId, type } = deleteModalConfig;
    if (!itemId || !type) return;

    await supabase.from(type).delete().eq('id', itemId);
    setDeleteModalConfig({ isOpen: false, itemId: null, type: null });
    fetchData();
  };

  const renderContent = () => {
    if (loadingData && currentPath !== '/') return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-ebf-green" size={48} /></div>;

    // 1. Dashboard
    if (currentPath === '/') {
      return (
        <Dashboard 
          data={dashboardStats.length > 0 ? dashboardStats : []} // Fallback to empty
          tickerMessages={tickerMessages}
          currentSite={currentSite} 
          currentPeriod={currentPeriod}
          onSiteChange={setCurrentSite}
          onPeriodChange={setCurrentPeriod}
          onNavigate={navigate}
        />
      );
    }

    // 2. Synthesis
    if (currentPath === '/synthesis') {
      return (
        <DetailedSynthesis 
          data={dashboardStats} 
          reports={reports}
          currentSite={currentSite} 
          currentPeriod={currentPeriod}
          onSiteChange={setCurrentSite}
          onPeriodChange={setCurrentPeriod}
          onNavigate={navigate}
          onViewReport={setViewReport}
        />
      );
    }

    // 3. Module Menus (Hubs)
    const moduleName = currentPath.split('/')[1];
    const isRootModule = currentPath === `/${moduleName}`;

    if (isRootModule && MODULE_ACTIONS[moduleName]) {
      const menuTitle = MAIN_MENU.find(m => m.id === moduleName)?.label || 'Module';
      return (
        <ModuleMenu 
          title={menuTitle} 
          actions={MODULE_ACTIONS[moduleName]} 
          onNavigate={navigate} 
        />
      );
    }

    // 4. Specific Pages
    if (currentPath === '/techniciens/rapports') {
      if (reportMode === 'select') return <ReportModeSelector reports={reports} onSelectMode={setReportMode} onBack={() => navigate('/techniciens')} onViewReport={setViewReport} />;
      if (reportMode === 'voice') return <VoiceReportRecorder onBack={() => setReportMode('select')} onSubmit={handleReportSubmit} />;
      if (reportMode === 'form') return <DetailedReportForm onBack={() => setReportMode('select')} onSubmit={handleReportSubmit} />;
    }

    // Generic Lists
    let items: any[] = [];
    let title = 'Liste';
    let subtitle = 'Gestion des données';
    let color = 'bg-gray-500';

    if (currentPath === '/techniciens/interventions') {
      items = interventions; title = 'Interventions'; subtitle = 'Suivi des travaux'; color = 'bg-orange-500';
    } else if (currentPath === '/quincaillerie/stocks') {
      items = stock; title = 'Stocks'; subtitle = 'Inventaire matériel'; color = 'bg-blue-500';
    } else if (currentPath === '/comptabilite/rh') {
      items = technicians; title = 'Ressources Humaines'; subtitle = 'Personnel'; color = 'bg-purple-500';
    }

    return (
      <ModulePlaceholder 
        title={title} 
        subtitle={subtitle} 
        color={color} 
        items={items}
        onBack={() => navigate(`/${moduleName}`)}
        onAdd={handleAddClick}
        onDelete={handleDeleteRequest}
      />
    );
  };

  const getPageTitle = () => {
    if (currentPath === '/') return 'Tableau de Bord';
    if (currentPath === '/synthesis') return 'Synthèse Détaillée';
    const main = MAIN_MENU.find(m => m.path === `/${currentPath.split('/')[1]}`);
    if (!main) return 'EBF Manager';
    if (currentPath === main.path) return main.label;
    
    const subActions = Object.values(MODULE_ACTIONS).flat();
    const sub = subActions.find(a => a.path === currentPath);
    return sub ? `${main.label} > ${sub.label}` : main.label;
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900 text-white' : 'bg-gradient-to-br from-orange-50 via-white to-green-50'}`}>
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setSidebarOpen} 
        currentPath={currentPath} 
        onNavigate={navigate} 
      />
      
      <div className="lg:ml-72 min-h-screen flex flex-col transition-all duration-300">
        <Header 
          onMenuClick={() => setSidebarOpen(true)} 
          title={getPageTitle()}
          onLogout={onLogout}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenHelp={() => setIsHelpOpen(true)}
          darkMode={darkMode}
          onToggleTheme={() => setDarkMode(!darkMode)}
          onOpenFlashInfo={() => setIsFlashInfoOpen(true)}
          onNavigate={navigate}
        />
        
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
          {renderContent()}
        </main>
      </div>

      <DynamicModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        config={modalConfig} 
        onSubmit={handleFormSubmit} 
      />

      <ReportDetailModal 
        isOpen={!!viewReport} 
        report={viewReport} 
        onClose={() => setViewReport(null)} 
      />

      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <FlashInfoModal isOpen={isFlashInfoOpen} onClose={() => setIsFlashInfoOpen(false)} messages={tickerMessages} onUpdate={handleTickerUpdate} />

      <ConfirmationModal 
        isOpen={deleteModalConfig.isOpen}
        onClose={() => setDeleteModalConfig({...deleteModalConfig, isOpen: false})}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        message="Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible."
      />

      {showToast && (
        <div className="fixed bottom-6 right-6 bg-ebf-green text-white px-6 py-4 rounded-xl shadow-2xl animate-slide-in flex items-center gap-3 z-50">
          <CheckCircle size={24} />
          <div>
            <h4 className="font-bold">Succès !</h4>
            <p className="text-sm opacity-90">Opération réussie.</p>
          </div>
        </div>
      )}
    </div>
  );
};

function App() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    return <LoginScreen onLogin={() => {}} />; // Login handled inside LoginScreen via Supabase
  }

  return <AppContent session={session} onLogout={() => supabase.auth.signOut()} />;
}

export default App;