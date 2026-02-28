import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Plus, Trash2, TrendingUp, Users } from 'lucide-react';
import { Income, IncomeCategory, Person, AppData } from '../types';
import { generateId } from '../utils/storage';
import { formatINR, formatDate, todayISO, INCOME_CATEGORY_LABELS } from '../utils/formatters';
import { format, parseISO, startOfMonth } from 'date-fns';

interface Props {
  data: AppData;
  onUpdate: (updater: (prev: AppData) => AppData) => void;
}

const EMPTY_FORM = {
  person: 'Husband' as Person,
  source: '',
  amount: '',
  date: todayISO(),
  category: 'salary' as IncomeCategory,
  recurring: false,
};

export default function IncomeTab({ data, onUpdate }: Props) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [filterPerson, setFilterPerson] = useState<'All' | Person>('All');
  const { incomes, settings } = data;

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.source.trim() || !form.amount) return;
    const entry: Income = {
      id: generateId(),
      person: form.person,
      source: form.source.trim(),
      amount: parseFloat(form.amount),
      date: form.date,
      category: form.category,
      recurring: form.recurring,
    };
    onUpdate(prev => ({ ...prev, incomes: [entry, ...prev.incomes] }));
    setForm(EMPTY_FORM);
  }

  function handleDelete(id: string) {
    onUpdate(prev => ({ ...prev, incomes: prev.incomes.filter(i => i.id !== id) }));
  }

  const filtered = filterPerson === 'All' ? incomes : incomes.filter(i => i.person === filterPerson);

  // Per-person totals this month
  const currentMonth = format(startOfMonth(new Date()), 'MMM yyyy');
  const husbandThisMonth = incomes
    .filter(i => i.person === 'Husband' && format(startOfMonth(parseISO(i.date)), 'MMM yyyy') === currentMonth)
    .reduce((s, i) => s + i.amount, 0);
  const wifeThisMonth = incomes
    .filter(i => i.person === 'Wife' && format(startOfMonth(parseISO(i.date)), 'MMM yyyy') === currentMonth)
    .reduce((s, i) => s + i.amount, 0);

  // Person-split chart data
  const personSplitData = Array.from({ length: 6 }, (_, idx) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - idx));
    const m = format(startOfMonth(d), 'MMM yyyy');
    const hus = incomes.filter(i => i.person === 'Husband' && format(startOfMonth(parseISO(i.date)), 'MMM yyyy') === m).reduce((s, i) => s + i.amount, 0);
    const wife = incomes.filter(i => i.person === 'Wife' && format(startOfMonth(parseISO(i.date)), 'MMM yyyy') === m).reduce((s, i) => s + i.amount, 0);
    return { month: m.replace(' ', "'"), [settings.husbandName]: hus, [settings.wifeName]: wife };
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="section-title">Income Tracker</h2>
        <p className="section-sub">Track combined household income</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: settings.husbandName, value: husbandThisMonth, color: 'bg-blue-50 text-blue-700' },
          { label: settings.wifeName, value: wifeThisMonth, color: 'bg-pink-50 text-pink-700' },
          { label: 'Combined (Month)', value: husbandThisMonth + wifeThisMonth, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Total Entries', value: incomes.length, color: 'bg-slate-50 text-slate-700', isCount: true },
        ].map(({ label, value, color, isCount }) => (
          <div key={label} className={`card ${color}`}>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
            <p className="text-xl font-bold mt-1">{isCount ? value : formatINR(value as number)}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Income Form */}
        <div className="card">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Plus size={16} className="text-emerald-600" /> Add Income Entry
          </h3>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="label">Person</label>
              <select className="input" value={form.person}
                onChange={e => setForm(f => ({ ...f, person: e.target.value as Person }))}>
                <option value="Husband">{settings.husbandName}</option>
                <option value="Wife">{settings.wifeName}</option>
              </select>
            </div>
            <div>
              <label className="label">Source / Description</label>
              <input className="input" placeholder="e.g., Monthly Salary, Freelance Project" value={form.source}
                onChange={e => setForm(f => ({ ...f, source: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Amount (₹)</label>
              <input className="input" type="number" min="0" step="1" placeholder="0" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value as IncomeCategory }))}>
                {Object.entries(INCOME_CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Date</label>
              <input className="input" type="date" value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input type="checkbox" checked={form.recurring}
                onChange={e => setForm(f => ({ ...f, recurring: e.target.checked }))}
                className="rounded accent-indigo-600" />
              Recurring monthly income
            </label>
            <button type="submit" className="btn-primary w-full mt-2">Add Income</button>
          </form>
        </div>

        {/* Chart */}
        <div className="lg:col-span-2 card">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Users size={16} className="text-indigo-600" /> Income Split — Last 6 Months
          </h3>
          {personSplitData.every(d => d[settings.husbandName] === 0 && d[settings.wifeName] === 0) ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-sm gap-2">
              <TrendingUp size={32} className="opacity-30" />
              Add income entries to see monthly trends
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={personSplitData} barGap={4} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number) => formatINR(v)} />
                <Legend iconType="circle" iconSize={8} />
                <Bar dataKey={settings.husbandName} fill="#6366f1" radius={[4,4,0,0]} />
                <Bar dataKey={settings.wifeName} fill="#ec4899" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Income List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-700">Income History</h3>
          <div className="flex gap-2">
            {(['All', 'Husband', 'Wife'] as const).map(p => (
              <button key={p}
                onClick={() => setFilterPerson(p === 'Husband' ? 'Husband' : p === 'Wife' ? 'Wife' : 'All')}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  filterPerson === p ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>
                {p === 'Husband' ? settings.husbandName : p === 'Wife' ? settings.wifeName : 'All'}
              </button>
            ))}
          </div>
        </div>
        {filtered.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No income entries yet. Add one above!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 uppercase tracking-wide border-b border-slate-100">
                  <th className="text-left py-2 pr-4">Date</th>
                  <th className="text-left py-2 pr-4">Person</th>
                  <th className="text-left py-2 pr-4">Source</th>
                  <th className="text-left py-2 pr-4">Category</th>
                  <th className="text-right py-2 pr-4">Amount</th>
                  <th className="text-left py-2">Type</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(inc => (
                  <tr key={inc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 pr-4 text-slate-500 whitespace-nowrap">{formatDate(inc.date)}</td>
                    <td className="py-2 pr-4">
                      <span className={`badge ${inc.person === 'Husband' ? 'badge-blue' : 'bg-pink-100 text-pink-700'}`}>
                        {inc.person === 'Husband' ? settings.husbandName : settings.wifeName}
                      </span>
                    </td>
                    <td className="py-2 pr-4 font-medium text-slate-700">{inc.source}</td>
                    <td className="py-2 pr-4 text-slate-500">{INCOME_CATEGORY_LABELS[inc.category]}</td>
                    <td className="py-2 pr-4 text-right font-semibold text-emerald-600">{formatINR(inc.amount)}</td>
                    <td className="py-2">
                      {inc.recurring && <span className="badge badge-green">Recurring</span>}
                    </td>
                    <td className="py-2 pl-2">
                      <button onClick={() => handleDelete(inc.id)} className="btn-danger py-1 px-2">
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
