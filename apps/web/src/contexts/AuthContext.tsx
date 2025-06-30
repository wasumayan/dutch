'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { auth, db } from '@dutch/shared';
import type { Database } from '@dutch/shared';

type UserProfile = Database['public']['Tables']['users']['Row'];

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ data: UserProfile | null; error: any }>;
  resendConfirmationEmail: (email: string) => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { user: currentUser, error } = await auth.getCurrentUser();
      if (currentUser && !error) {
        setUser(currentUser);
        
        // Get user profile
        const { data: userProfile } = await db.getCurrentUserProfile();
        setProfile(userProfile);
      }
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Get user profile
        const { data: userProfile } = await db.getCurrentUserProfile();
        setProfile(userProfile);
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    return await auth.signIn(email, password);
  };

  const signInWithGoogle = async () => {
    return await auth.signInWithGoogle();
  };

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await auth.signUp(email, password, name);
    
    if (!error && data.user) {
      // Create user profile
      const { error: profileError } = await db.updateUserProfile({
        email,
        name,
        provider: 'email',
        preferred_currency: 'USD',
        locale: 'en-US',
      });
      
      if (profileError) {
        console.error('Error creating user profile:', profileError);
      }
    }
    
    return { data, error };
  };

  const signOut = async () => {
    return await auth.signOut();
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    const { data, error } = await db.updateUserProfile(updates);
    if (data && !error) {
      setProfile(data);
    }
    return { data, error };
  };

  const resendConfirmationEmail = async (email: string) => {
    return await auth.resendConfirmationEmail(email);
  };

  const resetPassword = async (email: string) => {
    return await auth.resetPassword(email);
  };

  const updatePassword = async (password: string) => {
    return await auth.updatePassword(password);
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    updateProfile,
    resendConfirmationEmail,
    resetPassword,
    updatePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 