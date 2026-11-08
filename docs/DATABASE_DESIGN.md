# Database Design

The database is built on PostgreSQL (via Supabase). 

## Core Tables
- **profiles**: Links to `auth.users`. Stores `role`, `status`, `department`, and `avatar_url`.
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
- All tables reference `profiles.id` with `ON DELETE CASCADE` to prevent orphaned records.
- `exams` references `courses.id`.
- `seat_allocations` has a unique constraint on `(exam_id, student_id)` to prevent double-booking.