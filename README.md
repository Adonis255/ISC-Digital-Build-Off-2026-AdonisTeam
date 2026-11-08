# BaratonHub

**One Campus. One Connected Experience.**

BaratonHub is a unified digital campus management and student engagement platform built for the **University of Eastern Africa, Baraton (UEAB)**. It connects students, lecturers, administrators, and university workers into a single, secure, role-based web application.

## 📖 Overview
Universities often suffer from fragmented communication, lost physical items, slow maintenance responses, and disconnected academic services. BaratonHub solves this by centralizing campus operations into a single, responsive platform.

## 🎯 Target Users
1. **Students**: Access services, community, exams, and finances.
2. **Lecturers**: Manage classes, attendance, and announcements.
3. **Workers**: Receive and complete maintenance tasks.
4. **Administrators**: Manage users, permissions, finance, and platform settings.

## ✨ Key Features
- **Role-Based Dashboards**: Custom UI and permissions for every user type.
- **Lost & Found**: Report items, upload photos, and submit private ownership claims.
- **Campus Maintenance**: Report issues, assign workers, and upload completion evidence.
- **Digital Billboard**: Announcements targeted by role or specific department.
- **Student Community**: Social feed with reporting features, study groups, and events.
- **Smart Examinations**: Post exam schedules and automatically allocate seats/rooms.
- **Attendance Tracking**: Lecturers can mark attendance digitally.
- **Finance & Fees**: View balances and submit payment reconciliation queries.
- **Internships & Scholarships**: Post and apply for opportunities with CV uploads.
- **Global Search**: Instantly find announcements, items, or opportunities.
- **Audit Logs**: Admins can track sensitive actions like user suspensions.

## 🛠 Technology Stack
- **Frontend**: React 18, Vite, React Router v6, Tailwind CSS, Lucide Icons.
- **Backend & Auth**: Supabase (PostgreSQL, Auth, Storage, Realtime).
- **Hosting**: Vercel (Frontend), Supabase (Backend).

## 🚀 Local Setup Instructions

### 1. Prerequisites
- Node.js (v18+)
- A Supabase Project (Free Tier is fine)

### 2. Environment Variables
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Installation
```bash
npm install
npm run dev
```

### 4. Database Setup
All SQL migrations are available in the `supabase/migrations` folder. You can run them directly in the Supabase SQL Editor or via the Supabase CLI.

## 👥 Team Information
**AdonisTeam**
- Repository: [ISC-Digital-Build-Off-2026-AdonisTeam](https://github.com/Adonis255/ISC-Digital-Build-Off-2026-AdonisTeam)
- Hackathon: ISC Department – Digital Build-Off 2026

## ⚠️ Known Limitations
- Email notifications are configured in the UI but require an SMTP provider (e.g., Resend) for production sending.
- Finance reconciliation is a demonstration workflow and does not connect to real banking APIs.
- Payment gateways are not integrated (handled via manual entry/reconciliation).