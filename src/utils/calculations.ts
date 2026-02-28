import { SavingType, Goal, Saving, Expense, Income, BusinessTransaction } from '../types';
import { differenceInMonths, parseISO, startOfMonth, format } from 'date-fns';

// ── Default annual return rates (%) by saving type ────────────────────────────
export const DEFAULT_RETURN_RATES: Record<SavingType, number> = {
  gold: 8.5,
  silver: 7.5,
  ppf: 7.1,
  fd: 7.0,
  etf: 12.0,
  bond: 6.5,
  mutual_fund: 12.0,
  nps: 10.0,
  stocks: 15.0,
  real_estate: 10.0,
  elss: 13.0,
  other: 8.0,
};

export const SAVING_TYPE_LABELS: Record<SavingType, string> = {
  gold: 'Gold',
  silver: 'Silver',
  ppf: 'PPF',
  fd: 'Fixed Deposit',
  etf: 'ETF',
  bond: 'Bonds / F-Bonds',
  mutual_fund: 'Mutual Fund',
  nps: 'NPS',
  stocks: 'Stocks',
  real_estate: 'Real Estate',
  elss: 'ELSS',
  other: 'Other',
};

// ── Compound interest future value ─────────────────────────────────────────────
// FV = P * (1 + r/n)^(n*t)   (annual compounding, n=1)
export function futureValue(principal: number, annualRate: number, years: number): number {
  if (annualRate === 0) return principal;
  return principal * Math.pow(1 + annualRate / 100, years);
}

// ── Monthly PMT needed to reach a goal ────────────────────────────────────────
// FV = PV*(1+r)^n  +  PMT * ((1+r)^n - 1) / r
// PMT = (FV - PV*(1+r)^n) * r / ((1+r)^n - 1)
// r = monthly rate (annual / 12 / 100)
// n = months remaining
export function monthlyPMTNeeded(
  targetAmount: number,
  currentSavings: number,
  monthsRemaining: number,
  annualReturnRate = 8,
): number {
  if (monthsRemaining <= 0) return 0;
  const r = annualReturnRate / 100 / 12;
  if (r === 0) {
    return Math.max(0, (targetAmount - currentSavings) / monthsRemaining);
  }
  const factor = Math.pow(1 + r, monthsRemaining);
  const pvGrowth = currentSavings * factor;
  if (pvGrowth >= targetAmount) return 0;
  return ((targetAmount - pvGrowth) * r) / (factor - 1);
}

// ── Goal months remaining ──────────────────────────────────────────────────────
export function monthsRemaining(targetDate: string): number {
  return Math.max(0, differenceInMonths(parseISO(targetDate), new Date()));
}

// ── Goal progress percentage ───────────────────────────────────────────────────
export function goalProgress(goal: Goal): number {
  if (goal.targetAmount === 0) return 100;
  return Math.min(100, (goal.currentSavings / goal.targetAmount) * 100);
}

// ── Projected growth data for charts (yearly snapshots) ───────────────────────
export function savingGrowthProjection(saving: Saving, horizonYears = 10) {
  const data: { year: string; value: number }[] = [];
  const startYear = new Date().getFullYear();
  for (let y = 0; y <= horizonYears; y++) {
    data.push({
      year: String(startYear + y),
      value: Math.round(futureValue(saving.amount, saving.expectedReturn, y)),
    });
  }
  return data;
}

// ── Portfolio total projected values ─────────────────────────────────────────
export function portfolioProjection(savings: Saving[], horizonYears = 10) {
  const startYear = new Date().getFullYear();
  return Array.from({ length: horizonYears + 1 }, (_, y) => {
    const total = savings.reduce(
      (sum, s) => sum + futureValue(s.amount, s.expectedReturn, y),
      0,
    );
    return { year: String(startYear + y), total: Math.round(total) };
  });
}

// ── Monthly expense aggregation ────────────────────────────────────────────────
export function groupExpensesByMonth(expenses: Expense[]) {
  const map = new Map<string, number>();
  expenses.forEach((e) => {
    const key = format(parseISO(e.date), 'MMM yyyy');
    map.set(key, (map.get(key) ?? 0) + e.amount);
  });
  return Array.from(map.entries())
    .sort((a, b) => {
      const d1 = parseISO(expenses.find((e) => format(parseISO(e.date), 'MMM yyyy') === a[0])!.date);
      const d2 = parseISO(expenses.find((e) => format(parseISO(e.date), 'MMM yyyy') === b[0])!.date);
      return d1.getTime() - d2.getTime();
    })
    .map(([month, total]) => ({ month, total }));
}

// ── Category-wise expense breakdown ──────────────────────────────────────────
export function expensesByCategory(expenses: Expense[]) {
  const map = new Map<string, number>();
  expenses.forEach((e) => {
    map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
  });
  return Array.from(map.entries()).map(([category, value]) => ({ category, value }));
}

// ── Monthly income aggregation ────────────────────────────────────────────────
export function groupIncomesByMonth(incomes: Income[]) {
  const map = new Map<string, number>();
  incomes.forEach((i) => {
    const key = format(parseISO(i.date), 'MMM yyyy');
    map.set(key, (map.get(key) ?? 0) + i.amount);
  });
  return Array.from(map.entries())
    .sort((a, b) => {
      const d1 = parseISO(incomes.find((i) => format(parseISO(i.date), 'MMM yyyy') === a[0])!.date);
      const d2 = parseISO(incomes.find((i) => format(parseISO(i.date), 'MMM yyyy') === b[0])!.date);
      return d1.getTime() - d2.getTime();
    })
    .map(([month, total]) => ({ month, total }));
}

// ── Business P&L by month ─────────────────────────────────────────────────────
export function businessPLByMonth(transactions: BusinessTransaction[]) {
  const map = new Map<string, { income: number; expense: number }>();
  transactions.forEach((t) => {
    const key = format(parseISO(t.date), 'MMM yyyy');
    const entry = map.get(key) ?? { income: 0, expense: 0 };
    if (t.type === 'income') entry.income += t.amount;
    else entry.expense += t.amount;
    map.set(key, entry);
  });
  return Array.from(map.entries())
    .sort((a, b) => {
      const d1 = parseISO(transactions.find((t) => format(parseISO(t.date), 'MMM yyyy') === a[0])!.date);
      const d2 = parseISO(transactions.find((t) => format(parseISO(t.date), 'MMM yyyy') === b[0])!.date);
      return d1.getTime() - d2.getTime();
    })
    .map(([month, v]) => ({ month, income: v.income, expense: v.expense, profit: v.income - v.expense }));
}

// ── Savings rate analysis ──────────────────────────────────────────────────────
export function getSavingsRate(monthlyIncome: number, monthlyExpense: number): number {
  if (monthlyIncome === 0) return 0;
  return Math.max(0, ((monthlyIncome - monthlyExpense) / monthlyIncome) * 100);
}

// ── Top expense categories for improvement tips ───────────────────────────────
export function getTopExpenseCategories(expenses: Expense[], topN = 3) {
  const byCategory = expensesByCategory(expenses);
  return byCategory.sort((a, b) => b.value - a.value).slice(0, topN);
}

// ── Improvement suggestions for goals ─────────────────────────────────────────
export function getGoalSuggestions(
  goal: Goal,
  monthlyIncome: number,
  monthlyExpense: number,
): string[] {
  const months = monthsRemaining(goal.targetDate);
  const pmt = monthlyPMTNeeded(goal.targetAmount, goal.currentSavings, months);
  const currentSurplus = monthlyIncome - monthlyExpense;
  const suggestions: string[] = [];

  if (pmt > currentSurplus) {
    const shortfall = pmt - currentSurplus;
    suggestions.push(`Increase monthly savings by ₹${Math.ceil(shortfall).toLocaleString('en-IN')} to stay on track.`);
    suggestions.push('Review discretionary expenses (entertainment, subscriptions) to free up funds.');
    if (months > 24) {
      suggestions.push('Consider investing in higher-yield instruments like ELSS or equity mutual funds.');
    }
    suggestions.push('Explore additional income streams — freelancing, rental income, or dividend stocks.');
  } else {
    suggestions.push('You are on track! Keep investing the required monthly amount consistently.');
    if (currentSurplus - pmt > 5000) {
      suggestions.push('You have surplus funds — consider investing the extra in tax-saving instruments.');
    }
  }

  if (goal.type === 'long') {
    suggestions.push('For long-term goals, SIP in equity mutual funds or NPS can maximise returns.');
  }
  if (goal.type === 'short') {
    suggestions.push('For short-term goals, prefer FDs or liquid funds to protect your corpus.');
  }

  return suggestions;
}

// ── Current month totals ───────────────────────────────────────────────────────
export function currentMonthTotal(items: (Expense | Income | BusinessTransaction)[], type?: 'income' | 'expense'): number {
  const now = startOfMonth(new Date());
  return items
    .filter((item) => {
      const d = startOfMonth(parseISO(item.date));
      const sameMonth = d.getTime() === now.getTime();
      if (type && 'type' in item) return sameMonth && item.type === type;
      return sameMonth;
    })
    .reduce((s, item) => s + item.amount, 0);
}
