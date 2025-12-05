
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  LayoutDashboard, Wrench, Briefcase, ShoppingCart, Menu, X, Bell, Search, Settings,
  HardHat, DollarSign, LogOut, Calculator, Users, Calendar, FolderOpen, Truck, 
  FileText, UserCheck, CreditCard, Archive, ShieldCheck, ClipboardList, ArrowLeft, ChevronRight, Mic, Send, Save, Plus, CheckCircle, Trash2, User, HelpCircle, Moon, Play, StopCircle, RefreshCw, FileInput, MapPin, Volume2, Megaphone, AlertCircle, Filter, TrendingUp, Edit, ArrowUp, ArrowDown, AlertTriangle, Loader2, Mail, Lock, UserPlus, ScanFace, Fingerprint, Phone, CheckSquare, Key, MoveUp, MoveDown
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { DetailedSynthesis } from './components/DetailedSynthesis';
import { Site, Period, TickerMessage, StatData, DailyReport, Intervention, StockItem, Transaction, Profile, Role, Notification, Technician } from './types';
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
      { name: 'method', label: 'Méthode', type: 'select', options: ['Form'] } // Hidden or fixed normally
    ]
  }
};

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

// --- Helper: Permission Check ---
const getPermission = (path: string, role: Role): { canWrite: boolean } => {
  if (role === 'Admin') return { canWrite: true };
  if (role === 'Visiteur') return { canWrite: false };

  // Roles internes spécifiques
  if (role === 'Technicien' && path.startsWith('/techniciens')) return { canWrite: true };
  if (role === 'Magasinier' && path.startsWith('/quincaillerie')) return { canWrite: true };
  if (role === 'Secretaire' && path.startsWith('/secretariat')) return { canWrite: true };
  
  // Par défaut, lecture seule pour les autres sections
  return { canWrite: false };
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

// --- Add Item Modal (Generic) ---
const AddModal = ({ isOpen, onClose, config, onSubmit, loading }: any) => {
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (isOpen) setFormData({}); 
  }, [isOpen]);

  const handleSubmit = () => {
    // Inject default method for reports if needed
    if (config.title.includes('Rapport') && !formData.method) {
        formData.method = 'Form';
    }
    onSubmit(formData);
  };

  if (!isOpen || !config) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-green-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-6 shadow-2xl animate-fade-in">
        <h3 className="text-xl font-bold text-green-900 dark:text-white mb-4">{config.title}</h3>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          {config.fields.map((field: FormField) => (
             <div key={field.name}>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{field.label}</label>
                {field.type === 'select' ? (
                   <select 
                     className="w-full border border-orange-200 p-2 rounded bg-white text-green-900 focus:ring-2 focus:ring-ebf-orange outline-none"
                     onChange={e => setFormData({...formData, [field.name]: e.target.value})}
                     value={formData[field.name] || ''}
                   >
                     <option value="">Sélectionner...</option>
                     {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                   </select>
                ) : (
                   <input 
                     type={field.type} 
                     className="w-full border border-orange-200 p-2 rounded bg-white text-green-900 focus:ring-2 focus:ring-ebf-orange outline-none"
                     onChange={e => setFormData({...formData, [field.name]: e.target.value})}
                     value={formData[field.name] || ''}
                     placeholder={field.placeholder || ''}
                   />
                )}
             </div>
          ))}
        </div>
        <div className="mt-6 flex gap-3">
           <button onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded font-bold text-gray-600 hover:bg-gray-50">Annuler</button>
           <button onClick={handleSubmit} disabled={loading} className="flex-1 py-2 bg-ebf-green text-white rounded font-bold hover:bg-green-800 transition shadow-lg">
             {loading ? <Loader2 className="animate-spin mx-auto"/> : "Ajouter"}
           </button>
        </div>
      </div>
    </div>
  );
};

// --- Flash Info Configuration Modal ---
const FlashInfoModal = ({ isOpen, onClose, messages, onSaveMessage, onDeleteMessage }: any) => {
    const [newMessage, setNewMessage] = useState({ text: '', type: 'info' });
    
    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!newMessage.text) return;
        onSaveMessage(newMessage.text, newMessage.type);
        setNewMessage({ text: '', type: 'info' });
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-green-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl p-6 shadow-2xl animate-fade-in flex flex-col max-h-[85vh]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-green-900 dark:text-white flex items-center gap-2">
                        <Megaphone className="text-ebf-orange"/> Configuration Flash Info
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X /></button>
                </div>

                {/* Add New Message */}
                <div className="bg-orange-50 dark:bg-gray-700 p-4 rounded-lg mb-6 border border-orange-100">
                    <label className="block text-sm font-bold text-green-900 dark:text-gray-200 mb-2">Ajouter un message manuel</label>
                    <div className="flex gap-2 mb-2">
                        <input 
                            value={newMessage.text}
                            onChange={(e) => setNewMessage({...newMessage, text: e.target.value})}
                            placeholder="Ex: Réunion générale demain à 10h"
                            className="flex-1 border border-orange-200 p-2 rounded bg-white text-green-900 focus:ring-2 focus:ring-ebf-orange outline-none"
                        />
                        <select 
                            value={newMessage.type}
                            onChange={(e) => setNewMessage({...newMessage, type: e.target.value})}
                            className="border border-orange-200 p-2 rounded bg-white text-green-900 outline-none cursor-pointer"
                        >
                            <option value="info">Info (Bleu)</option>
                            <option value="success">Succès (Vert)</option>
                            <option value="alert">Alerte (Rouge)</option>
                        </select>
                        <button onClick={handleSubmit} className="bg-ebf-green text-white px-4 py-2 rounded font-bold hover:bg-green-800">
                            Ajouter
                        </button>
                    </div>
                </div>

                {/* List Messages */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <h4 className="text-sm font-bold text-gray-500 uppercase mb-2">Messages Actifs (Manuels)</h4>
                    <div className="space-y-2">
                        {messages.filter((m: TickerMessage) => m.isManual).length === 0 ? (
                            <p className="text-gray-400 text-sm italic text-center py-4">Aucun message manuel configuré.</p>
                        ) : (
                            messages.filter((m: TickerMessage) => m.isManual).map((msg: TickerMessage, idx: number) => (
                                <div key={msg.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded shadow-sm hover:shadow-md transition">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${msg.type === 'alert' ? 'bg-red-500' : msg.type === 'success' ? 'bg-green-500' : 'bg-blue-400'}`}></div>
                                        <span className="text-sm font-medium text-gray-800">{msg.text}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500 font-mono">#{idx + 1}</span>
                                        <button onClick={() => onDeleteMessage(msg.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded transition">
                                            <Trash2 size={16}/>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <h4 className="text-sm font-bold text-gray-500 uppercase mt-6 mb-2">Messages Automatiques (Prévisualisation)</h4>
                     <div className="space-y-2 opacity-75">
                        {messages.filter((m: TickerMessage) => !m.isManual).map((msg: TickerMessage) => (
                                <div key={msg.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${msg.type === 'alert' ? 'bg-red-500' : msg.type === 'success' ? 'bg-green-500' : 'bg-blue-400'}`}></div>
                                        <span className="text-sm font-medium text-gray-600 italic">{msg.text}</span>
                                    </div>
                                    <span className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-500">AUTO</span>
                                </div>
                            ))
                        }
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
    
    // Si c'est un membre de l'équipe, on met aussi à jour la table technicians
    if (!error && profile.role !== 'Visiteur') {
       await supabase.from('technicians').update({ name: formData.full_name }).eq('id', profile.id);
    }

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
           <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Nom Complet</label><input value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full border border-orange-200 p-2 rounded bg-white text-green-900 focus:ring-2 focus:ring-ebf-orange outline-none" /></div>
           <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Email (Lecture seule)</label><input value={formData.email} disabled className="w-full border border-gray-200 p-2 rounded bg-gray-100 text-gray-500" /></div>
           <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Téléphone</label><input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border border-orange-200 p-2 rounded bg-white text-green-900 focus:ring-2 focus:ring-ebf-orange outline-none" /></div>
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
           className="w-full border border-orange-200 p-3 rounded-lg mb-4 bg-white text-green-900 focus:ring-2 focus:ring-ebf-orange outline-none" 
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

        if (signUpResp.data.user) {
             const userId = signUpResp.data.user.id;
             const { error: profileError } = await supabase.from('profiles').insert([{
                 id: userId,
                 email: authMethod === 'email' ? identifier : '',
                 phone: authMethod === 'phone' ? identifier : '',
                 full_name: fullName,
                 role: role,
                 site: site
             }]);
             if (profileError) console.error("Erreur création profil DB:", profileError);

             if (role !== 'Visiteur') {
                 let specialty = role as string;
                 if (role === 'Admin') specialty = 'Administration';
                 
                 await supabase.from('technicians').insert([{
                     id: userId,
                     name: fullName,
                     specialty: specialty,
                     site: site,
                     status: 'Available'
                 }]);
             }
        }
        
        setSuccessMsg("Inscription réussie ! Veuillez vous connecter.");
        setIsSignUp(false); 

      } else {
        // --- CONNEXION ---
        const { data, error: err } = await supabase.auth.signInWithPassword(
            authMethod === 'email' ? { email: identifier, password } : { phone: identifier, password }
        );
        if (err) throw err;
        
        // Pas de redirection manuelle ici, on laisse le useEffect d'App.tsx gérer le changement d'état "SIGNED_IN"
      }
    } catch (err: any) {
      setError("Email ou mot de passe incorrect.");
    } finally {
      if (!successMsg) setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50/50 p-4">
       <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md text-center border-t-4 border-ebf-orange animate-fade-in">
          <div className="flex justify-center mb-6 transform scale-125"><EbfLogo /></div>
          <h2 className="text-2xl font-bold text-green-900 mb-2">{isResetMode ? "Récupération" : (isSignUp ? "Rejoindre l'Équipe" : "Connexion EBF")}</h2>
          
          {error && <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4 text-left font-bold">{error}</div>}
          {successMsg && <div className="bg-green-50 text-green-600 p-3 rounded text-sm mb-4 text-left font-bold border border-green-200">{successMsg}</div>}

          {!isResetMode && !successMsg.includes('Inscription') && (
            <div className="flex p-1 bg-gray-100 rounded-lg mb-6">
               <button onClick={() => setAuthMethod('email')} className={`flex-1 py-2 rounded text-sm font-bold ${authMethod === 'email' ? 'bg-white text-ebf-green shadow' : 'text-gray-500'}`}>Email</button>
               <button onClick={() => setAuthMethod('phone')} className={`flex-1 py-2 rounded text-sm font-bold ${authMethod === 'phone' ? 'bg-white text-ebf-orange shadow' : 'text-gray-500'}`}>Téléphone</button>
            </div>
          )}

          {!successMsg.includes('Inscription') && (
            <div className="space-y-4 text-left">
                {isSignUp && (
                    <>
                    <div>
                        <label className="block text-sm font-bold text-green-900 mb-1">Nom Complet</label>
                        <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full border border-orange-200 p-3 rounded-lg bg-white text-green-900 focus:ring-2 focus:ring-ebf-orange outline-none" placeholder="Jean Kouassi" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-sm font-bold text-green-900 mb-1">Rôle</label>
                            <select value={role} onChange={e => setRole(e.target.value as Role)} className="w-full border border-orange-200 p-3 rounded-lg bg-white text-green-900 focus:ring-2 focus:ring-ebf-orange outline-none">
                            <option value="Visiteur">Visiteur (Lecture seule)</option>
                            <option value="Technicien">Technicien</option>
                            <option value="Secretaire">Secretaire</option>
                            <option value="Magasinier">Magasinier</option>
                            <option value="Admin">Admin</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-green-900 mb-1">Site</label>
                            <select value={site} onChange={e => setSite(e.target.value as Site)} className="w-full border border-orange-200 p-3 rounded-lg bg-white text-green-900 focus:ring-2 focus:ring-ebf-orange outline-none">
                            <option value="Abidjan">Abidjan</option>
                            <option value="Bouaké">Bouaké</option>
                            </select>
                        </div>
                    </div>
                    </>
                )}

                <div>
                    <label className="block text-sm font-bold text-green-900 mb-1">{authMethod === 'email' ? 'Email' : 'Numéro'}</label>
                    <input value={identifier} onChange={e => setIdentifier(e.target.value)} className="w-full border border-orange-200 p-3 rounded-lg bg-white text-green-900 focus:ring-2 focus:ring-ebf-orange outline-none" />
                </div>
                
                {!isResetMode && (
                <div>
                    <label className="block text-sm font-bold text-green-900 mb-1">Mot de passe</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-orange-200 p-3 rounded-lg bg-white text-green-900 focus:ring-2 focus:ring-ebf-orange outline-none" />
                    {!isSignUp && <button onClick={() => setIsResetMode(true)} className="text-xs text-orange-600 font-bold mt-1 block text-right">Oublié ?</button>}
                </div>
                )}
                
                <button onClick={handleAuth} disabled={loading} className="w-full bg-ebf-green text-white font-bold py-3 rounded-lg hover:bg-green-800 transition shadow-lg">
                    {loading ? <Loader2 className="animate-spin mx-auto"/> : (isResetMode ? "Envoyer" : (isSignUp ? "S'inscrire" : "Se Connecter"))}
                </button>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-100">
             <button onClick={() => { 
                 if (successMsg) {
                     setSuccessMsg('');
                     setIsSignUp(false);
                 } else {
                     setIsSignUp(!isSignUp); 
                     setIsResetMode(false); 
                 }
             }} className="text-sm font-bold text-gray-500 hover:text-green-900">
                {successMsg ? "Se connecter" : (isSignUp ? "J'ai déjà un compte" : "Créer un compte")}
             </button>
          </div>
       </div>
    </div>
  );
};

// --- Biometric Onboarding Flow ---
const BiometricOnboarding = ({ profile, onComplete }: { profile: Profile | null, onComplete: () => void }) => {
  const [step, setStep] = useState<'message' | 'modal'>('message');

  useEffect(() => {
    // Transition from Message to Modal after short delay for readability
    if (step === 'message') {
      const timer = setTimeout(() => setStep('modal'), 2500); // 2.5s pour lire le message
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleEnableBiometrics = () => {
    // Check Native Capability
    if (window.PublicKeyCredential) {
      localStorage.setItem('ebf_biometric_active', 'true');
      localStorage.setItem('ebf_biometric_choice', 'true'); // Flag to not show again
      alert("Biométrie configurée avec succès !");
      onComplete();
    } else {
      alert("Votre appareil ne supporte pas la biométrie via le navigateur.");
      // Even if failed, mark as asked so we don't spam
      localStorage.setItem('ebf_biometric_choice', 'skipped');
      onComplete();
    }
  };

  const handleSkip = () => {
    localStorage.setItem('ebf_biometric_choice', 'skipped');
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 bg-green-900/90 backdrop-blur-md transition-all duration-500">
      
      {/* 1. Success Message Toast */}
      {step === 'message' && (
        <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md text-center border-l-8 border-ebf-green animate-fade-in">
            <div className="mx-auto bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="text-ebf-green h-8 w-8" />
            </div>
            <h3 className="text-2xl font-bold text-green-900 mb-2">Connexion réussie</h3>
            <p className="text-gray-600 font-medium text-lg">
                Vous allez vous connecter en tant que <br/>
                <span className="text-ebf-orange font-bold uppercase text-xl mt-2 inline-block">{profile?.role || '...'}</span>
            </p>
        </div>
      )}

      {/* 2. Biometric Modal */}
      {step === 'modal' && (
        <div className="bg-white rounded-2xl w-full max-w-sm p-8 shadow-2xl animate-fade-in border-t-4 border-ebf-orange relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-5"><ScanFace size={120}/></div>
           
           <div className="flex justify-center mb-6">
             <div className="p-4 bg-orange-50 rounded-full text-ebf-orange shadow-inner">
               <Fingerprint size={48} />
             </div>
           </div>
           
           <h3 className="text-2xl font-bold text-center text-green-900 mb-2">Connexion Rapide</h3>
           <p className="text-gray-600 text-center mb-8">
             Souhaitez-vous activer la connexion par empreinte digitale ou reconnaissance faciale pour faciliter vos prochaines connexions ?
           </p>
           
           <div className="space-y-3">
             <button onClick={handleEnableBiometrics} className="w-full bg-ebf-green text-white font-bold py-3.5 rounded-xl hover:bg-green-800 transition shadow-lg flex items-center justify-center gap-2">
               <ScanFace size={20}/> Oui, activer
             </button>
             <button onClick={handleSkip} className="w-full bg-white text-gray-500 font-bold py-3.5 rounded-xl hover:bg-gray-50 border border-gray-200 transition">
               Plus tard
             </button>
           </div>
        </div>
      )}
    </div>
  );
};

// --- Loading Screen ---
const LoadingScreen = () => (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-green-50">
        <Loader2 size={48} className="text-ebf-green animate-spin mb-4"/>
        <p className="text-green-900 font-bold animate-pulse">Chargement EBF Manager...</p>
    </div>
);

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
            // Only filter by date if the item HAS a date
            if (currentPeriod && item.date && !isInPeriod(item.date, currentPeriod)) return false;
            return true;
        });
    }, [items, currentSite, currentPeriod]);

    const columns = filteredItems.length > 0 
        ? Object.keys(filteredItems[0]).filter(k => k !== 'id' && k !== 'technicianId' && k !== 'avatar_url' && k !== 'created_at') 
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
                                    <tr key={i} className="hover:bg-orange-50/30 transition">
                                        {columns.map(col => (
                                            <td key={col} className="p-4 text-sm text-green-900">{renderCell(col, item[col])}</td>
                                        ))}
                                        {!readOnly && onDelete && (
                                            <td className="p-4 text-right flex justify-end gap-2">
                                                <button onClick={() => onDelete(item)} className="p-1.5 text-red-500 bg-red-50 rounded hover:bg-red-100"><Trash2 size={16}/></button>
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

// --- Header Component ---
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

    const canEditFlashInfo = userRole === 'Admin';

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
                   <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-orange-100 dark:border-gray-700 overflow-hidden animate-fade-in z-50">
                      <div className="p-2 space-y-1">
                         <button onClick={() => { onOpenProfile(); setShowSettingsDropdown(false); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-orange-50 dark:hover:bg-gray-700 text-sm font-bold text-green-900 dark:text-gray-200">
                            <User size={16} className="text-ebf-green"/> Mon Profil
                         </button>
                         {canEditFlashInfo && (
                             <button onClick={() => { onOpenFlashInfo(); setShowSettingsDropdown(false); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-orange-50 dark:hover:bg-gray-700 text-sm font-bold text-green-900 dark:text-gray-200">
                                <Megaphone size={16} className="text-ebf-orange"/> Configurer Flash Info
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

// --- AppContent Implementation ---
const AppContent = ({ session, onLogout, userRole, userProfile }: any) => {
  const [currentPath, setCurrentPath] = useState('/');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentSite, setCurrentSite] = useState<Site>(Site.GLOBAL);
  const [currentPeriod, setCurrentPeriod] = useState<Period>(Period.MONTH);
  const [darkMode, setDarkMode] = useState(false);
  
  // -- REAL STATE --
  const [stats, setStats] = useState<StatData[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Ticker Logic
  const [manualTickerMessages, setManualTickerMessages] = useState<TickerMessage[]>([]);
  const [autoTickerMessages, setAutoTickerMessages] = useState<TickerMessage[]>([]);

  // Modals & CRUD
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isFlashInfoOpen, setIsFlashInfoOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [crudTarget, setCrudTarget] = useState('');
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [crudLoading, setCrudLoading] = useState(false);

  // Determine permissions based on current path and user role
  const { canWrite } = getPermission(currentPath, userRole);

  // --- DATA FETCHING & REALTIME ---
  useEffect(() => {
    const fetchData = async () => {
      const { data: intervData } = await supabase.from('interventions').select('*');
      if (intervData) setInterventions(intervData);

      const { data: stockData } = await supabase.from('stocks').select('*');
      if (stockData) setStock(stockData);

      const { data: techData } = await supabase.from('technicians').select('*');
      if (techData) setTechnicians(techData);

      const { data: reportsData } = await supabase.from('reports').select('*');
      if (reportsData) setReports(reportsData);

      const { data: statsData } = await supabase.from('daily_stats').select('*');
      if (statsData) setStats(statsData);
      
      const { data: notifData } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
      if (notifData) setNotifications(notifData);
      
      // Fetch manual ticker messages
      const { data: tickerData } = await supabase.from('ticker_messages').select('*').order('display_order', { ascending: true });
      if (tickerData) {
          const manual = tickerData.map((m: any) => ({ ...m, isManual: true }));
          setManualTickerMessages(manual);
      } else {
          setManualTickerMessages([]); 
      }
    };

    fetchData();

    // Realtime Subscriptions
    const channels = supabase.channel('realtime-ebf')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'interventions' }, (payload) => {
          if (payload.eventType === 'INSERT') setInterventions(prev => [...prev, payload.new as Intervention]);
          else if (payload.eventType === 'UPDATE') setInterventions(prev => prev.map(i => i.id === payload.new.id ? payload.new as Intervention : i));
          else if (payload.eventType === 'DELETE') setInterventions(prev => prev.filter(i => i.id !== payload.old.id));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stocks' }, (payload) => {
          if (payload.eventType === 'INSERT') setStock(prev => [...prev, payload.new as StockItem]);
          else if (payload.eventType === 'UPDATE') setStock(prev => prev.map(s => s.id === payload.new.id ? payload.new as StockItem : s));
          else if (payload.eventType === 'DELETE') setStock(prev => prev.filter(s => s.id !== payload.old.id));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, (payload) => {
          if (payload.eventType === 'INSERT') setReports(prev => [...prev, payload.new as DailyReport]);
          else if (payload.eventType === 'UPDATE') setReports(prev => prev.map(r => r.id === payload.new.id ? payload.new as DailyReport : r));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'technicians' }, (payload) => {
          if (payload.eventType === 'INSERT') setTechnicians(prev => [...prev, payload.new as Technician]);
          else if (payload.eventType === 'UPDATE') setTechnicians(prev => prev.map(t => t.id === payload.new.id ? payload.new as Technician : t));
          else if (payload.eventType === 'DELETE') setTechnicians(prev => prev.filter(t => t.id !== payload.old.id));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload) => {
          if (payload.eventType === 'INSERT') setNotifications(prev => [payload.new as Notification, ...prev]);
      })
      // Listen to manual ticker updates
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ticker_messages' }, (payload) => {
          if (payload.eventType === 'INSERT') setManualTickerMessages(prev => [...prev, { ...payload.new, isManual: true } as TickerMessage]);
          else if (payload.eventType === 'DELETE') setManualTickerMessages(prev => prev.filter(m => m.id !== payload.old.id));
          // Re-fetch for reorder/update simplicity
          fetchData(); 
      })
      .subscribe();

    return () => { supabase.removeChannel(channels); };
  }, []);

  // --- AUTOMATIC TICKER CALCULATION ENGINE ---
  useEffect(() => {
    generateAutoTickerMessages(stats);
    // Re-run every 10 minutes to refresh calculation (even if data hasn't changed, relative dates might)
    const interval = setInterval(() => generateAutoTickerMessages(stats), 600000);
    return () => clearInterval(interval);
  }, [stats]); // Re-calc when stats change

  const generateAutoTickerMessages = (data: StatData[]) => {
      const messages: TickerMessage[] = [];
      const now = new Date();
      
      // Helper to sum rev/exp for a set of filtered items
      const calcPerf = (items: StatData[]) => {
          const revenue = items.reduce((acc, curr) => acc + curr.revenue, 0);
          const expenses = items.reduce((acc, curr) => acc + curr.expenses, 0);
          const profit = revenue - expenses;
          const percent = revenue > 0 ? (profit / revenue) * 100 : 0;
          return { profit, percent };
      };

      // 1. TODAY (Jour)
      const todayStats = data.filter(d => isInPeriod(d.date, Period.DAY));
      if (todayStats.length > 0) {
          const { percent } = calcPerf(todayStats);
          if (percent !== 0) {
              const isPositive = percent > 0;
              messages.push({
                  id: 'auto-day',
                  text: isPositive 
                      ? `Félicitations ! Nous sommes à +${percent.toFixed(1)}% de bénéfice aujourd'hui.`
                      : `Alerte : Nous sommes à ${percent.toFixed(1)}% de perte aujourd'hui.`,
                  type: isPositive ? 'success' : 'alert',
                  display_order: 100,
                  isManual: false
              });
          }
      }

      // 2. WEEK (Semaine)
      const weekStats = data.filter(d => isInPeriod(d.date, Period.WEEK));
      if (weekStats.length > 0) {
          const { percent } = calcPerf(weekStats);
          if (percent !== 0) {
             const isPositive = percent > 0;
             messages.push({
                 id: 'auto-week',
                 text: isPositive 
                     ? `Bravo ! Cette semaine enregistre +${percent.toFixed(1)}% de marge positive.`
                     : `Attention ! Nous sommes à ${percent.toFixed(1)}% de perte cette semaine.`,
                 type: isPositive ? 'success' : 'alert',
                 display_order: 101,
                 isManual: false
             });
          }
      }

      // 3. MONTH (Mois)
      const monthStats = data.filter(d => isInPeriod(d.date, Period.MONTH));
      if (monthStats.length > 0) {
          const { percent } = calcPerf(monthStats);
          if (percent !== 0) {
              const isPositive = percent > 0;
              messages.push({
                  id: 'auto-month',
                  text: isPositive
                      ? `Excellent ! Le mois en cours est à +${percent.toFixed(1)}% de rentabilité.`
                      : `Vigilance : Le cumul mensuel est à ${percent.toFixed(1)}%.`,
                  type: isPositive ? 'success' : 'alert',
                  display_order: 102,
                  isManual: false
              });
          }
      }

       // 4. YEAR (Année)
       const yearStats = data.filter(d => isInPeriod(d.date, Period.YEAR));
       if (yearStats.length > 0) {
           const { percent } = calcPerf(yearStats);
           if (percent !== 0) {
               const isPositive = percent > 0;
               messages.push({
                   id: 'auto-year',
                   text: `Bilan Annuel Global : ${isPositive ? '+' : ''}${percent.toFixed(1)}% de marge.`,
                   type: isPositive ? 'info' : 'alert',
                   display_order: 103,
                   isManual: false
               });
           }
       }

      setAutoTickerMessages(messages);
  };

  // Combine Manual (First) + Auto (Second)
  const combinedTickerMessages = useMemo(() => {
     if (manualTickerMessages.length === 0 && autoTickerMessages.length === 0) return [];
     return [...manualTickerMessages, ...autoTickerMessages];
  }, [manualTickerMessages, autoTickerMessages]);

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    setIsMenuOpen(false);
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  // --- CRUD Operations ---
  const handleOpenAdd = (table: string) => {
      setCrudTarget(table);
      setIsAddOpen(true);
  };

  const handleOpenDelete = (item: any, table: string) => {
      setItemToDelete(item);
      setCrudTarget(table);
      setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
      if (!itemToDelete || !crudTarget) return;
      setCrudLoading(true);
      const { error } = await supabase.from(crudTarget).delete().eq('id', itemToDelete.id);
      setCrudLoading(false);
      if (error) {
          alert("Erreur lors de la suppression: " + error.message);
      } else {
          setIsDeleteOpen(false);
          setItemToDelete(null);
      }
  };

  const confirmAdd = async (formData: any) => {
      if (!crudTarget) return;
      setCrudLoading(true);
      
      // Auto-inject Site if missing and relevant
      if (!formData.site) formData.site = currentSite !== Site.GLOBAL ? currentSite : Site.ABIDJAN;
      
      // CONVERSION DES TYPES
      const config = FORM_CONFIGS[crudTarget];
      const processedData = { ...formData };
      
      if (config) {
          config.fields.forEach(f => {
              if (f.type === 'number' && processedData[f.name]) {
                  processedData[f.name] = Number(processedData[f.name]);
              }
          });
      }

      const { error } = await supabase.from(crudTarget).insert([processedData]);
      setCrudLoading(false);
      if (error) {
          alert("Erreur lors de l'ajout: " + error.message);
      } else {
          setIsAddOpen(false);
      }
  };

  // --- Flash Info Manual Management ---
  const saveManualTickerMessage = async (text: string, type: string) => {
      const { error } = await supabase.from('ticker_messages').insert([{
          text,
          type,
          display_order: manualTickerMessages.length + 1
      }]);
      if (error) alert("Erreur ajout message: " + error.message);
  };

  const deleteManualTickerMessage = async (id: string) => {
      const { error } = await supabase.from('ticker_messages').delete().eq('id', id);
      if (error) alert("Erreur suppression: " + error.message);
  };

  const renderContent = () => {
     if (currentPath === '/') {
         return <Dashboard 
             data={stats} 
             reports={reports}
             tickerMessages={combinedTickerMessages} 
             currentSite={currentSite} 
             currentPeriod={currentPeriod} 
             onSiteChange={setCurrentSite} 
             onPeriodChange={setCurrentPeriod} 
             onNavigate={handleNavigate}
         />;
     }
     
     if (currentPath === '/synthesis') {
         return <DetailedSynthesis
             data={stats}
             reports={reports}
             currentSite={currentSite}
             currentPeriod={currentPeriod}
             onSiteChange={setCurrentSite}
             onPeriodChange={setCurrentPeriod}
             onNavigate={handleNavigate}
             onViewReport={(r) => alert(`Détail: ${r.content}`)}
         />;
     }

     const section = currentPath.substring(1);
     if (MODULE_ACTIONS[section]) {
         return (
             <div className="space-y-6 animate-fade-in">
                 <h2 className="text-2xl font-bold text-green-900 dark:text-white capitalize flex items-center gap-2">
                    <ArrowLeft className="cursor-pointer" onClick={() => handleNavigate('/')} />
                    Module {section}
                 </h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {MODULE_ACTIONS[section].map((action) => (
                        <button 
                           key={action.id}
                           onClick={() => handleNavigate(action.path)}
                           className={`${action.color} text-white p-6 rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transition transform text-left`}
                        >
                            <div className="bg-white/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                                <action.icon size={24} />
                            </div>
                            <h3 className="text-xl font-bold mb-1">{action.label}</h3>
                            <p className="text-white/80 text-sm">{action.description}</p>
                            {action.managedBy && <p className="text-xs bg-black/20 mt-2 px-2 py-1 rounded w-fit">{action.managedBy}</p>}
                        </button>
                    ))}
                 </div>
             </div>
         );
     }

     if (currentPath === '/techniciens/interventions') {
         return <ModulePlaceholder 
            title="Interventions" 
            subtitle="Planning et suivi des interventions"
            items={interventions}
            onBack={() => handleNavigate('/techniciens')}
            color="bg-orange-500"
            currentSite={currentSite}
            currentPeriod={currentPeriod}
            onAdd={() => handleOpenAdd('interventions')}
            onDelete={(item: any) => handleOpenDelete(item, 'interventions')}
            readOnly={!canWrite}
         />;
     }
     if (currentPath === '/techniciens/rapports') {
         return <ReportModeSelector 
            reports={reports} 
            onSelectMode={(mode: string) => {
               if (mode === 'form') handleOpenAdd('reports');
               else alert("Rapport vocal pas encore disponible.");
            }} 
            onBack={() => handleNavigate('/techniciens')}
            onViewReport={(r: any) => alert(r.content)}
            readOnly={!canWrite}
         />;
     }
     if (currentPath === '/techniciens/materiel') {
         return <ModulePlaceholder 
            title="Matériel" 
            subtitle="Inventaire Matériel"
            items={stock} // Reuse stock for demo
            onBack={() => handleNavigate('/techniciens')} 
            color="bg-blue-600" 
            onAdd={() => handleOpenAdd('stocks')}
            onDelete={(item: any) => handleOpenDelete(item, 'stocks')}
            readOnly={!canWrite}
         />;
     }
     if (currentPath === '/quincaillerie/stocks') {
         return <ModulePlaceholder 
             title="Stocks Quincaillerie" 
             subtitle="Inventaire et Seuils" 
             items={stock} 
             onBack={() => handleNavigate('/quincaillerie')} 
             color="bg-orange-600" 
             currentSite={currentSite} 
             onAdd={() => handleOpenAdd('stocks')}
             onDelete={(item: any) => handleOpenDelete(item, 'stocks')}
             readOnly={!canWrite}
         />;
     }
     if (currentPath === '/equipe') {
        return <ModulePlaceholder 
            title="Notre Équipe" 
            subtitle="Techniciens, Administration et Staff" 
            items={technicians} 
            onBack={() => handleNavigate('/')} 
            color="bg-indigo-500" 
            currentSite={currentSite}
            onAdd={() => handleOpenAdd('technicians')}
            onDelete={(item: any) => handleOpenDelete(item, 'technicians')}
            readOnly={!canWrite}
        />;
     }

     return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
           <Wrench size={48} className="mb-4 opacity-50" />
           <p className="text-xl">Module "{currentPath}" en cours de développement.</p>
           <button onClick={() => handleNavigate('/')} className="mt-4 text-ebf-green font-bold hover:underline">Retour Accueil</button>
        </div>
     );
  };

  return (
    <div className={`flex h-screen bg-green-50/30 dark:bg-gray-900 transition-colors duration-300 ${darkMode ? 'dark' : ''}`}>
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-green-900 text-white transform transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-auto shadow-2xl flex flex-col`}>
            <div className="flex items-center justify-between h-16 px-6 bg-green-950/50">
               <div className="transform scale-75 origin-left"><EbfLogo /></div>
               <button onClick={() => setIsMenuOpen(false)} className="lg:hidden text-gray-300"><X /></button>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto">
                <nav className="space-y-1">
                    {MAIN_MENU.map(item => (
                        <button
                            key={item.id}
                            onClick={() => handleNavigate(item.path)}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path)) ? 'bg-white text-green-900 font-bold shadow-lg' : 'text-gray-300 hover:bg-green-800 hover:text-white'}`}
                        >
                            <item.icon size={20} className={`${currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path)) ? item.colorClass : 'text-gray-400 group-hover:text-white'}`} />
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>
            </div>

            <div className="p-4 bg-green-950/30">
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-green-800/50 border border-green-700">
                    <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center font-bold text-white text-sm border-2 border-white">
                        {userProfile?.full_name?.charAt(0) || 'U'}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-bold truncate">{userProfile?.full_name || 'Utilisateur'}</p>
                        <p className="text-xs text-gray-400 truncate">{userRole}</p>
                    </div>
                </div>
            </div>
        </aside>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
             <HeaderWithNotif 
                title="EBF Manager" 
                onMenuClick={() => setIsMenuOpen(true)}
                onLogout={onLogout}
                notifications={notifications}
                userProfile={userProfile}
                userRole={userRole}
                markNotificationAsRead={(n: any) => setNotifications(notifications.map(x => x.id === n.id ? {...x, read: true} : x))}
                onOpenProfile={() => setIsProfileOpen(true)}
                onOpenFlashInfo={() => setIsFlashInfoOpen(true)}
                onOpenHelp={() => setIsHelpOpen(true)}
                darkMode={darkMode}
                onToggleTheme={toggleTheme}
             />
             <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 relative bg-green-50/10 dark:bg-gray-900">
                {renderContent()}
             </main>
        </div>

        {/* Modals */}
        <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} profile={userProfile} />
        <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
        <FlashInfoModal 
            isOpen={isFlashInfoOpen} 
            onClose={() => setIsFlashInfoOpen(false)} 
            messages={combinedTickerMessages}
            onSaveMessage={saveManualTickerMessage}
            onDeleteMessage={deleteManualTickerMessage}
        />
        <AddModal 
            isOpen={isAddOpen} 
            onClose={() => setIsAddOpen(false)} 
            config={FORM_CONFIGS[crudTarget]} 
            onSubmit={confirmAdd}
            loading={crudLoading}
        />
        <ConfirmationModal 
            isOpen={isDeleteOpen} 
            onClose={() => setIsDeleteOpen(false)}
            onConfirm={confirmDelete}
            title="Suppression"
            message="Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible."
        />
    </div>
  );
};

// --- App Wrapper ---
function App() {
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<Role>('Visiteur');
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [isPasswordResetOpen, setIsPasswordResetOpen] = useState(false);
  const [showBiometricFlow, setShowBiometricFlow] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // New Global Loading State

  // Centralized Session Initialization Logic
  const handleSessionInit = async (session: any) => {
      setIsLoading(true);
      try {
        const profile = await fetchUserProfile(session.user.id);
        
        // Determine Biometric Flow
        const bioChoice = localStorage.getItem('ebf_biometric_choice');
        if (!bioChoice) {
           setShowBiometricFlow(true);
        } else {
           setShowBiometricFlow(false);
        }
      } catch (e) {
        console.error("Initialization error", e);
      } finally {
        setIsLoading(false);
      }
  };

  const fetchUserProfile = async (userId: string) => {
      let { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      
      // Auto-create profile if missing (Fallback)
      if (!data) {
          const { data: userData } = await supabase.auth.getUser();
          const meta = userData.user?.user_metadata;
          if (meta) {
              const newProfile = {
                  id: userId,
                  full_name: meta.full_name || 'Utilisateur',
                  role: meta.role || 'Visiteur',
                  site: meta.site || 'Global',
                  email: userData.user?.email
              };
              const { error: insertError } = await supabase.from('profiles').insert([newProfile]);
              if (!insertError) data = newProfile as any;
          }
      }

      if (data) {
          setUserRole(data.role);
          setUserProfile(data);
          return data;
      }
      return null;
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        if (session) handleSessionInit(session);
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') setIsPasswordResetOpen(true);
        if (event === 'SIGNED_IN' && session) {
            setSession(session);
            handleSessionInit(session); // Re-trigger init on fresh login
        } else if (event === 'SIGNED_OUT') {
            setSession(null);
            setUserProfile(null);
            setShowBiometricFlow(false);
        }
    });
    return () => subscription.unsubscribe();
  }, []);

  // 1. Loading State (Priority)
  if (isLoading) return <LoadingScreen />;

  // 2. Not Logged In
  if (!session) return <LoginScreen onLogin={() => {}} />;

  // 3. Biometric Flow (After Login + Profile Loaded)
  if (showBiometricFlow) {
    return <BiometricOnboarding profile={userProfile} onComplete={() => setShowBiometricFlow(false)} />;
  }

  // 4. Main App
  return (
    <>
      <AppContent session={session} onLogout={() => supabase.auth.signOut()} userRole={userRole} userProfile={userProfile} />
      <PasswordUpdateModal isOpen={isPasswordResetOpen} onClose={() => setIsPasswordResetOpen(false)} />
    </>
  );
}

export default App;
