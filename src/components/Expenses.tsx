import React, { useState } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Plus, Trash2, Receipt, AlertTriangle, TrendingDown } from 'lucide-react';
import { Expense, ExpenseCategory, PersonOrJoint, AppData } from '../types';
import { generateId } from '../utils/storage';
import {
  groupExpensesByMonth, expensesByCategory, getTopExpenseCategories,
} from '../utils/calculations';
import {
  formatINR, formatCompact, formatDate, todayISO,
  EXPENSE_CATEGORY_LABELS,
} from '../utils/formatters';
import { format, parseISO, startOfMonth } from 'date-fns';

interface Props {
  data: AppData;
  onUpdate: (updater: (prev: AppData) => AppData) => void;
}

const EMPTY_FORM = {
  category: 'food' as ExpenseCategory,
  description: '',
  amount: '',
  date: todayISO(),
  person: 'Joint' as PersonOrJoint,
  paymentMethod: 'upi' as Expense['paymentMethod'],
};

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#14b8a6', '#ec4899', '#84cc16', '#3b82f6', '#a78bfa'];

// Expense reduction tips per category
const EXPENSE_TIPS: Record<string, string> = {
  housing: 'Consider refinancing your home loan or negotiating lower rent.',
  food: 'Meal-prep at home and reduce dining out to save significantly.',
  transport: 'Use public transport or carpooling a few days a week.',
  utilities: 'Switch to energy-efficient appliances and LED lighting.',
  healthcare: 'Invest in a good health insurance plan to avoid out-of-pocket costs.',
  education: 'Look for online courses and free educational resources.',
  entertainment: 'Set a monthly entertainment budget and stick to it.',
  clothing: 'Shop during sales and prefer quality over quantity.',
  personal_care: 'DIY grooming where possible, or find budget-friendly salons.',
  insurance: 'Compare policies annually to ensure best premium rates.',
  subscriptions: 'Audit all subscriptions and cancel unused ones.',
  emi: 'Prepay EMIs when you have surplus to reduce interest burden.',
  other: 'Track these miscellaneous expenses to find saving opportunities.',
};

export default function ExpensesTab({ data, onUpdate }: Props) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [filterPerson, setFilterPerson] = useState<'All' | PersonOrJoint>('All');
  const [filterMonth, setFilterMonth] = useState<string>('');
  const { expenses, settings } = data;

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description.trim() || !form.amount) return;
    const entry: Expense = {
      id: generateId(),
      category: form.category,
      description: form.description.trim(),
      amount: parseFloat(form.amount),
      date: form.date,
      person: form.person,
      paymentMethod: form.paymentMethod,
    };
    onUpdate(prev => ({ ...prev, expenses: [entry, ...prev.expenses] }));
    setForm(EMPTY_FORM);
  }

  function handleDelete(id: string) {
    onUpdate(prev => ({ ...prev, expenses: prev.expenses.filter(e => e.id !== id) }));
  }

  // Filtering
  let filtered = filterPerson === 'All' ? expenses : expenses.filter(e => e.person === filterPerson);
  if (filterMonth) {
    filtered = filtered.filter(e => format(parseISO(e.date), 'yyyy-MM') === filterMonth);
  }

  // Current month stats
  const currentMonth = format(startOfMonth(new Date()), 'MMM yyyy');
  const currentMonthTotal = expenses
    .filter(e => format(startOfMonth(parseISO(e.date)), 'MMM yyyy') === currentMonth)
    .reduce((s, e) => s + e.amount, 0);

  const byMonthData = groupExpensesByMonth(expenses);
  const byCategoryData = expensesByCategory(expenses).map(({ category, value }) => ({
    name: EXPENSE_CATEGORY_LABELS[category] ?? category,
    value,
    category,
  }));

  const top3Categories = getTopExpenseCategories(expenses, 3);

  // 6-month trend
  const last6Data = Array.from({ length: 6 }, (_, idx) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - idx));
    const m = format(startOfMonth(d), 'MMM yyyy');
    const total = expenses
      .filter(e => format(startOfMonth(parseISO(e.date)), 'MMM yyyy') === m)
      .reduce((s, e) => s + e.amount, 0);
    return { month: m.replace(' ', "'"), total };
  });

  // Available months for filter
  const months = Array.from(new Set(expenses.map(e => format(parseISO(e.date), 'yyyy-MM')))).sort().reverse();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="section-title">Expense Tracker</h2>
        <p className="section-sub">Track daily and monthly expenses — personal and household</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card bg-rose-50">
          <p className="text-xs font-semibold uppercase text-rose-500 tracking-wide">This Month</p>
          <p className="text-xl font-bold text-rose-700 mt-1">{formatCompact(currentMonthTotal)}</p>
        </div>
        <div className="card bg-slate-50">
          <p className="text-xs font-semibold uppercase text-slate-500 tracking-wide">Total Entries</p>
          <p className="text-xl font-bold text-slate-700 mt-1">{expenses.length}</p>
        </div>
        <div className="card bg-amber-50">
          <p className="text-xs font-semibold uppercase text-amber-500 tracking-wide">Top Category</p>
          <p className="text-xl font-bold text-amber-700 mt-1">
            {top3Categories[0] ? EXPENSE_CATEGORY_LABELS[top3Categories[0].category] : '—'}
          </p>
        </div>
        <div className="card bg-indigo-50">
          <p className="text-xs font-semibold uppercase text-indigo-500 tracking-wide">Avg Monthly</p>
          <p className="text-xl font-bold text-indigo-700 mt-1">
            {formatCompact(byMonthData.length ? byMonthData.reduce((s, m) => s + m.total, 0) / byMonthData.length : 0)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Expense Form */}
        <div className="card">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Plus size={16} className="text-rose-600" /> Add Expense
          </h3>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value as ExpenseCategory }))}>
                {Object.entries(EXPENSE_CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Description</label>
              <input className="input" placeholder="e.g., Grocery — Big Bazaar" value={form.description}
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
              <label className="label">Paid By</label>
              <select className="input" value={form.person}
                onChange={e => setForm(f => ({ ...f, person: e.target.value as PersonOrJoint }))}>
                <option value="Joint">Joint / Household</option>
                <option value="Husband">{settings.husbandName}</option>
                <option value="Wife">{settings.wifeName}</option>
              </select>
            </div>
            <div>
              <label className="label">Payment Method</label>
              <select className="input" value={form.paymentMethod}
                onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value as Expense['paymentMethod'] }))}>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>
            <button type="submit" className="btn-primary w-full">Add Expense</button>
          </form>
        </div>

        {/* Charts */}
        <div className="lg:col-span-2 space-y-4">
          {/* Monthly trend */}
          <div className="card">
            <h3 className="font-semibold text-slate-700 mb-4 text-sm flex items-center gap-2">
              <TrendingDown size={15} className="text-rose-500" /> Monthly Expense Trend
            </h3>
            {last6Data.every(d => d.total === 0) ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-sm gap-2">
                <Receipt size={28} className="opacity-30" />
                Add expenses to see monthly trends
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={last6Data} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                  <Tooltip formatter={(v: number) => formatINR(v)} />
                  <Bar dataKey="total" name="Expenses" fill="#f43f5e" radius={[5,5,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Category Pie */}
          <div className="card">
            <h3 className="font-semibold text-slate-700 mb-4 text-sm">Expense by Category (All Time)</h3>
            {byCategoryData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-36 text-slate-400 text-sm">
                No data yet
              </div>
            ) : (
              <div className="flex gap-4 items-center">
                <ResponsiveContainer width="50%" height={160}>
                  <PieChart>
                    <Pie data={byCategoryData} cx="50%" cy="50%" innerRadius={35} outerRadius={65}
                      dataKey="value" paddingAngle={2}>
                      {byCategoryData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatINR(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1">
                  {byCategoryData.slice(0, 6).map((item, i) => (
                    <div key={item.name} className="flex items-center gap-2 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-slate-600 flex-1 truncate">{item.name}</span>
                      <span className="font-semibold text-slate-700">{formatCompact(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Spending Improvement Tips */}
      {top3Categories.length > 0 && (
        <div className="card border-amber-200 bg-amber-50">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-amber-600" />
            <h3 className="font-semibold text-amber-800">Top Spending Areas — Improvement Tips</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {top3Categories.map(({ category, value }, i) => (
              <div key={category} className="bg-white rounded-xl p-3 border border-amber-100">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-amber-700">#{i + 1}</span>
                  <span className="text-sm font-semibold text-slate-700">
                    {EXPENSE_CATEGORY_LABELS[category]}
                  </span>
                  <span className="ml-auto badge badge-red">{formatCompact(value)}</span>
                </div>
                <p className="text-xs text-slate-500">{EXPENSE_TIPS[category]}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expense List */}
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="font-semibold text-slate-700">Expense History</h3>
          <div className="flex flex-wrap gap-2">
            <select className="input !w-auto text-xs py-1.5" value={filterMonth}
              onChange={e => setFilterMonth(e.target.value)}>
              <option value="">All Months</option>
              {months.map(m => (
                <option key={m} value={m}>{format(new Date(m + '-01'), 'MMM yyyy')}</option>
              ))}
            </select>
            {(['All', 'Joint', 'Husband', 'Wife'] as const).map(p => (
              <button key={p}
                onClick={() => setFilterPerson(p === 'Husband' ? 'Husband' : p === 'Wife' ? 'Wife' : p === 'Joint' ? 'Joint' : 'All')}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  filterPerson === p ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>
                {p === 'Husband' ? settings.husbandName : p === 'Wife' ? settings.wifeName : p}
              </button>
            ))}
          </div>
        </div>
        {filtered.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No expenses found. Add one above!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 uppercase tracking-wide border-b border-slate-100">
                  <th className="text-left py-2 pr-3">Date</th>
                  <th className="text-left py-2 pr-3">Category</th>
                  <th className="text-left py-2 pr-3">Description</th>
                  <th className="text-left py-2 pr-3">Paid By</th>
                  <th className="text-left py-2 pr-3">Method</th>
                  <th className="text-right py-2 pr-3">Amount</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 pr-3 text-slate-500 whitespace-nowrap">{formatDate(exp.date)}</td>
                    <td className="py-2 pr-3">
                      <span className="badge badge-yellow">{EXPENSE_CATEGORY_LABELS[exp.category]}</span>
                    </td>
                    <td className="py-2 pr-3 font-medium text-slate-700">{exp.description}</td>
                    <td className="py-2 pr-3 text-slate-500 text-xs">
                      {exp.person === 'Husband' ? settings.husbandName : exp.person === 'Wife' ? settings.wifeName : 'Joint'}
                    </td>
                    <td className="py-2 pr-3 text-slate-400 text-xs capitalize">{exp.paymentMethod.replace('_', ' ')}</td>
                    <td className="py-2 pr-3 text-right font-semibold text-rose-600">{formatINR(exp.amount)}</td>
                    <td className="py-2 pl-2">
                      <button onClick={() => handleDelete(exp.id)} className="btn-danger py-1 px-2">
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold text-sm">
                  <td colSpan={5} className="py-2 px-2 text-slate-600">Total (filtered)</td>
                  <td className="py-2 pr-3 text-right text-rose-700">
                    {formatINR(filtered.reduce((s, e) => s + e.amount, 0))}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
