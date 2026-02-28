import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { Plus, Trash2, Briefcase, DollarSign } from 'lucide-react';
import { BusinessTransaction, BusinessCategory, AppData } from '../types';
import { generateId } from '../utils/storage';
import { businessPLByMonth } from '../utils/calculations';
import { formatINR, formatCompact, formatDate, todayISO, BUSINESS_CATEGORY_LABELS } from '../utils/formatters';
import { format, parseISO, startOfMonth } from 'date-fns';

interface Props {
  data: AppData;
  onUpdate: (updater: (prev: AppData) => AppData) => void;
}

const INCOME_CATEGORIES: BusinessCategory[] = ['sales', 'services', 'rent_received', 'other_income'];
const EXPENSE_CATEGORIES: BusinessCategory[] = [
  'salaries', 'raw_materials', 'marketing', 'utilities',
  'rent_paid', 'equipment', 'travel', 'professional_fees', 'misc_expense',
];

const EMPTY_FORM = {
  type: 'income' as 'income' | 'expense',
  category: 'sales' as BusinessCategory,
  description: '',
  amount: '',
  date: todayISO(),
  taxDeductible: false,
  invoiceNumber: '',
};

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#14b8a6', '#ec4899', '#84cc16'];

export default function BusinessTab({ data, onUpdate }: Props) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterMonth, setFilterMonth] = useState<string>('');
  const { businessTransactions: transactions } = data;

  function handleTypeChange(type: 'income' | 'expense') {
    setForm(f => ({
      ...f,
      type,
      category: type === 'income' ? 'sales' : 'salaries',
    }));
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description.trim() || !form.amount) return;
    const entry: BusinessTransaction = {
      id: generateId(),
      type: form.type,
      category: form.category,
      description: form.description.trim(),
      amount: parseFloat(form.amount),
      date: form.date,
      taxDeductible: form.taxDeductible,
      invoiceNumber: form.invoiceNumber.trim() || undefined,
    };
    onUpdate(prev => ({
      ...prev,
      businessTransactions: [entry, ...prev.businessTransactions],
    }));
    setForm(EMPTY_FORM);
  }

  function handleDelete(id: string) {
    onUpdate(prev => ({
      ...prev,
      businessTransactions: prev.businessTransactions.filter(t => t.id !== id),
    }));
  }

  // Current month stats
  const currentMonth = format(startOfMonth(new Date()), 'MMM yyyy');
  const monthlyIncome = transactions
    .filter(t => t.type === 'income' && format(startOfMonth(parseISO(t.date)), 'MMM yyyy') === currentMonth)
    .reduce((s, t) => s + t.amount, 0);
  const monthlyExpense = transactions
    .filter(t => t.type === 'expense' && format(startOfMonth(parseISO(t.date)), 'MMM yyyy') === currentMonth)
    .reduce((s, t) => s + t.amount, 0);
  const monthlyProfit = monthlyIncome - monthlyExpense;

  // All-time stats
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  // Charts
  const plByMonth = businessPLByMonth(transactions);

  // Income breakdown
  const incomeByCategory = (() => {
    const map = new Map<string, number>();
    transactions.filter(t => t.type === 'income').forEach(t => {
      map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
    });
    return Array.from(map.entries()).map(([category, value]) => ({
      name: BUSINESS_CATEGORY_LABELS[category] ?? category, value,
    }));
  })();

  // Expense breakdown
  const expenseByCategory = (() => {
    const map = new Map<string, number>();
    transactions.filter(t => t.type === 'expense').forEach(t => {
      map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
    });
    return Array.from(map.entries()).map(([category, value]) => ({
      name: BUSINESS_CATEGORY_LABELS[category] ?? category, value,
    }));
  })();

  // Filtered list
  let filtered = filterType === 'all' ? transactions : transactions.filter(t => t.type === filterType);
  if (filterMonth) {
    filtered = filtered.filter(t => format(parseISO(t.date), 'yyyy-MM') === filterMonth);
  }

  const months = Array.from(new Set(transactions.map(t => format(parseISO(t.date), 'yyyy-MM')))).sort().reverse();

  const profitMargin = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="section-title">Business Finance</h2>
        <p className="section-sub">Track business income & expenses — P&L, cash flow, and cost breakdown</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card bg-emerald-50">
          <p className="text-xs font-semibold uppercase text-emerald-500 tracking-wide">Revenue (Month)</p>
          <p className="text-xl font-bold text-emerald-700 mt-1">{formatCompact(monthlyIncome)}</p>
          <p className="text-xs text-emerald-400 mt-0.5">Total: {formatCompact(totalIncome)}</p>
        </div>
        <div className="card bg-rose-50">
          <p className="text-xs font-semibold uppercase text-rose-500 tracking-wide">Expenses (Month)</p>
          <p className="text-xl font-bold text-rose-700 mt-1">{formatCompact(monthlyExpense)}</p>
          <p className="text-xs text-rose-400 mt-0.5">Total: {formatCompact(totalExpense)}</p>
        </div>
        <div className={`card ${monthlyProfit >= 0 ? 'bg-indigo-50' : 'bg-red-50'}`}>
          <p className={`text-xs font-semibold uppercase tracking-wide ${monthlyProfit >= 0 ? 'text-indigo-500' : 'text-red-500'}`}>
            Net Profit (Month)
          </p>
          <p className={`text-xl font-bold mt-1 ${monthlyProfit >= 0 ? 'text-indigo-700' : 'text-red-700'}`}>
            {monthlyProfit >= 0 ? '' : '-'}{formatCompact(Math.abs(monthlyProfit))}
          </p>
        </div>
        <div className="card bg-slate-50">
          <p className="text-xs font-semibold uppercase text-slate-500 tracking-wide">Profit Margin</p>
          <p className={`text-xl font-bold mt-1 ${profitMargin >= 20 ? 'text-emerald-700' : profitMargin >= 0 ? 'text-amber-700' : 'text-red-700'}`}>
            {profitMargin.toFixed(1)}%
          </p>
          <p className="text-xs text-slate-400 mt-0.5">All-time</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Transaction Form */}
        <div className="card">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Plus size={16} className="text-purple-600" /> Add Transaction
          </h3>
          <form onSubmit={handleAdd} className="space-y-3">
            {/* Income / Expense toggle */}
            <div>
              <label className="label">Type</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => handleTypeChange('income')}
                  className={`flex-1 py-2 text-sm rounded-lg font-medium border transition-colors ${
                    form.type === 'income'
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}>
                  ↑ Income
                </button>
                <button type="button" onClick={() => handleTypeChange('expense')}
                  className={`flex-1 py-2 text-sm rounded-lg font-medium border transition-colors ${
                    form.type === 'expense'
                      ? 'bg-rose-100 text-rose-700 border-rose-300'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}>
                  ↓ Expense
                </button>
              </div>
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value as BusinessCategory }))}>
                {(form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(k => (
                  <option key={k} value={k}>{BUSINESS_CATEGORY_LABELS[k]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Description</label>
              <input className="input" placeholder="Invoice, vendor, project name..." value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Amount (₹)</label>
              <input className="input" type="number" min="0" step="1" placeholder="0" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Date</label>
              <input className="input" type="date" value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Invoice / Reference No. (optional)</label>
              <input className="input" placeholder="INV-001" value={form.invoiceNumber}
                onChange={e => setForm(f => ({ ...f, invoiceNumber: e.target.value }))} />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input type="checkbox" checked={form.taxDeductible}
                onChange={e => setForm(f => ({ ...f, taxDeductible: e.target.checked }))}
                className="rounded accent-indigo-600" />
              Tax deductible expense
            </label>
            <button type="submit" className="btn-primary w-full">Add Entry</button>
          </form>
        </div>

        {/* Charts */}
        <div className="lg:col-span-2 space-y-4">
          {/* Monthly P&L */}
          <div className="card">
            <h3 className="font-semibold text-slate-700 mb-4 text-sm flex items-center gap-2">
              <DollarSign size={15} className="text-purple-600" /> Monthly P&L
            </h3>
            {plByMonth.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-sm gap-2">
                <Briefcase size={32} className="opacity-30" />
                Add business transactions to see P&L
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={plByMonth.slice(-6)} barGap={2} barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => formatCompact(v)} />
                  <Tooltip formatter={(v: number) => formatINR(v)} />
                  <Legend iconType="circle" iconSize={8} />
                  <Bar dataKey="income" name="Revenue" fill="#10b981" radius={[3,3,0,0]} />
                  <Bar dataKey="expense" name="Expenses" fill="#f43f5e" radius={[3,3,0,0]} />
                  <Bar dataKey="profit" name="Net Profit" fill="#6366f1" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Breakdowns row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card">
              <h3 className="font-semibold text-slate-700 mb-3 text-xs uppercase tracking-wide">Revenue Sources</h3>
              {incomeByCategory.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No data</p>
              ) : (
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={incomeByCategory} cx="50%" cy="50%" outerRadius={55}
                      dataKey="value" nameKey="name">
                      {incomeByCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatINR(v)} />
                  </PieChart>
                </ResponsiveContainer>
              )}
              {incomeByCategory.slice(0, 3).map((item, i) => (
                <div key={item.name} className="flex items-center gap-2 text-xs mt-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                  <span className="flex-1 truncate text-slate-600">{item.name}</span>
                  <span className="font-semibold">{formatCompact(item.value)}</span>
                </div>
              ))}
            </div>
            <div className="card">
              <h3 className="font-semibold text-slate-700 mb-3 text-xs uppercase tracking-wide">Cost Breakdown</h3>
              {expenseByCategory.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No data</p>
              ) : (
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={expenseByCategory} cx="50%" cy="50%" outerRadius={55}
                      dataKey="value" nameKey="name">
                      {expenseByCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatINR(v)} />
                  </PieChart>
                </ResponsiveContainer>
              )}
              {expenseByCategory.slice(0, 3).map((item, i) => (
                <div key={item.name} className="flex items-center gap-2 text-xs mt-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                  <span className="flex-1 truncate text-slate-600">{item.name}</span>
                  <span className="font-semibold">{formatCompact(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="font-semibold text-slate-700">Transaction History</h3>
          <div className="flex flex-wrap gap-2">
            <select className="input !w-auto text-xs py-1.5" value={filterMonth}
              onChange={e => setFilterMonth(e.target.value)}>
              <option value="">All Months</option>
              {months.map(m => (
                <option key={m} value={m}>{format(new Date(m + '-01'), 'MMM yyyy')}</option>
              ))}
            </select>
            {(['all', 'income', 'expense'] as const).map(t => (
              <button key={t}
                onClick={() => setFilterType(t)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  filterType === t
                    ? t === 'income' ? 'bg-emerald-600 text-white' : t === 'expense' ? 'bg-rose-600 text-white' : 'bg-purple-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>
                {t === 'all' ? 'All' : t === 'income' ? '↑ Income' : '↓ Expense'}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No transactions found. Add one above!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 uppercase tracking-wide border-b border-slate-100">
                  <th className="text-left py-2 pr-3">Date</th>
                  <th className="text-left py-2 pr-3">Type</th>
                  <th className="text-left py-2 pr-3">Category</th>
                  <th className="text-left py-2 pr-3">Description</th>
                  <th className="text-left py-2 pr-3">Invoice</th>
                  <th className="text-right py-2 pr-3">Amount</th>
                  <th className="text-left py-2">Tax</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 pr-3 text-slate-500 whitespace-nowrap">{formatDate(t.date)}</td>
                    <td className="py-2 pr-3">
                      <span className={`badge ${t.type === 'income' ? 'badge-green' : 'badge-red'}`}>
                        {t.type === 'income' ? '↑ Revenue' : '↓ Expense'}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-slate-500 text-xs">{BUSINESS_CATEGORY_LABELS[t.category]}</td>
                    <td className="py-2 pr-3 font-medium text-slate-700">{t.description}</td>
                    <td className="py-2 pr-3 text-slate-400 text-xs">{t.invoiceNumber ?? '—'}</td>
                    <td className={`py-2 pr-3 text-right font-semibold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatINR(t.amount)}
                    </td>
                    <td className="py-2">
                      {t.taxDeductible && <span className="badge badge-blue">Tax</span>}
                    </td>
                    <td className="py-2 pl-2">
                      <button onClick={() => handleDelete(t.id)} className="btn-danger py-1 px-2">
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold text-sm">
                  <td colSpan={5} className="py-2 px-2 text-slate-600">Total (filtered)</td>
                  <td className="py-2 pr-3 text-right text-indigo-700">
                    {formatINR(
                      filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0) -
                      filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
                    )}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
