import { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import IncomeTab from './components/Income';
import SavingsTab from './components/Savings';
import ExpensesTab from './components/Expenses';
import GoalsTab from './components/Goals';
import BusinessTab from './components/Business';
import { useAppData } from './hooks/useLocalStorage';
import { ActiveTab } from './types';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(() => sessionStorage.getItem('ft_auth') === '1');
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const { data, update, loading } = useAppData();

  function handleLogout() {
    sessionStorage.removeItem('ft_auth');
    setLoggedIn(false);
  }

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <div className="bg-indigo-600 text-white rounded-xl p-3">
          <TrendingUp size={28} />
        </div>
        <p className="text-slate-500 text-sm animate-pulse">Loading your data…</p>
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout}>
      {activeTab === 'dashboard' && (
        <Dashboard data={data} onNavigate={setActiveTab} />
      )}
      {activeTab === 'income' && (
        <IncomeTab data={data} onUpdate={update} />
      )}
      {activeTab === 'savings' && (
        <SavingsTab data={data} onUpdate={update} />
      )}
      {activeTab === 'expenses' && (
        <ExpensesTab data={data} onUpdate={update} />
      )}
      {activeTab === 'goals' && (
        <GoalsTab data={data} onUpdate={update} />
      )}
      {activeTab === 'business' && (
        <BusinessTab data={data} onUpdate={update} />
      )}
    </Layout>
  );
}
