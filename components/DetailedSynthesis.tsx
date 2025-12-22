import React from 'react';
import { StatData, DailyReport, Site, Period } from '../types';
import { ArrowLeft, Download, FileText, TrendingUp, Calendar, MapPin } from 'lucide-react';

interface DetailedSynthesisProps {
  data: StatData[];
  reports: DailyReport[];
  currentSite: Site;
  currentPeriod: Period;
  onSiteChange: (site: Site) => void;
  onPeriodChange: (period: Period) => void;
  onNavigate: (path: string) => void;
  onViewReport: (report: DailyReport) => void;
}

export const DetailedSynthesis: React.FC<DetailedSynthesisProps> = ({
  data, reports, currentSite, currentPeriod, onSiteChange, onPeriodChange, onNavigate, onViewReport
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate('/')}
            className="p-2 bg-white rounded-full border shadow-sm hover:bg-orange-50 transition"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl font-bold text-gray-800">Synthèse Détaillée</h2>
        </div>
        <button className="flex items-center gap-2 bg-ebf-green text-white px-4 py-2 rounded-lg font-bold shadow-md hover:opacity-90 transition">
          <Download size={18} /> Exporter PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-ebf-orange">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-orange-100 text-ebf-orange rounded-lg"><TrendingUp size={24}/></div>
            <h3 className="font-bold text-gray-700">Rentabilité</h3>
          </div>
          <p className="text-3xl font-black text-gray-900">
            {data.reduce((acc, curr) => acc + curr.profit, 0).toLocaleString()} F
          </p>
          <p className="text-sm text-gray-500 mt-2">Bénéfice cumulé sur la période</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-blue-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 text-blue-500 rounded-lg"><FileText size={24}/></div>
            <h3 className="font-bold text-gray-700">Rapports</h3>
          </div>
          <p className="text-3xl font-black text-gray-900">{reports.length}</p>
          <p className="text-sm text-gray-500 mt-2">Interventions documentées</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-green-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-100 text-ebf-green rounded-lg"><MapPin size={24}/></div>
            <h3 className="font-bold text-gray-700">Site Actif</h3>
          </div>
          <p className="text-3xl font-black text-gray-900">{currentSite}</p>
          <p className="text-sm text-gray-500 mt-2">Secteur géographique sélectionné</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-800">Historique des Rapports</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                <th className="p-4 text-left text-xs font-bold text-gray-500 uppercase">Technicien</th>
                <th className="p-4 text-left text-xs font-bold text-gray-500 uppercase">Domaine</th>
                <th className="p-4 text-right text-xs font-bold text-gray-500 uppercase">Recette</th>
                <th className="p-4 text-right text-xs font-bold text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50 transition">
                  <td className="p-4 text-sm text-gray-600 font-medium">{report.date}</td>
                  <td className="p-4 text-sm font-bold text-gray-800">{report.technicianName}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-bold">{report.domain || 'N/A'}</span>
                  </td>
                  <td className="p-4 text-right font-bold text-green-700">{(report.revenue || 0).toLocaleString()} F</td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => onViewReport(report)}
                      className="text-ebf-orange hover:underline font-bold text-sm"
                    >
                      Détails
                    </button>
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">Aucun rapport trouvé</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};