# Security Architecture

BaratonHub is built with a "Secure by Default" architecture. We do not rely on the frontend to hide sensitive data; the database enforces strict access controls.

## 1. Authentication
- Managed by **Supabase Auth** (GoTrue).
- Uses JWT (JSON Web Tokens) for session management.
- Student self-registration is restricted to `@ueab.ac.ke` email addresses.

## 2. Role-Based Access Control (RBAC)
- Roles: `admin`, `student`, `lecturer`, `worker`.
- Stored in the `public.profiles` table.
- Roles cannot be modified by the user via the frontend.

## 3. Row Level Security (RLS)
Every table has RLS enabled. 
- **Students** can only `SELECT` their own finance records, counselling requests, and attendance.
- **Maintenance Workers** can only `UPDATE` requests assigned to their specific `user_id`.
- **Admins** have elevated privileges but their actions are logged in the `audit_logs` table.

## 4. Storage Security
- Public buckets (`avatars`, `lost-found`, `maintenance`): Read-only for public, authenticated insert.
- Private buckets (`cvs`): Strictly authenticated access.

## 5. Edge Functions & Privileged Actions
- User creation is handled via a PostgreSQL `SECURITY DEFINER` function (`admin_create_user`) to safely insert into `auth.users` and `auth.identities` without exposing the Service Role Key to the frontend.