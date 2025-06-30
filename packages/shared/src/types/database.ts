// Database types for Dutch app
// These types will be used across web and mobile apps

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  preferred_currency: string;
  locale: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentHandle {
  id: string;
  user_id: string;
  type: 'venmo' | 'zelle' | 'apple_pay' | 'gpay';
  handle: string;
  is_primary: boolean;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
}

export interface Expense {
  id: string;
  group_id: string;
  title: string;
  amount: number;
  currency: string;
  paid_by: string;
  split_type: 'equal' | 'percentage' | 'shares' | 'custom';
  notes?: string;
  receipt_url?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface ExpenseParticipant {
  id: string;
  expense_id: string;
  user_id: string;
  amount: number;
  percentage?: number;
  shares?: number;
  created_at: string;
}

export interface Payment {
  id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'cancelled';
  payment_method?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Settlement {
  id: string;
  group_id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed';
  created_at: string;
}

// Database schema types (for Supabase)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;
      };
      payment_handles: {
        Row: PaymentHandle;
        Insert: Omit<PaymentHandle, 'id' | 'created_at'>;
        Update: Partial<Omit<PaymentHandle, 'id' | 'created_at'>>;
      };
      groups: {
        Row: Group;
        Insert: Omit<Group, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Group, 'id' | 'created_at' | 'updated_at'>>;
      };
      group_members: {
        Row: GroupMember;
        Insert: Omit<GroupMember, 'id' | 'joined_at'>;
        Update: Partial<Omit<GroupMember, 'id' | 'joined_at'>>;
      };
      expenses: {
        Row: Expense;
        Insert: Omit<Expense, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Expense, 'id' | 'created_at' | 'updated_at'>>;
      };
      expense_participants: {
        Row: ExpenseParticipant;
        Insert: Omit<ExpenseParticipant, 'id' | 'created_at'>;
        Update: Partial<Omit<ExpenseParticipant, 'id' | 'created_at'>>;
      };
      payments: {
        Row: Payment;
        Insert: Omit<Payment, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Payment, 'id' | 'created_at' | 'updated_at'>>;
      };
      settlements: {
        Row: Settlement;
        Insert: Omit<Settlement, 'id' | 'created_at'>;
        Update: Partial<Omit<Settlement, 'id' | 'created_at'>>;
      };
    };
  };
} 