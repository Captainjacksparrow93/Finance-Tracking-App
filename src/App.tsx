import { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import IncomeTab from './components/Income';
import SavingsTab from './components/Savings';
import ExpensesTab from './components/Expenses';
import GoalsTab from './components/Goals';
import BusinessTab from './components/Business';
import { useAppData } from './hooks/useLocalStorage';
import { ActiveTab } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const { data, update } = useAppData();

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
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
