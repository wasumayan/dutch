import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

// Environment variables will be set in each app
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with typed database
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Auth helpers
export const auth = {
  signUp: async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  signInWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },

  resetPassword: async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { data, error };
  },

  updatePassword: async (password: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password,
    });
    return { data, error };
  },

  resendConfirmationEmail: async (email: string) => {
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  },
};

// Database helpers
export const db = {
  // Users
  getCurrentUserProfile: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: null };

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    return { data, error };
  },

  updateUserProfile: async (updates: Partial<Database['public']['Tables']['users']['Update']>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('No authenticated user') };

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    return { data, error };
  },

  confirmUserEmail: async (userId: string) => {
    const { data, error } = await supabase.rpc('confirm_user_email', {
      user_id: userId,
    });
    return { data, error };
  },

  resendEmailConfirmation: async (email: string) => {
    const { data, error } = await supabase.rpc('resend_email_confirmation', {
      user_email: email,
    });
    return { data, error };
  },

  // Groups
  getGroups: async () => {
    const { data, error } = await supabase
      .from('groups')
      .select(`
        *,
        group_members!inner(user_id),
        group_members!inner(role)
      `)
      .order('created_at', { ascending: false });

    return { data, error };
  },

  createGroup: async (group: Database['public']['Tables']['groups']['Insert']) => {
    const { data, error } = await supabase
      .from('groups')
      .insert(group)
      .select()
      .single();

    return { data, error };
  },

  // Expenses
  getExpenses: async (groupId?: string) => {
    let query = supabase
      .from('expenses')
      .select(`
        *,
        expense_participants(*),
        users!expenses_paid_by_fkey(name, avatar_url)
      `)
      .order('created_at', { ascending: false });

    if (groupId) {
      query = query.eq('group_id', groupId);
    }

    const { data, error } = await query;
    return { data, error };
  },

  createExpense: async (expense: Database['public']['Tables']['expenses']['Insert']) => {
    const { data, error } = await supabase
      .from('expenses')
      .insert(expense)
      .select()
      .single();

    return { data, error };
  },

  // Payments
  getPayments: async () => {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        users!payments_from_user_id_fkey(name, avatar_url),
        users!payments_to_user_id_fkey(name, avatar_url)
      `)
      .order('created_at', { ascending: false });

    return { data, error };
  },
};

// Storage helpers
export const storage = {
  uploadReceipt: async (file: File, expenseId: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${expenseId}-${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('receipts')
      .upload(fileName, file);

    if (error) return { data: null, error };

    const { data: { publicUrl } } = supabase.storage
      .from('receipts')
      .getPublicUrl(fileName);

    return { data: publicUrl, error: null };
  },
}; 