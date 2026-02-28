import React, { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import { Plus, Trash2, PiggyBank, TrendingUp, Info } from 'lucide-react';
import { Saving, SavingType, PersonOrJoint, AppData } from '../types';
import { generateId } from '../utils/storage';
import {
  DEFAULT_RETURN_RATES, SAVING_TYPE_LABELS, futureValue,
  portfolioProjection, savingGrowthProjection,
} from '../utils/calculations';
import { formatINR, formatCompact, formatDate, formatPercent, todayISO } from '../utils/formatters';

interface Props {
  data: AppData;
  onUpdate: (updater: (prev: AppData) => AppData) => void;
}

const EMPTY_FORM = {
  name: '',
  type: 'fd' as SavingType,
  amount: '',
  startDate: todayISO(),
  maturityDate: '',
  expectedReturn: '',
  person: 'Joint' as PersonOrJoint,
  notes: '',
};

const TYPE_BADGES: Record<string, string> = {
  gold: 'bg-yellow-100 text-yellow-800',
  silver: 'bg-slate-100 text-slate-700',
  ppf: 'bg-green-100 text-green-800',
  fd: 'bg-blue-100 text-blue-800',
  etf: 'bg-indigo-100 text-indigo-800',
  bond: 'bg-purple-100 text-purple-800',
  mutual_fund: 'bg-teal-100 text-teal-800',
  nps: 'bg-orange-100 text-orange-800',
  stocks: 'bg-rose-100 text-rose-800',
  real_estate: 'bg-amber-100 text-amber-800',
  elss: 'bg-cyan-100 text-cyan-800',
  other: 'bg-slate-100 text-slate-600',
};

export default function SavingsTab({ data, onUpdate }: Props) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedSaving, setSelectedSaving] = useState<string | null>(null);
  const { savings, settings } = data;

  function handleTypeChange(type: SavingType) {
    setForm(f => ({
      ...f,
      type,
      expectedReturn: String(DEFAULT_RETURN_RATES[type]),
    }));
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.amount) return;
    const entry: Saving = {
      id: generateId(),
      name: form.name.trim(),
      type: form.type,
      amount: parseFloat(form.amount),
      startDate: form.startDate,
      maturityDate: form.maturityDate || undefined,
      expectedReturn: parseFloat(form.expectedReturn) || DEFAULT_RETURN_RATES[form.type],
      person: form.person,
      notes: form.notes.trim() || undefined,
    };
    onUpdate(prev => ({ ...prev, savings: [entry, ...prev.savings] }));
    setForm(EMPTY_FORM);
  }

  function handleDelete(id: string) {
    onUpdate(prev => ({ ...prev, savings: prev.savings.filter(s => s.id !== id) }));
    if (selectedSaving === id) setSelectedSaving(null);
  }

  const totalInvested = savings.reduce((s, sv) => s + sv.amount, 0);
  const totalIn5Years = savings.reduce((s, sv) => s + futureValue(sv.amount, sv.expectedReturn, 5), 0);
  const totalIn10Years = savings.reduce((s, sv) => s + futureValue(sv.amount, sv.expectedReturn, 10), 0);

  // Portfolio projection chart (all savings combined)
  const projectionData = portfolioProjection(savings, 10);

  // Individual saving growth chart
  const selectedSav = savings.find(s => s.id === selectedSaving);
  const individualData = selectedSav ? savingGrowthProjection(selectedSav, 10) : [];

  // Per-type bar comparison
  const typeComparison = savings.map(s => ({
    name: s.name.length > 12 ? s.name.slice(0, 12) + '…' : s.name,
    invested: s.amount,
    in5yr: Math.round(futureValue(s.amount, s.expectedReturn, 5)),
    in10yr: Math.round(futureValue(s.amount, s.expectedReturn, 10)),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="section-title">Savings & Investments</h2>
        <p className="section-sub">Track your portfolio — Gold, PPF, FD, ETFs, Bonds & more with projected growth</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card bg-slate-50">
          <p className="text-xs font-semibold uppercase text-slate-500 tracking-wide">Total Invested</p>
          <p className="text-xl font-bold text-slate-800 mt-1">{formatCompact(totalInvested)}</p>
          <p className="text-xs text-slate-400 mt-0.5">{savings.length} instruments</p>
        </div>
        <div className="card bg-indigo-50">
          <p className="text-xs font-semibold uppercase text-indigo-500 tracking-wide">Value in 1 Year</p>
          <p className="text-xl font-bold text-indigo-700 mt-1">
            {formatCompact(savings.reduce((s, sv) => s + futureValue(sv.amount, sv.expectedReturn, 1), 0))}
          </p>
          <p className="text-xs text-indigo-400 mt-0.5">At current rates</p>
        </div>
        <div className="card bg-emerald-50">
          <p className="text-xs font-semibold uppercase text-emerald-500 tracking-wide">Value in 5 Years</p>
          <p className="text-xl font-bold text-emerald-700 mt-1">{formatCompact(totalIn5Years)}</p>
          <p className="text-xs text-emerald-400 mt-0.5">Gain: {formatCompact(totalIn5Years - totalInvested)}</p>
        </div>
        <div className="card bg-amber-50">
          <p className="text-xs font-semibold uppercase text-amber-500 tracking-wide">Value in 10 Years</p>
          <p className="text-xl font-bold text-amber-700 mt-1">{formatCompact(totalIn10Years)}</p>
          <p className="text-xs text-amber-400 mt-0.5">Gain: {formatCompact(totalIn10Years - totalInvested)}</p>
        </div>
      </div>

      {/* Return Rate Reference */}
      <div className="card border-indigo-100 bg-indigo-50">
        <div className="flex items-start gap-2">
          <Info size={16} className="text-indigo-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-indigo-700 mb-1">Default Annual Return Rates (India)</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(DEFAULT_RETURN_RATES).map(([k, v]) => (
                <span key={k} className="text-xs bg-white text-indigo-700 border border-indigo-200 rounded px-2 py-0.5">
                  {SAVING_TYPE_LABELS[k as SavingType]}: {v}%
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Saving Form */}
        <div className="card">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Plus size={16} className="text-blue-600" /> Add Investment
          </h3>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="label">Name / Description</label>
              <input className="input" placeholder="e.g., SBI FD Jan 2024, Gold Jewellery" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type}
                onChange={e => handleTypeChange(e.target.value as SavingType)}>
                {Object.entries(SAVING_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Invested Amount (₹)</label>
              <input className="input" type="number" min="0" step="1" placeholder="0" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Expected Annual Return (%)</label>
              <input className="input" type="number" min="0" max="50" step="0.1"
                placeholder={String(DEFAULT_RETURN_RATES[form.type])}
                value={form.expectedReturn}
                onChange={e => setForm(f => ({ ...f, expectedReturn: e.target.value }))} />
              <p className="text-xs text-slate-400 mt-0.5">Default: {DEFAULT_RETURN_RATES[form.type]}% for {SAVING_TYPE_LABELS[form.type]}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Start Date</label>
                <input className="input" type="date" value={form.startDate}
                  onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Maturity (optional)</label>
                <input className="input" type="date" value={form.maturityDate}
                  onChange={e => setForm(f => ({ ...f, maturityDate: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="label">Held By</label>
              <select className="input" value={form.person}
                onChange={e => setForm(f => ({ ...f, person: e.target.value as PersonOrJoint }))}>
                <option value="Joint">Joint</option>
                <option value="Husband">{settings.husbandName}</option>
                <option value="Wife">{settings.wifeName}</option>
              </select>
            </div>
            <div>
              <label className="label">Notes (optional)</label>
              <input className="input" placeholder="Bank name, folio number, etc." value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <button type="submit" className="btn-primary w-full">Add Investment</button>
          </form>
        </div>

        {/* Portfolio Projection Chart */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-indigo-600" /> Total Portfolio Growth Projection
            </h3>
            {savings.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-sm gap-2">
                <PiggyBank size={32} className="opacity-30" />
                Add your investments to see 10-year growth projection
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={projectionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => formatCompact(v)} />
                  <Tooltip formatter={(v: number) => formatINR(v)} />
                  <Line type="monotone" dataKey="total" name="Portfolio Value" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Individual comparison */}
          {savings.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-slate-700 mb-4 text-sm">Invested vs 5-Year vs 10-Year Value</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={typeComparison} barGap={2} barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => formatCompact(v)} />
                  <Tooltip formatter={(v: number) => formatINR(v)} />
                  <Legend iconType="circle" iconSize={8} />
                  <Bar dataKey="invested" name="Invested" fill="#94a3b8" radius={[3,3,0,0]} />
                  <Bar dataKey="in5yr" name="5-Year Value" fill="#10b981" radius={[3,3,0,0]} />
                  <Bar dataKey="in10yr" name="10-Year Value" fill="#6366f1" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Savings Portfolio List */}
      <div className="card">
        <h3 className="font-semibold text-slate-700 mb-4">Investment Portfolio</h3>
        {savings.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No investments added yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 uppercase tracking-wide border-b border-slate-100">
                  <th className="text-left py-2 pr-3">Name</th>
                  <th className="text-left py-2 pr-3">Type</th>
                  <th className="text-left py-2 pr-3">Holder</th>
                  <th className="text-right py-2 pr-3">Invested</th>
                  <th className="text-right py-2 pr-3">Rate</th>
                  <th className="text-right py-2 pr-3">5-Year</th>
                  <th className="text-right py-2 pr-3">10-Year</th>
                  <th className="text-left py-2 pr-3">Maturity</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {savings.map(sv => {
                  const v5 = futureValue(sv.amount, sv.expectedReturn, 5);
                  const v10 = futureValue(sv.amount, sv.expectedReturn, 10);
                  return (
                    <tr key={sv.id}
                      className={`hover:bg-slate-50 transition-colors cursor-pointer ${selectedSaving === sv.id ? 'bg-indigo-50' : ''}`}
                      onClick={() => setSelectedSaving(selectedSaving === sv.id ? null : sv.id)}>
                      <td className="py-2 pr-3 font-medium text-slate-700">
                        {sv.name}
                        {sv.notes && <span className="block text-xs text-slate-400">{sv.notes}</span>}
                      </td>
                      <td className="py-2 pr-3">
                        <span className={`badge ${TYPE_BADGES[sv.type] ?? 'badge-blue'}`}>
                          {SAVING_TYPE_LABELS[sv.type]}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-slate-500 text-xs">
                        {sv.person === 'Husband' ? settings.husbandName : sv.person === 'Wife' ? settings.wifeName : 'Joint'}
                      </td>
                      <td className="py-2 pr-3 text-right font-semibold text-slate-700">{formatINR(sv.amount)}</td>
                      <td className="py-2 pr-3 text-right text-emerald-600 font-medium">{formatPercent(sv.expectedReturn)}</td>
                      <td className="py-2 pr-3 text-right text-blue-600 font-semibold">{formatCompact(v5)}</td>
                      <td className="py-2 pr-3 text-right text-indigo-700 font-bold">{formatCompact(v10)}</td>
                      <td className="py-2 pr-3 text-slate-400 text-xs whitespace-nowrap">
                        {sv.maturityDate ? formatDate(sv.maturityDate) : '—'}
                      </td>
                      <td className="py-2 pl-2">
                        <button onClick={e => { e.stopPropagation(); handleDelete(sv.id); }} className="btn-danger py-1 px-2">
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold text-sm">
                  <td colSpan={3} className="py-2 px-2 text-slate-600">Total</td>
                  <td className="py-2 pr-3 text-right text-slate-700">{formatINR(totalInvested)}</td>
                  <td />
                  <td className="py-2 pr-3 text-right text-blue-700">{formatCompact(totalIn5Years)}</td>
                  <td className="py-2 pr-3 text-right text-indigo-800">{formatCompact(totalIn10Years)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Individual saving projection (when selected) */}
      {selectedSav && (
        <div className="card border-indigo-200 bg-indigo-50">
          <h3 className="font-semibold text-indigo-700 mb-4">
            Growth Projection: {selectedSav.name}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[1, 3, 5, 10].map(yr => (
              <div key={yr} className="bg-white rounded-xl p-3 text-center border border-indigo-100">
                <p className="text-xs text-slate-400">{yr} Year{yr > 1 ? 's' : ''}</p>
                <p className="text-base font-bold text-indigo-700 mt-1">
                  {formatINR(Math.round(futureValue(selectedSav.amount, selectedSav.expectedReturn, yr)))}
                </p>
                <p className="text-xs text-emerald-600">
                  +{formatCompact(futureValue(selectedSav.amount, selectedSav.expectedReturn, yr) - selectedSav.amount)}
                </p>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={individualData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#6366f1' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6366f1' }} tickFormatter={v => formatCompact(v)} />
              <Tooltip formatter={(v: number) => formatINR(v)} />
              <Line type="monotone" dataKey="value" name="Value" stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
