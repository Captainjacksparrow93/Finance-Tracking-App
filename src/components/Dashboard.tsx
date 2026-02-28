import React from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, TrendingDown, PiggyBank, Target,
  Wallet, AlertCircle, ArrowRight,
} from 'lucide-react';
import { AppData, ActiveTab } from '../types';
import {
  portfolioProjection, groupExpensesByMonth, groupIncomesByMonth,
  businessPLByMonth, getSavingsRate, getTopExpenseCategories,
  monthsRemaining, monthlyPMTNeeded, goalProgress,
} from '../utils/calculations';
import { formatINR, formatCompact, formatPercent, EXPENSE_CATEGORY_LABELS } from '../utils/formatters';
import { startOfMonth, parseISO, format } from 'date-fns';

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  iconBg: string;
  trend?: 'up' | 'down' | 'neutral';
}

function StatCard({ label, value, sub, icon, iconBg, trend }: StatCardProps) {
  return (
    <div className="card card-hover flex items-start gap-4">
      <div className={`p-3 rounded-xl ${iconBg} flex-shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-slate-800 mt-0.5 truncate">{value}</p>
        {sub && (
          <p className={`text-xs mt-0.5 flex items-center gap-1 ${
            trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-500' : 'text-slate-500'
          }`}>
            {trend === 'up' && <TrendingUp size={11} />}
            {trend === 'down' && <TrendingDown size={11} />}
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

interface Props {
  data: AppData;
  onNavigate: (tab: ActiveTab) => void;
}

export default function Dashboard({ data, onNavigate }: Props) {
  const { incomes, savings, expenses, goals, businessTransactions, settings } = data;

  // Current month calculations
  const now = startOfMonth(new Date());
  const currentMonthStr = format(now, 'MMM yyyy');

  const monthlyPersonalIncome = incomes
    .filter(i => format(startOfMonth(parseISO(i.date)), 'MMM yyyy') === currentMonthStr)
    .reduce((s, i) => s + i.amount, 0);

  const monthlyBusinessIncome = businessTransactions
    .filter(t => t.type === 'income' && format(startOfMonth(parseISO(t.date)), 'MMM yyyy') === currentMonthStr)
    .reduce((s, t) => s + t.amount, 0);

  const monthlyBusinessExpense = businessTransactions
    .filter(t => t.type === 'expense' && format(startOfMonth(parseISO(t.date)), 'MMM yyyy') === currentMonthStr)
    .reduce((s, t) => s + t.amount, 0);

  const monthlyPersonalExpense = expenses
    .filter(e => format(startOfMonth(parseISO(e.date)), 'MMM yyyy') === currentMonthStr)
    .reduce((s, e) => s + e.amount, 0);

  const totalMonthlyIncome = monthlyPersonalIncome + monthlyBusinessIncome;
  const totalMonthlyExpense = monthlyPersonalExpense + monthlyBusinessExpense;
  const netSavings = totalMonthlyIncome - totalMonthlyExpense;
  const savingsRate = getSavingsRate(totalMonthlyIncome, totalMonthlyExpense);

  // Total portfolio current value
  const totalPortfolio = savings.reduce((s, sv) => s + sv.amount, 0);

  // Projected portfolio in 5 years
  const projectionData = portfolioProjection(savings, 10);

  // Income vs Expense — last 6 months combined
  const incomeByMonth = groupIncomesByMonth(incomes);
  const expenseByMonth = groupExpensesByMonth(expenses);
  const bizByMonth = businessPLByMonth(businessTransactions);

  // Merge last 6 months
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return format(startOfMonth(d), 'MMM yyyy');
  });

  const incomeExpenseData = last6Months.map(m => {
    const inc = (incomeByMonth.find(x => x.month === m)?.total ?? 0)
              + (bizByMonth.find(x => x.month === m)?.income ?? 0);
    const exp = (expenseByMonth.find(x => x.month === m)?.total ?? 0)
              + (bizByMonth.find(x => x.month === m)?.expense ?? 0);
    return { month: m.replace(' ', "'"), income: inc, expense: exp };
  });

  // Top expenses pie
  const topExpenses = getTopExpenseCategories(expenses, 6).map(({ category, value }) => ({
    name: EXPENSE_CATEGORY_LABELS[category] ?? category,
    value,
  }));

  // Goals summary
  const goalsOnTrack = goals.filter(g => {
    const months = monthsRemaining(g.targetDate);
    const pmt = monthlyPMTNeeded(g.targetAmount, g.currentSavings, months);
    return pmt <= netSavings;
  });

  const urgentGoals = goals
    .filter(g => monthsRemaining(g.targetDate) <= 12 && goalProgress(g) < 80)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="section-title text-2xl">
          Welcome back, {settings.husbandName} &amp; {settings.wifeName}! 👋
        </h1>
        <p className="section-sub">{currentMonthStr} at a glance</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Monthly Income"
          value={formatCompact(totalMonthlyIncome)}
          sub={`Personal + Business`}
          icon={<Wallet size={20} className="text-emerald-600" />}
          iconBg="bg-emerald-50"
          trend="up"
        />
        <StatCard
          label="Monthly Expenses"
          value={formatCompact(totalMonthlyExpense)}
          sub={`${formatPercent(savingsRate)} savings rate`}
          icon={<TrendingDown size={20} className="text-rose-600" />}
          iconBg="bg-rose-50"
          trend={totalMonthlyExpense > totalMonthlyIncome ? 'down' : 'neutral'}
        />
        <StatCard
          label="Total Savings"
          value={formatCompact(totalPortfolio)}
          sub={`${savings.length} instruments`}
          icon={<PiggyBank size={20} className="text-blue-600" />}
          iconBg="bg-blue-50"
        />
        <StatCard
          label="Goals"
          value={`${goalsOnTrack.length} / ${goals.length}`}
          sub="on track"
          icon={<Target size={20} className="text-amber-600" />}
          iconBg="bg-amber-50"
          trend={goalsOnTrack.length === goals.length ? 'up' : 'neutral'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Income vs Expense */}
        <div className="card">
          <h3 className="font-semibold text-slate-700 mb-4 text-sm">Income vs Expenses — Last 6 Months</h3>
          {incomeExpenseData.every(d => d.income === 0 && d.expense === 0) ? (
            <EmptyState message="Add income and expenses to see trends" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={incomeExpenseData} barGap={4} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number) => formatINR(v)} />
                <Legend iconType="circle" iconSize={8} />
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[4,4,0,0]} />
                <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Portfolio Growth Projection */}
        <div className="card">
          <h3 className="font-semibold text-slate-700 mb-4 text-sm">Portfolio Growth Projection — 10 Years</h3>
          {totalPortfolio === 0 ? (
            <EmptyState message="Add savings to see 10-year growth projection" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={projectionData}>
                <defs>
                  <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => formatCompact(v)} />
                <Tooltip formatter={(v: number) => formatINR(v)} />
                <Area type="monotone" dataKey="total" name="Portfolio Value" stroke="#6366f1" fill="url(#grad1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Expense Breakdown + Urgent Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Expense Pie */}
        <div className="card">
          <h3 className="font-semibold text-slate-700 mb-4 text-sm">Expense Breakdown by Category</h3>
          {topExpenses.length === 0 ? (
            <EmptyState message="Add expenses to see category breakdown" />
          ) : (
            <div className="flex gap-4 items-center">
              <ResponsiveContainer width="55%" height={180}>
                <PieChart>
                  <Pie data={topExpenses} cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                    dataKey="value" paddingAngle={3}>
                    {topExpenses.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatINR(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5">
                {topExpenses.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-slate-600 flex-1 truncate">{item.name}</span>
                    <span className="font-semibold text-slate-700">{formatCompact(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Urgent Goals */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-700 text-sm">Goals Needing Attention</h3>
            <button onClick={() => onNavigate('goals')}
              className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
              All Goals <ArrowRight size={12} />
            </button>
          </div>
          {urgentGoals.length === 0 && goals.length === 0 ? (
            <EmptyState message="Add financial goals to track progress" />
          ) : urgentGoals.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-sm text-emerald-600 gap-2">
              <Target size={28} />
              All goals are on track!
            </div>
          ) : (
            <div className="space-y-3">
              {urgentGoals.map(goal => {
                const progress = goalProgress(goal);
                const months = monthsRemaining(goal.targetDate);
                return (
                  <div key={goal.id} className="border border-amber-200 rounded-xl p-3 bg-amber-50">
                    <div className="flex items-start gap-2 mb-2">
                      <AlertCircle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-700 truncate">{goal.name}</p>
                        <p className="text-xs text-slate-500">{months} months left · {formatINR(goal.targetAmount)}</p>
                      </div>
                    </div>
                    <div className="h-2 bg-amber-200 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full transition-all"
                        style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-xs text-amber-700 mt-1">{progress.toFixed(0)}% funded</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0">
          <p className="text-xs opacity-80 font-medium">Net Monthly Surplus</p>
          <p className="text-2xl font-bold mt-1">{formatCompact(netSavings)}</p>
          <p className="text-xs opacity-70 mt-1">Income − All Expenses</p>
        </div>
        <div className="card bg-gradient-to-br from-emerald-400 to-teal-600 text-white border-0">
          <p className="text-xs opacity-80 font-medium">Business Net Profit (Month)</p>
          <p className="text-2xl font-bold mt-1">{formatCompact(monthlyBusinessIncome - monthlyBusinessExpense)}</p>
          <p className="text-xs opacity-70 mt-1">Revenue − Business Costs</p>
        </div>
        <div className="card bg-gradient-to-br from-amber-400 to-orange-500 text-white border-0">
          <p className="text-xs opacity-80 font-medium">Portfolio in 5 Years</p>
          <p className="text-2xl font-bold mt-1">
            {formatCompact(projectionData[5]?.total ?? 0)}
          </p>
          <p className="text-xs opacity-70 mt-1">At blended growth rate</p>
        </div>
      </div>

      {/* Quick navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { tab: 'income' as ActiveTab, label: 'Add Income', color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
          { tab: 'savings' as ActiveTab, label: 'Add Savings', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
          { tab: 'expenses' as ActiveTab, label: 'Add Expense', color: 'bg-rose-50 text-rose-700 hover:bg-rose-100' },
          { tab: 'goals' as ActiveTab, label: 'Add Goal', color: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
          { tab: 'business' as ActiveTab, label: 'Business Entry', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
        ].map(({ tab, label, color }) => (
          <button key={tab} onClick={() => onNavigate(tab)}
            className={`${color} rounded-xl p-3 text-sm font-semibold transition-colors text-center`}>
            + {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-32 text-sm text-slate-400 gap-2">
      <PiggyBank size={28} className="opacity-40" />
      {message}
    </div>
  );
}
