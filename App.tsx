import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import { Site, Period, Role, StatData, DailyReport, TickerMessage, StockItem } from './types';
import { 
  MOCK_STATS, MOCK_REPORTS, DEFAULT_TICKER_MESSAGES, MOCK_STOCK 
} from './constants';
import { Dashboard } from './components/Dashboard';
import { DetailedSynthesis } from './components/DetailedSynthesis';
import { 
  AlertCircle, CheckCircle, User, Mail, Phone, Lock, Eye, EyeOff, Loader2, ArrowLeft 
} from 'lucide-react';

// Simple Logo Component
const EbfLogo = ({ size = "normal" }: { size?: "normal" | "large" }) => (
  <div className={`font-black text-ebf-orange ${size === "large" ? "text-4xl" : "text-2xl"} tracking-tighter`}>
    EBF<span className="text-ebf-green">MANAGER</span>
  </div>
);

// --- Login Screen (Redesigned - Rich & Vibrant) ---
const LoginScreen = ({ onLoginSuccess }: { onLoginSuccess: () => void }) => {
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Role>('Visiteur');
  const [site, setSite] = useState<Site>(Site.ABIDJAN);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccessMsg('');

    const cleanIdentifier = identifier.trim();
    const cleanPassword = password.trim();
    const cleanName = fullName.trim();

    try {
      if (isResetMode) {
        if (authMethod !== 'email') throw new Error("La réinitialisation n'est disponible que par Email.");
        // Redirect to same URL but standard handling will pick it up
        const { error } = await supabase.auth.resetPasswordForEmail(cleanIdentifier, { redirectTo: window.location.origin });
        if (error) throw error;
        setSuccessMsg("Lien envoyé ! Vérifiez vos emails."); setLoading(false); return;
      }

      if (isSignUp) {
        const metadata = { full_name: cleanName, role: role, site: site };
        let signUpResp;
        if (authMethod === 'email') {
          signUpResp = await supabase.auth.signUp({ email: cleanIdentifier, password: cleanPassword, options: { data: metadata } });
        } else {
          signUpResp = await supabase.auth.signUp({ phone: cleanIdentifier, password: cleanPassword, options: { data: metadata } });
        }

        if (signUpResp.error) throw signUpResp.error;

        // CRITICAL: Check if we have a session immediately
        if (signUpResp.data.session) {
             const userId = signUpResp.data.user?.id;
             if (userId) {
                 await supabase.from('profiles').upsert([{
                     id: userId,
                     email: authMethod === 'email' ? cleanIdentifier : '',
                     phone: authMethod === 'phone' ? cleanIdentifier : '',
                     full_name: cleanName,
                     role: role,
                     site: site
                 }]);
                 
                 if (role !== 'Visiteur') {
                     let specialty = role as string;
                     if (role === 'Admin') specialty = 'Administration';
                     await supabase.from('technicians').upsert([{
                         id: userId,
                         name: cleanName,
                         specialty: specialty,
                         site: site,
                         status: 'Available'
                     }]);
                 }
             }
             // DIRECT SUCCESS LOGIN
             onLoginSuccess();
             return; 
        } else {
             // NO SESSION = CONFIRMATION REQUIRED BY SERVER
             setIsSignUp(false);
             setSuccessMsg("Inscription réussie ! Vérifiez vos emails pour valider le compte.");
        }

      } else {
        const { data, error: err } = await supabase.auth.signInWithPassword(
            authMethod === 'email' ? { email: cleanIdentifier, password: cleanPassword } : { phone: cleanIdentifier, password: cleanPassword }
        );
        
        if (err) throw err;
        onLoginSuccess();
      }
    } catch (err: any) {
        console.error("Auth Error:", err);
        let userMsg = "Une erreur technique est survenue.";
        // Normalize error message
        const msg = err.message || err.error_description || JSON.stringify(err);

        if (msg.includes("Invalid login credentials") || msg.includes("invalid_grant")) {
            userMsg = "Email ou mot de passe incorrect.";
        } else if (msg.includes("Email not confirmed")) {
            userMsg = "Votre email n'est pas encore confirmé. Vérifiez votre boîte mail (et les spams).";
        } else if (msg.includes("User already registered")) {
            userMsg = "Un compte existe déjà avec cet email/téléphone. Connectez-vous.";
        } else if (msg.includes("Password should be at least")) {
            userMsg = "Le mot de passe doit contenir au moins 6 caractères.";
        } else if (msg.includes("Phone signups are disabled")) {
            userMsg = "L'inscription par téléphone est désactivée. Utilisez l'email.";
        } else if (msg.includes("Failed to fetch") || msg.includes("Network request failed")) {
            userMsg = "Problème de connexion internet. Vérifiez votre réseau.";
        } else if (msg.includes("Too many requests") || msg.includes("rate_limit")) {
            userMsg = "Trop de tentatives. Veuillez patienter quelques minutes.";
        }

        setError(userMsg);
    } finally {
      setLoading(false); // STOP LOADING IN ALL CASES
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ebf-pattern p-4 font-sans relative">
       <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-orange-500/10 pointer-events-none"></div>
       <div className="glass-panel p-8 md:p-10 rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden animate-fade-in border-t-4 border-ebf-orange">
          <div className="flex flex-col items-center mb-8">
             {/* Logo SANS rounded-full - Square container */}
             <div className="bg-white p-4 shadow-lg mb-4">
                 <EbfLogo size="normal" />
             </div>
             <h2 className="text-2xl font-extrabold text-gray-800 mt-2 tracking-tight">
                 {isResetMode ? "Récupération" : (isSignUp ? "Rejoindre l'équipe" : "Espace Connexion")}
             </h2>
             <p className="text-gray-500 text-sm mt-1 font-medium">Gérez vos activités en temps réel</p>
          </div>
          {error && (<div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded-r mb-6 text-sm font-medium flex items-center gap-2 animate-slide-in shadow-sm"><AlertCircle size={18} className="flex-shrink-0"/> <span>{error}</span></div>)}
          
          {successMsg && (
            <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-3 rounded-r mb-6 text-sm font-medium animate-slide-in shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                    <CheckCircle size={18} className="flex-shrink-0"/> 
                    <span>{successMsg}</span>
                </div>
                {successMsg.includes("Inscription") && (
                    <div className="text-xs text-green-800 mt-2 bg-green-100/50 p-2 rounded border border-green-200">
                        <strong>Email non reçu ?</strong><br/>
                        1. Vérifiez vos <strong>Spams</strong>.<br/>
                        2. Gmail bloque souvent les emails système.<br/>
                        3. <span className="underline cursor-help" title="Dans Supabase > Auth > Providers > Email > Décochez 'Confirm Email'">Solution Admin</span> : Désactivez la confirmation email dans Supabase pour une connexion immédiate.
                    </div>
                )}
            </div>
          )}

          {!isResetMode && (
            <div className="flex p-1 bg-gray-100 rounded-lg mb-6 shadow-inner">
               <button onClick={() => setAuthMethod('email')} className={`flex-1 py-2 rounded-md text-sm font-bold transition-all duration-300 ${authMethod === 'email' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Email</button>
               <button onClick={() => setAuthMethod('phone')} className={`flex-1 py-2 rounded-md text-sm font-bold transition-all duration-300 ${authMethod === 'phone' ? 'bg-white text-ebf-orange shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Téléphone</button>
            </div>
          )}
          <form onSubmit={handleAuth} className="space-y-4">
                {isSignUp && (
                    <div className="space-y-4 animate-fade-in">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1">Nom Complet</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 text-gray-400" size={18}/>
                                <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-ebf-orange focus:border-transparent outline-none transition text-gray-900 font-medium shadow-sm" placeholder="Ex: Jean Kouassi" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1">Rôle</label>
                                <select value={role} onChange={e => setRole(e.target.value as Role)} className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-ebf-orange outline-none text-gray-900 font-medium appearance-none cursor-pointer shadow-sm">
                                    <option value="Visiteur">Visiteur</option>
                                    <option value="Technicien">Technicien</option>
                                    <option value="Secretaire">Secretaire</option>
                                    <option value="Magasinier">Magasinier</option>
                                    <option value="Admin">Admin</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1">Site</label>
                                <select value={site} onChange={e => setSite(e.target.value as Site)} className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-ebf-orange outline-none text-gray-900 font-medium appearance-none cursor-pointer shadow-sm">
                                    <option value="Abidjan">Abidjan</option>
                                    <option value="Bouaké">Bouaké</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1">{authMethod === 'email' ? 'Adresse Email' : 'Numéro de Téléphone'}</label>
                    <div className="relative">
                        {authMethod === 'email' ? <Mail className="absolute left-3 top-3 text-gray-400" size={18}/> : <Phone className="absolute left-3 top-3 text-gray-400" size={18}/>}
                        <input required value={identifier} onChange={e => setIdentifier(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-ebf-orange focus:border-transparent outline-none transition text-gray-900 font-medium shadow-sm" placeholder={authMethod === 'email' ? 'exemple@ebf.ci' : '0707070707'} />
                    </div>
                </div>
                {!isResetMode && (
                <div>
                    <div className="flex justify-between items-center mb-1.5 ml-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Mot de passe</label>
                        {!isSignUp && <button type="button" onClick={() => setIsResetMode(true)} className="text-xs text-ebf-orange font-bold hover:underline">Oublié ?</button>}
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 text-gray-400" size={18}/>
                        <input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-ebf-orange focus:border-transparent outline-none transition text-gray-900 font-medium shadow-sm" placeholder="••••••••" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                             {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>
                )}
                <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-ebf-orange to-orange-600 text-white font-bold py-3.5 rounded-xl hover:shadow-lg hover:from-orange-600 hover:to-orange-700 transition duration-300 transform hover:-translate-y-0.5 mt-2 flex items-center justify-center gap-2 shadow-orange-200">
                    {loading ? <Loader2 className="animate-spin" size={20}/> : (isResetMode ? "Envoyer le lien" : (isSignUp ? "Créer mon compte" : "Se Connecter"))}
                </button>
            </form>
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
             <button onClick={() => { 
                 if (successMsg && !successMsg.includes("Inscription réussie")) {
                     setSuccessMsg('');
                     setIsSignUp(false);
                 } else if (successMsg && successMsg.includes("Inscription réussie")) {
                     setSuccessMsg('');
                     // Keep on login screen
                 } else {
                     setIsSignUp(!isSignUp); 
                     setIsResetMode(false); 
                     setError('');
                 }
             }} className="text-sm font-semibold text-gray-500 hover:text-orange-600 transition">
                {successMsg && !successMsg.includes("Inscription réussie") ? (
                    <span className="flex items-center justify-center gap-2 font-bold text-orange-600"><ArrowLeft size={16}/> Retour à la connexion</span>
                ) : (isSignUp ? "Déjà un compte ? Se connecter" : "Pas encore de compte ? S'inscrire")}
             </button>
          </div>
       </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const [session, setSession] = useState<any>(null);
  const [view, setView] = useState<'dashboard' | 'synthesis'>('dashboard');
  const [currentSite, setCurrentSite] = useState<Site>(Site.GLOBAL);
  const [currentPeriod, setCurrentPeriod] = useState<Period>(Period.DAY);
  
  // Data State initialized with Mocks (for immediate render)
  const [data, setData] = useState<StatData[]>(MOCK_STATS);
  const [reports, setReports] = useState<DailyReport[]>(MOCK_REPORTS);
  const [stock, setStock] = useState<StockItem[]>(MOCK_STOCK);

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };
  
  const handleDeleteReport = (id: string) => {
    setReports(prev => prev.filter(r => r.id !== id));
  };

  if (!session) {
    return <LoginScreen onLoginSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans transition-colors duration-300">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Header */}
        <header className="flex justify-between items-center mb-8 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-orange-100 dark:border-gray-700">
          <EbfLogo />
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-900 dark:text-white">{session.user?.email}</p>
                <p className="text-xs text-gray-500">Connecté</p>
             </div>
             <button 
               onClick={handleLogout}
               className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-100 transition"
             >
               Déconnexion
             </button>
          </div>
        </header>

        {view === 'dashboard' ? (
          <Dashboard 
            data={data}
            reports={reports}
            tickerMessages={DEFAULT_TICKER_MESSAGES}
            stock={stock}
            currentSite={currentSite}
            currentPeriod={currentPeriod}
            onSiteChange={setCurrentSite}
            onPeriodChange={setCurrentPeriod}
            onNavigate={(path) => {
              if (path === '/synthesis') setView('synthesis');
            }}
            onDeleteReport={handleDeleteReport}
          />
        ) : (
          <DetailedSynthesis 
            data={data}
            reports={reports}
            currentSite={currentSite}
            currentPeriod={currentPeriod}
            onSiteChange={setCurrentSite}
            onPeriodChange={setCurrentPeriod}
            onNavigate={(path) => {
              if (path === '/') setView('dashboard');
            }}
            onViewReport={(r) => console.log("View report", r)}
          />
        )}
      </div>
    </div>
  );
};

export default App;