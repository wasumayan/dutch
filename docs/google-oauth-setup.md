# Google OAuth Setup Guide

## 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Choose "Web application"
6. Add authorized redirect URIs:
   - `https://your-project-ref.supabase.co/auth/v1/callback`
   - `http://localhost:3001/auth/callback` (for development)
7. Copy the Client ID and Client Secret

## 2. Configure Supabase Auth Settings

1. Go to your Supabase Dashboard
2. Navigate to Authentication → Settings
3. Under "Auth Providers", enable Google
4. Enter your Google Client ID and Client Secret
5. Save the settings

## 3. Configure Email Templates

1. Go to Authentication → Email Templates
2. Customize the following templates:
   - Confirm signup
   - Reset password
   - Magic link
   - Change email address

## 4. Environment Variables

Add these to your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 5. Update Database Schema

Make sure your users table has the necessary columns for OAuth:

```sql
-- This should already be in your migration
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'email';
```

## 6. Test the Setup

1. Try signing up with Google
2. Check that user profile is created correctly
3. Verify email confirmation flow works
4. Test password reset functionality 