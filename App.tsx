import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  LayoutDashboard, Wrench, Briefcase, ShoppingCart, Menu, X, Bell, Search, Settings,
  HardHat, DollarSign, LogOut, Calculator, Users, Calendar, FolderOpen, Truck, 
  FileText, UserCheck, CreditCard, Archive, ShieldCheck, ClipboardList, ArrowLeft, ChevronRight, Mic, Send, Save, Plus, CheckCircle, Trash2, User, HelpCircle, Moon, Sun, Play, StopCircle, RefreshCw, FileInput, MapPin, Volume2, Megaphone, AlertCircle, Filter, TrendingUp, Edit, ArrowUp, ArrowDown, AlertTriangle, Loader2, Mail, Lock, UserPlus, ScanFace, Fingerprint, Phone, CheckSquare, Key, Shield
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { DetailedSynthesis } from './components/DetailedSynthesis';
import { Site, Period, TickerMessage, StatData, DailyReport, Intervention, StockItem, Transaction, Profile, Role, Notification, Technician, Client, Supplier, Chantier, Material } from './types';
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
  type: 'Intervention' | 'Stock' | 'Technician' | 'Transaction' | 'Client' | 'Supplier' | 'Chantier' | 'Material' | 'Generic'; // To identify what we are saving
  fields: FormField[];
}

// --- CONFIGURATION DES FORMULAIRES ---
const INTERVENTION_FORM_TEMPLATE: FormConfig = {
  title: "Nouvelle Intervention",
  type: 'Intervention',
  fields: [
    { name: 'client', label: 'Client', type: 'text', placeholder: 'Nom du client ou entreprise' },
    { name: 'location', label: 'Lieu / Quartier', type: 'text', placeholder: 'Ex: Cocody Riviera' },
    { name: 'description', label: 'Description de la tâche', type: 'text', placeholder: 'Ex: Maintenance Clim' },
    { name: 'technicianId', label: 'Technicien assigné', type: 'select', options: [] }, // Will be filled dynamically
    { name: 'date', label: 'Date prévue', type: 'date' },
    { name: 'site', label: 'Site', type: 'select', options: ['Abidjan', 'Bouaké'] },
    { name: 'status', label: 'Statut', type: 'select', options: ['Pending', 'In Progress', 'Completed'] }
  ]
};

const STOCK_FORM: FormConfig = {
  title: "Article de Stock",
  type: 'Stock',
  fields: [
    { name: 'name', label: 'Nom de l\'article', type: 'text', placeholder: 'Ex: Câble 2.5mm' },
    { name: 'quantity', label: 'Quantité', type: 'number', placeholder: '0' },
    { name: 'unit', label: 'Unité', type: 'text', placeholder: 'm, pcs, kg...' },
    { name: 'threshold', label: 'Seuil d\'alerte', type: 'number', placeholder: '10' },
    { name: 'site', label: 'Site de stockage', type: 'select', options: ['Abidjan', 'Bouaké'] }
  ]
};

const TECHNICIAN_FORM: FormConfig = {
  title: "Gérer Technicien",
  type: 'Technician',
  fields: [
    { name: 'name', label: 'Nom Complet', type: 'text', placeholder: 'Ex: Kouamé Jean' },
    { name: 'specialty', label: 'Spécialité', type: 'text', placeholder: 'Ex: Électricité, Froid, Plomberie' },
    { name: 'status', label: 'Statut Actuel', type: 'select', options: ['Available', 'Busy', 'Off'] },
    { name: 'site', label: 'Site de Rattachement', type: 'select', options: ['Abidjan', 'Bouaké'] }
  ]
};

const TRANSACTION_FORM: FormConfig = {
  title: "Transaction",
  type: 'Transaction',
  fields: [
    { name: 'date', label: 'Date', type: 'date' },
    { name: 'type', label: 'Type', type: 'select', options: ['Recette', 'Dépense'] },
    { name: 'amount', label: 'Montant', type: 'number', placeholder: '0' },
    { name: 'category', label: 'Catégorie', type: 'select', options: ['Prestation', 'Achat Matériel', 'Salaire', 'Loyer', 'Caisse', 'Autre'] },
    { name: 'label', label: 'Libellé', type: 'text', placeholder: 'Ex: Achat câbles' },
    { name: 'site', label: 'Site', type: 'select', options: ['Abidjan', 'Bouaké'] }
  ]
};

const CAISSE_FORM: FormConfig = {
  title: "Mouvement Caisse",
  type: 'Transaction', // Uses transaction table but specific context
  fields: [
    { name: 'date', label: 'Date', type: 'date' },
    { name: 'type', label: 'Mouvement', type: 'select', options: ['Dépense', 'Recette'] },
    { name: 'amount', label: 'Montant', type: 'number', placeholder: '0' },
    { name: 'label', label: 'Motif', type: 'text', placeholder: 'Ex: Transport Technicien' },
    { name: 'site', label: 'Site', type: 'select', options: ['Abidjan', 'Bouaké'] }
  ]
};

const CLIENT_FORM: FormConfig = {
  title: "Client",
  type: 'Client',
  fields: [
    { name: 'name', label: 'Nom / Entreprise', type: 'text' },
    { name: 'phone', label: 'Téléphone', type: 'text' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'address', label: 'Adresse', type: 'text' },
    { name: 'site', label: 'Site', type: 'select', options: ['Abidjan', 'Bouaké'] }
  ]
};

const SUPPLIER_FORM: FormConfig = {
  title: "Fournisseur",
  type: 'Supplier',
  fields: [
    { name: 'name', label: 'Nom Entreprise', type: 'text' },
    { name: 'contact', label: 'Contact', type: 'text' },
    { name: 'category', label: 'Catégorie', type: 'text', placeholder: 'Ex: Électricité, Plomberie' },
    { name: 'site', label: 'Site', type: 'select', options: ['Abidjan', 'Bouaké'] }
  ]
};

const CHANTIER_FORM: FormConfig = {
  title: "Nouveau Chantier",
  type: 'Chantier',
  fields: [
    { name: 'name', label: 'Nom du Chantier', type: 'text', placeholder: 'Ex: Immeuble Le Paris' },
    { name: 'client', label: 'Client', type: 'text' },
    { name: 'location', label: 'Lieu', type: 'text' },
    { name: 'budget', label: 'Budget Estimé', type: 'number' },
    { name: 'startDate', label: 'Date Début', type: 'date' },
    { name: 'status', label: 'Statut', type: 'select', options: ['En Cours', 'Terminé', 'En Attente'] },
    { name: 'site', label: 'Site', type: 'select', options: ['Abidjan', 'Bouaké'] }
  ]
};

const MATERIAL_FORM: FormConfig = {
  title: "Matériel / Outil",
  type: 'Material',
  fields: [
    { name: 'name', label: 'Nom Matériel', type: 'text', placeholder: 'Ex: Perceuse Bosch' },
    { name: 'serialNumber', label: 'N° Série (Optionnel)', type: 'text' },
    { name: 'condition', label: 'État', type: 'select', options: ['Neuf', 'Bon', 'Usé', 'Panne'] },
    { name: 'assignedTo', label: 'Assigné à', type: 'text', placeholder: 'Nom Technicien ou Equipe' },
    { name: 'site', label: 'Site', type: 'select', options: ['Abidjan', 'Bouaké'] }
  ]
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
    { id: 'rh', label: 'Ressources Humaines', description: 'Dossiers du personnel', icon: Users, path: '/equipe', color: 'bg-purple-600' }, // Redirects to Team view
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
                 role: 'Admin', // FORCE ADMIN A L'INSCRIPTION
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
            setSuccessMsg(`Bienvenue, connexion en tant qu'Administrateur...`);
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
const ModulePlaceholder = ({ title, subtitle, items, onBack, onAdd, onEdit, onDelete, color, currentSite, currentPeriod, readOnly }: any) => {
    const COLUMN_LABELS: Record<string, string> = {
        name: 'Nom', quantity: 'Quantité', unit: 'Unité', threshold: 'Seuil', site: 'Site',
        client: 'Client', clientPhone: 'Tél Client', location: 'Lieu', description: 'Description', technicianName: 'Technicien', date: 'Date', status: 'Statut',
        amount: 'Montant', type: 'Type', label: 'Libellé', category: 'Catégorie', email: 'Email', specialty: 'Spécialité',
        full_name: 'Nom Complet', role: 'Rôle', contact: 'Contact', phone: 'Téléphone', address: 'Adresse',
        budget: 'Budget', serialNumber: 'N° Série', condition: 'État', assignedTo: 'Assigné à', startDate: 'Début'
    };

    const filteredItems = useMemo(() => {
        return items.filter((item: any) => {
            if (currentSite && currentSite !== Site.GLOBAL && item.site && item.site !== currentSite) return false;
            // Only apply period filter if the item has a 'date' or 'startDate' field
            const dateField = item.date || item.startDate;
            if (currentPeriod && dateField && !isInPeriod(dateField, currentPeriod)) return false;
            return true;
        });
    }, [items, currentSite, currentPeriod]);

    const columns = filteredItems.length > 0 
        ? Object.keys(filteredItems[0]).filter(k => k !== 'id' && k !== 'technicianId' && k !== 'avatar_url' && k !== 'technician_id' && k !== 'client_phone' && k !== 'created_at') 
        : []; 

    const renderCell = (col: string, value: any) => {
       if (col === 'status') {
          // Intervention Status
          if (value === 'Pending' || value === 'En Attente') return <span className="flex items-center gap-1 text-gray-600 bg-gray-100 px-3 py-1 rounded-full text-xs font-extrabold border border-gray-200"><Calendar size={12}/> {value}</span>;
          if (value === 'In Progress' || value === 'En Cours') return <span className="flex items-center gap-1 text-orange-600 bg-orange-50 px-3 py-1 rounded-full text-xs font-extrabold border border-orange-100"><Loader2 size={12} className="animate-spin"/> {value}</span>;
          if (value === 'Completed' || value === 'Terminé') return <span className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-extrabold border border-green-100"><CheckCircle size={12}/> {value}</span>;
          
          // Technician Status
          if (value === 'Available') return <span className="text-green-700 bg-green-100 px-3 py-1 rounded-full text-xs font-bold border border-green-200 flex items-center w-fit gap-1"><CheckCircle size={10}/> Disponible</span>;
          if (value === 'Busy') return <span className="text-orange-700 bg-orange-100 px-3 py-1 rounded-full text-xs font-bold border border-orange-200 flex items-center w-fit gap-1"><Wrench size={10}/> Occupé</span>;
          if (value === 'Off') return <span className="text-gray-700 bg-gray-200 px-3 py-1 rounded-full text-xs font-bold border border-gray-300 flex items-center w-fit gap-1"><User size={10}/> Absent</span>;

          return value;
       }
       if (col === 'amount' || col === 'budget') return value ? `${value.toLocaleString()} F` : '-';
       if (col === 'type' && value === 'Recette') return <span className="text-green-600 font-bold">{value}</span>;
       if (col === 'type' && value === 'Dépense') return <span className="text-red-600 font-bold">{value}</span>;

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
                                {!readOnly && (onDelete || onEdit) && <th className="p-4 text-right text-xs font-bold uppercase text-green-900">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredItems.length === 0 ? <tr><td colSpan={columns.length + 1} className="p-8 text-center text-gray-400">Aucune donnée trouvée.</td></tr> : 
                                filteredItems.map((item: any, i: number) => (
                                    <tr key={i} className="hover:bg-orange-50/30">
                                        {columns.map(col => (
                                            <td key={col} className="p-4 text-sm text-green-900">{renderCell(col, item[col])}</td>
                                        ))}
                                        {!readOnly && (
                                            <td className="p-4 text-right flex justify-end gap-2">
                                                {onEdit && <button onClick={() => onEdit(item)} className="p-1.5 text-blue-500 bg-blue-50 rounded hover:bg-blue-100 transition"><Edit size={16}/></button>}
                                                {onDelete && <button onClick={() => onDelete(item)} className="p-1.5 text-red-500 bg-red-50 rounded hover:bg-red-100 transition"><Trash2 size={16}/></button>}
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

// --- Module Menu Component ---
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

// --- Dynamic Modal Component ---
const DynamicModal = ({ isOpen, onClose, config, initialData, onSubmit }: any) => {
    const [formData, setFormData] = useState<any>({});

    useEffect(() => {
        if (isOpen) {
            setFormData(initialData || {});
        } else {
            setFormData({});
        }
    }, [isOpen, initialData]);

    if (!isOpen || !config) return null;

    const isEditMode = !!initialData;

    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-green-900/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-6 shadow-2xl animate-fade-in">
          <h3 className="text-xl font-bold text-green-900 dark:text-white mb-4">{isEditMode ? `Modifier: ${config.title}` : config.title}</h3>
          <div className="space-y-4">
            {config.fields.map((field: any) => (
              <div key={field.name}>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{field.label}</label>
                {field.type === 'select' ? (
                  <select
                    className="w-full border border-orange-200 p-2 rounded bg-white text-green-900"
                    value={formData[field.name] || ''}
                    onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
                  >
                    <option value="">Sélectionner...</option>
                    {field.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    className="w-full border border-orange-200 p-2 rounded bg-white text-green-900"
                    placeholder={field.placeholder}
                    value={formData[field.name] || ''}
                    onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
                  />
                )}
              </div>
            ))}
            <button onClick={() => { onSubmit(formData); }} className="w-full bg-ebf-green text-white font-bold py-2 rounded hover:bg-green-800 transition">
              {isEditMode ? "Mettre à jour" : "Ajouter"}
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
                  {reports.length === 0 ? <tr><td colSpan={5} className="p-4 text-center text-gray-400">Aucun rapport.</td></tr> :
                  reports.map((r: any) => (
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
            {team.length === 0 ? (
                <div className="col-span-full text-center py-10 text-gray-500 italic">Aucun membre d'équipe trouvé.</div>
            ) : (
                team.map(member => (
                <div key={member.id} className="bg-white p-6 rounded-xl shadow-md border-t-4 border-indigo-500 flex flex-col items-center text-center hover:shadow-lg transition">
                    <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-4 font-bold text-2xl uppercase">{member.full_name ? member.full_name.charAt(0) : '?'}</div>
                    <h3 className="font-bold text-xl text-green-900">{member.full_name || 'Utilisateur'}</h3>
                    <span className="inline-block bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold mt-2 uppercase">{member.role}</span>
                    <div className="mt-4 text-sm text-gray-500 w-full pt-4 border-t border-gray-100"><p className="flex items-center justify-center gap-2"><Mail size={14}/> {member.email}</p><p className="flex items-center justify-center gap-2 mt-1"><MapPin size={14}/> {member.site}</p></div>
                </div>
                ))
            )}
         </div>
      </div>
   );
};

const HeaderWithNotif = ({ 
  title, 
  onMenuClick, 
  onLogout, 
  onOpenFlashInfo, 
  onOpenAdmin, 
  onOpenProfile, 
  onOpenHelp, 
  notifications, 
  userProfile, 
  userRole, 
  markNotificationAsRead, 
  darkMode, 
  onToggleTheme, 
  session 
}: any) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center sticky top-0 z-30 transition-colors duration-300">
      <div className="flex items-center space-x-4">
        <button onClick={onMenuClick} className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
          <Menu size={24} />
        </button>
        <h1 className="text-xl md:text-2xl font-bold text-green-900 dark:text-white truncate">{title}</h1>
      </div>

      <div className="flex items-center space-x-2 md:space-x-4">
        
        {/* Theme Toggle */}
        <button onClick={onToggleTheme} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition">
           {darkMode ? <Sun size={20} className="text-yellow-400"/> : <Moon size={20}/>}
        </button>

        {/* Notifications */}
        <div className="relative">
           <button onClick={() => setShowNotifMenu(!showNotifMenu)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition relative">
              <Bell size={20} />
              {unreadCount > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>}
           </button>
           {showNotifMenu && (
             <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 py-2 z-50 animate-fade-in">
               <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 font-bold text-gray-700 dark:text-gray-200">Notifications</div>
               <div className="max-h-64 overflow-y-auto">
                 {notifications.length === 0 ? (
                   <div className="p-4 text-center text-gray-400 text-sm">Aucune notification.</div>
                 ) : (
                   notifications.map((n: any) => (
                     <div key={n.id} className={`p-3 border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${!n.read ? 'bg-orange-50/50 dark:bg-gray-700/50' : ''}`}>
                       <p className="text-sm font-bold text-green-900 dark:text-white">{n.title}</p>
                       <p className="text-xs text-gray-500">{n.message}</p>
                       <span className="text-[10px] text-gray-400 mt-1 block">{new Date(n.created_at).toLocaleDateString()}</span>
                     </div>
                   ))
                 )}
               </div>
             </div>
           )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
             <div className="w-8 h-8 bg-gradient-to-tr from-ebf-green to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                {userProfile?.full_name?.charAt(0) || 'U'}
             </div>
             <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-green-900 dark:text-white">{userProfile?.full_name || 'Utilisateur'}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 capitalize">{userProfile?.role}</p>
             </div>
          </button>
          
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 py-2 z-50 animate-fade-in">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <p className="text-sm font-bold text-green-900 dark:text-white">{userProfile?.full_name}</p>
                <p className="text-xs text-gray-500 truncate">{session?.user?.email || session?.user?.phone}</p>
              </div>
              
              <button onClick={() => { onOpenProfile(); setShowUserMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-gray-700 flex items-center gap-2">
                <User size={16} /> Mon Profil
              </button>

              {userRole === 'Admin' && (
                <>
                <button onClick={() => { onOpenAdmin(); setShowUserMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-gray-700 flex items-center gap-2">
                   <Shield size={16} /> Admin & Droits
                </button>
                <button onClick={() => { onOpenFlashInfo(); setShowUserMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-gray-700 flex items-center gap-2">
                   <Megaphone size={16} /> Flash Info
                </button>
                </>
              )}

              <button onClick={() => { onOpenHelp(); setShowUserMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-gray-700 flex items-center gap-2">
                <HelpCircle size={16} /> Aide
              </button>

              <div className="border-t border-gray-100 dark:border-gray-700 mt-2 pt-2">
                <button onClick={onLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-gray-700 flex items-center gap-2 font-bold">
                  <LogOut size={16} /> Déconnexion
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
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
  const [editingItem, setEditingItem] = useState<any | null>(null); // For Edit
  
  const [deleteModalConfig, setDeleteModalConfig] = useState<{isOpen: boolean, itemId: string | null, type: string | null}>({ isOpen: false, itemId: null, type: null });

  // REAL-TIME STATE
  const [stats, setStats] = useState<StatData[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [tickerMessages, setTickerMessages] = useState<TickerMessage[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [teamMembers, setTeamMembers] = useState<Profile[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  
  const [reportMode, setReportMode] = useState<'select' | 'voice' | 'form'>('select');

  // --- GENERIC REAL-TIME HOOK ---
  const useRealtime = <T extends { id: string }>(tableName: string, setter: React.Dispatch<React.SetStateAction<T[]>>, mapper?: (item: any) => T) => {
      useEffect(() => {
        const fetchData = async () => {
            const { data, error } = await supabase.from(tableName).select('*');
            if (!error && data) {
                setter(data.map(item => mapper ? mapper(item) : item));
            }
        };
        fetchData();

        const channel = supabase.channel(`public:${tableName}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, (payload) => {
            if (payload.eventType === 'INSERT') {
                const newItem = mapper ? mapper(payload.new) : payload.new;
                setter(prev => [...prev, newItem]);
            } else if (payload.eventType === 'UPDATE') {
                const updatedItem = mapper ? mapper(payload.new) : payload.new;
                setter(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
            } else if (payload.eventType === 'DELETE') {
                setter(prev => prev.filter(item => item.id !== payload.old.id));
            }
        })
        .subscribe();

        return () => { supabase.removeChannel(channel); };
      }, [tableName]);
  };

  // --- MAPPERS (Db SnakeCase -> App CamelCase) ---
  const mapIntervention = (i: any): Intervention => ({ ...i, clientPhone: i.client_phone, technicianId: i.technician_id, technicianName: technicians.find(t => t.id === i.technician_id)?.name });
  const mapReport = (r: any): DailyReport => ({ ...r, technicianName: r.technician_name, interventionType: r.intervention_type, clientName: r.client_name, clientPhone: r.client_phone, audioUrl: r.audio_url });
  const mapTicker = (t: any): TickerMessage => ({ ...t, isManual: t.is_manual });
  const mapChantier = (c: any): Chantier => ({ ...c, startDate: c.start_date });
  const mapMaterial = (m: any): Material => ({ ...m, serialNumber: m.serial_number, assignedTo: m.assigned_to });
  
  // --- ACTIVATE REAL-TIME ---
  useRealtime('daily_reports', setReports, mapReport);
  useRealtime('ticker_messages', setTickerMessages, mapTicker);
  useRealtime('stock_items', setStock);
  useRealtime('interventions', setInterventions, mapIntervention);
  useRealtime('technicians', setTechnicians);
  useRealtime('transactions', setTransactions);
  useRealtime('clients', setClients);
  useRealtime('suppliers', setSuppliers);
  useRealtime('chantiers', setChantiers, mapChantier);
  useRealtime('materials', setMaterials, mapMaterial);

  // --- NEW: DYNAMIC STATS AGGREGATION ENGINE ---
  // Calculates live dashboard stats from raw Transactions and Reports instead of relying on a pre-filled table
  useEffect(() => {
    const generatedStats: Record<string, StatData> = {};
    
    // Helper to init stat object
    const initStat = (id: string, date: string, site: Site) => ({
        id, date, site, revenue: 0, expenses: 0, profit: 0, interventions: 0
    });

    // 1. Process Transactions (Financials)
    transactions.forEach(t => {
        const key = `${t.date}-${t.site}`;
        if (!generatedStats[key]) generatedStats[key] = initStat(key, t.date, t.site);
        
        if (t.type === 'Recette') generatedStats[key].revenue += (t.amount || 0);
        else if (t.type === 'Dépense') generatedStats[key].expenses += (t.amount || 0);
    });

    // 2. Process Reports (Operational counts)
    reports.forEach(r => {
        const key = `${r.date}-${r.site}`;
        if (!generatedStats[key]) generatedStats[key] = initStat(key, r.date, r.site);
        
        generatedStats[key].interventions += 1;
    });

    // 3. Calculate Profits & Array
    const statsArray = Object.values(generatedStats).map(s => ({
        ...s,
        profit: s.revenue - s.expenses
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    setStats(statsArray);

  }, [transactions, reports]);

  // Team is special (profiles table)
  useEffect(() => {
    const fetchTeam = async () => {
        const { data } = await supabase.from('profiles').select('*').order('full_name');
        if (data) setTeamMembers(data);
    };
    fetchTeam();
    const channel = supabase.channel('public:profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchTeam())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Update Technician Names in Interventions when Technicians list changes
  useEffect(() => {
     if (technicians.length > 0 && interventions.length > 0) {
         setInterventions(prev => prev.map(i => ({
             ...i,
             technicianName: technicians.find(t => t.id === i.technicianId)?.name || i.technicianName
         })));
     }
  }, [technicians]);

  // --- PERMISSION CHECKER ---
  const canUserWrite = (role: Role, path: string): boolean => {
      return true; // Unlocked for demo/usage
  };
  
  const isReadOnly = useMemo(() => !canUserWrite(userRole, currentPath), [userRole, currentPath]);

  // Handlers
  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    setSidebarOpen(false); // Close mobile sidebar on nav
  };

  const handleDeleteReport = async (id: string) => {
     await supabase.from('daily_reports').delete().eq('id', id);
  };

  const handleFlashInfoSave = async (msg: TickerMessage) => {
     // DB Insert
     await supabase.from('ticker_messages').insert({
         text: msg.text,
         type: msg.type,
         display_order: msg.display_order,
         is_manual: true
     });
     setIsFlashInfoOpen(false);
  };
  
  // --- CORE SAVE LOGIC (CREATE OR UPDATE TO SUPABASE) ---
  const handleSaveItem = async (formData: any) => {
    if (!modalConfig) return;

    let tableName = '';
    let payload = formData;

    if (modalConfig.type === 'Intervention') {
       tableName = 'interventions';
       // Map back to Snake Case
       payload = {
           site: formData.site,
           client: formData.client,
           client_phone: formData.clientPhone, 
           location: formData.location,
           description: formData.description,
           technician_id: formData.technicianId,
           date: formData.date,
           status: formData.status
       };
    } else if (modalConfig.type === 'Stock') {
       tableName = 'stock_items';
    } else if (modalConfig.type === 'Technician') {
       tableName = 'technicians';
    } else if (modalConfig.type === 'Transaction') {
       tableName = 'transactions';
    } else if (modalConfig.type === 'Client') {
       tableName = 'clients';
    } else if (modalConfig.type === 'Supplier') {
       tableName = 'suppliers';
    } else if (modalConfig.type === 'Chantier') {
        tableName = 'chantiers';
        payload = { ...formData, start_date: formData.startDate }; // map camel to snake
    } else if (modalConfig.type === 'Material') {
        tableName = 'materials';
        payload = { ...formData, serial_number: formData.serialNumber, assigned_to: formData.assignedTo }; // map camel to snake
    }

    if (tableName) {
        if (editingItem) {
            await supabase.from(tableName).update(payload).eq('id', editingItem.id);
        } else {
            await supabase.from(tableName).insert(payload);
        }
    }
    
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleDeleteItem = async () => {
    let tableName = '';
    if (deleteModalConfig.type === 'Intervention') tableName = 'interventions';
    else if (deleteModalConfig.type === 'Stock') tableName = 'stock_items';
    else if (deleteModalConfig.type === 'Technician') tableName = 'technicians';
    else if (deleteModalConfig.type === 'Transaction') tableName = 'transactions';
    else if (deleteModalConfig.type === 'Client') tableName = 'clients';
    else if (deleteModalConfig.type === 'Supplier') tableName = 'suppliers';
    else if (deleteModalConfig.type === 'Chantier') tableName = 'chantiers';
    else if (deleteModalConfig.type === 'Material') tableName = 'materials';

    if (tableName) {
        await supabase.from(tableName).delete().eq('id', deleteModalConfig.itemId);
    }
    setDeleteModalConfig({isOpen: false, itemId: null, type: null});
  };

  // --- DYNAMIC FORM UPDATE ---
  // When opening intervention form, populate technicians list
  const openInterventionModal = (item?: any) => {
      const config = { ...INTERVENTION_FORM_TEMPLATE };
      config.fields = config.fields.map(f => {
          if (f.name === 'technicianId') {
              return { ...f, options: technicians.map(t => t.id) }; // Should ideally be name-value pair in select, simplified here
          }
          return f;
      });
      setModalConfig(config);
      setEditingItem(item || null);
      setIsModalOpen(true);
  };

  const openModal = (config: FormConfig, item?: any) => {
      setModalConfig(config);
      setEditingItem(item || null);
      setIsModalOpen(true);
  }

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
        return <ModulePlaceholder 
            title="Techniciens" 
            subtitle="Gestion des techniciens" 
            items={technicians} 
            onBack={() => handleNavigate('/')} 
            onAdd={!isReadOnly ? () => openModal(TECHNICIAN_FORM) : undefined} 
            onEdit={!isReadOnly ? (item: any) => openModal(TECHNICIAN_FORM, item) : undefined}
            onDelete={!isReadOnly ? (item: any) => setDeleteModalConfig({isOpen:true, itemId:item.id, type: 'Technician'}) : undefined} 
            color="bg-orange-600" 
            currentSite={currentSite} 
            readOnly={isReadOnly}
        />;
    }
    if (currentPath === '/equipe') {
        return <TeamGrid members={teamMembers} onBack={() => handleNavigate('/')} />;
    }
    
    const moduleName = currentPath.split('/')[1];
    if (currentPath === `/${moduleName}` && MODULE_ACTIONS[moduleName]) return <ModuleMenu title={MAIN_MENU.find(m => m.id === moduleName)?.label} actions={MODULE_ACTIONS[moduleName]} onNavigate={handleNavigate} />;
    
    // Lists & Forms with Permissions
    if (currentPath === '/techniciens/rapports') { if (reportMode === 'select') return <ReportModeSelector reports={reports} onSelectMode={setReportMode} onBack={() => setCurrentPath('/techniciens')} onViewReport={setViewReport} readOnly={isReadOnly} />; }
    
    // -- CONFIGURATION DES ROUTES DE MODULES --
    let items: any[] = []; 
    let title = 'Liste'; 
    let color = 'bg-gray-500'; 
    let type: any = '';
    let formConfig: FormConfig | null = null;
    let subtitle = '';

    if (currentPath === '/techniciens/interventions') { 
        title = "Interventions"; items = interventions; color = "bg-orange-500"; type="Intervention";
        return <ModulePlaceholder title={title} items={items} onBack={() => handleNavigate(`/${moduleName}`)} 
            onAdd={!isReadOnly ? () => openInterventionModal() : undefined} 
            onEdit={!isReadOnly ? (item: any) => openInterventionModal(item) : undefined}
            onDelete={!isReadOnly ? (item: any) => setDeleteModalConfig({isOpen:true, itemId:item.id, type}) : undefined} 
            color={color} currentSite={currentSite} currentPeriod={currentPeriod} readOnly={isReadOnly} />;
    }
    else if (currentPath === '/techniciens/chantiers') {
        title = "Chantiers"; items = chantiers; color = "bg-green-600"; type="Chantier"; formConfig = CHANTIER_FORM; subtitle = "Suivi des projets";
    }
    else if (currentPath === '/techniciens/materiel') {
        title = "Matériel Technique"; items = materials; color = "bg-blue-600"; type="Material"; formConfig = MATERIAL_FORM; subtitle = "Outillage et Équipements";
    }
    else if (currentPath === '/quincaillerie/stocks') { 
        title = "Stocks"; items = stock; color = "bg-blue-500"; type="Stock"; formConfig = STOCK_FORM;
    } 
    else if (currentPath === '/comptabilite/bilan') { 
        title = "Bilan Financier"; items = transactions; color = "bg-green-600"; type="Transaction"; formConfig = TRANSACTION_FORM; subtitle="Recettes et Dépenses";
    }
    else if (currentPath === '/comptabilite/paie') { 
        // Filter transactions for 'Salaire' category mainly
        title = "Paie & Salaires"; items = transactions.filter(t => t.category === 'Salaire'); color = "bg-orange-500"; type="Transaction"; formConfig = TRANSACTION_FORM; subtitle="Historique salaires";
    }
    else if (currentPath === '/secretariat/clients') { 
        title = "Gestion Clients"; items = clients; color = "bg-blue-500"; type="Client"; formConfig = CLIENT_FORM;
    }
    else if (currentPath === '/secretariat/caisse') {
        // Caisse uses transaction but specific view
        title = "Caisse Menu"; items = transactions.filter(t => t.category === 'Caisse'); color = "bg-gray-600"; type="Transaction"; formConfig = CAISSE_FORM; subtitle="Petite Caisse & Dépenses Courantes";
    }
    else if (currentPath === '/secretariat/planning') { 
        // Planning is essentially Intervention list view (reuse)
        title = "Planning Global"; items = interventions; color = "bg-indigo-500"; type="Intervention";
        return <ModulePlaceholder title={title} items={items} onBack={() => handleNavigate(`/${moduleName}`)} 
            onAdd={!isReadOnly ? () => openInterventionModal() : undefined} 
            onEdit={!isReadOnly ? (item: any) => openInterventionModal(item) : undefined}
            onDelete={!isReadOnly ? (item: any) => setDeleteModalConfig({isOpen:true, itemId:item.id, type}) : undefined} 
            color={color} currentSite={currentSite} currentPeriod={currentPeriod} readOnly={isReadOnly} />;
    }
    else if (currentPath === '/quincaillerie/fournisseurs') { 
        title = "Fournisseurs"; items = suppliers; color = "bg-green-600"; type="Supplier"; formConfig = SUPPLIER_FORM;
    }
    else if (currentPath === '/quincaillerie/achats') { 
        title = "Achats Matériel"; items = transactions.filter(t => t.category === 'Achat Matériel' || t.category === 'Achats'); color = "bg-red-500"; type="Transaction"; formConfig = TRANSACTION_FORM;
    }
    
    return <ModulePlaceholder 
        title={title} 
        subtitle={subtitle}
        items={items} 
        onBack={() => handleNavigate(`/${moduleName}`)} 
        onAdd={!isReadOnly && formConfig ? () => openModal(formConfig!) : undefined} 
        onEdit={!isReadOnly && formConfig ? (item: any) => openModal(formConfig!, item) : undefined}
        onDelete={!isReadOnly ? (item: any) => setDeleteModalConfig({isOpen:true, itemId:item.id, type}) : undefined} 
        color={color} 
        currentSite={currentSite} 
        currentPeriod={currentPeriod} 
        readOnly={isReadOnly} 
    />;
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
             session={session}
          />
          
          <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
             {renderContent()}
          </main>
       </div>

       {/* Modals */}
       <DynamicModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} config={modalConfig} initialData={editingItem} onSubmit={handleSaveItem} />
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

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setUserProfile(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-ebf-green" size={48} />
      </div>
    );
  }

  if (!session) {
    return <LoginScreen onLogin={() => {}} />;
  }

  return (
    <AppContent 
      session={session} 
      onLogout={async () => await supabase.auth.signOut()} 
      userRole={userProfile?.role || 'Visiteur'} 
      userProfile={userProfile} 
    />
  );
};

export default App;