
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Filter, TrendingUp, Maximize2, DollarSign, Activity, Star, ArrowUpRight, ArrowDownRight, Clock, Trash2, FileText, AlertTriangle, X, Download } from 'lucide-react';
import { StatData, Site, Period, TickerMessage, DailyReport, StockItem } from './types';

interface DashboardProps {
  data: StatData[];
  reports: DailyReport[];
  tickerMessages: TickerMessage[];
  stock: StockItem[];
  currentSite: Site;
  currentPeriod: Period;
  onSiteChange: (site: Site) => void;
  onPeriodChange: (period: Period) => void;
  onNavigate: (path: string) => void;
  onDeleteReport: (id: string) => void;
}

const KPICard = ({ title, value, subtext, icon: Icon, trend, colorClass, bgClass, borderClass }: any) => (
  <div className={`bg-white p-6 rounded-xl shadow-sm border-l-4 ${borderClass} border-y border-r border-orange-100 hover:shadow-md transition-all group`}>
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-lg ${bgClass} group-hover:scale-110 transition-transform`}>
        <Icon size={24} className={colorClass} />
      </div>
      {trend && (
        <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {trend > 0 ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wide">{title}</h3>
    <div className="mt-1 flex items-baseline">
      <p className="text-2xl font-bold text-green-950">{value}</p>
    </div>
    <p className="text-xs text-gray-400 mt-2">{subtext}</p>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ 
  data, reports, tickerMessages, stock, currentSite, currentPeriod, onSiteChange, onPeriodChange, onNavigate, onDeleteReport 
}) => {
  const [reportToDelete, setReportToDelete] = useState<DailyReport | null>(null);

  const filteredData = useMemo(() => {
    return data.filter(d => (currentSite === Site.GLOBAL || d.site === currentSite));
  }, [data, currentSite]);

  const totals = useMemo(() => {
    return filteredData.reduce((acc, curr) => ({
      revenue: acc.revenue + curr.revenue,
      interventions: acc.interventions + curr.interventions,
      profit: acc.profit + curr.profit,
      expenses: acc.expenses + curr.expenses
    }), { revenue: 0, interventions: 0, profit: 0, expenses: 0 });
  }, [filteredData]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Ticker */}
      <div className="bg-green-950 text-white p-3 rounded-xl overflow-hidden shadow-lg relative flex items-center">
        <div className="z-10 bg-green-950 pr-4 flex items-center border-r border-white/10">
           <Clock size={16} className="text-orange-500 animate-pulse mr-2" />
           <span className="font-bold text-xs uppercase tracking-widest">Flash</span>
        </div>
        <div className="flex-1 px-4 overflow-hidden">
           <div className="whitespace-nowrap animate-marquee flex gap-8">
              {tickerMessages.map(m => (
                <span key={m.id} className="text-sm font-medium flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${m.type === 'alert' ? 'bg-red-500' : 'bg-green-500'}`} />
                  {m.text}
                </span>
              ))}
           </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4">
          <select 
            className="border rounded-lg px-3 py-2 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-orange-500"
            value={currentSite}
            onChange={(e) => onSiteChange(e.target.value as Site)}
          >
            <option value={Site.GLOBAL}>Tous les Sites</option>
            <option value={Site.ABIDJAN}>Abidjan</option>
            <option value={Site.BOUAKE}>Bouaké</option>
          </select>
          <select 
            className="border rounded-lg px-3 py-2 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-orange-500"
            value={currentPeriod}
            onChange={(e) => onPeriodChange(e.target.value as Period)}
          >
            <option value={Period.MONTH}>Ce Mois</option>
            <option value={Period.YEAR}>Cette Année</option>
          </select>
        </div>
        <button onClick={() => onNavigate('/synthesis')} className="bg-orange-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-orange-600 transition">
          <Maximize2 size={18}/> Synthèse Détaillée
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="CA Total" value={`${totals.revenue.toLocaleString()} FCFA`} subtext="Volume de ventes" icon={DollarSign} borderClass="border-orange-500" bgClass="bg-orange-50" colorClass="text-orange-500" />
        <KPICard title="Bénéfice" value={`${totals.profit.toLocaleString()} FCFA`} subtext="Rentabilité nette" icon={TrendingUp} borderClass="border-green-500" bgClass="bg-green-50" colorClass="text-green-500" />
        <KPICard title="Activités" value={totals.interventions} subtext="Interventions réalisées" icon={Activity} borderClass="border-blue-500" bgClass="bg-blue-50" colorClass="text-blue-500" />
        <KPICard title="Satisfaction" value="4.8/5" subtext="Moyenne client" icon={Star} borderClass="border-yellow-500" bgClass="bg-yellow-50" colorClass="text-yellow-500" />
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><Activity className="text-orange-500"/> Performance Mensuelle</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
              <Tooltip cursor={{fill: '#fff7ed'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
              <Bar dataKey="revenue" fill="#f97316" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar dataKey="profit" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
