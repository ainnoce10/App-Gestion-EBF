import React, { useState, useMemo } from 'react';
import { Dashboard } from './components/Dashboard';
import { DetailedSynthesis } from './components/DetailedSynthesis';
import { 
  Site, Period, StatData, DailyReport, Transaction, 
  TickerMessage, StockItem
} from './types';
import { 
  MOCK_REPORTS, DEFAULT_TICKER_MESSAGES, 
  MOCK_STOCK, MOCK_TRANSACTIONS
} from './constants';

const App: React.FC = () => {
  // Navigation State
  const [currentPage, setCurrentPage] = useState<string>('/');
  
  // Filter State
  const [currentSite, setCurrentSite] = useState<Site>(Site.GLOBAL);
  const [currentPeriod, setCurrentPeriod] = useState<Period>(Period.DAY);
  
  // Data State
  const [reports, setReports] = useState<DailyReport[]>(MOCK_REPORTS);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [tickerMessages, setTickerMessages] = useState<TickerMessage[]>(DEFAULT_TICKER_MESSAGES);
  const [stock, setStock] = useState<StockItem[]>(MOCK_STOCK);

  const handleNavigate = (path: string) => {
    setCurrentPage(path);
    window.scrollTo(0, 0);
  };

  const handleDeleteReport = (id: string) => {
    setReports(prev => prev.filter(r => r.id !== id));
  };

  const handleViewReport = (report: any) => {
    console.log("View report", report);
  };

  // --- REAL-TIME AGGREGATION LOGIC ---
  // Calculates stats dynamically from Reports and Transactions
  const realTimeStats = useMemo(() => {
    const statsMap = new Map<string, StatData>();

    // 1. Process Reports (Revenue/Expenses/Interventions)
    reports.forEach(report => {
        if (!report.date) return;
        const key = `${report.date}_${report.site || 'Global'}`;
        
        if (!statsMap.has(key)) {
            statsMap.set(key, {
                id: key,
                date: report.date,
                site: report.site as Site,
                revenue: 0,
                expenses: 0,
                profit: 0,
                interventions: 0
            });
        }
        
        const stat = statsMap.get(key)!;
        stat.revenue += Number(report.revenue || 0);
        stat.expenses += Number(report.expenses || 0);
        stat.interventions += 1;
    });

    // 2. Process Transactions (Revenue/Expenses from Accounting)
    transactions.forEach(trans => {
        if (!trans.date) return;
        const key = `${trans.date}_${trans.site || 'Global'}`;

        if (!statsMap.has(key)) {
            statsMap.set(key, {
                id: key,
                date: trans.date,
                site: trans.site as Site,
                revenue: 0,
                expenses: 0,
                profit: 0,
                interventions: 0
            });
        }

        const stat = statsMap.get(key)!;
        if (trans.type === 'Recette') {
            stat.revenue += Number(trans.amount || 0);
        } else if (trans.type === 'Dépense') {
            stat.expenses += Number(trans.amount || 0);
        }
    });

    // 3. Finalize Profit Calculation & Sort (ASCENDING for Chart Chronology)
    return Array.from(statsMap.values()).map(stat => ({
        ...stat,
        profit: stat.revenue - stat.expenses
    })).sort((a, b) => a.date.localeCompare(b.date));

  }, [reports, transactions]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Header */}
        <header className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-gradient-to-br from-ebf-orange to-yellow-500 rounded-lg shadow-lg flex items-center justify-center text-white font-bold text-xl">
               E
             </div>
             <div>
               <h1 className="text-2xl font-extrabold tracking-tight text-green-900 dark:text-white">
                 EBF <span className="text-ebf-orange">Manager</span>
               </h1>
               <p className="text-xs text-gray-500 font-medium">Platforme de Gestion Unifiée</p>
             </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-sm font-bold text-green-900 dark:text-gray-200">Admin Principal</span>
                <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Connecté</span>
             </div>
             <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white shadow-sm overflow-hidden">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="Avatar" />
             </div>
          </div>
        </header>

        <main>
          {currentPage === '/' && (
            <Dashboard 
              data={realTimeStats}
              reports={reports}
              stock={stock}
              tickerMessages={tickerMessages}
              currentSite={currentSite}
              currentPeriod={currentPeriod}
              onSiteChange={setCurrentSite}
              onPeriodChange={setCurrentPeriod}
              onNavigate={handleNavigate}
              onDeleteReport={handleDeleteReport}
            />
          )}

          {currentPage === '/synthesis' && (
            <DetailedSynthesis 
              data={realTimeStats}
              reports={reports}
              currentSite={currentSite}
              currentPeriod={currentPeriod}
              onSiteChange={setCurrentSite}
              onPeriodChange={setCurrentPeriod}
              onNavigate={handleNavigate}
              onViewReport={handleViewReport}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;