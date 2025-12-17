
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  LayoutDashboard, Wrench, Briefcase, ShoppingCart, Menu, X, Bell, Search, Settings,
  HardHat, DollarSign, LogOut, Calculator, Users, Calendar, FolderOpen, Truck, 
  FileText, UserCheck, CreditCard, Archive, ShieldCheck, ClipboardList, ArrowLeft, ChevronRight, Mic, Send, Save, Plus, CheckCircle, Trash2, User, HelpCircle, Moon, Play, StopCircle, RefreshCw, FileInput, MapPin, Volume2, Megaphone, AlertCircle, Filter, TrendingUp, Edit, ArrowUp, ArrowDown, AlertTriangle, Loader2, Mail, Lock, UserPlus, ScanFace, Fingerprint, Phone, CheckSquare, Key, MoveUp, MoveDown, Eye, EyeOff, Sparkles, Target, RefreshCcw, Shield
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

// --- CONFIGURATION DES FORMULAIRES ---
const FORM_CONFIGS: Record<string, FormConfig> = {
  interventions: {
    title: 'Nouvelle Intervention',
    fields: [
      { name: 'client', label: 'Client', type: 'text' },
      { name: 'clientPhone', label: 'Tél Client', type: 'text' },
      { name: 'location', label: 'Lieu / Quartier', type: 'text' },
      { name: 'description', label: 'Description Panne', type: 'text' },
      { name: 'technicianId', label: 'ID Technicien', type: 'text' },
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
  materials: {
    title: 'Nouveau Matériel',
    fields: [
      { name: 'name', label: 'Nom de l\'outil', type: 'text' },
      { name: 'serialNumber', label: 'N° Série / Réf', type: 'text' },
      { name: 'condition', label: 'État', type: 'select', options: ['Neuf', 'Bon', 'Usé', 'Panne'] },
      { name: 'assignedTo', label: 'Affecté à', type: 'text' },
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
    title: 'Nouveau Rapport',
    fields: [
      { name: 'technicianName', label: 'Nom Technicien', type: 'text' },
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'content', label: 'Détails Intervention', type: 'text' },
      { name: 'domain', label: 'Domaine', type: 'select', options: ['Electricité', 'Froid', 'Bâtiment', 'Plomberie'] },
      { name: 'revenue', label: 'Recette (FCFA)', type: 'number' },
      { name: 'expenses', label: 'Dépenses (FCFA)', type: 'number' }
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
    { id: 'interventions', label: 'Interventions', description: 'Planning', icon: Wrench, path: '/techniciens/interventions', color: 'bg-orange-500' },
    { id: 'rapports', label: 'Rapports Journaliers', description: 'Vocal/Formulaire', icon: FileText, path: '/techniciens/rapports', color: 'bg-gray-700' },
    { id: 'materiel', label: 'Matériel & Outils', description: 'Inventaire', icon: Truck, path: '/techniciens/materiel', color: 'bg-blue-600' },
    { id: 'chantiers', label: 'Chantiers', description: 'Suivi', icon: ShieldCheck, path: '/techniciens/chantiers', color: 'bg-green-600' },
  ],
  comptabilite: [
    { id: 'bilan', label: 'Bilan Financier', icon: DollarSign, path: '/comptabilite/bilan', color: 'bg-green-600', description: 'Journal' },
    { id: 'rh', label: 'Ressources Humaines', icon: Users, path: '/comptabilite/rh', color: 'bg-purple-600', description: 'Staff' },
    { id: 'paie', label: 'Paie & Salaires', icon: CreditCard, path: '/comptabilite/paie', color: 'bg-orange-500', description: 'Virements' },
  ],
  secretariat: [
    { id: 'planning', label: 'Planning', icon: Calendar, path: '/secretariat/planning', color: 'bg-indigo-500', description: 'Agenda' },
    { id: 'clients', label: 'Gestion Clients', icon: UserCheck, path: '/secretariat/clients', color: 'bg-blue-500', description: 'CRM' },
    { id: 'caisse', label: 'Caisse', icon: Archive, path: '/secretariat/caisse', color: 'bg-gray-600', description: 'Mouvements' },
  ],
  quincaillerie: [
    { id: 'stocks', label: 'Stocks', icon: ClipboardList, path: '/quincaillerie/stocks', color: 'bg-orange-600', description: 'Inventaire' },
    { id: 'fournisseurs', label: 'Fournisseurs', icon: Truck, path: '/quincaillerie/fournisseurs', color: 'bg-green-600', description: 'Partenaires' },
    { id: 'achats', label: 'Bons d\'achat', icon: FileText, path: '/quincaillerie/achats', color: 'bg-red-500', description: 'Commandes' },
  ]
};

// --- Composants UI ---
const EbfLogo = ({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) => (
  <div className={`font-black tracking-tighter flex items-baseline ${size === 'small' ? 'text-xl' : size === 'large' ? 'text-5xl' : 'text-3xl'}`}>
    <span className="text-ebf-green">E</span><span className="text-ebf-orange">B</span><span className="text-ebf-green">F</span>
  </div>
);

const HeaderWithNotif = ({ 
  title, onMenuClick, onLogout, notifications, userProfile, userRole, onOpenProfile, onOpenFlashInfo, onOpenHelp, darkMode, onToggleTheme 
}: any) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
    const unreadCount = notifications.filter((n: Notification) => !n.read).length;
    const settingsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: any) => {
            if (settingsRef.current && !settingsRef.current.contains(event.target)) setShowSettingsDropdown(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 h-16 flex items-center justify-between px-4 sticky top-0 z-30 shadow-sm">
           <div className="flex items-center gap-4">
              <button onClick={onMenuClick} className="lg:hidden p-2 text-gray-600"><Menu/></button>
              <h2 className="text-lg font-extrabold text-green-950 hidden md:block tracking-tight">{title}</h2>
           </div>
           <div className="flex items-center gap-3">
               <div className="flex items-center gap-3 border-l pl-4 ml-2 border-gray-200">
                  <div className="hidden md:block text-right">
                     <p className="text-sm font-bold text-gray-800">{userProfile?.full_name || 'Utilisateur'}</p>
                     <p className="text-[10px] text-ebf-orange font-bold uppercase bg-orange-50 px-2 py-0.5 rounded-full inline-block">Role: {userRole}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-lg border border-green-200">
                      {userProfile?.full_name?.charAt(0) || <User size={20}/>}
                  </div>
               </div>
              <div className="relative ml-2">
                 <button onClick={() => setShowDropdown(!showDropdown)} className="p-2 relative hover:bg-gray-100 rounded-full transition text-gray-600">
                     <Bell size={20}/>
                     {unreadCount > 0 && <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{unreadCount}</span>}
                 </button>
                 {showDropdown && (
                     <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                         <div className="p-3 border-b bg-gray-50 flex justify-between items-center"><h3 className="font-bold text-sm">Notifications</h3></div>
                         <div className="max-h-80 overflow-y-auto">
                             {notifications.length === 0 ? <div className="p-4 text-center text-gray-400">Aucune notification</div> : 
                                 notifications.map((n: any) => (
                                     <div key={n.id} className="p-3 border-b hover:bg-gray-50 cursor-pointer">
                                         <p className="text-sm font-bold">{n.title}</p>
                                         <p className="text-xs text-gray-500">{n.message}</p>
                                     </div>
                                 ))
                             }
                         </div>
                         <button onClick={() => setShowDropdown(false)} className="w-full py-2 text-xs text-gray-500 hover:bg-gray-50">Fermer</button>
                     </div>
                 )}
              </div>
              <div className="relative" ref={settingsRef}>
                 <button onClick={() => setShowSettingsDropdown(!showSettingsDropdown)} className="p-2 hover:bg-gray-100 rounded-full transition text-gray-600">
                    <Settings size={20}/>
                 </button>
                 {showSettingsDropdown && (
                   <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                      <div className="py-2">
                         <button onClick={() => { onOpenProfile(); setShowSettingsDropdown(false); }} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-sm font-medium text-gray-700">
                             <User size={18} className="text-ebf-orange"/> Mon Profil
                         </button>
                         <button onClick={() => { onOpenFlashInfo(); setShowSettingsDropdown(false); }} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-sm font-medium text-gray-700">
                             <Megaphone size={18} className="text-blue-500"/> Gestion Flash Info
                         </button>
                         <div className="border-t my-1"></div>
                         <button onClick={onToggleTheme} className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-50 text-sm font-medium text-gray-700">
                            <div className="flex items-center gap-3"><Moon size={18} className="text-indigo-500"/> Mode Sombre</div>
                            <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${darkMode ? 'bg-indigo-500' : 'bg-gray-300'}`}><div className={`w-3 h-3 bg-white rounded-full transform transition-transform ${darkMode ? 'translate-x-4' : 'translate-x-0'}`}></div></div>
                         </button>
                         <button onClick={() => { onOpenHelp(); setShowSettingsDropdown(false); }} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-sm font-medium text-gray-700">
                             <HelpCircle size={18} className="text-green-500"/> Aide & Support
                         </button>
                         <div className="border-t my-1"></div>
                         <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 text-sm font-bold text-red-600">
                             <LogOut size={18}/> Se déconnecter
                         </button>
                      </div>
                   </div>
                 )}
              </div>
           </div>
        </header>
    )
};

const VoiceRecorderModal = ({ isOpen, onClose, onSave, userProfile }: any) => {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [loading, setLoading] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const timerRef = useRef<any>(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            const chunks: BlobPart[] = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                setAudioBlob(blob);
            };

            recorder.start();
            mediaRecorderRef.current = recorder;
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
        } catch (err: any) {
            alert("Erreur micro : " + (err.message || "Microphone non accessible."));
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(timerRef.current);
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    const handleSave = async () => {
        if (!audioBlob) return;
        setLoading(true);
        try {
            const fileName = `voice_${Date.now()}.webm`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('reports-audio')
                .upload(fileName, audioBlob);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('reports-audio').getPublicUrl(fileName);

            const reportData = {
                technicianName: userProfile?.full_name || 'Inconnu',
                date: new Date().toISOString().split('T')[0],
                content: `Rapport vocal enregistré le ${new Date().toLocaleString()}`,
                method: 'Voice',
                audioUrl: publicUrl,
                site: userProfile?.site || 'Abidjan'
            };

            const { error: dbError } = await supabase.from('reports').insert([reportData]);
            if (dbError) throw dbError;

            onSave();
            onClose();
            setAudioBlob(null);
        } catch (err: any) {
            console.error(err);
            alert("Erreur sauvegarde : " + (err.message || "Impossible de sauvegarder le rapport."));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-sm p-8 text-center shadow-2xl relative">
                <button onClick={() => { onClose(); setAudioBlob(null); setIsRecording(false); clearInterval(timerRef.current); }} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X/></button>
                <div className="mb-8">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-500 ${isRecording ? 'bg-red-500 animate-pulse scale-110' : 'bg-gray-100'}`}>
                        <Mic size={40} className={isRecording ? 'text-white' : 'text-gray-400'} />
                    </div>
                    <h3 className="text-xl font-bold">Rapport Vocal</h3>
                    <p className="text-gray-500 text-sm mt-1">{isRecording ? "Enregistrement en cours..." : audioBlob ? "Enregistrement terminé" : "Appuyez pour commencer"}</p>
                    {isRecording && <p className="text-red-500 font-bold text-2xl mt-4 font-mono">{Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}</p>}
                </div>

                <div className="space-y-4">
                    {!isRecording && !audioBlob && (
                        <button onClick={startRecording} className="w-full bg-ebf-orange text-white py-4 rounded-xl font-bold hover:opacity-90 transition shadow-lg flex items-center justify-center gap-2">
                            <Mic size={20}/> Démarrer le micro
                        </button>
                    )}
                    {isRecording && (
                        <button onClick={stopRecording} className="w-full bg-red-600 text-white py-4 rounded-xl font-bold hover:bg-red-700 transition shadow-lg flex items-center justify-center gap-2">
                            <StopCircle size={20}/> Arrêter l'enregistrement
                        </button>
                    )}
                    {audioBlob && !isRecording && (
                        <div className="flex flex-col gap-2">
                            <audio src={URL.createObjectURL(audioBlob)} controls className="w-full mb-2" />
                            <div className="flex gap-2">
                                <button onClick={() => setAudioBlob(null)} className="flex-1 border py-3 rounded-xl text-gray-600 font-bold hover:bg-gray-50">Réessayer</button>
                                <button onClick={handleSave} disabled={loading} className="flex-1 bg-ebf-green text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90">
                                    {loading ? <Loader2 className="animate-spin" size={20}/> : <Send size={20}/>} Envoyer
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ModulePlaceholder = ({ title, subtitle, items = [], onBack, color, currentSite, onAdd, onDelete, onVoiceAdd, readOnly }: any) => (
    <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="p-2 bg-white rounded-full shadow-sm border border-gray-100 hover:text-ebf-orange transition-colors"><ArrowLeft size={20}/></button>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 tracking-tight">{title}</h2>
                    <p className="text-gray-500 text-sm">{subtitle}</p>
                </div>
            </div>
            {!readOnly && (
                <div className="flex gap-2">
                    {onVoiceAdd && (
                        <button onClick={onVoiceAdd} className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold shadow-md hover:opacity-90 flex items-center gap-2 transition transform hover:-translate-y-0.5">
                            <Mic size={18}/> Nouveau Rapport Vocal
                        </button>
                    )}
                    {onAdd && (
                        <button onClick={onAdd} className={`${color} text-white px-4 py-2 rounded-lg font-bold shadow-md hover:opacity-90 flex items-center gap-2 transition transform hover:-translate-y-0.5`}>
                            <Plus size={18}/> Ajouter
                        </button>
                    )}
                </div>
            )}
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
                <thead className="bg-gray-50 border-b">
                    <tr>
                        <th className="p-4 text-left text-xs font-bold uppercase text-gray-500 tracking-wider">Type</th>
                        <th className="p-4 text-left text-xs font-bold uppercase text-gray-500 tracking-wider">Nom / Libellé</th>
                        <th className="p-4 text-left text-xs font-bold uppercase text-gray-500 tracking-wider">Détails</th>
                        <th className="p-4 text-left text-xs font-bold uppercase text-gray-500 tracking-wider">Site</th>
                        <th className="p-4 text-right text-xs font-bold uppercase text-gray-500 tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {items.filter((i:any) => currentSite === Site.GLOBAL || i.site === currentSite).map((item: any) => (
                        <tr key={item.id} className="hover:bg-orange-50/20 transition-colors">
                            <td className="p-4">
                                {item.method === 'Voice' ? <div className="p-2 bg-red-50 text-red-500 rounded-full inline-block" title="Audio"><Mic size={14}/></div> : <div className="p-2 bg-blue-50 text-blue-500 rounded-full inline-block" title="Texte"><FileText size={14}/></div>}
                            </td>
                            <td className="p-4 font-bold text-gray-800">{item.name || item.client || item.label || item.full_name || item.technicianName || 'Item'}</td>
                            <td className="p-4 text-sm text-gray-600">
                                {item.method === 'Voice' ? (
                                    <div className="flex items-center gap-2">
                                        <audio src={item.audioUrl} controls className="h-8 max-w-[200px]" />
                                    </div>
                                ) : (
                                    item.description || item.specialty || item.date || item.content || '-'
                                )}
                            </td>
                            <td className="p-4 text-sm font-medium">{item.site || '-'}</td>
                            <td className="p-4 text-right">
                                {!readOnly && onDelete && <button onClick={() => onDelete(item)} className="p-2 text-red-400 hover:bg-red-50 rounded transition-colors"><Trash2 size={16}/></button>}
                            </td>
                        </tr>
                    ))}
                    {items.length === 0 && <tr><td colSpan={5} className="p-12 text-center text-gray-400 italic">Aucune donnée disponible.</td></tr>}
                </tbody>
            </table>
        </div>
    </div>
);

const AppContent = ({ onLogout, userRole, userProfile, session }: any) => {
  const [currentPath, setCurrentPath] = useState('/');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentSite, setCurrentSite] = useState<Site>(Site.GLOBAL);
  const [currentPeriod, setCurrentPeriod] = useState<Period>(Period.MONTH);
  const [darkMode, setDarkMode] = useState(false);
  
  // États de données
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [chantiers, setChantiers] = useState<any[]>([]);
  const [tickerMessages, setTickerMessages] = useState<TickerMessage[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // États Modals
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isFlashInfoOpen, setIsFlashInfoOpen] = useState(false);
  const [isVoiceRecorderOpen, setIsVoiceRecorderOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [crudTarget, setCrudTarget] = useState('');
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [crudLoading, setCrudLoading] = useState(false);

  // Mapping Table -> Setter pour mise à jour instantanée
  const stateSetterMap: Record<string, any> = {
    interventions: setInterventions,
    stocks: setStock,
    materials: setMaterials,
    technicians: setTechnicians,
    reports: setReports,
    transactions: setTransactions,
    chantiers: setChantiers,
    ticker_messages: setTickerMessages
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data: interv } = await supabase.from('interventions').select('*'); if (interv) setInterventions(interv);
      const { data: st } = await supabase.from('stocks').select('*'); if (st) setStock(st);
      const { data: mat } = await supabase.from('materials').select('*'); if (mat) setMaterials(mat);
      const { data: tech } = await supabase.from('technicians').select('*'); if (tech) setTechnicians(tech);
      const { data: rep } = await supabase.from('reports').select('*').order('date', { ascending: false }); if (rep) setReports(rep);
      const { data: trans } = await supabase.from('transactions').select('*'); if (trans) setTransactions(trans);
      const { data: chan } = await supabase.from('chantiers').select('*'); if (chan) setChantiers(chan);
      const { data: tick } = await supabase.from('ticker_messages').select('*').order('display_order'); if (tick) setTickerMessages(tick);
    };
    fetchData();

    const channel = supabase.channel('ebf-realtime-v4')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        const setter = stateSetterMap[payload.table];
        if (!setter) return;
        if (payload.eventType === 'INSERT') setter((prev: any) => [payload.new, ...prev.filter((i:any) => i.id !== payload.new.id)]);
        if (payload.eventType === 'UPDATE') setter((prev: any) => prev.map((i: any) => i.id === payload.new.id ? payload.new : i));
        if (payload.eventType === 'DELETE') setter((prev: any) => prev.filter((i: any) => i.id !== payload.old.id));
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const stats = useMemo(() => {
    const map = new Map<string, StatData>();
    reports.forEach(r => {
      if (!r.date) return;
      const key = `${r.date}_${r.site}`;
      if (!map.has(key)) map.set(key, { id: key, date: r.date, site: r.site, revenue: 0, expenses: 0, profit: 0, interventions: 0 });
      const s = map.get(key)!;
      s.revenue += Number(r.revenue || 0);
      s.expenses += Number(r.expenses || 0);
      s.interventions += 1;
    });
    return Array.from(map.values()).map(s => ({ ...s, profit: s.revenue - s.expenses }));
  }, [reports]);

  const confirmAdd = async (formData: any) => {
    setCrudLoading(true);
    const processed = { ...formData, site: formData.site || (currentSite !== Site.GLOBAL ? currentSite : Site.ABIDJAN) };
    const { data, error } = await supabase.from(crudTarget).insert([processed]).select();
    if (error) alert(error.message);
    else if (data) {
      const setter = stateSetterMap[crudTarget];
      if (setter) setter((prev: any) => [data[0], ...prev]);
      setIsAddOpen(false);
    }
    setCrudLoading(false);
  };

  const confirmDelete = async () => {
    setCrudLoading(true);
    const { error } = await supabase.from(crudTarget).delete().eq('id', itemToDelete.id);
    if (error) alert(error.message);
    else {
      const setter = stateSetterMap[crudTarget];
      if (setter) setter((prev: any) => prev.filter((i: any) => i.id !== itemToDelete.id));
      setIsDeleteOpen(false);
    }
    setCrudLoading(false);
  };

  const handleNavigate = (path: string) => { setCurrentPath(path); setIsMenuOpen(false); };

  const renderContent = () => {
    if (currentPath === '/') return <Dashboard data={stats} reports={reports} tickerMessages={tickerMessages} stock={stock} currentSite={currentSite} currentPeriod={currentPeriod} onSiteChange={setCurrentSite} onPeriodChange={setCurrentPeriod} onNavigate={setCurrentPath} onDeleteReport={async (id) => { await supabase.from('reports').delete().eq('id', id); setReports(prev => prev.filter(r => r.id !== id)); }} />;
    if (currentPath === '/synthesis') return <DetailedSynthesis data={stats} reports={reports} currentSite={currentSite} currentPeriod={currentPeriod} onSiteChange={setCurrentSite} onPeriodChange={setCurrentPeriod} onNavigate={setCurrentPath} onViewReport={() => {}} />;
    
    const section = currentPath.substring(1);
    if (MODULE_ACTIONS[section]) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {MODULE_ACTIONS[section].map((a: any) => (
            <button key={a.id} onClick={() => handleNavigate(a.path)} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-ebf-orange transition-all group">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${a.color} text-white shadow-md`}><a.icon size={24} /></div>
              <h3 className="font-bold text-lg group-hover:text-ebf-orange tracking-tight transition-colors">{a.label}</h3>
              <p className="text-sm text-gray-500 mt-1">{a.description}</p>
            </button>
          ))}
        </div>
      );
    }

    const subSection = currentPath.split('/').pop() || '';
    if (FORM_CONFIGS[subSection] || subSection === 'materiel' || subSection === 'bilan' || subSection === 'rapports') {
        let items: any[] = [];
        let targetTable = subSection;
        if (subSection === 'interventions') items = interventions;
        else if (subSection === 'stocks') items = stock;
        else if (subSection === 'materiel') { items = materials; targetTable = 'materials'; }
        else if (subSection === 'rapports') { items = reports; targetTable = 'reports'; }
        else if (subSection === 'chantiers') items = chantiers;
        else if (subSection === 'bilan') { items = transactions; targetTable = 'transactions'; }

        return <ModulePlaceholder 
            title={FORM_CONFIGS[subSection]?.title || subSection} 
            subtitle="Gestion Opérationnelle" 
            items={items} 
            onBack={() => handleNavigate('/' + currentPath.split('/')[1])} 
            color="bg-ebf-orange" 
            currentSite={currentSite} 
            onAdd={() => { setCrudTarget(targetTable); setIsAddOpen(true); }} 
            onVoiceAdd={subSection === 'rapports' ? () => setIsVoiceRecorderOpen(true) : undefined}
            onDelete={(i:any) => { setItemToDelete(i); setCrudTarget(targetTable); setIsDeleteOpen(true); }} 
        />;
    }
    return <div className="text-center py-20 text-gray-400 font-medium">Cette section est en cours de développement...</div>;
  };

  return (
    <div className={`flex h-screen bg-gray-50/50 ${darkMode ? 'dark bg-gray-900' : ''}`}>
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-green-950 text-white transform transition-transform duration-300 lg:translate-x-0 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full shadow-2xl'}`}>
        <div className="h-20 flex items-center px-6 bg-white border-b border-gray-100"><EbfLogo size="small"/></div>
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-80px)]">
          {MAIN_MENU.map(m => (
            <button key={m.id} onClick={() => handleNavigate(m.path)} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${currentPath === m.path || currentPath.startsWith(m.path + '/') ? 'bg-ebf-orange font-bold shadow-lg shadow-orange-950/20' : 'text-gray-300 hover:bg-green-900/50'}`}>
              <m.icon size={20} /><span>{m.label}</span>
            </button>
          ))}
        </nav>
      </aside>
      
      <div className="flex-1 flex flex-col lg:ml-64">
        <HeaderWithNotif 
            title="EBF Manager" 
            onMenuClick={() => setIsMenuOpen(true)} 
            onLogout={onLogout} 
            notifications={notifications} 
            userProfile={userProfile} 
            userRole={userRole} 
            onOpenProfile={() => setIsProfileOpen(true)}
            onOpenFlashInfo={() => setIsFlashInfoOpen(true)}
            onOpenHelp={() => setIsHelpOpen(true)}
            darkMode={darkMode}
            onToggleTheme={() => setDarkMode(!darkMode)}
        />
        <main className="p-6 flex-1 overflow-y-auto scrollbar-hide">{renderContent()}</main>
      </div>

      <VoiceRecorderModal 
        isOpen={isVoiceRecorderOpen} 
        onClose={() => setIsVoiceRecorderOpen(false)} 
        onSave={() => {}} 
        userProfile={userProfile}
      />

      {isAddOpen && <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl animate-fade-in relative">
          <button onClick={() => setIsAddOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X/></button>
          <h3 className="text-2xl font-bold mb-6 tracking-tight">{FORM_CONFIGS[crudTarget === 'transactions' ? 'bilan' : crudTarget === 'materials' ? 'materiel' : crudTarget === 'reports' ? 'rapports' : crudTarget]?.title || 'Ajouter'}</h3>
          <form onSubmit={(e: any) => { e.preventDefault(); confirmAdd(Object.fromEntries(new FormData(e.target))); }} className="space-y-4">
            {(FORM_CONFIGS[crudTarget === 'transactions' ? 'bilan' : crudTarget === 'materials' ? 'materiel' : crudTarget === 'reports' ? 'rapports' : crudTarget]?.fields || []).map((f: any) => (
              <div key={f.name}>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">{f.label}</label>
                {f.type === 'select' ? 
                    <select name={f.name} className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-ebf-orange focus:bg-white transition-all" required>
                        {f.options.map((o:any)=><option key={o} value={o}>{o}</option>)}
                    </select> : 
                    <input name={f.name} type={f.type} className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-ebf-orange focus:bg-white transition-all" required placeholder={f.placeholder || ''}/>}
              </div>
            ))}
            <div className="flex gap-3 pt-6">
              <button type="button" onClick={() => setIsAddOpen(false)} className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-colors">Annuler</button>
              <button type="submit" disabled={crudLoading} className="flex-1 py-3 bg-ebf-orange text-white rounded-xl font-bold shadow-lg shadow-orange-200 hover:opacity-90 transition-all flex items-center justify-center gap-2">
                {crudLoading ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>} Valider
              </button>
            </div>
          </form>
        </div>
      </div>}

      {isDeleteOpen && <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white p-8 rounded-2xl text-center max-w-sm shadow-2xl relative">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 animate-bounce"><AlertTriangle size={40}/></div>
          <h3 className="text-2xl font-bold mb-2 tracking-tight">Supprimer ?</h3>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">Cette opération supprimera définitivement l'élément de la base de données.</p>
          <div className="flex gap-3">
            <button onClick={() => setIsDeleteOpen(false)} className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-colors">Annuler</button>
            <button onClick={confirmDelete} disabled={crudLoading} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold shadow-lg shadow-red-200 hover:bg-red-600 transition-all flex items-center justify-center">
              {crudLoading ? <Loader2 className="animate-spin" size={20}/> : 'Confirmer'}
            </button>
          </div>
        </div>
      </div>}
      
      {isProfileOpen && <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl relative animate-fade-in">
          <button onClick={() => setIsProfileOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X/></button>
          <h3 className="text-2xl font-bold mb-8 tracking-tight">Mon Profil</h3>
          <div className="space-y-6">
            <div className="flex flex-col items-center mb-8">
                <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center text-ebf-orange font-black text-4xl mb-4 shadow-inner border border-orange-100">{userProfile?.full_name?.charAt(0) || 'U'}</div>
                <p className="font-bold text-2xl text-gray-800">{userProfile?.full_name}</p>
                <p className="text-ebf-orange text-xs font-black uppercase tracking-widest bg-orange-50 px-3 py-1 rounded-full mt-2 border border-orange-100">{userRole}</p>
            </div>
            <div className="grid grid-cols-1 gap-4 text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex justify-between items-center"><label className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Email</label><p className="font-bold text-gray-700">{session?.user?.email}</p></div>
                <div className="flex justify-between items-center"><label className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Site d'affectation</label><p className="font-bold text-gray-700">{userProfile?.site || 'Non défini'}</p></div>
            </div>
          </div>
        </div>
      </div>}
      
      {isHelpOpen && <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white p-8 rounded-2xl w-full max-w-lg shadow-2xl relative animate-fade-in">
          <button onClick={() => setIsHelpOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X/></button>
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-green-950 tracking-tight"><HelpCircle className="text-ebf-green"/> Aide & Support</h3>
          <div className="space-y-6 text-sm">
            <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                <p className="font-bold text-green-900 mb-2">Guide d'utilisation</p>
                <p className="text-green-800 leading-relaxed italic text-xs">Naviguez via le menu latéral pour accéder aux différents modules. Le dashboard accueil vous donne une vue temps réel sur la rentabilité. Les rapports vocaux sont recommandés pour les techniciens terrain.</p>
            </div>
            <div className="p-4 border border-orange-100 rounded-xl bg-orange-50/30">
                <p className="font-bold text-orange-900 mb-2">Urgence technique ?</p>
                <p className="text-orange-800 font-medium">Contact direct : <strong className="font-black">support@ebf.ci</strong></p>
            </div>
          </div>
        </div>
      </div>}
      
      {isFlashInfoOpen && <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white p-8 rounded-2xl w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto animate-fade-in">
          <button onClick={() => setIsFlashInfoOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X/></button>
          <h3 className="text-2xl font-bold mb-8 flex items-center gap-3 tracking-tight"><Megaphone className="text-ebf-orange"/> Gestion Flash Info</h3>
          <div className="space-y-6">
             <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Diffuser un nouveau message</label>
                <div className="flex gap-3">
                   <input id="ticker-input" placeholder="Ex: Panne générale électricité secteur Plateau..." className="flex-1 p-3 border border-gray-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-ebf-orange transition-all font-medium"/>
                   <button onClick={async () => {
                       const el = document.getElementById('ticker-input') as HTMLInputElement;
                       if (el.value) {
                           await supabase.from('ticker_messages').insert([{ text: el.value, type: 'info', display_order: tickerMessages.length + 1 }]);
                           el.value = '';
                       }
                   }} className="bg-ebf-orange text-white px-6 rounded-xl font-black shadow-lg shadow-orange-200 hover:opacity-90 transition-all">PUBLIER</button>
                </div>
             </div>
             <div className="space-y-3">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Messages actifs</label>
                {tickerMessages.map((m: any) => (
                    <div key={m.id} className="p-4 border border-gray-100 rounded-xl flex justify-between items-center group bg-white hover:border-ebf-orange transition-all">
                        <span className="text-sm font-medium text-gray-700">{m.text}</span>
                        <button onClick={async () => await supabase.from('ticker_messages').delete().eq('id', m.id)} className="text-red-400 opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={18}/></button>
                    </div>
                ))}
                {tickerMessages.length === 0 && <p className="text-center text-gray-400 text-sm italic py-4">Aucun message flash diffusé actuellement.</p>}
             </div>
          </div>
        </div>
      </div>}
    </div>
  );
};

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        if (session) {
            supabase.from('profiles').select('*').eq('id', session.user.id).single()
                .then(({data}) => { setUserProfile(data); setLoading(false); });
        } else {
            setLoading(false);
        }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        if (session) {
            supabase.from('profiles').select('*').eq('id', session.user.id).single()
                .then(({data}) => setUserProfile(data));
        }
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center bg-green-950 text-white flex-col gap-6 animate-pulse"><EbfLogo size="large"/><div className="flex items-center gap-2"><Loader2 className="animate-spin" size={20}/><p className="font-bold tracking-widest text-xs uppercase">Initialisation du système...</p></div></div>;
  if (!session) return <div className="h-screen flex items-center justify-center bg-ebf-pattern p-4">
    <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md border border-white/20 text-center relative overflow-hidden backdrop-blur-lg">
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-ebf-orange to-orange-600"></div>
      <EbfLogo size="large" /><p className="text-gray-400 mb-10 font-bold uppercase tracking-widest text-[10px] mt-2">Pilotage Opérationnel EBF</p>
      <form onSubmit={async (e: any) => { e.preventDefault(); const { error } = await supabase.auth.signInWithPassword({ email: e.target.email.value, password: e.target.password.value }); if (error) alert("Identifiants incorrects. Veuillez réessayer."); }} className="space-y-5 text-left">
        <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Email Professionnel</label><div className="relative"><Mail className="absolute left-4 top-3.5 text-gray-300" size={18}/><input name="email" type="email" className="w-full pl-12 p-3.5 border border-gray-100 rounded-2xl bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-ebf-orange transition-all font-medium" placeholder="votre@ebf.ci" required/></div></div>
        <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Clé d'Accès</label><div className="relative"><Lock className="absolute left-4 top-3.5 text-gray-300" size={18}/><input name="password" type="password" className="w-full pl-12 p-3.5 border border-gray-100 rounded-2xl bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-ebf-orange transition-all font-medium" placeholder="••••••••" required/></div></div>
        <button type="submit" className="w-full bg-ebf-green text-white py-4 rounded-2xl font-black shadow-xl shadow-green-100 hover:shadow-green-200 transition-all transform hover:-translate-y-1 mt-4 tracking-widest">OUVRIR LA SESSION</button>
      </form>
      <p className="mt-10 text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">© 2024 Énergie & Bâtiment de la Falémé</p>
    </div>
  </div>;

  return <AppContent session={session} onLogout={() => supabase.auth.signOut()} userRole={userProfile?.role || 'Collaborateur'} userProfile={userProfile} />;
}
