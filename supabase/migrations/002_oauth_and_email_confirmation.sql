-- Migration: Add OAuth support and email confirmation
-- This migration adds support for OAuth providers and email confirmation

-- Add OAuth-related columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'email',
ADD COLUMN IF NOT EXISTS email_confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS email_confirmation_sent_at TIMESTAMP WITH TIME ZONE;

-- Create index for email confirmation
CREATE INDEX IF NOT EXISTS idx_users_email_confirmed_at ON users(email_confirmed_at);

-- Update RLS policies to handle OAuth users
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Add policy for inserting user profiles (for OAuth signups)
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Function to handle OAuth user creation
CREATE OR REPLACE FUNCTION public.handle_oauth_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert user profile if it doesn't exist
    INSERT INTO public.users (
        id,
        email,
        name,
        avatar_url,
        provider,
        email_confirmed_at,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE(NEW.raw_user_meta_data->>'provider', 'google'),
        CASE 
            WHEN NEW.email_confirmed_at IS NOT NULL THEN NEW.email_confirmed_at
            ELSE NOW()
        END,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = COALESCE(EXCLUDED.name, users.name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
        provider = EXCLUDED.provider,
        email_confirmed_at = COALESCE(EXCLUDED.email_confirmed_at, users.email_confirmed_at),
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for OAuth user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_oauth_user();

-- Function to handle email confirmation
CREATE OR REPLACE FUNCTION public.confirm_user_email(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.users 
    SET 
        email_confirmed_at = NOW(),
        updated_at = NOW()
    WHERE id = user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to resend email confirmation
CREATE OR REPLACE FUNCTION public.resend_email_confirmation(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.users 
    SET 
        email_confirmation_sent_at = NOW(),
        updated_at = NOW()
    WHERE email = user_email;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_oauth_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_user_email(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resend_email_confirmation(TEXT) TO authenticated; 