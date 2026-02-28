import React, { useState } from 'react';
import { Plus, Trash2, Target, Lightbulb, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Goal, GoalType, GoalCategory, AppData } from '../types';
import { generateId } from '../utils/storage';
import {
  monthlyPMTNeeded, monthsRemaining, goalProgress, getGoalSuggestions,
} from '../utils/calculations';
import {
  formatINR, formatCompact, formatDate,
  GOAL_CATEGORY_LABELS, GOAL_TYPE_LABELS,
} from '../utils/formatters';
import { format, parseISO, startOfMonth, addYears } from 'date-fns';

interface Props {
  data: AppData;
  onUpdate: (updater: (prev: AppData) => AppData) => void;
}

const EMPTY_FORM = {
  name: '',
  description: '',
  targetAmount: '',
  targetDate: '',
  currentSavings: '0',
  type: 'mid' as GoalType,
  category: 'home' as GoalCategory,
  priority: '2' as '1' | '2' | '3',
};

const PRIORITY_LABELS = { '1': 'High', '2': 'Medium', '3': 'Low' };
const PRIORITY_COLORS = { '1': 'text-red-600 bg-red-50', '2': 'text-amber-600 bg-amber-50', '3': 'text-slate-600 bg-slate-100' };

const TYPE_COLOR: Record<GoalType, string> = {
  short: 'bg-emerald-100 text-emerald-800',
  mid: 'bg-blue-100 text-blue-800',
  long: 'bg-purple-100 text-purple-800',
};

const GOAL_ICONS: Record<GoalCategory, string> = {
  home: '🏠', vehicle: '🚗', vacation: '✈️', education: '📚',
  wedding: '💍', retirement: '🌴', emergency_fund: '🛡️', gadget: '💻', other: '🎯',
};

export default function GoalsTab({ data, onUpdate }: Props) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedType, setSelectedType] = useState<'all' | GoalType>('all');
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const { goals, incomes, expenses, businessTransactions } = data;

  // Monthly income and expense totals
  const currentMonth = format(startOfMonth(new Date()), 'MMM yyyy');
  const monthlyIncome = incomes
    .filter(i => format(startOfMonth(parseISO(i.date)), 'MMM yyyy') === currentMonth)
    .reduce((s, i) => s + i.amount, 0)
    + businessTransactions
      .filter(t => t.type === 'income' && format(startOfMonth(parseISO(t.date)), 'MMM yyyy') === currentMonth)
      .reduce((s, t) => s + t.amount, 0);

  const monthlyExpense = expenses
    .filter(e => format(startOfMonth(parseISO(e.date)), 'MMM yyyy') === currentMonth)
    .reduce((s, e) => s + e.amount, 0)
    + businessTransactions
      .filter(t => t.type === 'expense' && format(startOfMonth(parseISO(t.date)), 'MMM yyyy') === currentMonth)
      .reduce((s, t) => s + t.amount, 0);

  const monthlySurplus = Math.max(0, monthlyIncome - monthlyExpense);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.targetAmount || !form.targetDate) return;
    const entry: Goal = {
      id: generateId(),
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      targetAmount: parseFloat(form.targetAmount),
      targetDate: form.targetDate,
      currentSavings: parseFloat(form.currentSavings) || 0,
      type: form.type,
      category: form.category,
      priority: parseInt(form.priority) as 1 | 2 | 3,
    };
    onUpdate(prev => ({ ...prev, goals: [...prev.goals, entry] }));
    setForm(EMPTY_FORM);
  }

  function handleDelete(id: string) {
    onUpdate(prev => ({ ...prev, goals: prev.goals.filter(g => g.id !== id) }));
    if (expandedGoal === id) setExpandedGoal(null);
  }

  function handleUpdateSavings(id: string, newSavings: number) {
    onUpdate(prev => ({
      ...prev,
      goals: prev.goals.map(g => g.id === id ? { ...g, currentSavings: newSavings } : g),
    }));
  }

  const filtered = selectedType === 'all' ? goals : goals.filter(g => g.type === selectedType);

  // Sort by priority then by target date
  const sorted = [...filtered].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.targetDate.localeCompare(b.targetDate);
  });

  // Summary
  const totalRequired = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved = goals.reduce((s, g) => s + g.currentSavings, 0);
  const totalPMT = goals.reduce((s, g) => {
    return s + monthlyPMTNeeded(g.targetAmount, g.currentSavings, monthsRemaining(g.targetDate));
  }, 0);

  // Minimum income to fulfill all goals + current expenses
  const minIncomeNeeded = totalPMT + monthlyExpense;

  // Default target date helpers
  function shortTermDate() {
    return format(addYears(new Date(), 2), 'yyyy-MM-dd');
  }
  function midTermDate() {
    return format(addYears(new Date(), 5), 'yyyy-MM-dd');
  }
  function longTermDate() {
    return format(addYears(new Date(), 15), 'yyyy-MM-dd');
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="section-title">Financial Goals</h2>
        <p className="section-sub">
          Short-term, mid-term &amp; long-term goals — with auto-calculated monthly savings needed
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card bg-indigo-50">
          <p className="text-xs font-semibold uppercase text-indigo-500 tracking-wide">Total Goals</p>
          <p className="text-xl font-bold text-indigo-700 mt-1">{goals.length}</p>
        </div>
        <div className="card bg-slate-50">
          <p className="text-xs font-semibold uppercase text-slate-500 tracking-wide">Total Required</p>
          <p className="text-xl font-bold text-slate-700 mt-1">{formatCompact(totalRequired)}</p>
        </div>
        <div className="card bg-emerald-50">
          <p className="text-xs font-semibold uppercase text-emerald-500 tracking-wide">Already Saved</p>
          <p className="text-xl font-bold text-emerald-700 mt-1">{formatCompact(totalSaved)}</p>
        </div>
        <div className="card bg-amber-50">
          <p className="text-xs font-semibold uppercase text-amber-500 tracking-wide">Monthly PMT Needed</p>
          <p className="text-xl font-bold text-amber-700 mt-1">{formatCompact(totalPMT)}</p>
          <p className="text-xs text-amber-500 mt-0.5">For all goals</p>
        </div>
      </div>

      {/* Income Requirement Banner */}
      {goals.length > 0 && (
        <div className={`card border-2 ${totalPMT > monthlySurplus ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'}`}>
          <div className="flex items-start gap-3">
            {totalPMT > monthlySurplus
              ? <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
              : <CheckCircle size={20} className="text-emerald-500 flex-shrink-0 mt-0.5" />
            }
            <div>
              <p className={`font-bold text-base ${totalPMT > monthlySurplus ? 'text-red-700' : 'text-emerald-700'}`}>
                {totalPMT > monthlySurplus
                  ? `You need ₹${formatCompact(totalPMT - monthlySurplus)} more per month to achieve all your goals!`
                  : 'Great news! Your current income can cover all your goal contributions.'}
              </p>
              <p className="text-sm text-slate-600 mt-1">
                Minimum combined monthly income needed to cover expenses + all goals:{' '}
                <strong>{formatINR(Math.ceil(minIncomeNeeded))}</strong>
                {monthlyIncome > 0 && ` (you currently earn ${formatINR(monthlyIncome)}/month combined)`}
              </p>
              {totalPMT > monthlySurplus && (
                <div className="mt-3 space-y-1">
                  <p className="text-sm font-semibold text-red-700">Ways to bridge the gap:</p>
                  <ul className="text-sm text-slate-600 list-disc list-inside space-y-1">
                    <li>Increase income through salary hike, freelancing, or business growth</li>
                    <li>Reduce monthly expenses by cutting discretionary spending</li>
                    <li>Extend goal timelines for lower-priority goals</li>
                    <li>Increase current savings allocation for goals</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Goal Form */}
        <div className="card">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Plus size={16} className="text-amber-600" /> Add New Goal
          </h3>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="label">Goal Name</label>
              <input className="input" placeholder="e.g., Buy a House, Europe Trip" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value as GoalCategory }))}>
                {Object.entries(GOAL_CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{GOAL_ICONS[k as GoalCategory]} {v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Term Type</label>
              <div className="flex gap-2">
                {(['short', 'mid', 'long'] as GoalType[]).map(t => (
                  <button key={t} type="button"
                    onClick={() => {
                      setForm(f => ({
                        ...f,
                        type: t,
                        targetDate: t === 'short' ? shortTermDate() : t === 'mid' ? midTermDate() : longTermDate(),
                      }));
                    }}
                    className={`flex-1 py-1.5 text-xs rounded-lg font-medium border transition-colors ${
                      form.type === t ? TYPE_COLOR[t] + ' border-current' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}>
                    {t === 'short' ? 'Short' : t === 'mid' ? 'Mid' : 'Long'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Target Amount (₹)</label>
              <input className="input" type="number" min="0" step="1000" placeholder="0" value={form.targetAmount}
                onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Target Date</label>
              <input className="input" type="date" value={form.targetDate}
                onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Amount Already Saved (₹)</label>
              <input className="input" type="number" min="0" step="1" placeholder="0" value={form.currentSavings}
                onChange={e => setForm(f => ({ ...f, currentSavings: e.target.value }))} />
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value as '1' | '2' | '3' }))}>
                <option value="1">High Priority</option>
                <option value="2">Medium Priority</option>
                <option value="3">Low Priority</option>
              </select>
            </div>
            <div>
              <label className="label">Notes (optional)</label>
              <input className="input" placeholder="Additional details..." value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <button type="submit" className="btn-primary w-full">Add Goal</button>
          </form>
        </div>

        {/* Goals List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filter Tabs */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'short', 'mid', 'long'] as const).map(t => (
              <button key={t}
                onClick={() => setSelectedType(t)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors border ${
                  selectedType === t
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}>
                {t === 'all' ? 'All Goals' : GOAL_TYPE_LABELS[t]}
              </button>
            ))}
          </div>

          {sorted.length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
              <Target size={40} className="opacity-30" />
              <p className="text-sm">No goals added yet. Create your first goal!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sorted.map(goal => {
                const progress = goalProgress(goal);
                const months = monthsRemaining(goal.targetDate);
                const pmt = monthlyPMTNeeded(goal.targetAmount, goal.currentSavings, months);
                const isOnTrack = pmt <= monthlySurplus;
                const isExpanded = expandedGoal === goal.id;
                const suggestions = isExpanded ? getGoalSuggestions(goal, monthlyIncome, monthlyExpense) : [];

                return (
                  <div key={goal.id} className="card card-hover border-l-4"
                    style={{ borderLeftColor: goal.type === 'short' ? '#10b981' : goal.type === 'mid' ? '#6366f1' : '#8b5cf6' }}>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{GOAL_ICONS[goal.category]}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-slate-800">{goal.name}</h4>
                          <span className={`badge ${TYPE_COLOR[goal.type]}`}>{GOAL_TYPE_LABELS[goal.type]}</span>
                          <span className={`badge ${PRIORITY_COLORS[String(goal.priority) as '1' | '2' | '3']}`}>
                            {PRIORITY_LABELS[String(goal.priority) as '1' | '2' | '3']} Priority
                          </span>
                          {isOnTrack
                            ? <span className="badge badge-green flex items-center gap-1"><CheckCircle size={10} /> On Track</span>
                            : <span className="badge badge-red flex items-center gap-1"><AlertTriangle size={10} /> Behind</span>
                          }
                        </div>
                        {goal.description && <p className="text-xs text-slate-500 mt-0.5">{goal.description}</p>}

                        {/* Progress bar */}
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-slate-500 mb-1">
                            <span>{formatINR(goal.currentSavings)} saved</span>
                            <span>{progress.toFixed(0)}% of {formatINR(goal.targetAmount)}</span>
                          </div>
                          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${progress}%`,
                                backgroundColor: goal.type === 'short' ? '#10b981' : goal.type === 'mid' ? '#6366f1' : '#8b5cf6',
                              }} />
                          </div>
                        </div>

                        {/* Key metrics */}
                        <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div>
                            <p className="text-slate-400">Target Date</p>
                            <p className="font-semibold text-slate-700 flex items-center gap-1">
                              <Clock size={10} /> {formatDate(goal.targetDate)}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400">Months Left</p>
                            <p className="font-semibold text-slate-700">{months} months</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Monthly Needed</p>
                            <p className={`font-bold ${pmt > monthlySurplus ? 'text-red-600' : 'text-emerald-600'}`}>
                              {pmt > 0 ? formatINR(Math.ceil(pmt)) : <span className="text-emerald-600">Goal met! 🎉</span>}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400">Still Needed</p>
                            <p className="font-semibold text-slate-700">
                              {formatCompact(Math.max(0, goal.targetAmount - goal.currentSavings))}
                            </p>
                          </div>
                        </div>

                        {/* Quick update savings */}
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs text-slate-400">Update saved:</span>
                          <input
                            type="number" min="0" step="1000"
                            defaultValue={goal.currentSavings}
                            onBlur={e => handleUpdateSavings(goal.id, parseFloat(e.target.value) || 0)}
                            className="input !py-1 !text-xs w-28"
                          />
                          <button onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}
                            className="ml-auto text-xs text-indigo-600 hover:underline flex items-center gap-1">
                            <Lightbulb size={11} /> {isExpanded ? 'Hide Tips' : 'Get Tips'}
                          </button>
                          <button onClick={() => handleDelete(goal.id)} className="btn-danger py-1 px-2">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Suggestions panel */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-xs font-semibold text-indigo-700 mb-2 flex items-center gap-1">
                          <Lightbulb size={12} /> Personalised Recommendations
                        </p>
                        <ul className="space-y-1.5">
                          {suggestions.map((s, i) => (
                            <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                              <span className="text-indigo-400 font-bold mt-0.5">→</span>
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Required Income Analysis */}
      {goals.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-slate-700 mb-4">Income Required to Achieve All Goals</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 uppercase tracking-wide border-b border-slate-100">
                  <th className="text-left py-2 pr-3">Goal</th>
                  <th className="text-left py-2 pr-3">Type</th>
                  <th className="text-right py-2 pr-3">Target</th>
                  <th className="text-right py-2 pr-3">Saved</th>
                  <th className="text-right py-2 pr-3">Months Left</th>
                  <th className="text-right py-2 pr-3">Monthly Needed</th>
                  <th className="text-left py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {goals.sort((a, b) => a.priority - b.priority).map(goal => {
                  const months = monthsRemaining(goal.targetDate);
                  const pmt = monthlyPMTNeeded(goal.targetAmount, goal.currentSavings, months);
                  return (
                    <tr key={goal.id} className="hover:bg-slate-50">
                      <td className="py-2 pr-3 font-medium text-slate-700">
                        {GOAL_ICONS[goal.category]} {goal.name}
                      </td>
                      <td className="py-2 pr-3">
                        <span className={`badge ${TYPE_COLOR[goal.type]}`}>{GOAL_TYPE_LABELS[goal.type]}</span>
                      </td>
                      <td className="py-2 pr-3 text-right">{formatINR(goal.targetAmount)}</td>
                      <td className="py-2 pr-3 text-right text-emerald-600">{formatINR(goal.currentSavings)}</td>
                      <td className="py-2 pr-3 text-right text-slate-500">{months}</td>
                      <td className="py-2 pr-3 text-right font-bold">
                        {pmt > 0 ? formatINR(Math.ceil(pmt)) : <span className="text-emerald-600 font-bold">Achieved!</span>}
                      </td>
                      <td className="py-2">
                        {pmt <= 0
                          ? <span className="badge badge-green flex items-center gap-1"><CheckCircle size={10} /> Done</span>
                          : pmt <= monthlySurplus
                            ? <span className="badge badge-green">On Track</span>
                            : <span className="badge badge-red">Needs Attention</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold">
                  <td colSpan={5} className="py-2 px-2 text-slate-700">Total Monthly Goal Contribution</td>
                  <td className="py-2 pr-3 text-right text-indigo-700">{formatINR(Math.ceil(totalPMT))}</td>
                  <td />
                </tr>
                <tr className="bg-slate-50 font-bold">
                  <td colSpan={5} className="py-2 px-2 text-slate-700">+ Monthly Expenses</td>
                  <td className="py-2 pr-3 text-right text-rose-600">+{formatINR(Math.ceil(monthlyExpense))}</td>
                  <td />
                </tr>
                <tr className="bg-indigo-50 font-bold text-indigo-800">
                  <td colSpan={5} className="py-2 px-2">Minimum Monthly Income Required</td>
                  <td className="py-2 pr-3 text-right text-lg">{formatINR(Math.ceil(minIncomeNeeded))}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
