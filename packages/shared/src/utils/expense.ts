import type { Expense, ExpenseParticipant, User } from '../types/database';

// Calculate how much each person owes for an expense
export const calculateExpenseSplit = (
  expense: Expense,
  participants: ExpenseParticipant[]
): Record<string, number> => {
  const split: Record<string, number> = {};
  
  switch (expense.split_type) {
    case 'equal':
      const equalAmount = expense.amount / participants.length;
      participants.forEach(participant => {
        split[participant.user_id] = equalAmount;
      });
      break;
      
    case 'percentage':
      participants.forEach(participant => {
        if (participant.percentage) {
          split[participant.user_id] = (expense.amount * participant.percentage) / 100;
        }
      });
      break;
      
    case 'shares':
      const totalShares = participants.reduce((sum, p) => sum + (p.shares || 0), 0);
      participants.forEach(participant => {
        if (participant.shares) {
          split[participant.user_id] = (expense.amount * participant.shares) / totalShares;
        }
      });
      break;
      
    case 'custom':
      participants.forEach(participant => {
        split[participant.user_id] = participant.amount;
      });
      break;
  }
  
  return split;
};

// Calculate net balance for a user across all expenses
export const calculateUserBalance = (
  userId: string,
  expenses: (Expense & { expense_participants: ExpenseParticipant[] })[]
): number => {
  let balance = 0;
  
  expenses.forEach(expense => {
    const split = calculateExpenseSplit(expense, expense.expense_participants);
    const userShare = split[userId] || 0;
    
    if (expense.paid_by === userId) {
      // User paid for this expense, so they get credited the full amount
      balance += expense.amount;
    }
    
    // User owes their share
    balance -= userShare;
  });
  
  return balance;
};

// Calculate balances for all users in a group
export const calculateGroupBalances = (
  expenses: (Expense & { expense_participants: ExpenseParticipant[] })[],
  users: User[]
): Record<string, number> => {
  const balances: Record<string, number> = {};
  
  users.forEach(user => {
    balances[user.id] = calculateUserBalance(user.id, expenses);
  });
  
  return balances;
};

// Simplify debts (find optimal way to settle up)
export const simplifyDebts = (
  balances: Record<string, number>
): Array<{ from: string; to: string; amount: number }> => {
  const settlements: Array<{ from: string; to: string; amount: number }> = [];
  const positiveBalances: Array<{ userId: string; amount: number }> = [];
  const negativeBalances: Array<{ userId: string; amount: number }> = [];
  
  // Separate positive and negative balances
  Object.entries(balances).forEach(([userId, balance]) => {
    if (balance > 0) {
      positiveBalances.push({ userId, amount: balance });
    } else if (balance < 0) {
      negativeBalances.push({ userId, amount: Math.abs(balance) });
    }
  });
  
  // Sort by amount (largest first)
  positiveBalances.sort((a, b) => b.amount - a.amount);
  negativeBalances.sort((a, b) => b.amount - a.amount);
  
  let posIndex = 0;
  let negIndex = 0;
  
  while (posIndex < positiveBalances.length && negIndex < negativeBalances.length) {
    const positive = positiveBalances[posIndex];
    const negative = negativeBalances[negIndex];
    
    const settlementAmount = Math.min(positive.amount, negative.amount);
    
    settlements.push({
      from: negative.userId,
      to: positive.userId,
      amount: settlementAmount,
    });
    
    positive.amount -= settlementAmount;
    negative.amount -= settlementAmount;
    
    if (positive.amount === 0) posIndex++;
    if (negative.amount === 0) negIndex++;
  }
  
  return settlements;
};

// Format currency
export const formatCurrency = (
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

// Get expense summary for a group
export const getExpenseSummary = (
  expenses: (Expense & { expense_participants: ExpenseParticipant[] })[]
) => {
  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const expenseCount = expenses.length;
  const averageAmount = expenseCount > 0 ? totalAmount / expenseCount : 0;
  
  return {
    totalAmount,
    expenseCount,
    averageAmount,
  };
}; 