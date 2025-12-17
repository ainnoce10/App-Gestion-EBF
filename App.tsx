
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  LayoutDashboard, Wrench, Briefcase, ShoppingCart, Menu, X, Bell, Search, Settings,
  HardHat, DollarSign, LogOut, Calculator, Users, Calendar, FolderOpen, Truck, 
  FileText, UserCheck, CreditCard, Archive, ShieldCheck, ClipboardList, ArrowLeft, ChevronRight, Mic, Send, Save, Plus, CheckCircle, Trash2, User, HelpCircle, Moon, Sun, Play, StopCircle, RefreshCw, FileInput, MapPin, Volume2, Megaphone, AlertCircle, Filter, TrendingUp, Edit, ArrowUp, ArrowDown, AlertTriangle, Loader2, Mail, Lock, UserPlus, ScanFace, Fingerprint, Phone, CheckSquare, Key, MoveUp, MoveDown, Eye, EyeOff, Sparkles, Target, RefreshCcw, Shield
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
    title: 'Ajouter au Stock (Consommable)',
    fields: [
      { name: 'name', label: 'Nom Article', type: 'text' },
      { name: 'quantity', label: 'Quantité', type: 'number' },
      { name: 'unit', label: 'Unité (ex: pcs, m)', type: 'text' },
      { name: 'threshold', label: 'Seuil Alerte', type: 'number' },
      { name: 'site', label: 'Site', type: 'select', options: ['Abidjan', 'Bouaké'] }
    ]
  },
  materials: {
    title: 'Nouveau Matériel (Outillage)',
    fields: [
      { name: 'name', label: 'Nom de l\'outil', type: 'text' },
      { name: 'serialNumber', label: 'N° Série / Réf', type: 'text' },
      { name: 'condition', label: 'État', type: 'select', options: ['Neuf', 'Bon', 'Usé', 'Panne'] },
      { name: 'assignedTo', label: 'Affecté à (Technicien)', type: 'text' },
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
  },
  payrolls: {
    title: 'Bulletin de Paie',
    fields: [
      { name: 'employee_name', label: 'Employé', type: 'text' },
      { name: 'amount', label: 'Montant Net (FCFA)', type: 'number' },
      { name: 'period', label: 'Mois concerné', type: 'text', placeholder: 'Ex: Mars 2024' },
      { name: 'date', label: 'Date paiement', type: 'date' },
      { name: 'status', label: 'Statut', type: 'select', options: ['Payé', 'En attente'] }
    ]
  },
  clients: {
    title: 'Nouveau Client',
    fields: [
      { name: 'name', label: 'Nom Client / Entreprise', type: 'text' },
      { name: 'phone', label: 'Téléphone', type: 'text' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'address', label: 'Adresse', type: 'text' },
      { name: 'site', label: 'Ville', type: 'select', options: ['Abidjan', 'Bouaké'] },
      { name: 'type', label: 'Type', type: 'select', options: ['Particulier', 'Entreprise'] }
    ]
  },
  caisse: {
    title: 'Mouvement Caisse',
    fields: [
      { name: 'label', label: 'Motif', type: 'text' },
      { name: 'amount', label: 'Montant (FCFA)', type: 'number' },
      { name: 'type', label: 'Flux', type: 'select', options: ['Entrée', 'Sortie'] },
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'operator', label: 'Opérateur', type: 'text' }
    ]
  },
  suppliers: {
    title: 'Nouveau Fournisseur',
    fields: [
      { name: 'name', label: 'Nom Entreprise', type: 'text' },
      { name: 'contact', label: 'Contact Principal', type: 'text' },
      { name: 'phone', label: 'Téléphone', type: 'text' },
      { name: 'category', label: 'Spécialité', type: 'select', options: ['Électricité', 'Plomberie', 'Froid', 'Matériaux', 'Divers'] },
      { name: 'site', label: 'Zone', type: 'select', options: ['Abidjan', 'Bouaké', 'National'] }
    ]
  },
  purchases: {
    title: 'Bon d\'Achat',
    fields: [
      { name: 'item_name', label: 'Article / Service', type: 'text' },
      { name: 'supplier', label: 'Fournisseur', type: 'text' },
      { name: 'quantity', label: 'Quantité', type: 'number' },
      { name: 'cost', label: 'Coût Total (FCFA)', type: 'number' },
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'status', label: 'Statut', type: 'select', options: ['Commandé', 'Reçu', 'Annulé'] }
    ]
  }
};

const MAIN_MENU: MenuItem[] = [
  { id: 'accueil', label: 'Accueil', icon: LayoutDashboard, path: '/', description: 'Vue d\'ensemble', colorClass: 'text-orange-500' },
  { id: 'techniciens', label: 'Techniciens', icon: HardHat, path: '/techniciens', description: 'Gestion opérationnelle', colorClass: 'text-gray-600' },
  { id: 'comptabilite', label: 'Comptabilité', icon: Calculator, path: '/comptabilite', description: 'Finance & RH', colorClass: 'text-gray-600' },
  { id: 'secretariat', label: 'Secrétariat', icon: FolderOpen, path: '/secretariat', description: 'Administration', colorClass: 'text-gray-600' },
  { id: 'quincaillerie', label: 'Quincaillerie', icon: ShoppingCart, path: '/quincaillerie', description: 'Logistique & Stocks', colorClass: 'text-gray-600' },
  { id: 'equipe', label: 'Notre Équipe', icon: Users, path: '/equipe', description: 'Membres & Rôles', colorClass: 'text-gray-600' },
];

const MODULE_ACTIONS: Record<string, ModuleAction[]> = {
  techniciens: [
    { id: 'interventions', label: 'Interventions', description: 'Planning des interventions', managedBy: 'Géré par le Superviseur', icon: Wrench, path: '/techniciens/interventions', color: 'bg-orange-500' },
    { id: 'rapports', label: 'Rapports Journaliers', description: 'Vocal ou Formulaire détaillé', managedBy: 'Géré par les Techniciens', icon: FileText, path: '/techniciens/rapports', color: 'bg-gray-700' },
    { id: 'materiel', label: 'Matériel & Outils', description: 'Inventaire & Affectation', managedBy: 'Géré par le Magasinier', icon: Truck, path: '/techniciens/materiel', color: 'bg-blue-600' },
    { id: 'chantiers', label: 'Chantiers', description: 'Suivi & Exécution', managedBy: 'Géré par le Chef de Chantier', icon: ShieldCheck, path: '/techniciens/chantiers', color: 'bg-green-600' },
  ],
  comptabilite: [
    { id: 'bilan', label: 'Bilan Financier', description: 'Journal des transactions', icon: DollarSign, path: '/comptabilite/bilan', color: 'bg-green-600' },
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

const isInPeriod = (dateStr: string, period: Period): boolean => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  if (period === Period.DAY) {
    return dateStr === todayStr;
  } else if (period === Period.WEEK) {
    const today = new Date();
    const day = today.getDay();
    const diffToMonday = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today);
    monday.setDate(diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return date >= monday && date <= sunday;
  } else if (period === Period.MONTH) {
    return dateStr.startsWith(todayStr.substring(0, 7));
  } else if (period === Period.YEAR) {
    return dateStr.startsWith(todayStr.substring(0, 4));
  }
  return true;
};

// --- SUB-COMPONENTS (RESTORED) ---

const LoadingScreen = () => (
  <div className="flex items-center justify-center h-screen bg-green-950">
    <div className="flex flex-col items-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      <p className="mt-4 text-white font-medium">Chargement de EBF Manager...</p>
    </div>
  </div>
);

const LoginScreen = ({ onLoginSuccess }: { onLoginSuccess: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else onLoginSuccess();
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col items-center mb-8">
           <EbfLogo size="large" />
           <p className="text-gray-500 mt-2">Gestion Immobilière & Technique</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-ebf-green text-white p-3 rounded-lg font-bold hover:bg-green-700 transition">
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
};

const OnboardingFlow = ({ role, onComplete }: { role: string; onComplete: () => void }) => (
  <div className="flex flex-col items-center justify-center h-screen bg-white dark:bg-gray-900 p-6 text-center">
    <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6 text-ebf-orange">
      <Sparkles size={40} />
    </div>
    <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Bienvenue sur EBF Manager !</h1>
    <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">Interface personnalisée pour : <span className="font-bold text-ebf-green">{role}</span>.</p>
    <button onClick={onComplete} className="bg-ebf-green text-white px-10 py-3 rounded-xl font-bold hover:bg-green-700 transition shadow-lg">Continuer</button>
  </div>
);

const EbfLogo = ({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) => (
  <div className={`font-black tracking-tighter flex items-baseline ${size === 'small' ? 'text-xl' : size === 'large' ? 'text-5xl' : 'text-3xl'}`}>
    <span className="text-ebf-green">E</span>
    <span className="text-ebf-orange">B</span>
    <span className="text-ebf-green">F</span>
  </div>
);

const HeaderWithNotif = ({ title, onMenuClick, onLogout, notifications, userProfile, userRole, markNotificationAsRead, onOpenProfile, onOpenFlashInfo, onOpenHelp, darkMode, onToggleTheme }: any) => {
  const [showNotifs, setShowNotifs] = useState(false);
  const unreadCount = notifications.filter((n: any) => !n.read).length;

  return (
    <header className="bg-white dark:bg-gray-800 h-20 shadow-sm px-4 md:px-6 flex items-center justify-between z-30 border-b border-gray-100 dark:border-gray-700">
      <div className="flex items-center">
        <button onClick={onMenuClick} className="lg:hidden mr-4 text-gray-600 dark:text-gray-300 p-1"><Menu /></button>
        <h1 className="text-lg md:text-xl font-bold text-gray-800 dark:text-white truncate max-w-[150px] md:max-w-none">{title}</h1>
      </div>
      <div className="flex items-center space-x-2 md:space-x-4">
        <button onClick={onToggleTheme} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors">
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <div className="relative">
          <button onClick={() => setShowNotifs(!showNotifs)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 relative transition-colors">
            <Bell size={20} />
            {unreadCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white dark:border-gray-800">{unreadCount}</span>}
          </button>
          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 py-2 max-h-96 overflow-y-auto z-50 animate-fade-in">
              <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                <span className="font-bold text-sm">Notifications</span>
                <button onClick={() => setShowNotifs(false)} className="text-gray-400 hover:text-gray-600"><X size={16}/></button>
              </div>
              {notifications.length === 0 ? (
                <div className="px-4 py-12 text-center text-gray-400 text-sm">Aucune notification.</div>
              ) : (
                notifications.map((n: any) => (
                  <div key={n.id} onClick={() => markNotificationAsRead(n)} className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition ${!n.read ? 'bg-orange-50/30 dark:bg-orange-900/10' : ''}`}>
                    <p className="text-sm font-bold text-gray-800 dark:text-white">{n.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        <button onClick={onOpenFlashInfo} className="p-2 rounded-lg hover:bg-orange-50 text-ebf-orange transition-colors"><Megaphone size={20} /></button>
        <button onClick={onOpenHelp} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"><HelpCircle size={20} /></button>
        <button onClick={onOpenProfile} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"><User size={20} /></button>
        <button onClick={onLogout} className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"><LogOut size={20} /></button>
      </div>
    </header>
  );
};

const ModulePlaceholder = ({ title, subtitle, items, onBack, color, currentSite, currentPeriod, onAdd, onDelete, readOnly }: any) => {
  const filteredItems = items.filter((item: any) => {
    if (currentSite && currentSite !== Site.GLOBAL && item.site && item.site !== currentSite) return false;
    if (currentPeriod && item.date && !isInPeriod(item.date, currentPeriod)) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button onClick={onBack} className="flex items-center text-gray-500 hover:text-ebf-orange mb-2 transition text-sm font-medium">
            <ArrowLeft size={16} className="mr-1" /> Retour
          </button>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
            <span className={`w-2 h-8 ${color} rounded-full`}></span>
            {title}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{subtitle}</p>
        </div>
        {!readOnly && onAdd && (
          <button onClick={onAdd} className={`${color} text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg transition hover:scale-105 active:scale-95 font-bold`}>
            <Plus size={20} /> Ajouter
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Détails</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Site</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {filteredItems.length === 0 ? (
                <tr><td colSpan={3} className="px-6 py-20 text-center text-gray-400 italic">Aucun élément disponible.</td></tr>
              ) : (
                filteredItems.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-800 dark:text-white">{item.name || item.client || item.label || item.full_name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.date || item.description || item.specialty || item.phone}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{item.site || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      {!readOnly && onDelete && (
                        <button onClick={() => onDelete(item)} className="p-2 text-red-300 hover:text-red-500 transition"><Trash2 size={18} /></button>
                      )}
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

const ReportModeSelector = ({ reports, onSelectMode, onBack, onViewReport, readOnly }: any) => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <button onClick={onBack} className="flex items-center text-gray-500 hover:text-ebf-orange mb-2 transition text-sm font-medium">
        <ArrowLeft size={16} className="mr-1" /> Retour
      </button>
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Rapports Journaliers</h2>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <button onClick={() => onSelectMode('form')} className="bg-white dark:bg-gray-800 hover:bg-orange-50 dark:hover:bg-gray-700 p-8 rounded-2xl shadow-sm border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-ebf-orange transition flex flex-col items-center group">
        <div className="w-20 h-20 bg-orange-100 text-ebf-orange rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition"><FileText size={40} /></div>
        <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">Formulaire</h3>
        <p className="text-gray-500 dark:text-gray-400 text-center text-sm">Remplissez les détails manuellement.</p>
      </button>
      <button onClick={() => onSelectMode('voice')} className="bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-gray-700 p-8 rounded-2xl shadow-sm border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-red-400 transition flex flex-col items-center group">
        <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition"><Mic size={40} /></div>
        <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">Vocal</h3>
        <p className="text-gray-500 dark:text-gray-400 text-center text-sm">Enregistrez un rapport audio via l'IA.</p>
      </button>
    </div>
  </div>
);

const ProfileModal = ({ isOpen, onClose, profile }: any) => isOpen && (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-green-950/40 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in">
       <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Mon Profil</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
       </div>
       <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-2xl font-bold text-ebf-green mb-4">
             {profile?.full_name?.charAt(0) || 'U'}
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{profile?.full_name}</h3>
          <p className="text-ebf-orange font-bold uppercase text-xs mb-4">{profile?.role}</p>
          <div className="w-full space-y-2 text-left">
             <div className="flex justify-between text-sm border-b pb-2"><span className="text-gray-500">Email:</span> <span>{profile?.email}</span></div>
             <div className="flex justify-between text-sm border-b pb-2"><span className="text-gray-500">Site:</span> <span>{profile?.site}</span></div>
          </div>
       </div>
    </div>
  </div>
);

const HelpModal = ({ isOpen, onClose }: any) => isOpen && (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-green-950/40 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
       <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Centre d'aide</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
       </div>
       <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
          <p className="font-bold text-gray-800 dark:text-white">Gestion des Rapports</p>
          <p>Utilisez l'onglet Techniciens pour soumettre vos rapports quotidiens.</p>
          <p className="font-bold text-gray-800 dark:text-white">Analyse Business</p>
          <p>La synthèse utilise l'IA Gemini pour résumer les performances financières.</p>
       </div>
    </div>
  </div>
);

const FlashInfoModal = ({ isOpen, onClose, messages, onSaveMessage, onDeleteMessage }: any) => {
  const [text, setText] = useState('');
  const [type, setType] = useState('info');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-green-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
         <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Messages Flash</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
         </div>
         <div className="mb-4 space-y-2">
            <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Nouveau message..." className="w-full p-2 border rounded dark:bg-gray-700" rows={2}></textarea>
            <div className="flex justify-between items-center">
               <select value={type} onChange={e => setType(e.target.value)} className="text-sm p-1 border rounded dark:bg-gray-700">
                  <option value="info">Info</option>
                  <option value="alert">Alerte</option>
                  <option value="success">Succès</option>
               </select>
               <button onClick={() => { onSaveMessage(text, type); setText(''); }} className="bg-ebf-orange text-white px-4 py-1 rounded font-bold text-sm">Publier</button>
            </div>
         </div>
         <div className="flex-1 overflow-y-auto space-y-2">
            {messages.map((m: any) => (
               <div key={m.id} className="p-2 bg-gray-50 dark:bg-gray-700 rounded flex justify-between items-center">
                  <p className="text-sm">{m.text}</p>
                  <button onClick={() => onDeleteMessage(m.id)} className="text-red-400"><Trash2 size={14}/></button>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
};

const AddModal = ({ isOpen, onClose, config, onSubmit, loading }: any) => {
  const [formData, setFormData] = useState<any>({});

  if (!isOpen || !config) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-green-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
         <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-white">{config.title}</h2>
         <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
            {config.fields.map((f: any) => (
               <div key={f.name}>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{f.label}</label>
                  {f.type === 'select' ? (
                     <select onChange={e => setFormData({...formData, [f.name]: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700" required>
                        <option value="">Sélectionner...</option>
                        {f.options.map((o: any) => <option key={o} value={o}>{o}</option>)}
                     </select>
                  ) : (
                     <input type={f.type} onChange={e => setFormData({...formData, [f.name]: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700" required />
                  )}
               </div>
            ))}
            <div className="flex gap-2 pt-4">
               <button type="button" onClick={onClose} className="flex-1 py-2 border rounded hover:bg-gray-50 transition">Annuler</button>
               <button type="submit" disabled={loading} className="flex-1 py-2 bg-ebf-green text-white rounded font-bold hover:bg-green-700 transition">
                  {loading ? 'Enregistrement...' : 'Confirmer'}
               </button>
            </div>
         </form>
      </div>
    </div>
  );
};

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }: any) => isOpen && (
  <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-green-950/60 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-fade-in text-center">
       <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto text-red-500"><AlertTriangle size={32} /></div>
       <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{title}</h2>
       <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
       <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 border rounded hover:bg-gray-50 transition">Non</button>
          <button onClick={onConfirm} className="flex-1 py-2 bg-red-500 text-white rounded font-bold hover:bg-red-600 transition">Oui</button>
       </div>
    </div>
  </div>
);

const AppContent = ({ session, onLogout, userRole, userProfile }: any) => {
  const [currentPath, setCurrentPath] = useState('/');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentSite, setCurrentSite] = useState<Site>(Site.GLOBAL);
  const [currentPeriod, setCurrentPeriod] = useState<Period>(Period.MONTH);
  const [darkMode, setDarkMode] = useState(false);
  
  const [stats, setStats] = useState<StatData[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [materials, setMaterials] = useState<any[]>([]); 
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [manualTickerMessages, setManualTickerMessages] = useState<TickerMessage[]>([]);
  const [autoTickerMessages, setAutoTickerMessages] = useState<TickerMessage[]>([]);

  const [chantiers, setChantiers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [caisse, setCaisse] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isFlashInfoOpen, setIsFlashInfoOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [crudTarget, setCrudTarget] = useState('');
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [crudLoading, setCrudLoading] = useState(false);

  // Helper mapping table name to setter
  const stateSetterMap: Record<string, any> = {
    interventions: setInterventions,
    stocks: setStock,
    materials: setMaterials,
    technicians: setTechnicians,
    reports: setReports,
    chantiers: setChantiers,
    transactions: setTransactions,
    employees: setEmployees,
    payrolls: setPayrolls,
    clients: setClients,
    caisse: setCaisse,
    suppliers: setSuppliers,
    purchases: setPurchases,
    ticker_messages: setManualTickerMessages,
    notifications: setNotifications
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data: intervData } = await supabase.from('interventions').select('*');
      if (intervData) setInterventions(intervData);
      const { data: stockData } = await supabase.from('stocks').select('*');
      if (stockData) setStock(stockData);
      const { data: matData } = await supabase.from('materials').select('*');
      if (matData) setMaterials(matData);
      const { data: techData } = await supabase.from('technicians').select('*');
      if (techData) setTechnicians(techData);
      const { data: reportsData } = await supabase.from('reports').select('*');
      if (reportsData) setReports(reportsData);
      const { data: statsData } = await supabase.from('daily_stats').select('*');
      if (statsData) setStats(statsData);
      const { data: notifData } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
      if (notifData) setNotifications(notifData);
      const { data: tickerData } = await supabase.from('ticker_messages').select('*').order('display_order', { ascending: true });
      if (tickerData) setManualTickerMessages(tickerData.map((m: any) => ({ ...m, isManual: true })));

      const { data: chantiersData } = await supabase.from('chantiers').select('*');
      if (chantiersData) setChantiers(chantiersData);
      const { data: transData } = await supabase.from('transactions').select('*');
      if (transData) setTransactions(transData);
      const { data: empData } = await supabase.from('employees').select('*');
      if (empData) setEmployees(empData);
      const { data: payrollData } = await supabase.from('payrolls').select('*');
      if (payrollData) setPayrolls(payrollData);
      const { data: clientData } = await supabase.from('clients').select('*');
      if (clientData) setClients(clientData);
      const { data: caisseData } = await supabase.from('caisse').select('*');
      if (caisseData) setCaisse(caisseData);
      const { data: suppData } = await supabase.from('suppliers').select('*');
      if (suppData) setSuppliers(suppData);
      const { data: purchData } = await supabase.from('purchases').select('*');
      if (purchData) setPurchases(purchData);
    };

    fetchData();

    // Setup Realtime with a robust update logic
    const channels = supabase.channel('ebf-manager-realtime')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
          const table = payload.table;
          const setter = stateSetterMap[table];
          if (!setter) return;

          if (payload.eventType === 'INSERT') {
            setter((prev: any[]) => {
                const exists = prev.some(item => item.id === payload.new.id);
                return exists ? prev : [...prev, payload.new];
            });
          } else if (payload.eventType === 'UPDATE') {
            setter((prev: any[]) => prev.map(item => item.id === payload.new.id ? payload.new : item));
          } else if (payload.eventType === 'DELETE') {
            setter((prev: any[]) => prev.filter(item => item.id !== payload.old.id));
          }
      })
      .subscribe();

    return () => { supabase.removeChannel(channels); };
  }, []);

  const realTimeStats = useMemo(() => {
    const statsMap = new Map<string, StatData>();

    reports.forEach(report => {
        if (!report.date) return;
        const key = `${report.date}_${report.site || 'Global'}`;
        if (!statsMap.has(key)) {
            statsMap.set(key, { id: key, date: report.date, site: report.site as Site, revenue: 0, expenses: 0, profit: 0, interventions: 0 });
        }
        const stat = statsMap.get(key)!;
        stat.revenue += Number(report.revenue || 0);
        stat.expenses += Number(report.expenses || 0);
        stat.interventions += 1;
    });

    transactions.forEach(trans => {
        if (!trans.date) return;
        const key = `${trans.date}_${trans.site || 'Global'}`;
        if (!statsMap.has(key)) {
            statsMap.set(key, { id: key, date: trans.date, site: trans.site as Site, revenue: 0, expenses: 0, profit: 0, interventions: 0 });
        }
        const stat = statsMap.get(key)!;
        if (trans.type === 'Recette') stat.revenue += Number(trans.amount || 0);
        else if (trans.type === 'Dépense') stat.expenses += Number(trans.amount || 0);
    });

    return Array.from(statsMap.values()).map(stat => ({
        ...stat,
        profit: stat.revenue - stat.expenses
    })).sort((a, b) => a.date.localeCompare(b.date));
  }, [reports, transactions]);

  // --- OPTIMISTIC CRUD HANDLERS ---
  const confirmAdd = async (formData: any) => {
      if (!crudTarget) return;
      setCrudLoading(true);
      
      const config = FORM_CONFIGS[crudTarget];
      const processedData = { ...formData };
      if (!processedData.site) processedData.site = currentSite !== Site.GLOBAL ? currentSite : Site.ABIDJAN;
      if (config) config.fields.forEach(f => { if (f.type === 'number' && processedData[f.name]) processedData[f.name] = Number(processedData[f.name]); });
      
      const { data, error } = await supabase.from(crudTarget).insert([processedData]).select();
      setCrudLoading(false);
      
      if (error) {
          alert("Erreur: " + error.message);
      } else if (data && data.length > 0) {
          const setter = stateSetterMap[crudTarget];
          if (setter) {
              setter((prev: any[]) => [...prev, data[0]]);
          }
          setIsAddOpen(false);
      }
  };

  const confirmDelete = async () => {
      if (!itemToDelete || !crudTarget) return;
      setCrudLoading(true);
      
      const { error } = await supabase.from(crudTarget).delete().eq('id', itemToDelete.id);
      setCrudLoading(false);
      
      if (error) {
          alert("Erreur: " + error.message);
      } else {
          const setter = stateSetterMap[crudTarget];
          if (setter) {
              setter((prev: any[]) => prev.filter(i => i.id !== itemToDelete.id));
          }
          setIsDeleteOpen(false);
          setItemToDelete(null);
      }
  };

  const handleDeleteDirectly = async (id: string, table: string) => {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) {
          alert("Erreur: " + error.message);
      } else {
          const setter = stateSetterMap[table];
          if (setter) setter((prev: any[]) => prev.filter(i => i.id !== id));
      }
  };

  const toggleTheme = () => { setDarkMode(!darkMode); document.documentElement.classList.toggle('dark'); };
  const handleNavigate = (path: string) => { setCurrentPath(path); setIsMenuOpen(false); };
  const handleOpenAdd = (table: string) => { setCrudTarget(table); setIsAddOpen(true); };
  const handleOpenDelete = (item: any, table: string) => { setItemToDelete(item); setCrudTarget(table); setIsDeleteOpen(true); };

  const combinedTickerMessages = useMemo(() => [...manualTickerMessages, ...autoTickerMessages], [manualTickerMessages, autoTickerMessages]);

  const renderContent = () => {
     if (currentPath === '/') return <Dashboard data={realTimeStats} reports={reports} tickerMessages={combinedTickerMessages} stock={stock} currentSite={currentSite} currentPeriod={currentPeriod} onSiteChange={setCurrentSite} onPeriodChange={setCurrentPeriod} onNavigate={handleNavigate} onDeleteReport={(id) => handleDeleteDirectly(id, 'reports')} />;
     if (currentPath === '/synthesis') return <DetailedSynthesis data={realTimeStats} reports={reports} currentSite={currentSite} currentPeriod={currentPeriod} onSiteChange={setCurrentSite} onPeriodChange={setCurrentPeriod} onNavigate={handleNavigate} onViewReport={(r) => alert(`Détail: ${r.content}`)} />;
     
     const section = currentPath.substring(1);
     if (MODULE_ACTIONS[section]) return (
             <div className="space-y-6 animate-fade-in">
                 <h2 className="text-2xl font-bold text-gray-800 dark:text-white capitalize flex items-center gap-2"><ArrowLeft className="cursor-pointer" onClick={() => handleNavigate('/')} /> Module {section}</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {MODULE_ACTIONS[section].map((action) => (
                        <button key={action.id} onClick={() => handleNavigate(action.path)} className={`bg-white hover:bg-orange-50 p-6 rounded-xl shadow-md border border-gray-100 hover:border-orange-200 transition transform hover:-translate-y-1 text-left group`}>
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${action.color.replace('bg-', 'bg-').replace('600', '100').replace('500', '100')} ${action.color.replace('bg-', 'text-').replace('600', '600').replace('500', '600')}`}><action.icon size={24} /></div>
                            <h3 className="text-xl font-bold mb-1 text-gray-800 group-hover:text-ebf-orange">{action.label}</h3>
                            <p className="text-gray-500 text-sm">{action.description}</p>
                            {action.managedBy && <p className="text-[10px] text-gray-400 mt-3 font-medium uppercase tracking-wider">{action.managedBy}</p>}
                        </button>
                    ))}
                 </div>
             </div>
     );

     if (currentPath === '/techniciens/interventions') return <ModulePlaceholder title="Interventions" subtitle="Planning" items={interventions} onBack={() => handleNavigate('/techniciens')} color="bg-orange-500" currentSite={currentSite} currentPeriod={currentPeriod} onAdd={() => handleOpenAdd('interventions')} onDelete={(item: any) => handleOpenDelete(item, 'interventions')} readOnly={false} />;
     if (currentPath === '/techniciens/rapports') return <ReportModeSelector reports={reports} onSelectMode={(mode: string) => { if (mode === 'form') handleOpenAdd('reports'); else alert("Rapport vocal pas encore disponible."); }} onBack={() => handleNavigate('/techniciens')} onViewReport={(r: any) => alert(r.content)} readOnly={false} />;
     if (currentPath === '/techniciens/materiel') return <ModulePlaceholder title="Matériel & Outils" subtitle="Inventaire Outillage" items={materials} onBack={() => handleNavigate('/techniciens')} color="bg-blue-600" currentSite={currentSite} onAdd={() => handleOpenAdd('materials')} onDelete={(item: any) => handleOpenDelete(item, 'materials')} readOnly={false} />;
     if (currentPath === '/quincaillerie/stocks') return <ModulePlaceholder title="Stocks Quincaillerie" subtitle="Inventaire Consommables" items={stock} onBack={() => handleNavigate('/quincaillerie')} color="bg-orange-600" currentSite={currentSite} onAdd={() => handleOpenAdd('stocks')} onDelete={(item: any) => handleOpenDelete(item, 'stocks')} readOnly={false} />;
     if (currentPath === '/equipe') return <ModulePlaceholder title="Notre Équipe" subtitle="Staff" items={technicians} onBack={() => handleNavigate('/')} color="bg-indigo-500" currentSite={currentSite} onAdd={() => handleOpenAdd('technicians')} onDelete={(item: any) => handleOpenDelete(item, 'technicians')} readOnly={false} />;
     if (currentPath === '/techniciens/chantiers') return <ModulePlaceholder title="Chantiers" subtitle="Suivi & Exécution" items={chantiers} onBack={() => handleNavigate('/techniciens')} color="bg-green-600" currentSite={currentSite} onAdd={() => handleOpenAdd('chantiers')} onDelete={(item: any) => handleOpenDelete(item, 'chantiers')} readOnly={false} />;
     if (currentPath === '/comptabilite/bilan') return <ModulePlaceholder title="Bilan Financier" subtitle="Journal des Transactions" items={transactions} onBack={() => handleNavigate('/comptabilite')} color="bg-green-600" currentSite={currentSite} currentPeriod={currentPeriod} onAdd={() => handleOpenAdd('transactions')} onDelete={(item: any) => handleOpenDelete(item, 'transactions')} readOnly={false} />;
     if (currentPath === '/comptabilite/rh') return <ModulePlaceholder title="Ressources Humaines" subtitle="Employés & Dossiers" items={employees} onBack={() => handleNavigate('/comptabilite')} color="bg-purple-600" currentSite={currentSite} onAdd={() => handleOpenAdd('employees')} onDelete={(item: any) => handleOpenDelete(item, 'employees')} readOnly={false} />;
     if (currentPath === '/comptabilite/paie') return <ModulePlaceholder title="Paie & Salaires" subtitle="Virements" items={payrolls} onBack={() => handleNavigate('/comptabilite')} color="bg-orange-500" currentPeriod={currentPeriod} onAdd={() => handleOpenAdd('payrolls')} onDelete={(item: any) => handleOpenDelete(item, 'payrolls')} readOnly={false} />;
     if (currentPath === '/secretariat/planning') return <ModulePlaceholder title="Planning Équipe" subtitle="Vue d'ensemble" items={interventions} onBack={() => handleNavigate('/secretariat')} color="bg-indigo-500" currentSite={currentSite} currentPeriod={currentPeriod} readOnly={true} />; 
     if (currentPath === '/secretariat/clients') return <ModulePlaceholder title="Gestion Clients" subtitle="CRM" items={clients} onBack={() => handleNavigate('/secretariat')} color="bg-blue-500" currentSite={currentSite} onAdd={() => handleOpenAdd('clients')} onDelete={(item: any) => handleOpenDelete(item, 'clients')} readOnly={false} />;
     if (currentPath === '/secretariat/caisse') return <ModulePlaceholder title="Petite Caisse" subtitle="Mouvements" items={caisse} onBack={() => handleNavigate('/secretariat')} color="bg-gray-600" currentPeriod={currentPeriod} onAdd={() => handleOpenAdd('caisse')} onDelete={(item: any) => handleOpenDelete(item, 'caisse')} readOnly={false} />;
     if (currentPath === '/quincaillerie/fournisseurs') return <ModulePlaceholder title="Fournisseurs" subtitle="Base Contacts" items={suppliers} onBack={() => handleNavigate('/quincaillerie')} color="bg-green-600" currentSite={currentSite} onAdd={() => handleOpenAdd('suppliers')} onDelete={(item: any) => handleOpenDelete(item, 'suppliers')} readOnly={false} />;
     if (currentPath === '/quincaillerie/achats') return <ModulePlaceholder title="Bons d'Achat" subtitle="Historique" items={purchases} onBack={() => handleNavigate('/quincaillerie')} color="bg-red-500" currentPeriod={currentPeriod} onAdd={() => handleOpenAdd('purchases')} onDelete={(item: any) => handleOpenDelete(item, 'purchases')} readOnly={false} />;

     return <div>Module non trouvé</div>;
  };

  return (
    <div className={`flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 ${darkMode ? 'dark' : ''}`}>
        <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-green-950 text-white transform transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-auto shadow-2xl flex flex-col`}>
            <div className="flex items-center justify-between h-20 px-6 bg-green-950/50">
                <div className="transform scale-75 origin-left bg-white p-2 rounded-lg shadow"><EbfLogo size="small" /></div>
                <button onClick={() => setIsMenuOpen(false)} className="lg:hidden text-gray-400 hover:text-white"><X /></button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
                <nav className="space-y-2">
                    {MAIN_MENU.map(item => (
                        <button key={item.id} onClick={() => handleNavigate(item.path)} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 group ${currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path)) ? 'bg-ebf-orange text-white font-bold shadow-lg transform scale-105' : 'text-gray-300 hover:bg-green-900 hover:text-white'}`}>
                            <item.icon size={20} className={`${currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path)) ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>
            </div>
            <div className="p-4 bg-green-900/30">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-green-800 flex items-center justify-center font-bold text-white text-sm border border-green-700">{userProfile?.full_name?.charAt(0) || 'U'}</div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-bold truncate text-white">{userProfile?.full_name || 'Utilisateur'}</p>
                        <p className="text-xs text-gray-300 truncate opacity-80">{userRole}</p>
                    </div>
                </div>
            </div>
        </aside>
        <div className="flex-1 flex flex-col overflow-hidden relative">
             <HeaderWithNotif title="EBF Manager" onMenuClick={() => setIsMenuOpen(true)} onLogout={onLogout} notifications={notifications} userProfile={userProfile} userRole={userRole} markNotificationAsRead={(n: any) => handleDeleteDirectly(n.id, 'notifications')} onOpenProfile={() => setIsProfileOpen(true)} onOpenFlashInfo={() => setIsFlashInfoOpen(true)} onOpenHelp={() => setIsHelpOpen(true)} darkMode={darkMode} onToggleTheme={toggleTheme} />
             <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 relative bg-ebf-pattern dark:bg-gray-900">{renderContent()}</main>
        </div>
        <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} profile={userProfile} />
        <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
        <FlashInfoModal isOpen={isFlashInfoOpen} onClose={() => setIsFlashInfoOpen(false)} messages={combinedTickerMessages} onSaveMessage={async (text: string, type: string) => { await supabase.from('ticker_messages').insert([{ text, type, display_order: combinedTickerMessages.length + 1 }]); }} onDeleteMessage={async (id: string) => { await supabase.from('ticker_messages').delete().eq('id', id); }} />
        <AddModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} config={FORM_CONFIGS[crudTarget]} onSubmit={confirmAdd} loading={crudLoading} />
        <ConfirmationModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={confirmDelete} title="Suppression" message="Voulez-vous supprimer cet élément ?" />
    </div>
  );
};

export default function App() {
  const [appState, setAppState] = useState<'LOADING' | 'LOGIN' | 'ONBOARDING' | 'APP'>('LOADING');
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<Role>('Visiteur');
  const [userProfile, setUserProfile] = useState<Profile | null>(null);

  const fetchUserProfile = async (userId: string) => {
      let { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (!data) {
          const { data: userData } = await supabase.auth.getUser();
          const meta = userData.user?.user_metadata;
          if (meta) {
              const newProfile = { id: userId, full_name: meta.full_name || 'Utilisateur', role: meta.role || 'Visiteur', site: meta.site || 'Global', email: userData.user?.email };
              const { error: insertError } = await supabase.from('profiles').insert([newProfile]);
              if (!insertError) data = newProfile as any;
          }
      }
      if (data) { setUserRole(data.role); setUserProfile(data); return data; }
      return null;
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      if (existingSession) {
         setSession(existingSession);
         await fetchUserProfile(existingSession.user.id);
         setAppState('APP');
      } else { setAppState('LOGIN'); }
    };
    init();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => { if (event === 'SIGNED_OUT') { setSession(null); setUserProfile(null); setAppState('LOGIN'); } });
    return () => subscription.unsubscribe();
  }, []);

  if (appState === 'LOADING') return <LoadingScreen />;
  if (appState === 'LOGIN') return <LoginScreen onLoginSuccess={async () => { const { data: { session } } = await supabase.auth.getSession(); if (session) { setSession(session); await fetchUserProfile(session.user.id); setAppState('APP'); } }} />;
  if (appState === 'ONBOARDING') return <OnboardingFlow role={userRole} onComplete={() => setAppState('APP')} />;

  return <AppContent session={session} onLogout={() => supabase.auth.signOut()} userRole={userRole} userProfile={userProfile} />;
}
