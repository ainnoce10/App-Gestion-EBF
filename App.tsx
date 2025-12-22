

import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, Wrench, Briefcase, ShoppingCart, Menu, X, Bell, Search, Settings,
  HardHat, DollarSign, LogOut, Calculator, Users, Calendar, FolderOpen, Truck, 
  FileText, UserCheck, CreditCard, Archive, ShieldCheck, ClipboardList, ArrowLeft, 
  ChevronRight, Mic, Send, Save, Plus, CheckCircle, Trash2, User, Play, StopCircle, 
  MapPin, Filter, TrendingUp, Edit, AlertTriangle, Loader2, Key, Eye, CheckSquare,
  Building2, Package, UserPlus
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { DetailedSynthesis } from './components/DetailedSynthesis';
import { 
  Site, Period, DailyReport, StockItem, Profile, Role, 
  Intervention, Transaction, Client, Supplier, Chantier, Material 
} from './types';
import { supabase } from './services/supabaseClient';
import { processVoiceReport } from './services/geminiService';
import { 
  DEFAULT_TICKER_MESSAGES, MOCK_STATS, MOCK_STOCK, MOCK_TECHNICIANS, 
  MOCK_INTERVENTIONS, MOCK_REPORTS, MOCK_TRANSACTIONS, MOCK_CLIENTS,
  MOCK_SUPPLIERS, MOCK_CHANTIERS, MOCK_MATERIALS
} from './constants';

// --- Configuration des Menus ---
const MAIN_MENU = [
  { id: 'accueil', label: 'Accueil', icon: LayoutDashboard, path: '/' },
  { id: 'techniciens', label: 'Technique', icon: HardHat, path: '/techniciens' },
  { id: 'comptabilite', label: 'Compta/RH', icon: Calculator, path: '/comptabilite' },
  { id: 'secretariat', label: 'Secrétariat', icon: FolderOpen, path: '/secretariat' },
  { id: 'quincaillerie', label: 'Stocks', icon: ShoppingCart, path: '/quincaillerie' },
];

const MODULE_ACTIONS: Record<string, any[]> = {
  techniciens: [
    { id: 'interventions', label: 'Interventions', description: 'Planning & Exécution', icon: Wrench, path: '/techniciens/interventions', color: 'bg-orange-500', dataKey: 'interventions' },
    { id: 'rapports', label: 'Rapports', description: 'Vocal ou Manuel', icon: FileText, path: '/techniciens/rapports', color: 'bg-gray-700' },
    { id: 'materiel', label: 'Matériel', description: 'Outils & Équipement', icon: Truck, path: '/techniciens/materiel', color: 'bg-blue-600', dataKey: 'materials' },
    { id: 'chantiers', label: 'Chantiers', description: 'Suivi des travaux', icon: ShieldCheck, path: '/techniciens/chantiers', color: 'bg-green-600', dataKey: 'chantiers' },
  ],
  comptabilite: [
    { id: 'bilan', label: 'Bilan Financier', description: 'Flux de trésorerie', icon: DollarSign, path: '/comptabilite/bilan', color: 'bg-green-600', dataKey: 'transactions' },
    { id: 'rh', label: 'RH', description: 'Dossiers employés', icon: Users, path: '/comptabilite/rh', color: 'bg-purple-600', dataKey: 'employees' },
  ],
  secretariat: [
    { id: 'clients', label: 'Base Clients', description: 'Annuaire EBF', icon: UserCheck, path: '/secretariat/clients', color: 'bg-blue-500', dataKey: 'clients' },
    { id: 'planning', label: 'Planning', description: 'Agenda général', icon: Calendar, path: '/secretariat/planning', color: 'bg-indigo-500' },
  ],
  quincaillerie: [
    { id: 'stocks', label: 'Inventaire', description: 'Matériaux & Pièces', icon: ClipboardList, path: '/quincaillerie/stocks', color: 'bg-orange-600', dataKey: 'stocks' },
    { id: 'fournisseurs', label: 'Fournisseurs', description: 'Partenaires achat', icon: Truck, path: '/quincaillerie/fournisseurs', color: 'bg-green-600', dataKey: 'suppliers' },
  ]
};

// --- Composant de Gestion Générique (Liste + Formulaire) ---
const GenericManager = ({ title, data, columns, onAdd, onBack }: any) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-white rounded-full border shadow-sm hover:bg-orange-50 transition"><ArrowLeft size={20}/></button>
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        </div>
        <button onClick={onAdd} className="flex items-center gap-2 bg-ebf-orange text-white px-4 py-2 rounded-xl font-bold shadow-lg hover:scale-105 transition">
          <Plus size={20} /> Ajouter
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {columns.map((col: any) => (
                  <th key={col.key} className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{col.label}</th>
                ))}
                <th className="p-4 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map((item: any) => (
                <tr key={item.id} className="hover:bg-orange-50/30 transition group">
                  {columns.map((col: any) => (
                    <td key={col.key} className="p-4 text-sm">
                      {col.render ? col.render(item[col.key], item) : item[col.key]}
                    </td>
                  ))}
                  <td className="p-4 text-right">
                    <button className="text-gray-400 hover:text-ebf-orange transition p-2"><Edit size={16}/></button>
                    <button className="text-gray-400 hover:text-red-500 transition p-2"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr><td colSpan={columns.length + 1} className="p-12 text-center text-gray-400 italic">Aucune donnée disponible</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- Modal Rapport Vocal ---
const VoiceRecorderModal = ({ isOpen, onClose, onFinish }: any) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<number | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-green-950/80 backdrop-blur-md">
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl border-t-4 border-ebf-orange">
        {isProcessing ? (
          <div className="space-y-6">
            <Loader2 size={64} className="text-ebf-orange animate-spin mx-auto" />
            <h3 className="text-xl font-bold">Analyse Gemini...</h3>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-ebf-orange/10 p-6 rounded-full w-24 h-24 flex items-center justify-center mx-auto animate-pulse">
               <Mic size={40} className="text-ebf-orange" />
            </div>
            <h3 className="text-2xl font-bold">Enregistrement</h3>
            <p className="text-4xl font-mono font-bold text-ebf-orange">00:00</p>
            <button onClick={onClose} className="w-full bg-red-600 text-white font-bold py-4 rounded-xl shadow-lg">Arrêter</button>
            <button onClick={onClose} className="text-gray-400 font-bold">Annuler</button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main Application ---
export default function App() {
  const [currentPath, setCurrentPath] = useState('/');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentSite, setCurrentSite] = useState<Site>(Site.GLOBAL);
  const [currentPeriod, setCurrentPeriod] = useState<Period>(Period.MONTH);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  
  // États des données
  const [reports, setReports] = useState<DailyReport[]>(MOCK_REPORTS);
  const [stock, setStock] = useState<StockItem[]>(MOCK_STOCK);
  const [interventions, setInterventions] = useState<Intervention[]>(MOCK_INTERVENTIONS);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(MOCK_SUPPLIERS);
  const [chantiers, setChantiers] = useState<Chantier[]>(MOCK_CHANTIERS);
  const [materials, setMaterials] = useState<Material[]>(MOCK_MATERIALS);

  const handleNavigate = (path: string) => { setCurrentPath(path); setIsMenuOpen(false); };

  const renderContent = () => {
    // 1. Dashboard Principal
    if (currentPath === '/') return (
      <Dashboard 
        data={MOCK_STATS} reports={reports} tickerMessages={DEFAULT_TICKER_MESSAGES} stock={stock} 
        currentSite={currentSite} currentPeriod={currentPeriod} 
        onSiteChange={setCurrentSite} onPeriodChange={setCurrentPeriod} onNavigate={handleNavigate} 
      />
    );

    // 2. Synthèse Détaillée
    if (currentPath === '/synthesis') return (
      <DetailedSynthesis 
        data={MOCK_STATS} reports={reports} currentSite={currentSite} currentPeriod={currentPeriod}
        onSiteChange={setCurrentSite} onPeriodChange={setCurrentPeriod} onNavigate={handleNavigate}
        onViewReport={(r) => alert(r.content)}
      />
    );

    // 3. Vues des Modules (Grille d'actions)
    if (['/techniciens', '/comptabilite', '/secretariat', '/quincaillerie'].includes(currentPath)) {
      const section = currentPath.substring(1);
      const actions = MODULE_ACTIONS[section];
      return (
        <div className="space-y-8 animate-fade-in">
          <div className="flex items-center gap-4">
             <button onClick={() => handleNavigate('/')} className="p-2 bg-white rounded-full border shadow-sm"><ArrowLeft size={20}/></button>
             <h2 className="text-2xl font-bold capitalize">Module {section === 'techniciens' ? 'Technique' : section}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {actions.map(a => (
              <button key={a.id} onClick={() => handleNavigate(a.path)} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:border-ebf-orange hover:shadow-xl transition flex flex-col items-center gap-4 group">
                <div className={`${a.color} p-5 rounded-2xl text-white group-hover:scale-110 transition shadow-lg`}><a.icon size={32}/></div>
                <div className="text-center"><h3 className="font-bold text-lg text-gray-800">{a.label}</h3><p className="text-xs text-gray-500 mt-1">{a.description}</p></div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-ebf-orange group-hover:translate-x-1 transition"/>
              </button>
            ))}
          </div>
        </div>
      );
    }

    // 4. Sous-Modules Spécifiques (Listes de données)
    if (currentPath === '/techniciens/interventions') return (
      <GenericManager title="Planning Interventions" data={interventions} onBack={() => handleNavigate('/techniciens')} onAdd={() => {}} columns={[
        { key: 'date', label: 'Date' },
        { key: 'client', label: 'Client', render: (val: any, row: any) => <div><p className="font-bold">{val}</p><p className="text-xs text-gray-500">{row.location}</p></div> },
        { key: 'description', label: 'Problème' },
        { key: 'status', label: 'Statut', render: (val: string) => <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${val === 'Completed' ? 'bg-green-100 text-green-700' : val === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{val}</span> },
      ]} />
    );

    if (currentPath === '/techniciens/rapports') return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center gap-4">
            <button onClick={() => handleNavigate('/techniciens')} className="p-2 bg-white rounded-full border shadow-sm"><ArrowLeft size={20}/></button>
            <h2 className="text-2xl font-bold">Rapports Journaliers</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <button onClick={() => setIsVoiceOpen(true)} className="bg-gradient-to-br from-ebf-orange to-orange-600 text-white p-12 rounded-3xl shadow-xl flex flex-col items-center gap-6 hover:scale-[1.02] transition border border-orange-400">
             <Mic size={64}/> <div className="text-center"><h3 className="text-2xl font-bold">Rapport Vocal</h3><p className="opacity-80">Dictée intelligente (Gemini AI)</p></div>
           </button>
           <button className="bg-white p-12 rounded-3xl shadow-md border border-gray-100 flex flex-col items-center gap-6 hover:border-ebf-orange transition">
             <FileText size={64} className="text-gray-400 group-hover:text-ebf-orange"/> <div className="text-center text-gray-800"><h3 className="text-2xl font-bold">Formulaire Manuel</h3><p className="text-gray-500">Saisie structurée classique</p></div>
           </button>
        </div>
      </div>
    );

    if (currentPath === '/techniciens/chantiers') return (
        <GenericManager title="Suivi des Chantiers" data={chantiers} onBack={() => handleNavigate('/techniciens')} onAdd={() => {}} columns={[
          { key: 'name', label: 'Chantier', render: (v:any) => <span className="font-bold text-gray-800">{v}</span> },
          { key: 'client', label: 'Client' },
          { key: 'status', label: 'État', render: (v:string) => <span className="text-xs font-bold px-2 py-1 bg-gray-100 rounded">{v}</span> },
          { key: 'budget', label: 'Budget', render: (v:number) => <span className="font-bold text-green-700">{v?.toLocaleString()} F</span> }
        ]} />
    );

    if (currentPath === '/comptabilite/bilan') return (
      <GenericManager title="Journal des Transactions" data={transactions} onBack={() => handleNavigate('/comptabilite')} onAdd={() => {}} columns={[
        { key: 'date', label: 'Date' },
        { key: 'label', label: 'Libellé' },
        { key: 'category', label: 'Catégorie' },
        { key: 'type', label: 'Type', render: (v:string) => <span className={`font-bold ${v === 'Recette' ? 'text-green-600' : 'text-red-500'}`}>{v}</span> },
        { key: 'amount', label: 'Montant', render: (v:number) => <span className="font-bold">{v?.toLocaleString()} F</span> }
      ]} />
    );

    if (currentPath === '/quincaillerie/stocks') return (
      <GenericManager title="État des Stocks" data={stock} onBack={() => handleNavigate('/quincaillerie')} onAdd={() => {}} columns={[
        { key: 'name', label: 'Article', render: (v:any) => <span className="font-bold">{v}</span> },
        { key: 'quantity', label: 'En Stock', render: (v:number, row:any) => <span className={`font-bold ${v <= row.threshold ? 'text-red-500 animate-pulse' : 'text-green-700'}`}>{v} {row.unit}</span> },
        { key: 'threshold', label: 'Seuil Alerte' },
        { key: 'site', label: 'Lieu' }
      ]} />
    );

    if (currentPath === '/secretariat/clients') return (
      <GenericManager title="Répertoire Clients" data={clients} onBack={() => handleNavigate('/secretariat')} onAdd={() => {}} columns={[
        { key: 'name', label: 'Client', render: (v:any) => <span className="font-bold">{v}</span> },
        { key: 'phone', label: 'Téléphone' },
        { key: 'email', label: 'Email' },
        { key: 'address', label: 'Localisation' }
      ]} />
    );

    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <Package size={64} className="opacity-20 mb-4"/>
        <p className="text-xl font-bold italic">Module "{currentPath}" en cours de déploiement...</p>
        <button onClick={() => handleNavigate('/')} className="mt-4 text-ebf-orange font-bold hover:underline">Retour Accueil</button>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-green-950 text-white transform transition-transform duration-300 lg:translate-x-0 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 h-20 border-b border-white/5 flex items-center justify-center">
          <span className="text-2xl font-black text-white">E<span className="text-ebf-orange">.B.</span>F <span className="text-xs font-normal opacity-40">MANAGER</span></span>
        </div>
        <nav className="p-4 space-y-1">
          {MAIN_MENU.map(m => (
            <button key={m.id} onClick={() => handleNavigate(m.path)} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all font-semibold ${currentPath === m.path || (m.path !== '/' && currentPath.startsWith(m.path)) ? 'bg-ebf-orange text-white shadow-lg' : 'text-gray-300 hover:bg-green-900'}`}>
              <m.icon size={22}/> <span>{m.label}</span>
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 w-full p-6 border-t border-white/5">
           <button className="w-full flex items-center gap-3 text-red-400 font-bold hover:text-red-300 transition">
              <LogOut size={20}/> Déconnexion
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-64 relative">
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-40">
           <div className="flex items-center gap-4">
              <button onClick={() => setIsMenuOpen(true)} className="lg:hidden p-2 text-gray-600"><Menu/></button>
              <h1 className="font-black text-green-950 text-xl tracking-tight hidden sm:block uppercase">Plateforme de Gestion</h1>
           </div>
           <div className="flex items-center gap-6">
              <div className="relative group cursor-pointer"><Bell size={22} className="text-gray-400 group-hover:text-ebf-orange transition"/><span className="absolute -top-1 -right-1 bg-red-500 w-2 h-2 rounded-full border-2 border-white"></span></div>
              <div className="h-10 w-px bg-gray-100"></div>
              <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                     <p className="text-sm font-black text-gray-800 leading-none">Admin EBF</p>
                     <p className="text-[10px] text-ebf-orange uppercase font-black tracking-widest mt-1">Directeur</p>
                  </div>
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-700 border-2 border-green-200"><User size={20}/></div>
              </div>
           </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-ebf-pattern">
           {renderContent()}
        </main>
      </div>

      <VoiceRecorderModal isOpen={isVoiceOpen} onClose={() => setIsVoiceOpen(false)} />
    </div>
  );
}
