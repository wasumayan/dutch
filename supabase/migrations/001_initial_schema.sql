-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    preferred_currency TEXT DEFAULT 'USD',
    locale TEXT DEFAULT 'en-US',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment_handles table
CREATE TABLE public.payment_handles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT CHECK (type IN ('venmo', 'zelle', 'apple_pay', 'gpay')) NOT NULL,
    handle TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create groups table
CREATE TABLE public.groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create group_members table
CREATE TABLE public.group_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT CHECK (role IN ('admin', 'member')) DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- Create expenses table
CREATE TABLE public.expenses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    currency TEXT DEFAULT 'USD',
    paid_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    split_type TEXT CHECK (split_type IN ('equal', 'percentage', 'shares', 'custom')) NOT NULL,
    notes TEXT,
    receipt_url TEXT,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create expense_participants table
CREATE TABLE public.expense_participants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    expense_id UUID REFERENCES public.expenses(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    percentage DECIMAL(5,2),
    shares INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(expense_id, user_id)
);

-- Create payments table
CREATE TABLE public.payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    from_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    to_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    currency TEXT DEFAULT 'USD',
    status TEXT CHECK (status IN ('pending', 'completed', 'cancelled')) DEFAULT 'pending',
    payment_method TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create settlements table
CREATE TABLE public.settlements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
    from_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    to_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    currency TEXT DEFAULT 'USD',
    status TEXT CHECK (status IN ('pending', 'completed')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_payment_handles_user_id ON public.payment_handles(user_id);
CREATE INDEX idx_groups_created_by ON public.groups(created_by);
CREATE INDEX idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX idx_expenses_group_id ON public.expenses(group_id);
CREATE INDEX idx_expenses_paid_by ON public.expenses(paid_by);
CREATE INDEX idx_expense_participants_expense_id ON public.expense_participants(expense_id);
CREATE INDEX idx_expense_participants_user_id ON public.expense_participants(user_id);
CREATE INDEX idx_payments_from_user_id ON public.payments(from_user_id);
CREATE INDEX idx_payments_to_user_id ON public.payments(to_user_id);
CREATE INDEX idx_settlements_group_id ON public.settlements(group_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON public.groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_handles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Payment handles policies
CREATE POLICY "Users can manage own payment handles" ON public.payment_handles FOR ALL USING (auth.uid() = user_id);

-- Groups policies
CREATE POLICY "Group members can view groups" ON public.groups FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.group_members 
        WHERE group_id = id AND user_id = auth.uid()
    )
);
CREATE POLICY "Users can create groups" ON public.groups FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Group admins can update groups" ON public.groups FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.group_members 
        WHERE group_id = id AND user_id = auth.uid() AND role = 'admin'
    )
);

-- Group members policies
CREATE POLICY "Group members can view group members" ON public.group_members FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.group_members gm2
        WHERE gm2.group_id = group_id AND gm2.user_id = auth.uid()
    )
);
CREATE POLICY "Group admins can manage members" ON public.group_members FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.group_members gm2
        WHERE gm2.group_id = group_id AND gm2.user_id = auth.uid() AND gm2.role = 'admin'
    )
);

-- Expenses policies
CREATE POLICY "Group members can view expenses" ON public.expenses FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.group_members 
        WHERE group_id = group_id AND user_id = auth.uid()
    )
);
CREATE POLICY "Group members can create expenses" ON public.expenses FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.group_members 
        WHERE group_id = group_id AND user_id = auth.uid()
    )
);
CREATE POLICY "Expense creator can update expenses" ON public.expenses FOR UPDATE USING (auth.uid() = paid_by);

-- Expense participants policies
CREATE POLICY "Group members can view expense participants" ON public.expense_participants FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.expenses e
        JOIN public.group_members gm ON e.group_id = gm.group_id
        WHERE e.id = expense_id AND gm.user_id = auth.uid()
    )
);
CREATE POLICY "Group members can manage expense participants" ON public.expense_participants FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.expenses e
        JOIN public.group_members gm ON e.group_id = gm.group_id
        WHERE e.id = expense_id AND gm.user_id = auth.uid()
    )
);

-- Payments policies
CREATE POLICY "Users can view payments they're involved in" ON public.payments FOR SELECT USING (
    auth.uid() = from_user_id OR auth.uid() = to_user_id
);
CREATE POLICY "Users can create payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "Payment participants can update payments" ON public.payments FOR UPDATE USING (
    auth.uid() = from_user_id OR auth.uid() = to_user_id
);

-- Settlements policies
CREATE POLICY "Group members can view settlements" ON public.settlements FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.group_members 
        WHERE group_id = group_id AND user_id = auth.uid()
    )
);
CREATE POLICY "Users can create settlements they're involved in" ON public.settlements FOR INSERT WITH CHECK (
    auth.uid() = from_user_id OR auth.uid() = to_user_id
); 