
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  LayoutDashboard, Wrench, Briefcase, ShoppingCart, Menu, X, Bell, Search, Settings,
  HardHat, DollarSign, LogOut, Calculator, Users, Calendar, FolderOpen, Truck, 
  FileText, UserCheck, CreditCard, Archive, ShieldCheck, ClipboardList, ArrowLeft, ChevronRight, Mic, Send, Save, Plus, CheckCircle, Trash2, User, HelpCircle, Moon, Play, StopCircle, RefreshCw, FileInput, MapPin, Volume2, Megaphone, AlertCircle, Filter, TrendingUp, Edit, ArrowUp, ArrowDown, AlertTriangle, Loader2, Mail, Lock, UserPlus, ScanFace, Fingerprint, Phone
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

// --- Login & Register Screen (Supabase Auth) ---
const LoginScreen = ({ onLogin }: { onLogin: () => void }) => {
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [identifier, setIdentifier] = useState(''); // Email or Phone
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [hasLoggedInBefore, setHasLoggedInBefore] = useState(false);

  useEffect(() => {
    // Vérifier si l'utilisateur s'est déjà connecté sur ce navigateur
    const visited = localStorage.getItem('ebf_has_logged_in');
    if (visited) {
      setHasLoggedInBefore(true);
    }
  }, []);

  const handleAuth = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (isResetMode) {
        // Logique de réinitialisation de mot de passe (Email uniquement)
        if (authMethod !== 'email') {
          throw new Error("La réinitialisation n'est disponible que par Email pour le moment.");
        }
        const { error } = await supabase.auth.resetPasswordForEmail(identifier, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setSuccessMsg("Lien de réinitialisation envoyé ! Vérifiez votre boîte mail.");
        setLoading(false);
        return;
      }

      if (isSignUp) {
        // Mode Inscription
        let error;
        if (authMethod === 'email') {
          const { error: err } = await supabase.auth.signUp({
            email: identifier,
            password,
          });
          error = err;
        } else {
          // Inscription Téléphone
          const { error: err } = await supabase.auth.signUp({
            phone: identifier,
            password,
          });
          error = err;
        }

        if (error) throw error;
        
        localStorage.setItem('ebf_has_logged_in', 'true');
        alert("Inscription réussie ! Vous êtes connecté.");
      } else {
        // Mode Connexion
        let error;
        if (authMethod === 'email') {
          const { error: err } = await supabase.auth.signInWithPassword({
            email: identifier,
            password,
          });
          error = err;
        } else {
          // Connexion Téléphone
          const { error: err } = await supabase.auth.signInWithPassword({
            phone: identifier,
            password,
          });
          error = err;
        }

        if (error) throw error;
        localStorage.setItem('ebf_has_logged_in', 'true');
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue. Vérifiez vos identifiants.");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setIsResetMode(false);
    setError('');
    setSuccessMsg('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50/50 p-4">
       <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md text-center border-t-4 border-ebf-orange animate-fade-in">
          <div className="flex justify-center mb-6 transform scale-125">
             <EbfLogo />
          </div>
          
          <h2 className="text-2xl font-bold text-green-900 mb-2">
            {isResetMode ? "Réinitialisation" : (isSignUp ? "Créer un compte" : "Bon retour")}
          </h2>
          <p className="text-green-700 mb-6 text-sm">
            {isResetMode 
               ? "Entrez votre email pour recevoir un lien de récupération."
               : (isSignUp 
                  ? "Enregistrez-vous pour accéder à EBF Manager" 
                  : "Connectez-vous pour accéder à votre espace.")}
          </p>
          
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-bold flex items-center gap-2 text-left"><AlertCircle size={16}/> {error}</div>}
          {successMsg && <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 text-sm font-bold flex items-center gap-2 text-left"><CheckCircle size={16}/> {successMsg}</div>}

          {/* Onglets de méthode d'auth */}
          {!isResetMode && (
            <div className="flex p-1 bg-gray-100 rounded-lg mb-6">
               <button 
                 onClick={() => { setAuthMethod('email'); setError(''); }}
                 className={`flex-1 flex items-center justify-center py-2 rounded-md text-sm font-bold transition ${authMethod === 'email' ? 'bg-white text-ebf-green shadow' : 'text-gray-500'}`}
               >
                 <Mail size={16} className="mr-2"/> Email
               </button>
               <button 
                 onClick={() => { setAuthMethod('phone'); setError(''); }}
                 className={`flex-1 flex items-center justify-center py-2 rounded-md text-sm font-bold transition ${authMethod === 'phone' ? 'bg-white text-ebf-orange shadow' : 'text-gray-500'}`}
               >
                 <Phone size={16} className="mr-2"/> Téléphone
               </button>
            </div>
          )}

          <div className="space-y-4 text-left">
             <div>
                <label className="block text-sm font-bold text-green-900 mb-1">
                  {authMethod === 'email' ? 'Email' : 'Numéro de téléphone'}
                </label>
                <div className="relative">
                  {authMethod === 'email' ? (
                    <Mail className="absolute left-3 top-3 text-green-700" size={18} />
                  ) : (
                    <Phone className="absolute left-3 top-3 text-ebf-orange" size={18} />
                  )}
                  <input 
                    type={authMethod === 'email' ? 'email' : 'tel'}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={authMethod === 'email' ? "exemple@ebf.ci" : "+225 07..."}
                    className="w-full border border-orange-200 p-3 pl-10 rounded-lg focus:ring-2 focus:ring-ebf-orange outline-none bg-white text-green-900 placeholder-green-300" 
                  />
                </div>
             </div>
             
             {!isResetMode && (
               <div>
                  <label className="block text-sm font-bold text-green-900 mb-1">Mot de passe</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-green-700" size={18} />
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••" 
                      className="w-full border border-orange-200 p-3 pl-10 rounded-lg focus:ring-2 focus:ring-ebf-orange outline-none bg-white text-green-900 placeholder-green-300" 
                    />
                  </div>
                  {/* Lien Mot de passe oublié */}
                  {!isSignUp && (
                    <div className="text-right mt-1">
                      <button 
                        onClick={() => { setIsResetMode(true); setAuthMethod('email'); setError(''); }}
                        className="text-xs text-orange-600 hover:text-orange-800 font-semibold"
                      >
                        Mot de passe oublié ?
                      </button>
                    </div>
                  )}
               </div>
             )}
             
             <button 
                onClick={handleAuth} 
                disabled={loading}
                className="w-full bg-gradient-to-r from-ebf-orange to-orange-600 text-white font-bold py-3 rounded-lg hover:shadow-lg transition transform hover:scale-105 disabled:opacity-50 flex justify-center items-center gap-2 mt-4"
             >
                {loading ? <Loader2 className="animate-spin" /> : (
                  isResetMode 
                    ? "Envoyer le lien" 
                    : (isSignUp ? <><UserPlus size={18} /> S'inscrire</> : "Se Connecter")
                )}
             </button>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            {isResetMode ? (
              <button 
                onClick={() => setIsResetMode(false)}
                className="text-sm font-bold text-gray-500 hover:text-gray-800"
              >
                Retour à la connexion
              </button>
            ) : (
              <button 
                onClick={toggleMode}
                className="text-sm font-bold text-ebf-green hover:underline focus:outline-none"
              >
                {isSignUp 
                  ? "Déjà un compte ? Se connecter" 
                  : "Pas encore de compte ? S'inscrire"}
              </button>
            )}
          </div>

          {/* Affichage des autres méthodes UNIQUEMENT si l'utilisateur s'est déjà connecté auparavant et n'est pas en mode reset */}
          {!isSignUp && hasLoggedInBefore && !isResetMode && (
            <div className="mt-6 animate-fade-in">
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase font-bold">Ou continuer avec</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <button className="flex items-center justify-center py-2 px-4 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition text-sm font-medium text-green-900">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Google
                </button>
                <button className="flex items-center justify-center py-2 px-4 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition text-sm font-medium text-green-900">
                   <Mail size={18} className="mr-2 text-indigo-500"/> Lien Magique
                </button>
                <button className="flex items-center justify-center py-2 px-4 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition text-sm font-medium text-green-900">
                   <ScanFace size={18} className="mr-2 text-ebf-orange"/> Face ID
                </button>
                <button className="flex items-center justify-center py-2 px-4 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition text-sm font-medium text-green-900">
                   <Fingerprint size={18} className="mr-2 text-ebf-green"/> Touch ID
                </button>
              </div>
            </div>
          )}

          <p className="mt-8 text-xs text-gray-400">© 2024 EBF Manager v2.2 (Secured)</p>
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
        {/* Notifications and Settings removed from here for brevity based on previous context, can be re-added if needed but prompt focused on Login */}
        <div className="relative group">
           <button className="p-2 text-ebf-orange hover:bg-orange-50 rounded-full transition"><Settings size={24} /></button>
           <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-orange-100 dark:border-gray-700 hidden group-hover:block animate-fade-in z-50">
              <div className="p-4 border-b border-orange-50 dark:border-gray-700">
                 <p className="font-bold text-green-900 dark:text-white text-sm">Paramètres</p>
              </div>
              <button onClick={onOpenProfile} className="w-full text-left px-4 py-3 text-sm text-green-800 dark:text-gray-200 hover:bg-orange-50 dark:hover:bg-gray-700 flex items-center gap-2"><User size={16}/> Mon Profil</button>
              <button onClick={onOpenFlashInfo} className="w-full text-left px-4 py-3 text-sm text-green-800 dark:text-gray-200 hover:bg-orange-50 dark:hover:bg-gray-700 flex items-center gap-2"><Megaphone size={16}/> Configurer Flash Info</button>
              <button onClick={onToggleTheme} className="w-full text-left px-4 py-3 text-sm text-green-800 dark:text-gray-200 hover:bg-orange-50 dark:hover:bg-gray-700 flex items-center gap-2">
                 {darkMode ? <><Moon size={16}/> Mode Clair</> : <><Moon size={16}/> Mode Sombre</>}
              </button>
              <button onClick={onOpenHelp} className="w-full text-left px-4 py-3 text-sm text-green-800 dark:text-gray-200 hover:bg-orange-50 dark:hover:bg-gray-700 flex items-center gap-2"><HelpCircle size={16}/> Aide & Support</button>
              <div className="border-t border-orange-50 dark:border-gray-700">
                 <button onClick={onLogout} className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"><LogOut size={16}/> Se déconnecter</button>
              </div>
           </div>
        </div>
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

  const moveMessage = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === messages.length - 1) return;
    
    const newMessages = [...messages];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newMessages[index], newMessages[targetIndex]] = [newMessages[targetIndex], newMessages[index]];
    onUpdate(newMessages);
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
           <button onClick={handleSubmit} className="bg-ebf-orange text-white p-2 rounded flex items-center gap-1">{editingId ? <><RefreshCw size={16}/> MAJ</> : <><Plus size={16}/> Ajout</>}</button>
           {editingId && <button onClick={resetForm} className="bg-gray-200 text-gray-700 p-2 rounded"><X size={16}/></button>}
        </div>
        <div className="flex-1 overflow-y-auto space-y-2">
            {messages.map((msg, idx) => (
               <div key={msg.id} className="flex justify-between items-center p-2 border border-orange-100 rounded bg-orange-50/30">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${msg.type === 'alert' ? 'bg-red-500' : msg.type === 'success' ? 'bg-green-500' : 'bg-blue-400'}`}></span>
                    <span className="text-green-900 dark:text-white text-sm">{msg.text}</span>
                  </div>
                  <div className="flex gap-1">
                     <button onClick={() => moveMessage(idx, 'up')} disabled={idx === 0} className="p-1 text-gray-400 hover:text-ebf-orange disabled:opacity-30"><ArrowUp size={16}/></button>
                     <button onClick={() => moveMessage(idx, 'down')} disabled={idx === messages.length - 1} className="p-1 text-gray-400 hover:text-ebf-orange disabled:opacity-30"><ArrowDown size={16}/></button>
                     <div className="w-px h-4 bg-gray-300 mx-1"></div>
                     <button onClick={() => handleEdit(msg)} className="p-1 text-blue-500 hover:text-blue-700"><Edit size={16}/></button>
                     <button onClick={() => { 
                         const newMsgs = messages.filter(m => m.id !== msg.id);
                         onUpdate(newMsgs); 
                     }} className="p-1 text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
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
               <button onClick={() => onSelectMode('voice')} className="p-8 bg-white shadow-xl rounded-xl border-2 hover:border-indigo-500 h-40 w-40 flex flex-col items-center justify-center gap-2 md:h-56 md:w-56">
                   <Mic size={40} className="text-indigo-600 mb-2" />
                   <div className="font-bold text-lg text-green-900">Vocal</div>
               </button>
               <button onClick={() => onSelectMode('form')} className="p-8 bg-white shadow-xl rounded-xl border-2 hover:border-orange-500 h-40 w-40 flex flex-col items-center justify-center gap-2 md:h-56 md:w-56">
                   <FileText size={40} className="text-orange-600 mb-2" />
                   <div className="font-bold text-lg text-green-900">Formulaire</div>
               </button>
           </div>
           {/* List */}
           <div className="bg-white rounded-xl shadow p-4 border border-orange-100">
              <h3 className="font-bold mb-4 text-green-900">Historique des Derniers Rapports</h3>
              {reports.map((r: any) => (
                  <div key={r.id} className="flex justify-between items-center p-3 border-b border-gray-100 last:border-0 hover:bg-orange-50 transition">
                      <div className="flex items-center gap-3">
                         {r.method === 'Voice' ? <Mic size={16} className="text-indigo-500"/> : <FileText size={16} className="text-orange-500"/>}
                         <div className="flex flex-col">
                            <span className="font-bold text-green-900 text-sm">{r.technicianName}</span>
                            <span className="text-xs text-gray-500">{r.date} - {r.site}</span>
                         </div>
                      </div>
                      <button onClick={() => onViewReport(r)} className="text-white bg-ebf-green hover:bg-green-800 px-3 py-1 rounded text-xs font-bold transition">VOIR</button>
                  </div>
              ))}
           </div>
        </div>
    );
};

const VoiceReportRecorder = ({ onBack, onSubmit }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-xl max-w-lg mx-auto border border-orange-100">
        <h2 className="text-2xl font-bold mb-4 text-green-900">Rapport Vocal</h2>
        <div className="flex justify-center my-8 p-10 bg-gray-50 rounded-full w-40 h-40 mx-auto items-center"><Mic size={64} className="text-ebf-orange animate-pulse" /></div>
        <p className="text-center text-gray-500 mb-6">Enregistrement en cours... (Simulation)</p>
        <button onClick={() => onSubmit({method: 'Voice', content: 'Ceci est une simulation de transcription vocale du rapport technicien.', date: new Date().toISOString(), technicianName: 'Tech', site: 'Abidjan'})} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition">Arrêter & Envoyer</button>
        <button onClick={onBack} className="w-full mt-2 text-red-500 py-2 hover:bg-red-50 rounded">Annuler</button>
    </div>
);

const DetailedReportForm = ({ onBack, onSubmit }: any) => {
    const [domain, setDomain] = useState('');
    const [type, setType] = useState('');
    const [manualType, setManualType] = useState('');
    const [formData, setFormData] = useState<any>({ site: 'Abidjan', expenses: 0, revenue: 0 });

    const handleChange = (e: any) => setFormData({...formData, [e.target.name]: e.target.value});

    const getTypes = () => {
        switch(domain) {
            case 'Electricité': return ['Expertise', 'Rapport', 'Conception', 'Étude', 'Devis', 'Dépannages', 'Installation'];
            case 'Bâtiment': return ['Expertise', 'Rapport', 'Conception', 'Étude', 'Devis', 'Implantation des chaises', 'Implantation des poteaux', 'Supervision'];
            case 'Froid': return ['Expertise', 'Rapport', 'Conception', 'Étude', 'Devis', 'Dépannages', 'Installation', 'Entretien', 'Cuivrage'];
            default: return []; // Plomberie & Autres -> Manual
        }
    };

    const handleSubmit = () => {
        onSubmit({
            ...formData,
            domain,
            interventionType: (domain === 'Plomberie' || domain === 'Autres') ? manualType : type,
            method: 'Form',
            date: new Date().toISOString()
        });
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-xl max-w-2xl mx-auto border border-orange-100">
            <h2 className="text-2xl font-bold mb-6 text-ebf-orange">Rapport Détaillé</h2>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-green-900 mb-1">Domaine d'intervention</label>
                    <select value={domain} onChange={e => setDomain(e.target.value)} className="w-full border border-orange-200 p-2 rounded bg-white text-green-900">
                        <option value="">Choisir un domaine...</option>
                        <option value="Electricité">Electricité</option>
                        <option value="Bâtiment">Bâtiment</option>
                        <option value="Froid">Froid</option>
                        <option value="Plomberie">Plomberie</option>
                        <option value="Autres">Autres</option>
                    </select>
                </div>

                {domain && (
                    <div>
                         <label className="block text-sm font-bold text-green-900 mb-1">Type d'intervention</label>
                         {(domain === 'Plomberie' || domain === 'Autres') ? (
                             <input type="text" placeholder="Saisir manuellement..." value={manualType} onChange={e => setManualType(e.target.value)} className="w-full border border-orange-200 p-2 rounded bg-white text-green-900" />
                         ) : (
                             <select value={type} onChange={e => setType(e.target.value)} className="w-full border border-orange-200 p-2 rounded bg-white text-green-900">
                                 <option value="">Choisir le type...</option>
                                 {getTypes().map(t => <option key={t} value={t}>{t}</option>)}
                             </select>
                         )}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-bold text-green-900 mb-1">Lieu d'intervention</label>
                    <input name="location" placeholder="Quartier, Ville, Repère..." onChange={handleChange} className="w-full border border-orange-200 p-2 rounded bg-white text-green-900" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-red-50 rounded border border-red-100">
                        <label className="block text-sm font-bold text-red-900 mb-1">Dépenses (FCFA)</label>
                        <div className="relative">
                            <DollarSign size={16} className="absolute left-2 top-2.5 text-red-400"/>
                            <input name="expenses" type="number" defaultValue={0} onChange={handleChange} className="w-full pl-8 border border-red-200 p-2 rounded bg-white text-green-900" />
                        </div>
                    </div>
                    <div className="p-3 bg-green-50 rounded border border-green-100">
                        <label className="block text-sm font-bold text-green-900 mb-1">Recettes (FCFA)</label>
                        <div className="relative">
                            <DollarSign size={16} className="absolute left-2 top-2.5 text-green-400"/>
                            <input name="revenue" type="number" defaultValue={0} onChange={handleChange} className="w-full pl-8 border border-green-200 p-2 rounded bg-white text-green-900" />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-green-900 mb-1">Nom du Client</label>
                    <input name="clientName" onChange={handleChange} className="w-full border border-orange-200 p-2 rounded bg-white text-green-900" />
                </div>

                 <div>
                    <label className="block text-sm font-bold text-green-900 mb-1">Numéro du Client</label>
                    <input name="clientPhone" onChange={handleChange} className="w-full border border-orange-200 p-2 rounded bg-white text-green-900" />
                </div>

                <div>
                    <label className="block text-sm font-bold text-green-900 mb-1">Site EBF</label>
                    <select name="site" onChange={handleChange} className="w-full border border-orange-200 p-2 rounded bg-white text-green-900">
                        <option value="Abidjan">Abidjan</option>
                        <option value="Bouaké">Bouaké</option>
                    </select>
                </div>
            </div>

            <button onClick={handleSubmit} className="w-full bg-ebf-green text-white py-3 rounded-lg font-bold mt-6 hover:bg-green-800 transition shadow-lg">Soumettre le Rapport</button>
            <button onClick={onBack} className="w-full mt-3 text-red-500 py-2 hover:bg-red-50 rounded">Annuler</button>
        </div>
    )
};

const ModulePlaceholder = ({ title, subtitle, items, onBack, onAdd, onDelete, color, currentSite, currentPeriod }: any) => {
    // Labels mapping for nicer display
    const COLUMN_LABELS: Record<string, string> = {
        name: 'Nom', quantity: 'Quantité', unit: 'Unité', threshold: 'Seuil', site: 'Site',
        client: 'Client', clientPhone: 'Tél Client', location: 'Lieu', description: 'Description', technician: 'Technicien', date: 'Date', status: 'Statut'
    };

    // Filter items locally based on Site and Period props if passed
    const filteredItems = useMemo(() => {
        return items.filter((item: any) => {
            // Site Check
            if (currentSite && currentSite !== Site.GLOBAL && item.site && item.site !== currentSite) return false;
            // Date Check (only if item has date)
            if (currentPeriod && item.date && !isInPeriod(item.date, currentPeriod)) return false;
            return true;
        });
    }, [items, currentSite, currentPeriod]);

    // Determine columns from first item
    const columns = filteredItems.length > 0 
        ? Object.keys(filteredItems[0]).filter(k => k !== 'id' && k !== 'technicianId') 
        : ['info']; // Fallback

    return (
        <div className="space-y-4 animate-fade-in">
             {/* Header with Global Filters Context Reminder */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-orange-100 shadow-sm">
                <div>
                    <h2 className={`text-2xl font-bold ${color.replace('bg-', 'text-').replace('600', '700')}`}>{title}</h2>
                    <p className="text-sm text-gray-500">{subtitle}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-lg">
                    <Filter size={14}/>
                    <span>Filtres actifs : {currentSite} - {currentPeriod}</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={onBack} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 font-medium">Retour</button>
                    <button onClick={onAdd} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow-md transition transform hover:-translate-y-0.5"><Plus size={18}/> Ajouter Nouveau</button>
                </div>
            </div>

            {/* Stocks Chart specific */}
            {title === 'Stocks' && filteredItems.length > 0 && (
                <div className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm h-64 mb-6">
                    <h3 className="text-sm font-bold text-green-900 mb-2">Niveaux de Stock vs Seuil d'Alerte</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={filteredItems}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{fontSize: 10}} interval={0} angle={-15} textAnchor="end" height={40}/>
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="quantity" name="Quantité Actuelle" fill="#228B22" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="threshold" name="Seuil Alerte" fill="#EF4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-orange-100">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                        <thead className={`bg-opacity-10 ${color}`}>
                            <tr>
                                {columns.map(col => (
                                    <th key={col} className="p-4 text-left text-xs font-bold uppercase tracking-wider text-green-900">
                                        {COLUMN_LABELS[col] || col}
                                    </th>
                                ))}
                                <th className="p-4 text-right text-xs font-bold uppercase tracking-wider text-green-900">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredItems.length === 0 ? (
                                <tr><td colSpan={columns.length + 1} className="p-8 text-center text-gray-400">Aucune donnée trouvée pour ces filtres.</td></tr>
                            ) : (
                                filteredItems.map((item: any, i: number) => (
                                    <tr key={i} className="hover:bg-orange-50/30 transition duration-150">
                                        {columns.map(col => (
                                            <td key={col} className="p-4 text-sm text-green-900 border-r border-transparent last:border-0">
                                                {item[col]}
                                            </td>
                                        ))}
                                        <td className="p-4 text-right flex justify-end gap-2">
                                            <button className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition"><Edit size={16}/></button>
                                            <button onClick={() => onDelete(item)} className="p-1.5 text-red-500 hover:bg-red-50 rounded transition"><Trash2 size={16}/></button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const DynamicModal = ({ isOpen, onClose, config, onSubmit }: any) => {
    const [data, setData] = useState<any>({});
    
    // Reset data when modal opens
    useEffect(() => {
        if(isOpen) setData({});
    }, [isOpen]);

    if (!isOpen || !config) return null;
    return (
        <div className="fixed inset-0 bg-green-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-2xl animate-fade-in border-t-4 border-ebf-orange">
                <h3 className="font-bold text-xl mb-6 text-green-900">{config.title}</h3>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                    {config.fields.map((f: any) => (
                        <div key={f.name}>
                            <label className="block text-sm font-bold mb-1 text-green-900">{f.label}</label>
                            {f.type === 'select' ? (
                                <select onChange={e => setData({...data, [f.name]: e.target.value})} className="w-full border border-orange-200 p-2.5 rounded-lg bg-white text-green-900 focus:ring-2 focus:ring-ebf-orange outline-none">
                                    <option value="">Choisir...</option>
                                    {f.options.map((o: string) => <option key={o} value={o}>{o}</option>)}
                                </select>
                            ) : (
                                <input 
                                    type={f.type} 
                                    onChange={e => setData({...data, [f.name]: e.target.value})} 
                                    placeholder={f.placeholder || ''}
                                    className="w-full border border-orange-200 p-2.5 rounded-lg bg-white text-green-900 focus:ring-2 focus:ring-ebf-orange outline-none" 
                                />
                            )}
                        </div>
                    ))}
                </div>
                <div className="flex gap-3 mt-8">
                    <button onClick={onClose} className="flex-1 border border-gray-300 p-2.5 rounded-lg text-gray-700 hover:bg-gray-50 font-bold transition">Annuler</button>
                    <button onClick={() => onSubmit(data)} className="flex-1 bg-gradient-to-r from-ebf-green to-green-700 text-white p-2.5 rounded-lg font-bold shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5">Enregistrer</button>
                </div>
            </div>
        </div>
    );
};

const ModuleMenu = ({ title, actions, onNavigate }: any) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
        {actions.map((a: any) => (
            <button 
              key={a.id} 
              onClick={() => onNavigate(a.path)} 
              className={`${a.color} text-white p-6 rounded-xl text-left shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group relative overflow-hidden border border-white/10`}
            >
                <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-150 transition duration-500">
                    <a.icon size={100} />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm"><a.icon size={28} className="text-white"/></div>
                        <ChevronRight className="text-white opacity-0 group-hover:opacity-100 transition transform translate-x-2 group-hover:translate-x-0" />
                    </div>
                    <h3 className="font-bold text-xl mb-1 text-white tracking-wide">{a.label}</h3>
                    <p className="text-white/80 text-sm font-medium">{a.description}</p>
                    {a.managedBy && (
                        <span className="inline-block mt-4 bg-white px-3 py-1 rounded-full text-blue-700 text-xs font-extrabold uppercase tracking-wider shadow-sm">
                            {a.managedBy}
                        </span>
                    )}
                </div>
            </button>
        ))}
    </div>
);

const ProfileModal = ({ isOpen, onClose }: any) => { if (!isOpen) return null; return <div className="fixed inset-0 bg-black/50" onClick={onClose}></div> };
const HelpModal = ({ isOpen, onClose }: any) => { if (!isOpen) return null; return <div className="fixed inset-0 bg-black/50" onClick={onClose}></div> };
const ReportDetailModal = ({ isOpen, onClose, report }: any) => { 
    if (!isOpen || !report) return null; 
    return (
        <div className="fixed inset-0 bg-green-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl animate-fade-in overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="bg-ebf-green p-4 flex justify-between items-center">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                        {report.method === 'Voice' ? <Mic size={20}/> : <FileText size={20}/>} 
                        Détail du Rapport
                    </h3>
                    <button onClick={onClose} className="text-white hover:bg-white/20 p-1 rounded"><X size={20}/></button>
                </div>
                <div className="p-6">
                    <div className="flex justify-between items-start mb-6 border-b border-orange-100 pb-4">
                        <div>
                            <p className="text-sm text-gray-500">Technicien</p>
                            <p className="font-bold text-green-900 text-lg">{report.technicianName}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Date</p>
                            <p className="font-bold text-green-900">{report.date}</p>
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{report.site}</span>
                        </div>
                    </div>

                    {report.method === 'Voice' ? (
                        <div className="bg-gray-50 p-6 rounded-xl flex flex-col items-center justify-center border border-gray-200">
                             <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                                <Volume2 size={32} />
                             </div>
                             <div className="w-full bg-gray-200 h-2 rounded-full mb-2 overflow-hidden">
                                <div className="bg-indigo-500 w-1/3 h-full"></div>
                             </div>
                             <div className="flex justify-between w-full text-xs text-gray-500 mb-4">
                                <span>0:15</span>
                                <span>1:45</span>
                             </div>
                             <div className="flex gap-4">
                                <button className="p-3 rounded-full bg-indigo-600 text-white hover:bg-indigo-700"><Play size={24} fill="white"/></button>
                             </div>
                             <div className="mt-6 p-4 bg-white border border-gray-200 rounded w-full">
                                <p className="text-xs font-bold text-gray-500 mb-1">TRANSCRIPTION AUTOMATIQUE</p>
                                <p className="text-green-900 italic">"{report.content}"</p>
                             </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 bg-orange-50 p-3 rounded border border-orange-100">
                                <p className="text-xs font-bold text-orange-800 uppercase">Description</p>
                                <p className="text-green-900">{report.content || 'Aucune description'}</p>
                            </div>
                            <div className="p-3 border rounded">
                                <p className="text-xs text-gray-500">Domaine</p>
                                <p className="font-bold text-green-900">{report.domain}</p>
                            </div>
                            <div className="p-3 border rounded">
                                <p className="text-xs text-gray-500">Type</p>
                                <p className="font-bold text-green-900">{report.interventionType}</p>
                            </div>
                            <div className="p-3 border rounded">
                                <p className="text-xs text-gray-500">Lieu</p>
                                <p className="font-bold text-green-900">{report.location}</p>
                            </div>
                            <div className="p-3 border rounded">
                                <p className="text-xs text-gray-500">Client</p>
                                <p className="font-bold text-green-900">{report.clientName} <span className="text-xs font-normal text-gray-400">({report.clientPhone})</span></p>
                            </div>
                            <div className="p-3 border border-red-100 bg-red-50 rounded">
                                <p className="text-xs font-bold text-red-700">Dépenses</p>
                                <p className="font-bold text-red-900">{report.expenses} FCFA</p>
                            </div>
                            <div className="p-3 border border-green-100 bg-green-50 rounded">
                                <p className="text-xs font-bold text-green-700">Recettes</p>
                                <p className="font-bold text-green-900">{report.revenue} FCFA</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

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
      const { data: inters } = await supabase.from('interventions').select('*').order('scheduled_date', { ascending: false });
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
        currentSite={currentSite}
        currentPeriod={currentPeriod}
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
