import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  LayoutDashboard, Wrench, Briefcase, ShoppingCart, Menu, X, Bell, Search, Settings,
  HardHat, DollarSign, LogOut, Calculator, Users, Calendar, FolderOpen, Truck, 
  FileText, UserCheck, CreditCard, Archive, ShieldCheck, ClipboardList, ArrowLeft, ChevronRight, Mic, Send, Save, Plus, CheckCircle, Trash2, User, HelpCircle, Moon, Play, StopCircle, RefreshCw, FileInput, MapPin, Volume2, Megaphone, AlertCircle, Filter, TrendingUp, Edit, ArrowUp, ArrowDown, AlertTriangle, Loader2, Mail, Lock, UserPlus, ScanFace, Fingerprint, Phone, CheckSquare, Key, Shield
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { DetailedSynthesis } from './components/DetailedSynthesis';
import { Site, Period, TickerMessage, StatData, DailyReport, Intervention, StockItem, Transaction, Profile, Role, Notification, Technician } from './types';
import { supabase } from './services/supabaseClient';
import { MOCK_STATS, MOCK_TECHNICIANS, MOCK_STOCK, MOCK_INTERVENTIONS, MOCK_REPORTS, DEFAULT_TICKER_MESSAGES } from './constants';

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

// --- Admin Panel Modal ---
const AdminPanelModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) fetchUsers();
  }, [isOpen]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('full_name');
    if (data) setUsers(data);
    setLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: Role) => {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    if (!error) {
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } else {
      alert("Erreur lors de la mise à jour du rôle.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-green-900/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-xl w-full max-w-2xl p-6 shadow-2xl animate-fade-in flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-green-900 dark:text-white flex items-center gap-2">
            <Shield className="text-ebf-orange" /> Administration & Droits
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500"><X /></button>
        </div>
        
        <div className="overflow-y-auto custom-scrollbar flex-1">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
              <tr>
                <th className="p-3 text-left text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Utilisateur</th>
                <th className="p-3 text-left text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Email / Tél</th>
                <th className="p-3 text-left text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Rôle (Accès)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan={3} className="p-4 text-center"><Loader2 className="animate-spin mx-auto text-ebf-green"/></td></tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className="hover:bg-orange-50 dark:hover:bg-gray-800">
                    <td className="p-3">
                      <div className="font-bold text-green-900 dark:text-white">{user.full_name || 'Sans nom'}</div>
                      <div className="text-xs text-gray-400">{user.site}</div>
                    </td>
                    <td className="p-3 text-sm text-gray-600 dark:text-gray-300">{user.email || user.phone}</td>
                    <td className="p-3">
                      <select 
                        value={user.role} 
                        onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                        className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-sm font-bold text-green-900 dark:text-white focus:border-ebf-orange outline-none"
                      >
                        <option value="Visiteur">Visiteur (Lecture Seule)</option>
                        <option value="Technicien">Technicien</option>
                        <option value="Secretaire">Secretaire</option>
                        <option value="Magasinier">Magasinier</option>
                        <option value="Admin">Administrateur</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400">
          * Les modifications de rôle sont immédiates mais peuvent nécessiter une reconnexion de l'utilisateur concerné.
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

// --- Flash Info Modal ---
const FlashInfoModal = ({ isOpen, onClose, onSave }: any) => {
    const [text, setText] = useState('');
    const [type, setType] = useState<'info'|'alert'|'success'>('info');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-green-900/60 backdrop-blur-sm" onClick={onClose}/>
            <div className="relative bg-white rounded-xl w-full max-w-sm p-6 shadow-2xl animate-fade-in">
                <h3 className="text-xl font-bold text-green-900 mb-4">Nouveau Flash Info</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700">Message</label>
                        <input value={text} onChange={e => setText(e.target.value)} className="w-full border border-orange-200 p-2 rounded" placeholder="Message court..." maxLength={60} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700">Type</label>
                        <select value={type} onChange={e => setType(e.target.value as any)} className="w-full border border-orange-200 p-2 rounded">
                            <option value="info">Info (Bleu)</option>
                            <option value="success">Succès (Vert)</option>
                            <option value="alert">Alerte (Rouge)</option>
                        </select>
                    </div>
                    <button onClick={() => { onSave({ id: Date.now().toString(), text, type, display_order: 1, isManual: true }); setText(''); }} className="w-full bg-ebf-green text-white font-bold py-2 rounded">Publier</button>
                </div>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400"><X/></button>
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

// --- Login & Register Screen ---
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

        // Création explicite du profil avec upsert pour éviter les doublons/erreurs
        if (signUpResp.data.user) {
             const { error: profileError } = await supabase.from('profiles').upsert([{
                 id: signUpResp.data.user.id,
                 email: authMethod === 'email' ? identifier : '',
                 phone: authMethod === 'phone' ? identifier : '',
                 full_name: fullName,
                 role: role, // FORCE LE ROLE CHOISI
                 site: site
             }]);
             if (profileError) console.error("Erreur création profil DB:", profileError);
        }
        
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
            // Tentative immédiate de récupération du profil
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
            const roleToShow = profile ? profile.role : (data.user.user_metadata.role || 'Inconnu');
            const nameToShow = profile ? profile.full_name : (data.user.user_metadata.full_name || 'Utilisateur');

            setSuccessMsg(`Bienvenue ${nameToShow}, connexion en tant que ${roleToShow}...`);
            setTimeout(() => {
                localStorage.setItem('ebf_has_logged_in', 'true');
            }, 1500);
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

// --- Module Menu Component (MISSING FIX) ---
const ModuleMenu = ({ title, actions, onNavigate }: any) => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center space-x-4 mb-2">
         <button onClick={() => onNavigate('/')} className="p-2 bg-orange-50 border border-orange-100 rounded-full shadow hover:bg-orange-100 transition"><ArrowLeft className="text-ebf-orange"/></button>
         <h2 className="text-2xl font-bold text-green-900 dark:text-white">{title}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {actions.map((action: any) => (
          <button
            key={action.id}
            onClick={() => onNavigate(action.path)}
            className={`p-6 rounded-xl shadow-md hover:shadow-xl transition transform hover:-translate-y-1 text-left group relative overflow-hidden ${action.color} text-white`}
          >
            <div className="absolute top-0 right-0 p-4 opacity-20 transform group-hover:scale-125 transition">
              <action.icon size={80} />
            </div>
            <div className="relative z-10">
              <div className="bg-white/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4 backdrop-blur-sm">
                <action.icon size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-bold mb-1">{action.label}</h3>
              <p className="text-sm opacity-90">{action.description}</p>
              {action.managedBy && (
                <span className="inline-block mt-3 text-[10px] font-bold uppercase tracking-wider bg-black/20 px-2 py-1 rounded">
                  {action.managedBy}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
);

// --- Dynamic Modal Component (MISSING FIX) ---
const DynamicModal = ({ isOpen, onClose, config, onSubmit }: any) => {
    const [formData, setFormData] = useState<any>({});

    if (!isOpen || !config) return null;

    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-green-900/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-6 shadow-2xl animate-fade-in">
          <h3 className="text-xl font-bold text-green-900 dark:text-white mb-4">{config.title}</h3>
          <div className="space-y-4">
            {config.fields.map((field: any) => (
              <div key={field.name}>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{field.label}</label>
                {field.type === 'select' ? (
                  <select
                    className="w-full border border-orange-200 p-2 rounded bg-white text-green-900"
                    onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
                  >
                    {field.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    className="w-full border border-orange-200 p-2 rounded bg-white text-green-900"
                    placeholder={field.placeholder}
                    onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
                  />
                )}
              </div>
            ))}
            <button onClick={() => { onSubmit(formData); onClose(); }} className="w-full bg-ebf-green text-white font-bold py-2 rounded hover:bg-green-800 transition">
              Enregistrer
            </button>
          </div>
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400"><X /></button>
        </div>
      </div>
    );
};

const ReportModeSelector = ({ reports, onSelectMode, onBack, onViewReport, readOnly }: any) => {
  return (
    <div className="space-y-8 animate-fade-in">
       <div className="flex items-center space-x-4 mb-2">
         <button onClick={onBack} className="p-2 bg-orange-50 border border-orange-100 rounded-full shadow hover:bg-orange-100 transition"><ArrowLeft className="text-ebf-orange"/></button>
         <h2 className="text-2xl font-bold text-green-900 dark:text-white">Rapports Journaliers</h2>
       </div>

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

// --- Header Component ---
const HeaderWithNotif = ({ 
  title, 
  onMenuClick, 
  onLogout, 
  onOpenFlashInfo, 
  onOpenAdmin,
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

              {/* Settings Dropdown */}
              <div className="relative" ref={settingsRef}>
                 <button onClick={() => setShowSettingsDropdown(!showSettingsDropdown)} className="p-2 hover:bg-gray-100 rounded-full transition">
                    <Settings className="text-gray-600" />
                 </button>
                 {showSettingsDropdown && (
                   <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-orange-100 dark:border-gray-700 overflow-hidden animate-fade-in z-50">
                      <div className="p-2 space-y-1">
                         <button onClick={() => { onOpenProfile(); setShowSettingsDropdown(false); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-orange-50 dark:hover:bg-gray-700 text-sm font-bold text-green-900 dark:text-gray-200">
                            <User size={16} className="text-ebf-green"/> Mon Profil
                         </button>
                         <button onClick={() => { onOpenFlashInfo(); setShowSettingsDropdown(false); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-orange-50 dark:hover:bg-gray-700 text-sm font-bold text-green-900 dark:text-gray-200">
                            <Megaphone size={16} className="text-ebf-orange"/> Configurer Flash Info
                         </button>
                         {userRole === 'Admin' && (
                           <button onClick={() => { onOpenAdmin(); setShowSettingsDropdown(false); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-gray-700 text-sm font-bold text-red-600 dark:text-red-400">
                              <Shield size={16} /> Administration
                           </button>
                         )}
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

const AppContent = ({ session, onLogout, userRole, userProfile }: any) => {
  const [currentPath, setCurrentPath] = useState('/');
  const [currentSite, setCurrentSite] = useState<Site>(Site.GLOBAL);
  const [currentPeriod, setCurrentPeriod] = useState<Period>(Period.DAY);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Modals state
  const [isFlashInfoOpen, setIsFlashInfoOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [viewReport, setViewReport] = useState<DailyReport | null>(null);
  
  // Create / Edit / Delete Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<FormConfig | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [deleteModalConfig, setDeleteModalConfig] = useState<{isOpen: boolean, itemId: string | null, type: string | null}>({ isOpen: false, itemId: null, type: null });

  // Data state
  const [stats, setStats] = useState(MOCK_STATS);
  const [reports, setReports] = useState(MOCK_REPORTS);
  const [tickerMessages, setTickerMessages] = useState(DEFAULT_TICKER_MESSAGES);
  const [stock, setStock] = useState(MOCK_STOCK);
  const [interventions, setInterventions] = useState(MOCK_INTERVENTIONS);
  const [technicians, setTechnicians] = useState(MOCK_TECHNICIANS);
  const [notifications, setNotifications] = useState<Notification[]>([]); // Empty for now
  
  const [reportMode, setReportMode] = useState<'select' | 'voice' | 'form'>('select');

  // --- PERMISSION CHECKER ---
  const canUserWrite = (role: Role, path: string): boolean => {
      // TEMPORAIRE : LEVÉE DE TOUTES LES RESTRICTIONS POUR TEST
      return true;
  };
  
  const isReadOnly = useMemo(() => !canUserWrite(userRole, currentPath), [userRole, currentPath]);

  // Handlers
  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    setSidebarOpen(false); // Close mobile sidebar on nav
  };

  const handleDeleteReport = (id: string) => {
     setReports(reports.filter(r => r.id !== id));
  };

  const handleFlashInfoSave = (msg: TickerMessage) => {
     setTickerMessages([...tickerMessages, msg]);
     setIsFlashInfoOpen(false);
  };
  
  const handleDeleteItem = () => {
    if (deleteModalConfig.type === 'Intervention') {
      setInterventions(interventions.filter(i => i.id !== deleteModalConfig.itemId));
    } else if (deleteModalConfig.type === 'Stock') {
      setStock(stock.filter(s => s.id !== deleteModalConfig.itemId));
    }
    setDeleteModalConfig({isOpen: false, itemId: null, type: null});
  };

  // Render logic based on path
  const renderContent = () => {
    if (currentPath === '/') {
      return (
        <Dashboard 
          data={stats} 
          reports={reports} 
          tickerMessages={tickerMessages} 
          stock={stock}
          currentSite={currentSite} 
          currentPeriod={currentPeriod} 
          onSiteChange={setCurrentSite} 
          onPeriodChange={setCurrentPeriod} 
          onNavigate={handleNavigate}
          onDeleteReport={handleDeleteReport}
        />
      );
    }
    if (currentPath === '/synthesis') {
      return (
        <DetailedSynthesis 
          data={stats} 
          reports={reports} 
          currentSite={currentSite} 
          currentPeriod={currentPeriod} 
          onSiteChange={setCurrentSite} 
          onPeriodChange={setCurrentPeriod} 
          onNavigate={handleNavigate}
          onViewReport={setViewReport}
        />
      );
    }
    if (currentPath === '/techniciens') {
        return <ModulePlaceholder title="Techniciens" subtitle="Gestion des techniciens" items={technicians} onBack={() => handleNavigate('/')} color="bg-orange-600" currentSite={currentSite} />;
    }
    if (currentPath === '/equipe') {
        return <TeamGrid members={userProfile ? [userProfile] : []} onBack={() => handleNavigate('/')} />;
    }
    
    const moduleName = currentPath.split('/')[1];
    if (currentPath === `/${moduleName}` && MODULE_ACTIONS[moduleName]) return <ModuleMenu title={MAIN_MENU.find(m => m.id === moduleName)?.label} actions={MODULE_ACTIONS[moduleName]} onNavigate={handleNavigate} />;
    
    // Lists & Forms with Permissions
    if (currentPath === '/techniciens/rapports') { if (reportMode === 'select') return <ReportModeSelector reports={reports} onSelectMode={setReportMode} onBack={() => setCurrentPath('/techniciens')} onViewReport={setViewReport} readOnly={isReadOnly} />; }
    
    let items: any[] = []; let title = 'Liste'; let color = 'bg-gray-500'; let type = '';
    if (currentPath === '/techniciens/interventions') { items = interventions; title = 'Interventions'; color = 'bg-orange-500'; type = 'Intervention'; }
    else if (currentPath === '/quincaillerie/stocks') { items = stock; title = 'Stocks'; color = 'bg-blue-500'; type = 'Stock'; }
    
    return <ModulePlaceholder title={title} items={items} onBack={() => handleNavigate(`/${moduleName}`)} onAdd={!isReadOnly ? () => { setIsModalOpen(true); } : undefined} onDelete={!isReadOnly ? (item: any) => setDeleteModalConfig({isOpen:true, itemId:item.id, type: type}) : undefined} color={color} currentSite={currentSite} currentPeriod={currentPeriod} readOnly={isReadOnly} />;
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''} bg-gray-50 dark:bg-gray-900 flex transition-colors duration-300`}>
       {/* Sidebar Desktop */}
       <aside className="hidden lg:flex w-64 flex-col bg-green-900 text-white fixed h-full z-20 shadow-xl">
          <div className="p-6 flex items-center justify-center border-b border-green-800">
             <EbfLogo />
          </div>
          <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
             {MAIN_MENU.map(item => (
                <button 
                  key={item.id} 
                  onClick={() => handleNavigate(item.path)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${currentPath === item.path ? 'bg-white text-green-900 shadow-lg font-bold' : 'text-green-100 hover:bg-green-800'}`}
                >
                   <item.icon size={20} className={currentPath === item.path ? 'text-ebf-orange' : 'text-green-300 group-hover:text-white'} />
                   <span>{item.label}</span>
                </button>
             ))}
          </nav>
          <div className="p-4 border-t border-green-800 bg-green-950">
             <div className="text-xs text-green-400 text-center">© 2024 EBF Manager v1.0</div>
          </div>
       </aside>

       {/* Mobile Sidebar Overlay */}
       {sidebarOpen && (
         <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-green-900/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-3/4 max-w-xs bg-green-900 text-white shadow-2xl animate-slide-in">
               <div className="p-4 flex justify-between items-center border-b border-green-800">
                  <EbfLogo />
                  <button onClick={() => setSidebarOpen(false)}><X/></button>
               </div>
               <nav className="p-4 space-y-2">
                 {MAIN_MENU.map(item => (
                    <button 
                      key={item.id} 
                      onClick={() => handleNavigate(item.path)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl ${currentPath === item.path ? 'bg-white text-green-900 font-bold' : 'text-green-100'}`}
                    >
                       <item.icon size={20} className={currentPath === item.path ? 'text-ebf-orange' : ''} />
                       <span>{item.label}</span>
                    </button>
                 ))}
               </nav>
            </div>
         </div>
       )}

       {/* Main Content */}
       <div className="flex-1 flex flex-col lg:ml-64 min-h-screen relative">
          <HeaderWithNotif 
             title={MAIN_MENU.find(m => m.path === currentPath)?.label || 'EBF Manager'}
             onMenuClick={() => setSidebarOpen(true)}
             onLogout={onLogout}
             onOpenFlashInfo={() => setIsFlashInfoOpen(true)}
             onOpenAdmin={() => setIsAdminOpen(true)}
             onOpenProfile={() => setIsProfileOpen(true)}
             onOpenHelp={() => setIsHelpOpen(true)}
             notifications={notifications}
             userProfile={userProfile}
             userRole={userRole}
             markNotificationAsRead={() => {}}
             darkMode={darkMode}
             onToggleTheme={() => setDarkMode(!darkMode)}
          />
          
          <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
             {renderContent()}
          </main>
       </div>

       {/* Modals */}
       <DynamicModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} config={modalConfig} onSubmit={() => {}} />
       <FlashInfoModal isOpen={isFlashInfoOpen} onClose={() => setIsFlashInfoOpen(false)} onSave={handleFlashInfoSave} />
       <AdminPanelModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
       <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} profile={userProfile} />
       <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
       
       <ConfirmationModal 
          isOpen={deleteModalConfig.isOpen}
          onClose={() => setDeleteModalConfig({...deleteModalConfig, isOpen: false})}
          onConfirm={handleDeleteItem}
          title="Suppression"
          message="Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible."
       />

       {/* Report Detail Modal (Read Only) */}
        {viewReport && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-green-900/60 backdrop-blur-sm" onClick={() => setViewReport(null)} />
                <div className="relative bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg p-6 shadow-2xl animate-fade-in border-t-4 border-ebf-orange">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-green-900 dark:text-white flex items-center gap-2">
                            <FileText size={20} className="text-ebf-orange"/> Rapport Détail
                        </h3>
                        <button onClick={() => setViewReport(null)} className="text-gray-400 hover:text-red-500"><X/></button>
                    </div>
                    <div className="space-y-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Technicien</span>
                                <p className="font-bold text-green-900 dark:text-white">{viewReport.technicianName}</p>
                            </div>
                            <div>
                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Date</span>
                                <p className="font-bold text-green-900 dark:text-white">{viewReport.date}</p>
                            </div>
                        </div>
                        <div>
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Contenu</span>
                            <p className="text-sm text-gray-800 dark:text-gray-300 whitespace-pre-line mt-1">{viewReport.content}</p>
                        </div>
                        {viewReport.method === 'Form' && (
                             <div className="grid grid-cols-2 gap-4 border-t border-gray-200 dark:border-gray-600 pt-3">
                                <div><span className="text-xs text-gray-500">Recettes</span><p className="font-bold text-green-600">{viewReport.revenue?.toLocaleString()} F</p></div>
                                <div><span className="text-xs text-gray-500">Dépenses</span><p className="font-bold text-red-500">{viewReport.expenses?.toLocaleString()} F</p></div>
                             </div>
                        )}
                        {viewReport.method === 'Voice' && viewReport.audioUrl && (
                            <div className="pt-2">
                                <audio controls src={viewReport.audioUrl} className="w-full h-8" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
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
      // 1. Try to get profile
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      
      if (data) {
          setUserRole(data.role);
          setUserProfile(data);
      } else {
          // 2. AUTO-RECOVERY: If no profile exists (Visitor bug), try to create one from Auth Metadata
          console.warn("Profil introuvable, tentative de création automatique...");
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user && user.user_metadata) {
              const meta = user.user_metadata;
              const newProfile = {
                  id: userId,
                  email: user.email,
                  full_name: meta.full_name || 'Utilisateur',
                  role: meta.role || 'Visiteur',
                  site: meta.site || 'Abidjan'
              };
              
              const { error: insertError } = await supabase.from('profiles').upsert(newProfile);
              
              if (!insertError) {
                   console.log("Profil récupéré automatiquement.");
                   setUserRole(newProfile.role as Role);
                   setUserProfile(newProfile as any);
              } else {
                   console.error("Echec création profil auto:", insertError);
              }
          }
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
