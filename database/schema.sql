-- ==========================================
-- BARATONHUB DATABASE SCHEMA
-- Engine: PostgreSQL (Supabase)
-- ==========================================

-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE user_role AS ENUM ('admin', 'student', 'lecturer', 'worker');
CREATE TYPE account_status AS ENUM ('active', 'suspended', 'deactivated', 'pending');

-- ==========================================
-- 1. CORE & ACADEMIC
-- ==========================================
CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  code text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  role user_role DEFAULT 'student',
  status account_status DEFAULT 'active',
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  avatar_url text,
  phone text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  title text NOT NULL,
  lecturer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  department text,
  time_slot text,
  location text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(course_id, student_id)
);

-- ==========================================
-- 2. SMART LECTURES & ATTENDANCE
-- ==========================================
CREATE TABLE public.lecture_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  lecturer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_token text NOT NULL,
  venue_lat numeric,
  venue_lng numeric,
  radius_meters int DEFAULT 100,
  is_online boolean DEFAULT false,
  topic text,
  notes text,
  resources jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.lecture_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.lecture_sessions(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'Present',
  device_id text,
  distance numeric,
  created_at timestamptz DEFAULT now(),
  UNIQUE(session_id, student_id)
);

CREATE TABLE public.lecture_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.lecture_sessions(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  author_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_role text DEFAULT 'lecturer',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.question_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES public.lecture_questions(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  response_text text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(question_id, student_id)
);

-- ==========================================
-- 3. EXAMINATIONS & SEATING
-- ==========================================
CREATE TABLE public.exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  exam_date timestamptz NOT NULL,
  location text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.exam_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  capacity int NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.seat_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  room_id uuid REFERENCES public.exam_rooms(id) ON DELETE CASCADE,
  seat_number int NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(exam_id, student_id),
  UNIQUE(exam_id, room_id, seat_number)
);

-- ==========================================
-- 4. COMMUNITY, NOTICES, & SERVICES
-- ==========================================
CREATE TABLE public.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text,
  body text NOT NULL,
  category text DEFAULT 'General',
  post_type text DEFAULT 'community', 
  media_url text,
  media_type text,
  urgency text DEFAULT 'Normal',
  expiry_date date,
  is_reported boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  UNIQUE(post_id, user_id)
);

CREATE TABLE public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.offices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  building text,
  room text,
  operating_hours text,
  services text,
  contact_number text,
  description text,
  image_urls jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- ==========================================
-- 5. FINANCE, INTERNSHIPS & OPPORTUNITIES
-- ==========================================
CREATE TABLE public.finance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount numeric NOT NULL,
  status text DEFAULT 'unpaid',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.internships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  company text NOT NULL,
  description text NOT NULL,
  duration text,
  requirements text,
  image_url text,
  deadline date,
  created_by uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.scholarships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  amount text,
  image_url text,
  deadline date,
  created_by uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- ==========================================
-- 6. SYSTEM SETTINGS & NOTIFICATIONS
-- ==========================================
CREATE TABLE public.system_settings (
  id int PRIMARY KEY,
  allow_registration boolean DEFAULT true,
  banner_url text
);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);