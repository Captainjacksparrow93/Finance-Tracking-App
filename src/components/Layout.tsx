import React from 'react';
import { ActiveTab } from '../types';
import {
  LayoutDashboard,
  Wallet,
  PiggyBank,
  Receipt,
  Target,
  Briefcase,
  TrendingUp,
  LogOut,
} from 'lucide-react';

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, color: 'text-indigo-600' },
  { id: 'income', label: 'Income', icon: <Wallet size={18} />, color: 'text-emerald-600' },
  { id: 'savings', label: 'Savings', icon: <PiggyBank size={18} />, color: 'text-blue-600' },
  { id: 'expenses', label: 'Expenses', icon: <Receipt size={18} />, color: 'text-rose-600' },
  { id: 'goals', label: 'Goals', icon: <Target size={18} />, color: 'text-amber-600' },
  { id: 'business', label: 'Business', icon: <Briefcase size={18} />, color: 'text-purple-600' },
];

interface LayoutProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export default function Layout({ activeTab, onTabChange, onLogout, children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-indigo-600" size={22} />
              <span className="font-bold text-slate-800 text-base">Family Finance Tracker</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-400 hidden sm:block">
                All data stored locally — private &amp; secure
              </span>
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-600 transition-colors"
                title="Sign out"
              >
                <LogOut size={15} />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-14 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto gap-1 py-1 scrollbar-hide">
            {NAV_ITEMS.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-150 ${
                    active
                      ? `bg-indigo-50 ${item.color} border border-indigo-200`
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  <span className={active ? item.color : ''}>{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      <footer className="text-center text-xs text-slate-400 py-3 border-t border-slate-100">
        Family Finance Tracker — Your finances, your privacy.
      </footer>
    </div>
  );
}
