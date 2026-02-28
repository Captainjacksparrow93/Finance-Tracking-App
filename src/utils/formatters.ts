export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCompact(amount: number): string {
  if (Math.abs(amount) >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(2)}Cr`;
  if (Math.abs(amount) >= 100_000) return `₹${(amount / 100_000).toFixed(2)}L`;
  if (Math.abs(amount) >= 1_000) return `₹${(amount / 1_000).toFixed(1)}K`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatMonthYear(date: string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    month: 'short',
    year: 'numeric',
  });
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

// Category → human-readable label
export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  housing: 'Housing / Rent',
  food: 'Food & Groceries',
  transport: 'Transport',
  utilities: 'Utilities',
  healthcare: 'Healthcare',
  education: 'Education',
  entertainment: 'Entertainment',
  clothing: 'Clothing',
  personal_care: 'Personal Care',
  insurance: 'Insurance',
  subscriptions: 'Subscriptions',
  emi: 'EMI / Loan',
  other: 'Other',
};

export const INCOME_CATEGORY_LABELS: Record<string, string> = {
  salary: 'Salary',
  freelance: 'Freelance',
  rental: 'Rental Income',
  dividend: 'Dividends',
  business: 'Business',
  other: 'Other',
};

export const GOAL_CATEGORY_LABELS: Record<string, string> = {
  home: 'Home / Property',
  vehicle: 'Vehicle',
  vacation: 'Vacation',
  education: 'Education',
  wedding: 'Wedding',
  retirement: 'Retirement',
  emergency_fund: 'Emergency Fund',
  gadget: 'Gadget / Tech',
  other: 'Other',
};

export const GOAL_TYPE_LABELS: Record<string, string> = {
  short: 'Short-term (< 3 yrs)',
  mid: 'Mid-term (3–7 yrs)',
  long: 'Long-term (7+ yrs)',
};

export const BUSINESS_CATEGORY_LABELS: Record<string, string> = {
  sales: 'Sales Revenue',
  services: 'Services Revenue',
  rent_received: 'Rent Received',
  other_income: 'Other Income',
  salaries: 'Salaries & Wages',
  raw_materials: 'Raw Materials',
  marketing: 'Marketing',
  utilities: 'Utilities',
  rent_paid: 'Rent / Office',
  equipment: 'Equipment',
  travel: 'Travel',
  professional_fees: 'Professional Fees',
  misc_expense: 'Miscellaneous',
};
