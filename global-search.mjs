import fs from 'fs';
import path from 'path';

const files = {
  "README.md": `# BaratonHub

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
Create a \`.env\` file in the root directory:
\`\`\`env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
\`\`\`

### 3. Installation
\`\`\`bash
npm install
npm run dev
\`\`\`

### 4. Database Setup
All SQL migrations are available in the \`supabase/migrations\` folder. You can run them directly in the Supabase SQL Editor or via the Supabase CLI.

## 👥 Team Information
**AdonisTeam**
- Repository: [ISC-Digital-Build-Off-2026-AdonisTeam](https://github.com/Adonis255/ISC-Digital-Build-Off-2026-AdonisTeam)
- Hackathon: ISC Department – Digital Build-Off 2026

## ⚠️ Known Limitations
- Email notifications are configured in the UI but require an SMTP provider (e.g., Resend) for production sending.
- Finance reconciliation is a demonstration workflow and does not connect to real banking APIs.
- Payment gateways are not integrated (handled via manual entry/reconciliation).`,

  "docs/SECURITY.md": `# Security Architecture

BaratonHub is built with a "Secure by Default" architecture. We do not rely on the frontend to hide sensitive data; the database enforces strict access controls.

## 1. Authentication
- Managed by **Supabase Auth** (GoTrue).
- Uses JWT (JSON Web Tokens) for session management.
- Student self-registration is restricted to \`@ueab.ac.ke\` email addresses.

## 2. Role-Based Access Control (RBAC)
- Roles: \`admin\`, \`student\`, \`lecturer\`, \`worker\`.
- Stored in the \`public.profiles\` table.
- Roles cannot be modified by the user via the frontend.

## 3. Row Level Security (RLS)
Every table has RLS enabled. 
- **Students** can only \`SELECT\` their own finance records, counselling requests, and attendance.
- **Maintenance Workers** can only \`UPDATE\` requests assigned to their specific \`user_id\`.
- **Admins** have elevated privileges but their actions are logged in the \`audit_logs\` table.

## 4. Storage Security
- Public buckets (\`avatars\`, \`lost-found\`, \`maintenance\`): Read-only for public, authenticated insert.
- Private buckets (\`cvs\`): Strictly authenticated access.

## 5. Edge Functions & Privileged Actions
- User creation is handled via a PostgreSQL \`SECURITY DEFINER\` function (\`admin_create_user\`) to safely insert into \`auth.users\` and \`auth.identities\` without exposing the Service Role Key to the frontend.`,

  "docs/DATABASE_DESIGN.md": `# Database Design

The database is built on PostgreSQL (via Supabase). 

## Core Tables
- **profiles**: Links to \`auth.users\`. Stores \`role\`, \`status\`, \`department\`, and \`avatar_url\`.
- **audit_logs**: Tracks admin actions (e.g., suspensions).
- **departments**: Configurable university departments.

## Academic Tables
- **courses** & **exams**: Linked to lecturers and exam schedules.
- **seat_allocations**: Maps students to specific rooms and seat numbers for exams.
- **attendance**: Tracks student presence per course.

## Services Tables
- **items** & **lost_found_claims**: Handles lost and found with private proof uploads.
- **maintenance_requests**: Tracks the lifecycle of a campus issue with before/after photos.
- **internships** & **internship_applications**: Handles job postings and student CV uploads.
- **finance_records** & **finance_queries**: Tracks fee balances and student queries.

## Relationships
- All tables reference \`profiles.id\` with \`ON DELETE CASCADE\` to prevent orphaned records.
- \`exams\` references \`courses.id\`.
- \`seat_allocations\` has a unique constraint on \`(exam_id, student_id)\` to prevent double-booking.`,

  "docs/BUSINESS_MODEL.md": `# Business Model & Sustainability

## Problem Statement
University campuses operate in silos. Students use WhatsApp for lost items, physical notice boards for announcements, and paper forms for maintenance. This leads to lost data, slow response times, and poor student experience.

## Solution
BaratonHub is a central operating system for the university. It replaces fragmented tools with one unified, role-based portal.

## Value Proposition
- **For Students**: One app for everything (fees, exams, lost items).
- **For Admin**: Real-time data, reduced operational overhead.
- **For Workers**: Clear digital task assignment and evidence tracking.

## Target Customers
- Primarily: University of Eastern Africa, Baraton.
- Secondary: Other private universities in East Africa.

## Proposed Sustainability Model (Non-Confirmed)
- **Institutional Licensing**: The university pays an annual SaaS fee based on student population.
- **Premium Features**: Advanced analytics modules for the administration.
- **Value-Add Services**: Integration with local businesses for student discounts.

*Note: This is a proposed model for the hackathon and does not represent an existing contract with UEAB.*`,

  "docs/SYSTEM_ARCHITECTURE.md": `# System Architecture

## Frontend
- **React 18 + Vite**: Fast, modern Single Page Application (SPA).
- **Tailwind CSS**: Utility-first styling for rapid, responsive UI development.
- **React Router**: Handles protected routes and role-based redirects.
- **Context API**: Used for global state (Auth and Notifications).

## Backend (Supabase)
- **PostgreSQL**: Relational database with strict foreign keys.
- **Supabase Auth**: Handles JWT, session management, and password hashing.
- **Supabase Storage**: Hosts images, CVs, and maintenance evidence.
- **Realtime**: Postgres Changes are used to update the Notification Bell instantly without refreshing the page.

## Data Flow Example (Maintenance)
1. Student submits form + image.
2. Image uploads to \`maintenance\` bucket.
3. Record inserts into \`maintenance_requests\` table.
4. Admin views table, assigns Worker (updates \`assigned_to\`).
5. Database trigger inserts a row into \`notifications\`.
6. Worker's Navbar updates instantly via Supabase Realtime.
7. Worker uploads "after" photo and marks complete.`
};

Object.entries(files).forEach(([filePath, content]) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content);
});
console.log("✅ Professional Documentation generated successfully!");