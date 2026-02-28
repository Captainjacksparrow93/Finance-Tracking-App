export type Person = 'Husband' | 'Wife';
export type PersonOrJoint = Person | 'Joint';

// ── Income ────────────────────────────────────────────────────────────────────
export type IncomeCategory = 'salary' | 'freelance' | 'rental' | 'dividend' | 'business' | 'other';

export interface Income {
  id: string;
  person: Person;
  source: string;
  amount: number;
  date: string;
  category: IncomeCategory;
  recurring: boolean;
}

// ── Savings ───────────────────────────────────────────────────────────────────
export type SavingType =
  | 'gold'
  | 'silver'
  | 'ppf'
  | 'fd'
  | 'etf'
  | 'bond'
  | 'mutual_fund'
  | 'nps'
  | 'stocks'
  | 'real_estate'
  | 'elss'
  | 'other';

export interface Saving {
  id: string;
  name: string;
  type: SavingType;
  amount: number;          // Principal invested
  startDate: string;
  maturityDate?: string;
  expectedReturn: number;  // Annual percentage
  person: PersonOrJoint;
  notes?: string;
}

// ── Expenses ──────────────────────────────────────────────────────────────────
export type ExpenseCategory =
  | 'housing'
  | 'food'
  | 'transport'
  | 'utilities'
  | 'healthcare'
  | 'education'
  | 'entertainment'
  | 'clothing'
  | 'personal_care'
  | 'insurance'
  | 'subscriptions'
  | 'emi'
  | 'other';

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
  person: PersonOrJoint;
  paymentMethod: 'cash' | 'card' | 'upi' | 'bank_transfer';
}

// ── Goals ─────────────────────────────────────────────────────────────────────
export type GoalType = 'short' | 'mid' | 'long';
export type GoalCategory =
  | 'home'
  | 'vehicle'
  | 'vacation'
  | 'education'
  | 'wedding'
  | 'retirement'
  | 'emergency_fund'
  | 'gadget'
  | 'other';

export interface Goal {
  id: string;
  name: string;
  description?: string;
  targetAmount: number;
  targetDate: string;
  currentSavings: number;
  type: GoalType;
  category: GoalCategory;
  priority: 1 | 2 | 3;     // 1 = high, 2 = medium, 3 = low
}

// ── Business ──────────────────────────────────────────────────────────────────
export type BusinessCategory =
  | 'sales'
  | 'services'
  | 'rent_received'
  | 'other_income'
  | 'salaries'
  | 'raw_materials'
  | 'marketing'
  | 'utilities'
  | 'rent_paid'
  | 'equipment'
  | 'travel'
  | 'professional_fees'
  | 'misc_expense';

export interface BusinessTransaction {
  id: string;
  type: 'income' | 'expense';
  category: BusinessCategory;
  description: string;
  amount: number;
  date: string;
  taxDeductible: boolean;
  invoiceNumber?: string;
}

// ── App-wide settings ─────────────────────────────────────────────────────────
export interface Settings {
  husbandName: string;
  wifeName: string;
  currency: string;
}

// ── Root data structure ───────────────────────────────────────────────────────
export interface AppData {
  incomes: Income[];
  savings: Saving[];
  expenses: Expense[];
  goals: Goal[];
  businessTransactions: BusinessTransaction[];
  settings: Settings;
}

export type ActiveTab = 'dashboard' | 'income' | 'savings' | 'expenses' | 'goals' | 'business';
