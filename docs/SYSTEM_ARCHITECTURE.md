# System Architecture

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
2. Image uploads to `maintenance` bucket.
3. Record inserts into `maintenance_requests` table.
4. Admin views table, assigns Worker (updates `assigned_to`).
5. Database trigger inserts a row into `notifications`.
6. Worker's Navbar updates instantly via Supabase Realtime.
7. Worker uploads "after" photo and marks complete.