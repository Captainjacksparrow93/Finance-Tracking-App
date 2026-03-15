import { AppData } from '../types';

export const defaultData: AppData = {
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

export async function loadData(): Promise<AppData> {
  try {
    const res = await fetch('/api/data');
    if (!res.ok) return defaultData;
    const parsed = await res.json() as Partial<AppData>;
    return {
      incomes:              parsed.incomes              ?? [],
      savings:              parsed.savings              ?? [],
      expenses:             parsed.expenses             ?? [],
      goals:                parsed.goals                ?? [],
      businessTransactions: parsed.businessTransactions ?? [],
      settings: { ...defaultData.settings, ...(parsed.settings ?? {}) },
    };
  } catch {
    return defaultData;
  }
}

export async function saveData(data: AppData): Promise<void> {
  try {
    await fetch('/api/data', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch {
    console.error('Failed to persist data to server');
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
