'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@dutch/shared';

export default function AuthCallbackPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('Processing...');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }

        if (data.session) {
          // Check if this is an email confirmation
          const type = searchParams.get('type');
          const token = searchParams.get('token');
          
          if (type === 'signup' && token) {
            // Handle email confirmation
            setMessage('Confirming your email...');
            
            const { error: confirmError } = await supabase.auth.verifyOtp({
              token_hash: token,
              type: 'signup',
            });

            if (confirmError) {
              setError('Email confirmation failed. Please try again.');
              setLoading(false);
              return;
            }

            setMessage('Email confirmed successfully!');
            setTimeout(() => {
              router.push('/dashboard');
            }, 2000);
          } else {
            // Regular OAuth sign in
            setMessage('Sign in successful!');
            setTimeout(() => {
              router.push('/dashboard');
            }, 1500);
          }
        } else {
          // No session, redirect to sign in
          router.push('/auth/signin');
        }
      } catch (err) {
        setError('An unexpected error occurred. Please try again.');
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="flex justify-center">
              <Link href="/" className="text-3xl font-bold text-blue-600">
                Dutch
              </Link>
            </div>
            <div className="mt-6 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Authentication Error
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {error}
              </p>
            </div>
          </div>

          <div className="text-center">
            <Link href="/auth/signin" className="font-medium text-blue-600 hover:text-blue-500">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <Link href="/" className="text-3xl font-bold text-blue-600">
              Dutch
            </Link>
          </div>
          <div className="mt-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
              {loading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              ) : (
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              {loading ? 'Processing...' : 'Success!'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {message}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 