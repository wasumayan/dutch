# Dutch - Smart Expense Splitting App

A cross-platform expense-splitting application built with Next.js, React Native, and Supabase.

## 🏗️ Architecture Overview

### **Monorepo Structure**
```
dutch/
├── apps/
│   ├── web/          # Next.js web application
│   └── mobile/       # React Native (Expo) mobile app
├── packages/
│   ├── shared/       # Shared utilities, types, and Supabase config
│   └── ui/           # Shared UI components (coming soon)
├── supabase/         # Database migrations and types
└── docs/            # Documentation
```

### **Tech Stack**
- **Frontend**: Next.js (web), React Native + Expo (mobile)
- **Styling**: Tailwind CSS (web), NativeWind (mobile)
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Hosting**: Vercel (web), Expo EAS (mobile)
- **State Management**: React Query / SWR
- **Type Safety**: TypeScript throughout

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Expo CLI (for mobile development)

### 1. Clone and Install Dependencies
```bash
git clone <repository-url>
cd dutch
npm install
```

### 2. Set Up Supabase
1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Create a `.env.local` file in the root:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run Database Migrations
```bash
# Install Supabase CLI
npm install -g supabase

# Link your project
supabase link --project-ref your_project_ref

# Run migrations
supabase db push
```

### 4. Start Development
```bash
# Start web app
npm run dev:web

# Start mobile app (in another terminal)
npm run dev:mobile
```

## 📱 Features

### Core Features
- ✅ User authentication (email/password, Google OAuth)
- ✅ Create and manage groups
- ✅ Add expenses with multiple split types
- ✅ Real-time balance calculations
- ✅ Debt simplification and settlements
- ✅ Receipt image upload and storage

### Premium Features (Coming Soon)
- 📷 OCR receipt scanning
- 📊 Analytics and spending insights
- 💸 Payment integrations (Venmo, Zelle, etc.)
- 🔔 Push notifications
- 🌍 Multi-currency support

## 🗄️ Database Schema

### Key Tables
- **users**: User profiles and preferences
- **groups**: Expense groups
- **group_members**: Group membership and roles
- **expenses**: Individual expenses
- **expense_participants**: How expenses are split
- **payments**: Direct payments between users
- **settlements**: Group debt settlements
- **payment_handles**: User payment methods

### Security
- Row Level Security (RLS) enabled on all tables
- Users can only access data they're authorized to see
- Group-based access control for expenses and members

## 🔧 Development

### Shared Package
The `packages/shared` contains:
- Database types and interfaces
- Supabase client configuration
- Utility functions for calculations
- Common business logic

### Code Sharing Strategy
- **Types**: Shared between web and mobile
- **API Logic**: Shared Supabase queries and mutations
- **Utilities**: Expense calculations, formatting, etc.
- **UI Components**: Platform-specific implementations with shared logic

### Adding New Features
1. Define types in `packages/shared/src/types/`
2. Add database helpers in `packages/shared/src/lib/supabase.ts`
3. Create utility functions in `packages/shared/src/utils/`
4. Implement UI in respective apps
5. Update database schema if needed

## 🚀 Deployment

### Web App (Vercel)
```bash
npm run build:web
# Deploy to Vercel
```

### Mobile App (Expo EAS)
```bash
npm run build:mobile
# Build with EAS
eas build --platform all
```

## 📚 Learning Resources

This project demonstrates:
- **Monorepo Architecture**: Managing multiple apps with shared code
- **Cross-Platform Development**: Web and mobile with React
- **Full-Stack Development**: Frontend, backend, and database
- **Real-time Features**: Live updates with Supabase
- **Type Safety**: End-to-end TypeScript
- **Modern Tooling**: Next.js, Expo, Tailwind CSS

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details 