import { AppData } from '../types';

const STORAGE_KEY = 'family_finance_tracker_v1';

const defaultData: AppData = {
  incomes: [],
  savings: [],
  expenses: [],
  goals: [],
  businessTransactions: [],
  settings: {
    husbandName: 'Husband',
    wifeName: 'Wife',
    currency: '₹',
  },
};

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData;
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return {
      incomes: parsed.incomes ?? [],
      savings: parsed.savings ?? [],
      expenses: parsed.expenses ?? [],
      goals: parsed.goals ?? [],
      businessTransactions: parsed.businessTransactions ?? [],
      settings: { ...defaultData.settings, ...(parsed.settings ?? {}) },
    };
  } catch {
    return defaultData;
  }
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    console.error('Failed to persist data to localStorage');
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
