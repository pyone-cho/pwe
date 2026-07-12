# PWE Frontend

Frontend web application for the PWE Event Management System built with React, Vite, and Tailwind CSS.

## Tech Stack

- **Framework**: React 19
- **Build Tool**: Vite 6
- **Language**: TypeScript 5.7
- **Styling**: Tailwind CSS 3
- **Routing**: React Router v7
- **HTTP Client**: Axios
- **Forms**: Formik + Zod
- **Charts**: Recharts
- **Testing**: Vitest + React Testing Library

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/            # Reusable UI primitives (Button, Input, Modal, etc.)
│   │   ├── layout/        # Layout components (Sidebar, Header, DashboardLayout)
│   │   └── shared/        # Shared components (SearchBar, Pagination, etc.)
│   ├── features/
│   │   ├── auth/          # Authentication (login, signup)
│   │   ├── members/       # Member management
│   │   ├── events/        # Event management
│   │   ├── registrations/ # Event registration
│   │   ├── attendance/    # Attendance tracking
│   │   ├── payments/      # Payment tracking
│   │   ├── announcements/ # Announcements
│   │   └── reports/       # Reports & analytics
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities (axios, helpers)
│   ├── pages/             # Route-level page components
│   ├── services/          # API client
│   ├── types/             # TypeScript types
│   ├── App.tsx            # Router setup
│   ├── main.tsx           # Entry point
│   └── index.css          # Tailwind styles
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
└── index.html
```

## Setup

### 1. Install dependencies

```bash
cd src/frontend
npm install
```

### 2. Configure environment

```bash
# Create .env file
echo "VITE_API_URL=http://localhost/api/v1" > .env
```

### 3. Start development server

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`.

## Available Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run typecheck    # TypeScript type checking
npm test             # Run tests
```

## Features

### Pages

- **Login** - Email/password authentication
- **Signup** - Organization registration
- **Dashboard** - Overview with stats and recent activity
- **Members** - List, search, filter, create, edit, import/export
- **Events** - List, create (4-step wizard), edit, status management
- **Event Detail** - Registrations, attendance, payments tabs
- **Attendance** - Real-time check-in list with counter
- **Payments** - List, record, status management
- **Announcements** - List, create, publish/archive
- **Reports** - Members, events, payments with charts
- **Organization Settings** - Org profile and settings
- **Public Event** - Public event page with registration form

### Multi-Tenancy

All API calls include JWT token with `orgId` claim. The Axios interceptor automatically attaches the token to requests.

### Roles

- **admin**: Full access to all features
- **staff**: Can manage members, events, registrations, attendance
- **member**: Can view announcements, register for events
