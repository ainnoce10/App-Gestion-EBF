import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  LayoutDashboard, Wrench, Briefcase, ShoppingCart, Menu, X, Bell, Search, Settings,
  HardHat, DollarSign, LogOut, Calculator, Users, Calendar, FolderOpen, Truck, 
  FileText, UserCheck, CreditCard, Archive, ShieldCheck, ClipboardList, ArrowLeft, ChevronRight, Mic, Send, Save, Plus, CheckCircle, Trash2, User, HelpCircle, Moon, Play, StopCircle, RefreshCw, FileInput, MapPin, Volume2, Megaphone, AlertCircle, Filter, TrendingUp, Edit, ArrowUp, ArrowDown, AlertTriangle, Loader2, Mail, Lock, UserPlus, ScanFace, Fingerprint, Phone, CheckSquare, Key
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { DetailedSynthesis } from './components/DetailedSynthesis';
import { Site, Period, TickerMessage, StatData, DailyReport, Intervention, StockItem, Transaction, Profile, Role, Notification } from './types';
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

// --- Menu Configuration ---
const MAIN_MENU: MenuItem[] = [
  { id: 'accueil', label: 'Accueil', icon: LayoutDashboard, path: '/', description: 'Vue d\'ensemble', colorClass: 'text-orange-500' },
  { id: 'techniciens', label: 'Techniciens', icon: HardHat, path: '/techniciens', description: 'Gestion opérationnelle', colorClass: 'text-yellow-600' },
  { id: 'comptabilite', label: 'Comptabilité', icon: Calculator, path: '/comptabilite', description: 'Finance & RH', colorClass: 'text-green-600' },
  { id: 'secretariat', label: 'Secrétariat', icon: FolderOpen, path: '/secretariat', description: 'Administration', colorClass: 'text-blue-500' },
  { id: 'quincaillerie', label: 'Quincaillerie', icon: ShoppingCart, path: '/quincaillerie', description: 'Logistique & Stocks', colorClass: 'text-red-500' },
  { id: 'equipe', label: 'Notre Équipe', icon: Users, path: '/equipe', description: 'Membres & Rôles', colorClass: 'text-indigo-500' },
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

// --- Helper: Date Filter ---
const isInPeriod = (dateStr: string, period: Period): boolean => {
  if (!dateStr) return false;
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
  isOpen, onClose, onConfirm, title, message 
}: { isOpen: boolean, onClose: () => void, onConfirm: () => void, title: string, message: string }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-green-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl w-full max-w-sm p-6 shadow-2xl animate-fade-in border border-red-100">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600"><AlertTriangle size={28} /></div>
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

// --- Profile Modal ---
const ProfileModal = ({ isOpen, onClose, profile }: any) => {
  const [formData, setFormData] = useState({ full_name: '', email: '', phone: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) setFormData({ full_name: profile.full_name || '', email: profile.email || '', phone: profile.phone || '' });
  }, [profile, isOpen]);

  const handleUpdate = async () => {
    setLoading(true);
    const { error } = await supabase.from('profiles').update({ full_name: formData.full_name, phone: formData.phone }).eq('id', profile.id);
    setLoading(false);
    if (error) alert("Erreur mise à jour profil");
    else { alert("Profil mis à jour !"); onClose(); window.location.reload(); }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-green-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-6 shadow-2xl animate-fade-in">
        <h3 className="text-xl font-bold text-green-900 dark:text-white mb-4">Mon Profil</h3>
        <div className="space-y-4">
           <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Nom Complet</label><input value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full border border-orange-200 p-2 rounded bg-white text-green-900" /></div>
           <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Email (Lecture seule)</label><input value={formData.email} disabled className="w-full border border-gray-200 p-2 rounded bg-gray-100 text-gray-500" /></div>
           <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Téléphone</label><input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border border-orange-200 p-2 rounded bg-white text-green-900" /></div>
           <button onClick={handleUpdate} disabled={loading} className="w-full bg-ebf-green text-white font-bold py-2 rounded hover:bg-green-800">{loading ? '...' : 'Enregistrer'}</button>
        </div>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400"><X /></button>
      </div>
    </div>
  );
};

// --- Help Modal ---
const HelpModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-green-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-6 shadow-2xl animate-fade-in text-center">
        <HelpCircle size={48} className="text-ebf-orange mx-auto mb-4" />
        <h3 className="text-xl font-bold text-green-900 dark:text-white mb-2">Aide & Support EBF</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">Besoin d'assistance technique ?</p>
        <div className="bg-orange-50 dark:bg-gray-700 p-4 rounded-lg mb-4 text-left">
           <p className="font-bold text-green-900 dark:text-white">📞 Support:</p> <p className="text-gray-700 dark:text-gray-300">+225 07 07 07 07 07</p>
           <p className="font-bold text-green-900 dark:text-white mt-2">📧 Email:</p> <p className="text-gray-700 dark:text-gray-300">support@ebf-ci.com</p>
        </div>
        <button onClick={onClose} className="bg-gray-200 text-gray-700 px-4 py-2 rounded font-bold hover:bg-gray-300">Fermer</button>
      </div>
    </div>
  );
};

// --- Password Update Modal ---
const PasswordUpdateModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) alert("Erreur: " + error.message);
    else {
      alert("Mot de passe mis à jour avec succès !");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-green-900/80 backdrop-blur-sm" />
      <div className="relative bg-white rounded-xl w-full max-w-sm p-8 shadow-2xl animate-fade-in">
         <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2"><Key className="text-ebf-orange"/> Nouveau Mot de Passe</h3>
         <input 
           type="password" 
           value={newPassword} 
           onChange={e => setNewPassword(e.target.value)} 
           placeholder="Entrez votre nouveau mot de passe"
           className="w-full border border-orange-200 p-3 rounded-lg mb-4 bg-white text-green-900" 
         />
         <button onClick={handleUpdate} disabled={loading} className="w-full bg-ebf-green text-white font-bold py-3 rounded-lg hover:bg-green-800 transition">
           {loading ? <Loader2 className="animate-spin mx-auto"/> : "Mettre à jour"}
         </button>
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
       <div className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wide mt-1 text-center shadow-sm">Electricité - Bâtiment - Froid</div>
    </div>
  </div>
);

// --- Login & Register Screen (Supabase Auth & Profiles) ---
const LoginScreen = ({ onLogin }: { onLogin: () => void }) => {
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration Fields
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Role>('Visiteur');
  const [site, setSite] = useState<Site>(Site.ABIDJAN);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  
  const handleAuth = async () => {
    setLoading(true); setError(''); setSuccessMsg('');

    try {
      if (isResetMode) {
        if (authMethod !== 'email') throw new Error("La réinitialisation n'est disponible que par Email.");
        const { error } = await supabase.auth.resetPasswordForEmail(identifier, { redirectTo: window.location.origin });
        if (error) throw error;
        setSuccessMsg("Lien envoyé ! Vérifiez vos emails."); setLoading(false); return;
      }

      if (isSignUp) {
        // --- INSCRIPTION ---
        let signUpResp;
        const metadata = { full_name: fullName, role: role, site: site };

        if (authMethod === 'email') {
          signUpResp = await supabase.auth.signUp({ email: identifier, password, options: { data: metadata } });
        } else {
          signUpResp = await supabase.auth.signUp({ phone: identifier, password, options: { data: metadata } });
        }

        if (signUpResp.error) throw signUpResp.error;

        // Création explicite du profil
        if (signUpResp.data.user) {
             const { error: profileError } = await supabase.from('profiles').insert([{
                 id: signUpResp.data.user.id,
                 email: authMethod === 'email' ? identifier : '',
                 phone: authMethod === 'phone' ? identifier : '',
                 full_name: fullName,
                 role: role,
                 site: site
             }]);
             if (profileError) console.error("Erreur création profil DB:", profileError);
        }
        
        // --- SUCCÈS INSCRIPTION -> BASCULE VERS CONNEXION ---
        setSuccessMsg("Inscription réussie ! Veuillez vous connecter.");
        setIsSignUp(false); 

      } else {
        // --- CONNEXION ---
        const { data, error: err } = await supabase.auth.signInWithPassword(
            authMethod === 'email' ? { email: identifier, password } : { phone: identifier, password }
        );
        if (err) throw err;
        
        // --- FEEDBACK DE RÔLE ---
        if (data.user) {
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
            if (profile) {
                setSuccessMsg(`Bienvenue ${profile.full_name || 'Utilisateur'}, connexion en tant que ${profile.role}...`);
                // Délai pour laisser l'utilisateur lire le message de connexion
                setTimeout(() => {
                    localStorage.setItem('ebf_has_logged_in', 'true');
                }, 1500);
            } else {
                localStorage.setItem('ebf_has_logged_in', 'true');
            }
        }
      }
    } catch (err: any) {
      setError(err.message || "Erreur d'authentification.");
    } finally {
      if (!successMsg) setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50/50 p-4">
       <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md text-center border-t-4 border-ebf-orange animate-fade-in">
          <div className="flex justify-center mb-6 transform scale-125"><EbfLogo /></div>
          <h2 className="text-2xl font-bold text-green-900 mb-2">{isResetMode ? "Récupération" : (isSignUp ? "Rejoindre l'Équipe" : "Connexion EBF")}</h2>
          
          {error && <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4 text-left">{error}</div>}
          {successMsg && <div className="bg-green-50 text-green-600 p-3 rounded text-sm mb-4 text-left font-bold border border-green-200">{successMsg}</div>}

          {!isResetMode && !successMsg.includes('Bienvenue') && (
            <div className="flex p-1 bg-gray-100 rounded-lg mb-6">
               <button onClick={() => setAuthMethod('email')} className={`flex-1 py-2 rounded text-sm font-bold ${authMethod === 'email' ? 'bg-white text-ebf-green shadow' : 'text-gray-500'}`}>Email</button>
               <button onClick={() => setAuthMethod('phone')} className={`flex-1 py-2 rounded text-sm font-bold ${authMethod === 'phone' ? 'bg-white text-ebf-orange shadow' : 'text-gray-500'}`}>Téléphone</button>
            </div>
          )}

          {!successMsg.includes('Bienvenue') && (
            <div className="space-y-4 text-left">
                {isSignUp && (
                    <>
                    <div>
                        <label className="block text-sm font-bold text-green-900 mb-1">Nom Complet</label>
                        <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full border border-orange-200 p-3 rounded-lg bg-white text-green-900" placeholder="Jean Kouassi" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-sm font-bold text-green-900 mb-1">Rôle</label>
                            <select value={role} onChange={e => setRole(e.target.value as Role)} className="w-full border border-orange-200 p-3 rounded-lg bg-white text-green-900">
                            <option value="Visiteur">Visiteur</option>
                            <option value="Technicien">Technicien</option>
                            <option value="Secretaire">Secretaire</option>
                            <option value="Magasinier">Magasinier</option>
                            <option value="Admin">Admin</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-green-900 mb-1">Site</label>
                            <select value={site} onChange={e => setSite(e.target.value as Site)} className="w-full border border-orange-200 p-3 rounded-lg bg-white text-green-900">
                            <option value="Abidjan">Abidjan</option>
                            <option value="Bouaké">Bouaké</option>
                            </select>
                        </div>
                    </div>
                    </>
                )}

                <div>
                    <label className="block text-sm font-bold text-green-900 mb-1">{authMethod === 'email' ? 'Email' : 'Numéro'}</label>
                    <input value={identifier} onChange={e => setIdentifier(e.target.value)} className="w-full border border-orange-200 p-3 rounded-lg bg-white text-green-900" />
                </div>
                
                {!isResetMode && (
                <div>
                    <label className="block text-sm font-bold text-green-900 mb-1">Mot de passe</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-orange-200 p-3 rounded-lg bg-white text-green-900" />
                    {!isSignUp && <button onClick={() => setIsResetMode(true)} className="text-xs text-orange-600 font-bold mt-1 block text-right">Oublié ?</button>}
                </div>
                )}
                
                <button onClick={handleAuth} disabled={loading} className="w-full bg-ebf-green text-white font-bold py-3 rounded-lg hover:bg-green-800 transition">
                    {loading ? <Loader2 className="animate-spin mx-auto"/> : (isResetMode ? "Envoyer" : (isSignUp ? "S'inscrire" : "Se Connecter"))}
                </button>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-100">
             <button onClick={() => { setIsSignUp(!isSignUp); setIsResetMode(false); }} className="text-sm font-bold text-gray-500 hover:text-green-900">
                {isSignUp ? "J'ai déjà un compte" : "Créer un compte"}
             </button>
          </div>
       </div>
    </div>
  );
};

// --- Module Placeholder (Lists) ---
const ModulePlaceholder = ({ title, subtitle, items, onBack, onAdd, onDelete, color, currentSite, currentPeriod, readOnly }: any) => {
    const COLUMN_LABELS: Record<string, string> = {
        name: 'Nom', quantity: 'Quantité', unit: 'Unité', threshold: 'Seuil', site: 'Site',
        client: 'Client', clientPhone: 'Tél Client', location: 'Lieu', description: 'Description', technician: 'Technicien', date: 'Date', status: 'Statut',
        amount: 'Montant', type: 'Type', label: 'Libellé', category: 'Catégorie', email: 'Email', specialty: 'Spécialité',
        full_name: 'Nom Complet', role: 'Rôle'
    };

    const filteredItems = useMemo(() => {
        return items.filter((item: any) => {
            if (currentSite && currentSite !== Site.GLOBAL && item.site && item.site !== currentSite) return false;
            if (currentPeriod && item.date && !isInPeriod(item.date, currentPeriod)) return false;
            return true;
        });
    }, [items, currentSite, currentPeriod]);

    const columns = filteredItems.length > 0 
        ? Object.keys(filteredItems[0]).filter(k => k !== 'id' && k !== 'technicianId' && k !== 'avatar_url') 
        : []; 

    const renderCell = (col: string, value: any) => {
       if (col === 'status') {
          if (value === 'Pending') return <span className="flex items-center gap-1 text-gray-600 bg-gray-100 px-3 py-1 rounded-full text-xs font-extrabold border border-gray-200"><Calendar size={12}/> Planifié</span>;
          if (value === 'In Progress') return <span className="flex items-center gap-1 text-orange-600 bg-orange-50 px-3 py-1 rounded-full text-xs font-extrabold border border-orange-100"><Loader2 size={12} className="animate-spin"/> En cours</span>;
          if (value === 'Completed') return <span className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-extrabold border border-green-100"><CheckCircle size={12}/> Exécuté</span>;
          return value;
       }
       return value;
    };

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-orange-100 shadow-sm">
                <div>
                    <h2 className={`text-2xl font-bold ${color.replace('bg-', 'text-').replace('600', '700')}`}>{title}</h2>
                    <p className="text-sm text-gray-500">{subtitle}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={onBack} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 font-bold">Retour</button>
                    {!readOnly && onAdd && <button onClick={onAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow hover:bg-blue-700"><Plus size={18}/> Ajouter Nouveau</button>}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-orange-100">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                        <thead className={`bg-opacity-10 ${color}`}>
                            <tr>
                                {columns.length > 0 ? columns.map(col => (
                                    <th key={col} className="p-4 text-left text-xs font-bold uppercase text-green-900">{COLUMN_LABELS[col] || col}</th>
                                )) : <th className="p-4 text-left font-bold text-green-900">Info</th>}
                                {!readOnly && onDelete && <th className="p-4 text-right text-xs font-bold uppercase text-green-900">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredItems.length === 0 ? <tr><td colSpan={columns.length + 1} className="p-8 text-center text-gray-400">Aucune donnée.</td></tr> : 
                                filteredItems.map((item: any, i: number) => (
                                    <tr key={i} className="hover:bg-orange-50/30">
                                        {columns.map(col => (
                                            <td key={col} className="p-4 text-sm text-green-900">{renderCell(col, item[col])}</td>
                                        ))}
                                        {!readOnly && onDelete && (
                                            <td className="p-4 text-right flex justify-end gap-2">
                                                <button onClick={() => onDelete(item)} className="p-1.5 text-red-500 bg-red-50 rounded"><Trash2 size={16}/></button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const ReportModeSelector = ({ reports, onSelectMode, onBack, onViewReport, readOnly }: any) => {
  return (
    <div className="space-y-8 animate-fade-in">
       {!readOnly && (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button onClick={() => onSelectMode('voice')} className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-8 rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition text-left relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-20"><Mic size={100} className="text-white"/></div>
               <div className="relative z-10">
                 <div className="bg-white/20 w-16 h-16 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm"><Mic size={32} className="text-white"/></div>
                 <h3 className="text-2xl font-bold text-white mb-2">Rapport Vocal</h3>
                 <p className="text-indigo-100">Dictez votre rapport simplement.</p>
               </div>
            </button>
            <button onClick={() => onSelectMode('form')} className="bg-gradient-to-br from-orange-500 to-orange-700 p-8 rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition text-left relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-20"><FileText size={100} className="text-white"/></div>
               <div className="relative z-10">
                 <div className="bg-white/20 w-16 h-16 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm"><FileText size={32} className="text-white"/></div>
                 <h3 className="text-2xl font-bold text-white mb-2">Rapport Formulaire</h3>
                 <p className="text-orange-100">Saisie détaillée avec données financières.</p>
               </div>
            </button>
         </div>
       )}

       <div className="bg-white p-6 rounded-xl shadow-md border border-orange-100">
           <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2"><ClipboardList className="text-ebf-green"/> Historique des Derniers Rapports</h3>
           <div className="overflow-x-auto">
             <table className="w-full">
               <thead className="bg-gray-50 border-b border-gray-100">
                 <tr>
                   <th className="p-3 text-left text-xs font-bold uppercase text-gray-500">Date</th>
                   <th className="p-3 text-left text-xs font-bold uppercase text-gray-500">Technicien</th>
                   <th className="p-3 text-left text-xs font-bold uppercase text-gray-500">Type</th>
                   <th className="p-3 text-left text-xs font-bold uppercase text-gray-500">Aperçu</th>
                   <th className="p-3 text-right text-xs font-bold uppercase text-gray-500">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                  {reports.map((r: any) => (
                    <tr key={r.id} className="hover:bg-orange-50/50">
                      <td className="p-3 text-sm font-bold text-gray-700">{r.date}</td>
                      <td className="p-3 text-sm text-gray-700">{r.technicianName}</td>
                      <td className="p-3 text-sm">
                        {r.method === 'Voice' ? <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-bold flex items-center w-fit gap-1"><Mic size={10}/> Vocal</span> : <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold flex items-center w-fit gap-1"><FileText size={10}/> Form</span>}
                      </td>
                      <td className="p-3 text-sm text-gray-600 truncate max-w-xs">{r.content || '...'}</td>
                      <td className="p-3 text-right">
                         <button onClick={() => onViewReport(r)} className="text-ebf-green hover:underline font-bold text-xs bg-green-50 px-3 py-1 rounded border border-green-200">VOIR</button>
                      </td>
                    </tr>
                  ))}
               </tbody>
             </table>
           </div>
       </div>
    </div>
  );
};

const TeamGrid = ({ members, onBack }: { members: Profile[], onBack: () => void }) => {
   const team = members.filter(m => m.role !== 'Visiteur');
   return (
      <div className="space-y-6 animate-fade-in">
         <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-orange-100 shadow-sm">
             <div><h2 className="text-2xl font-bold text-indigo-700">Notre Équipe</h2><p className="text-sm text-gray-500">Membres actifs ({team.length})</p></div>
             <button onClick={onBack} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 font-bold">Retour</button>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {team.map(member => (
               <div key={member.id} className="bg-white p-6 rounded-xl shadow-md border-t-4 border-indigo-500 flex flex-col items-center text-center hover:shadow-lg transition">
                  <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-4 font-bold text-2xl uppercase">{member.full_name ? member.full_name.charAt(0) : '?'}</div>
                  <h3 className="font-bold text-xl text-green-900">{member.full_name || 'Utilisateur'}</h3>
                  <span className="inline-block bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold mt-2 uppercase">{member.role}</span>
                  <div className="mt-4 text-sm text-gray-500 w-full pt-4 border-t border-gray-100"><p className="flex items-center justify-center gap-2"><Mail size={14}/> {member.email}</p><p className="flex items-center justify-center gap-2 mt-1"><MapPin size={14}/> {member.site}</p></div>
               </div>
            ))}
         </div>
      </div>
   );
};

const Sidebar = ({ isOpen, setIsOpen, currentPath, onNavigate }: any) => {
  return (
    <>
      <div className={`fixed inset-0 bg-black/50 z-40 lg:hidden ${isOpen ? 'block' : 'hidden'}`} onClick={() => setIsOpen(false)} />
      <aside className={`fixed top-0 left-0 h-full w-72 bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 z-50 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 border-r border-orange-100`}>
        <div className="h-20 flex items-center justify-center border-b border-orange-100 bg-gradient-to-r from-white to-green-50"><EbfLogo /><button onClick={() => setIsOpen(false)} className="absolute right-4 lg:hidden text-gray-500"><X /></button></div>
        <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100%-5rem)]">
           <div className="mb-4 px-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Menu Principal</div>
           {MAIN_MENU.map(item => {
             const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/');
             return (
               <button key={item.id} onClick={() => { onNavigate(item.path); setIsOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive ? 'bg-gradient-to-r from-ebf-green to-emerald-700 text-white shadow-lg shadow-green-200' : 'text-gray-600 hover:bg-orange-50 hover:text-green-900'}`}>
                 <item.icon className={`${isActive ? 'text-white' : item.colorClass} group-hover:scale-110 transition`} size={20} />
                 <div className="text-left"><span className={`block font-bold ${isActive ? 'text-white' : ''}`}>{item.label}</span><span className={`text-[10px] ${isActive ? 'text-green-100' : 'text-gray-400'}`}>{item.description}</span></div>
                 {isActive && <ChevronRight className="ml-auto text-white" size={16} />}
               </button>
             );
           })}
        </nav>
      </aside>
    </>
  );
};

const ModuleMenu = ({ title, actions, onNavigate }: any) => (
  <div className="animate-fade-in">
    <h2 className="text-2xl font-bold text-green-900 mb-6 flex items-center"><ChevronRight className="text-ebf-orange mr-2"/> Module {title}</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
       {actions.map((action: any) => (
         <button key={action.id} onClick={() => onNavigate(action.path)} className="bg-white p-6 rounded-xl shadow-md border border-orange-100 hover:shadow-xl hover:border-ebf-orange transition group text-left relative overflow-hidden">
           <div className={`absolute top-0 right-0 p-3 rounded-bl-2xl ${action.color} opacity-10 group-hover:opacity-20 transition`}><action.icon size={48} /></div>
           <div className={`w-12 h-12 rounded-lg ${action.color} text-white flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition`}><action.icon size={24} /></div>
           <h3 className="text-lg font-bold text-green-900 mb-1 group-hover:text-ebf-orange transition">{action.label}</h3>
           <p className="text-sm text-gray-500 mb-4">{action.description}</p>
           {action.managedBy && <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-100">{action.managedBy}</span>}
         </button>
       ))}
    </div>
  </div>
);

const DynamicModal = ({ isOpen, onClose, config, onSubmit }: any) => {
  if (!isOpen || !config) return null;
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); const formData = new FormData(e.target as HTMLFormElement); const data: any = {}; formData.forEach((value, key) => data[key] = value); onSubmit(data); };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-green-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-orange-100 bg-gray-50 rounded-t-2xl"><h3 className="text-xl font-bold text-green-900 flex items-center gap-2"><FileText className="text-ebf-orange"/> {config.title}</h3><button onClick={onClose} className="text-gray-400 hover:text-red-500 transition"><X /></button></div>
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar space-y-4">
           {config.fields.map((field: FormField) => (
             <div key={field.name}><label className="block text-sm font-bold text-green-900 mb-1">{field.label}</label>{field.type === 'select' ? (<select name={field.name} className="w-full border border-orange-200 rounded-lg p-3 bg-white text-gray-700 focus:ring-2 focus:ring-ebf-green outline-none transition" required>{field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select>) : (<input type={field.type} name={field.name} placeholder={field.placeholder} className="w-full border border-orange-200 rounded-lg p-3 text-gray-700 focus:ring-2 focus:ring-ebf-green outline-none transition" required />)}</div>
           ))}
           <div className="pt-4 flex gap-3"><button type="button" onClick={onClose} className="flex-1 py-3 border border-gray-300 text-gray-600 font-bold rounded-lg hover:bg-gray-50 transition">Annuler</button><button type="submit" className="flex-1 py-3 bg-ebf-green text-white font-bold rounded-lg hover:bg-green-800 transition shadow-lg shadow-green-200">Enregistrer</button></div>
        </form>
      </div>
    </div>
  );
};

const FlashInfoModal = ({ isOpen, onClose, messages, onUpdate }: any) => {
  const [localMsgs, setLocalMsgs] = useState<TickerMessage[]>([]); const [newMessage, setNewMessage] = useState(''); const [newType, setNewType] = useState<'info'|'alert'|'success'>('info');
  useEffect(() => { if (isOpen) setLocalMsgs(messages); }, [isOpen, messages]);
  const addMsg = () => { if (!newMessage) return; const newM: TickerMessage = { id: Date.now().toString(), text: newMessage, type: newType, display_order: localMsgs.length + 1 }; setLocalMsgs([...localMsgs, newM]); setNewMessage(''); };
  const removeMsg = (id: string) => { setLocalMsgs(localMsgs.filter(m => m.id !== id)); };
  const moveMessage = (index: number, direction: 'up' | 'down') => { const newMsgs = [...localMsgs]; if (direction === 'up' && index > 0) { [newMsgs[index], newMsgs[index-1]] = [newMsgs[index-1], newMsgs[index]]; } else if (direction === 'down' && index < newMsgs.length - 1) { [newMsgs[index], newMsgs[index+1]] = [newMsgs[index+1], newMsgs[index]]; } setLocalMsgs(newMsgs); };
  const handleSave = () => { onUpdate(localMsgs); onClose(); };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-green-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in">
         <div className="p-6 border-b border-orange-100 flex justify-between items-center"><h3 className="text-xl font-bold text-green-900 flex items-center gap-2"><Megaphone className="text-ebf-orange"/> Gestion Flash Info</h3><button onClick={onClose}><X className="text-gray-400 hover:text-red-500"/></button></div>
         <div className="p-6 space-y-4">
            <div className="flex gap-2"><input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Nouveau message..." className="flex-1 border border-orange-200 rounded-lg p-2 text-sm focus:ring-ebf-green outline-none" /><select value={newType} onChange={(e:any) => setNewType(e.target.value)} className="border border-orange-200 rounded-lg p-2 text-sm bg-white"><option value="info">Info</option><option value="success">Succès</option><option value="alert">Alerte</option></select><button onClick={addMsg} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"><Plus size={20}/></button></div>
            <div className="max-h-60 overflow-y-auto space-y-2">
               {localMsgs.map((msg, idx) => (
                  <div key={msg.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                     <div className="flex items-center gap-2 overflow-hidden"><span className="text-xs font-bold text-gray-400">#{idx+1}</span><span className={`w-2 h-2 rounded-full flex-shrink-0 ${msg.type === 'alert' ? 'bg-red-500' : msg.type === 'success' ? 'bg-green-500' : 'bg-blue-400'}`}></span><span className="text-sm truncate text-gray-700">{msg.text}</span></div>
                     <div className="flex gap-1"><button onClick={() => moveMessage(idx, 'up')} className="text-gray-400 hover:text-gray-600"><ArrowUp size={14}/></button><button onClick={() => moveMessage(idx, 'down')} className="text-gray-400 hover:text-gray-600"><ArrowDown size={14}/></button><button onClick={() => removeMsg(msg.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button></div>
                  </div>
               ))}
            </div>
            <button onClick={handleSave} className="w-full bg-ebf-green text-white font-bold py-3 rounded-lg hover:bg-green-800 transition shadow-lg">Enregistrer & Diffuser</button>
         </div>
      </div>
    </div>
  );
};

// --- Header Component (Extracted) ---
const HeaderWithNotif = ({ 
  title, 
  onMenuClick, 
  onLogout, 
  onOpenFlashInfo, 
  notifications, 
  userProfile, 
  userRole, 
  markNotificationAsRead,
  onOpenProfile,
  onOpenHelp,
  darkMode,
  onToggleTheme
}: any) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
    const unreadCount = notifications.filter((n: Notification) => !n.read).length;
    
    // Refs for clicking outside
    const notifRef = useRef<HTMLDivElement>(null);
    const settingsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: any) => {
            if (notifRef.current && !notifRef.current.contains(event.target)) setShowDropdown(false);
            if (settingsRef.current && !settingsRef.current.contains(event.target)) setShowSettingsDropdown(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="bg-white/90 backdrop-blur-md border-b border-orange-100 h-16 flex items-center justify-between px-4 sticky top-0 z-30">
           <div className="flex items-center gap-4">
              <button onClick={onMenuClick} className="lg:hidden p-2"><Menu/></button>
              <h2 className="text-xl font-bold text-green-900 hidden md:block">{title}</h2>
           </div>
           
           <div className="flex items-center gap-3">
               <div className="flex items-center gap-3 border-l pl-4 ml-2 border-orange-200">
                  <div className="hidden md:block text-right">
                     <p className="text-sm font-bold text-green-900">{userProfile?.full_name || 'Utilisateur'}</p>
                     <p className="text-xs text-ebf-orange font-bold uppercase tracking-wider bg-orange-50 px-2 py-0.5 rounded-full inline-block">Mode: {userRole}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ebf-green to-emerald-700 text-white flex items-center justify-center font-bold text-lg shadow-md border-2 border-white">
                      {userProfile?.full_name ? userProfile.full_name.charAt(0) : <User size={20}/>}
                  </div>
               </div>

              {/* Notification Bell */}
              <div className="relative ml-2" ref={notifRef}>
                 <button onClick={() => setShowDropdown(!showDropdown)} className="p-2 relative hover:bg-orange-50 rounded-full transition">
                     <Bell className="text-ebf-green"/>
                     {unreadCount > 0 && <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{unreadCount}</span>}
                 </button>
                 
                 {showDropdown && (
                     <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-orange-100 overflow-hidden animate-fade-in z-50">
                         <div className="p-3 border-b border-orange-50 bg-gray-50 flex justify-between items-center">
                             <h3 className="font-bold text-green-900 text-sm">Notifications</h3>
                             <span className="text-xs text-gray-500">{unreadCount} non lues</span>
                         </div>
                         <div className="max-h-80 overflow-y-auto custom-scrollbar">
                             {notifications.length === 0 ? (
                                 <div className="p-4 text-center text-gray-400 text-sm">Aucune notification</div>
                             ) : (
                                 notifications.map((notif: Notification) => (
                                     <div 
                                         key={notif.id} 
                                         onClick={() => { markNotificationAsRead(notif); setShowDropdown(false); }}
                                         className={`p-3 border-b border-gray-50 hover:bg-orange-50 cursor-pointer transition ${!notif.read ? 'bg-orange-50/30' : ''}`}
                                     >
                                         <div className="flex items-start gap-3">
                                             <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${notif.type === 'alert' ? 'bg-red-500' : notif.type === 'success' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                                             <div>
                                                 <p className={`text-sm ${!notif.read ? 'font-bold text-green-900' : 'text-gray-600'}`}>{notif.title}</p>
                                                 <p className="text-xs text-gray-500 line-clamp-2">{notif.message}</p>
                                                 <p className="text-[10px] text-gray-400 mt-1">{new Date(notif.created_at).toLocaleDateString()}</p>
                                             </div>
                                         </div>
                                     </div>
                                 ))
                             )}
                         </div>
                     </div>
                 )}
              </div>

              {/* Flash Info Button */}
              <button onClick={onOpenFlashInfo} className="p-2 hover:bg-orange-50 rounded-full transition"><Megaphone className="text-ebf-orange"/></button>

              {/* Settings Dropdown */}
              <div className="relative" ref={settingsRef}>
                 <button onClick={() => setShowSettingsDropdown(!showSettingsDropdown)} className="p-2 hover:bg-gray-100 rounded-full transition">
                    <Settings className="text-gray-600" />
                 </button>
                 {showSettingsDropdown && (
                   <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-orange-100 dark:border-gray-700 overflow-hidden animate-fade-in z-50">
                      <div className="p-2 space-y-1">
                         <button onClick={() => { onOpenProfile(); setShowSettingsDropdown(false); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-orange-50 dark:hover:bg-gray-700 text-sm font-bold text-green-900 dark:text-gray-200">
                            <User size={16} className="text-ebf-green"/> Mon Profil
                         </button>
                         <button onClick={onToggleTheme} className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-orange-50 dark:hover:bg-gray-700 text-sm font-bold text-green-900 dark:text-gray-200">
                            <div className="flex items-center gap-3"><Moon size={16} className="text-indigo-500"/> Mode Sombre</div>
                            <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${darkMode ? 'bg-indigo-500' : 'bg-gray-300'}`}>
                               <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${darkMode ? 'translate-x-4' : 'translate-x-0'}`}></div>
                            </div>
                         </button>
                         <button onClick={() => { onOpenHelp(); setShowSettingsDropdown(false); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-orange-50 dark:hover:bg-gray-700 text-sm font-bold text-green-900 dark:text-gray-200">
                            <HelpCircle size={16} className="text-blue-500"/> Aide & Support
                         </button>
                         <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                         <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 text-sm font-bold text-red-600">
                            <LogOut size={16}/> Se déconnecter
                         </button>
                      </div>
                   </div>
                 )}
              </div>
           </div>
        </header>
    )
};

// --- App Content with Role Management ---
const AppContent = ({ session, onLogout, userRole, userProfile }: { session: any, onLogout: () => void, userRole: Role, userProfile: Profile | null }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState('/');
  const [currentSite, setCurrentSite] = useState<Site>(Site.GLOBAL);
  const [currentPeriod, setCurrentPeriod] = useState<Period>(Period.MONTH);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<FormConfig | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [isFlashInfoOpen, setIsFlashInfoOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  // Settings Modals State
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Data
  const [loadingData, setLoadingData] = useState(false);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]); 
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tickerMessages, setTickerMessages] = useState<TickerMessage[]>([]);
  const [dashboardStats, setDashboardStats] = useState<StatData[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const [deleteModalConfig, setDeleteModalConfig] = useState<{isOpen: boolean, itemId: string | null, type: string | null}>({ isOpen: false, itemId: null, type: null });
  const [reportMode, setReportMode] = useState<'select' | 'voice' | 'form'>('select');
  const [viewReport, setViewReport] = useState<any | null>(null);

  // --- PERMISSION CHECKER ---
  const canUserWrite = (role: Role, path: string): boolean => {
      if (role === 'Admin') return true;
      if (role === 'Visiteur') return false;
      
      // Technicien: Edit only techniciens modules
      if (role === 'Technicien' && path.startsWith('/techniciens')) return true;
      
      // Secretaire: Edit only secretariat modules
      if (role === 'Secretaire' && path.startsWith('/secretariat')) return true;
      
      // Magasinier: Edit only quincaillerie and materiel
      if (role === 'Magasinier' && (path.startsWith('/quincaillerie') || path.includes('/techniciens/materiel'))) return true;
      
      return false;
  };
  
  // Determine if current view is Read-Only based on Role
  const isReadOnly = useMemo(() => !canUserWrite(userRole, currentPath), [userRole, currentPath]);

  // --- FORM CONFIG ---
  const technicianOptions = useMemo(() => profiles.filter(p => p.role === 'Technicien').map(p => p.full_name), [profiles]);
  const formConfigs = useMemo<Record<string, FormConfig>>(() => ({
      '/techniciens/interventions': {
        title: 'Nouvelle Intervention',
        fields: [
          { name: 'site', label: 'Site', type: 'select', options: ['Abidjan', 'Bouaké'] },
          { name: 'client', label: 'Nom du Client', type: 'text', placeholder: 'Ex: Hôtel Ivoire' },
          { name: 'clientPhone', label: 'Numéro du Client', type: 'text', placeholder: 'Ex: 0707...' },
          { name: 'lieu', label: 'Lieu d\'intervention', type: 'text', placeholder: 'Ex: Cocody Riviera' },
          { name: 'description', label: 'Description', type: 'text', placeholder: 'Ex: Panne Clim R410' },
          { name: 'technician', label: 'Technicien', type: 'select', options: technicianOptions }, 
          { name: 'date', label: 'Date Prévue', type: 'date' },
          { name: 'status', label: 'Statut Initial', type: 'select', options: ['Pending', 'In Progress', 'Completed'] }
        ]
      },
      '/quincaillerie/stocks': {
        title: 'Article Stock',
        fields: [{ name: 'name', label: 'Nom Article', type: 'text' }, { name: 'quantity', label: 'Quantité Initiale', type: 'number' }, { name: 'unit', label: 'Unité', type: 'text', placeholder: 'm, kg, pcs...' }, { name: 'threshold', label: 'Seuil Alerte', type: 'number' }, { name: 'site', label: 'Site', type: 'select', options: ['Abidjan', 'Bouaké'] }]
      },
      '/comptabilite/bilan': {
        title: 'Nouvelle Transaction',
        fields: [{ name: 'type', label: 'Type', type: 'select', options: ['Recette', 'Dépense'] }, { name: 'amount', label: 'Montant (FCFA)', type: 'number' }, { name: 'label', label: 'Libellé', type: 'text' }, { name: 'category', label: 'Catégorie', type: 'select', options: ['Facture Client', 'Achat Matériel', 'Salaire', 'Transport', 'Autre'] }, { name: 'date', label: 'Date', type: 'date' }, { name: 'site', label: 'Site', type: 'select', options: ['Abidjan', 'Bouaké'] }]
      }
  }), [technicianOptions]);

  // --- FETCH DATA ---
  const fetchData = async () => {
    setLoadingData(true);
    try {
      const { data: inters } = await supabase.from('interventions').select('*').order('scheduled_date', { ascending: false });
      if (inters) setInterventions(inters.map(i => ({ id: i.id, site: i.site, client: i.client_name, clientPhone: i.client_phone, location: i.location, description: i.description, technicianId: i.technician_id, technician: 'Technicien', date: i.scheduled_date, status: i.status })));
      const { data: stocks } = await supabase.from('stocks').select('*'); if (stocks) setStock(stocks);
      const { data: reps } = await supabase.from('daily_reports').select('*').order('date', { ascending: false }); if (reps) setReports(reps.map(r => ({ id: r.id, technicianName: 'Technicien', date: r.date, method: r.method, site: r.site, content: r.content, audioUrl: r.audio_url, domain: r.domain, interventionType: r.intervention_type, location: r.location, expenses: r.expenses, revenue: r.revenue, clientName: r.client_name, clientPhone: r.client_phone })));
      const { data: msgs } = await supabase.from('ticker_messages').select('*').order('display_order', { ascending: true }); if (msgs) setTickerMessages(msgs);
      const { data: profs } = await supabase.from('profiles').select('*'); if (profs) setProfiles(profs);
      const { data: trans } = await supabase.from('transactions').select('*').order('date', { ascending: false }); if (trans) setTransactions(trans);
      const { data: notifs } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }); if (notifs) setNotifications(notifs);
    } catch (err) { console.error(err); } 
    finally { setLoadingData(false); }
  };
  
  useEffect(() => { fetchData(); const channels = supabase.channel('public:db-changes').on('postgres_changes', { event: '*', schema: 'public' }, () => fetchData()).subscribe(); return () => { supabase.removeChannel(channels); }; }, []);
  
  useEffect(() => {
    const statsMap = new Map<string, StatData>();
    reports.forEach(r => { if (!r.date) return; if (!statsMap.has(r.date)) statsMap.set(r.date, { date: r.date, site: r.site as Site, revenue: 0, expenses: 0, profit: 0, interventions: 0 }); const s = statsMap.get(r.date)!; const rev = Number(r.revenue || 0); const exp = Number(r.expenses || 0); s.revenue += rev; s.expenses += exp; s.profit += (rev - exp); s.interventions += 1; });
    transactions.forEach(t => { if (!t.date) return; if (!statsMap.has(t.date)) statsMap.set(t.date, { date: t.date, site: t.site as Site, revenue: 0, expenses: 0, profit: 0, interventions: 0 }); const s = statsMap.get(t.date)!; if (t.type === 'Recette') { s.revenue += Number(t.amount); s.profit += Number(t.amount); } else { s.expenses += Number(t.amount); s.profit -= Number(t.amount); } });
    setDashboardStats(Array.from(statsMap.values()).sort((a, b) => a.date.localeCompare(b.date)));
  }, [reports, transactions]);

  // --- NOTIFICATION HELPERS ---
  const createNotification = async (title: string, message: string, type: 'info' | 'success' | 'alert', path: string) => {
      await supabase.from('notifications').insert([{ title, message, type, path, read: false }]);
  };

  const markNotificationAsRead = async (notif: Notification) => {
      await supabase.from('notifications').update({ read: true }).eq('id', notif.id);
      if (notif.path) navigate(notif.path);
  };

  // --- HANDLERS ---
  const handleTickerUpdate = async (msgs: TickerMessage[]) => {
    const currentIds = tickerMessages.map(m => m.id); const newIds = msgs.map(m => m.id); const toDelete = currentIds.filter(id => !newIds.includes(id));
    for (const id of toDelete) await supabase.from('ticker_messages').delete().eq('id', id);
    for (let i = 0; i < msgs.length; i++) { const msg = msgs[i]; const payload: any = { text: msg.text, type: msg.type, display_order: i }; if (msg.id.length > 15) payload.id = msg.id; await supabase.from('ticker_messages').upsert(payload); }
    fetchData();
  };

  const navigate = (path: string) => { setCurrentPath(path); setReportMode('select'); };
  
  const handleFormSubmit = async (data: any) => {
    setIsModalOpen(false);
    try {
      if (currentPath.includes('interventions')) { 
          const techProfile = profiles.find(p => p.full_name === data.technician); 
          await supabase.from('interventions').insert([{ site: data.site, client_name: data.client, client_phone: data.clientPhone, location: data.lieu, description: data.description, scheduled_date: data.date, status: data.status, technician_id: techProfile?.id }]); 
          // TRIGGER NOTIFICATION
          await createNotification('Nouvelle Intervention', `Nouvelle intervention créée pour ${data.client} à ${data.lieu}`, 'info', '/techniciens/interventions');
      } 
      // Add other module inserts here
      setShowToast(true); setTimeout(() => setShowToast(false), 3000); fetchData();
    } catch (e) { console.error("Insert error", e); }
  };

  const renderContent = () => {
    if (loadingData && currentPath !== '/') return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-ebf-green" size={48}/></div>;
    if (currentPath === '/') return <Dashboard data={dashboardStats} tickerMessages={tickerMessages} currentSite={currentSite} currentPeriod={currentPeriod} onSiteChange={setCurrentSite} onPeriodChange={setCurrentPeriod} onNavigate={navigate} />;
    if (currentPath === '/equipe') return <TeamGrid members={profiles} onBack={() => navigate('/')} />;
    const moduleName = currentPath.split('/')[1];
    if (currentPath === `/${moduleName}` && MODULE_ACTIONS[moduleName]) return <ModuleMenu title={MAIN_MENU.find(m => m.id === moduleName)?.label} actions={MODULE_ACTIONS[moduleName]} onNavigate={navigate} />;
    
    // Lists & Forms with Permissions
    if (currentPath === '/techniciens/rapports') { if (reportMode === 'select') return <ReportModeSelector reports={reports} onSelectMode={setReportMode} onBack={() => setCurrentPath('/techniciens')} onViewReport={setViewReport} readOnly={isReadOnly} />; }
    
    let items: any[] = []; let title = 'Liste'; let color = 'bg-gray-500';
    if (currentPath === '/techniciens/interventions') { items = interventions; title = 'Interventions'; color = 'bg-orange-500'; }
    else if (currentPath === '/quincaillerie/stocks') { items = stock; title = 'Stocks'; color = 'bg-blue-500'; }
    
    return <ModulePlaceholder title={title} items={items} onBack={() => navigate(`/${moduleName}`)} onAdd={!isReadOnly ? () => { setModalConfig(formConfigs[currentPath]); setIsModalOpen(true); } : undefined} onDelete={!isReadOnly ? (item: any) => setDeleteModalConfig({isOpen:true, itemId:item.id, type: '...'}) : undefined} color={color} currentSite={currentSite} currentPeriod={currentPeriod} readOnly={isReadOnly} />;
  };

  return (
     <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900 text-white' : 'bg-gradient-to-br from-orange-50 via-white to-green-50'}`}>
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} currentPath={currentPath} onNavigate={navigate} />
        <div className="lg:ml-72 min-h-screen flex flex-col transition-all duration-300">
           <HeaderWithNotif 
              title="EBF Manager" 
              onMenuClick={() => setSidebarOpen(true)} 
              onLogout={onLogout} 
              onOpenFlashInfo={() => setIsFlashInfoOpen(true)}
              notifications={notifications}
              userProfile={userProfile}
              userRole={userRole}
              markNotificationAsRead={markNotificationAsRead}
              onOpenProfile={() => setIsProfileOpen(true)}
              onOpenHelp={() => setIsHelpOpen(true)}
              darkMode={darkMode}
              onToggleTheme={() => setDarkMode(!darkMode)}
           />
           <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">{renderContent()}</main>
        </div>
        <DynamicModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} config={modalConfig} onSubmit={handleFormSubmit} />
        <FlashInfoModal isOpen={isFlashInfoOpen} onClose={() => setIsFlashInfoOpen(false)} messages={tickerMessages} onUpdate={handleTickerUpdate} />
        <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} profile={userProfile} />
        <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
     </div>
  );
};

// --- App Wrapper ---
function App() {
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<Role>('Visiteur');
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [isPasswordResetOpen, setIsPasswordResetOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        if (session) fetchUserProfile(session.user.id);
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
            setIsPasswordResetOpen(true);
        }
        setSession(session);
        if (session) fetchUserProfile(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (data) {
          setUserRole(data.role);
          setUserProfile(data);
      } else {
          console.error("Profile fetch error", error);
      }
  };

  if (!session) return <LoginScreen onLogin={() => {}} />;

  return (
    <>
      <AppContent session={session} onLogout={() => supabase.auth.signOut()} userRole={userRole} userProfile={userProfile} />
      <PasswordUpdateModal isOpen={isPasswordResetOpen} onClose={() => setIsPasswordResetOpen(false)} />
    </>
  );
}

export default App;