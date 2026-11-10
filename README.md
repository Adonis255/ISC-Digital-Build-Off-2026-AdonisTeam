# BaratonHub: One Campus. One Connected Experience.

**Theme:** Building Digital Solutions for Campus Problems  
**Institution:** University of Eastern Africa, Baraton (UEAB)  
**Live Demo:** [https://baratonhub.vercel.app]
**GitHub Repository:** [https://github.com/Adonis255/ISC-Digital-Build-Off-2026-AdonisTeam]
---

## 👥 Team Information (AdonisTeam)

*   **Adams Omondi** - *Team Leader (ISC Student)* | Student ID No: SOGUOM2411 | [(https://github.com/Adonis255)]
*   **Joan cherono** - *[Frontend/UI Designer]* | Student ID | [()]

---

## 1. Problem Statement and Research

### The Problem
University campuses operate in fragmented silos. Students at UEAB face three major daily frustrations:
1.  **Lost Items:** There is no centralized way to report or claim lost items, leading to permanent loss of valuables.
2.  **Unclear Notices:** Important announcements (internships, exams, events) are placed on physical boards that students rarely walk past.
3.  **Manual Processes:** Checking fee balances requires standing in long lines, and tracking lecture attendance is manual and prone to proxy (friends signing for friends).

### User Research Summary
We interviewed three real users (two students and one lecturer) to validate these pain points. 

**The Questions We Asked:**
1. *"Have you ever lost an item on campus? How did you try to find it?"*
2. *"Do you find the physical notice boards effective for getting campus updates and opportunities?"*
3. *"What is the most frustrating part about checking your exam results, checking your fee balance, or taking attendance?"*

**What Users Told Us:**
*   **Student A (3rd Year, ISC):** "I lost my student ID last semester. I asked around and checked the library, but there was no central place to check if someone had found it. I had to pay for a replacement."
*   **Student B (2nd Year, Nursing):** "I usually miss out on scholarship and internship deadlines because I don't see the posters in time. We need a digital board on our phones."
*   **Lecturer C:** "Taking attendance manually takes 10 minutes of my lecture time. I need a faster, secure way to know who is actually in the room, not just who has a friend in class."

---

## 2. Proposed Solution

**BaratonHub** is a unified, role-based digital campus platform that connects Students, Lecturers, Administrators, and Workers into one secure application. It replaces fragmented physical boards and manual paperwork with a streamlined digital portal.

### Key Features
*   **Role-Based Dashboards:** Custom UI and permissions for Admin, Student, Lecturer, and Worker.
*   **Smart Lecture Attendance:** Lecturers start a session, and students must be within the physical GPS radius of the lecture hall to mark attendance using a live rotating code. Includes a live in-class Q&A chat.
*   **Digital Notice Board:** A campus-wide social feed for urgent notices, events, and internships with image uploads, urgency tags, and expiry dates.
*   **Lost & Found:** Report items, upload photos, and submit private ownership claims for admin approval.
*   **Dynamic Fee Management:** Students' fees are automatically calculated based on enrolled courses. Features a mock payment system and a visual progress bar for exam clearance.
*   **Exams & Seating:** Bulk CSV exam uploads and automatic seat allocation based strictly on room capacity and course enrollment.
*   **Campus Directory & Counselling:** Searchable directory of offices with photos, and a confidential counselling request system.

---

## 3. System Design

### Database Architecture (ERD)
The database is built on PostgreSQL (via Supabase) with strict Row Level Security (RLS) ensuring data privacy.
![ERD 1](./database/ERD1.png)
![ERD 2](./database/ERD2.png)
![ERD 3](./database/ERD3.png)
![ERD 4](./database/ERD4.png)
![ERD 5](./database/ERD5.png)


### System Architecture
*   **Frontend:** React + Vite (Single Page Application) hosted on Vercel.
*   **Backend:** Supabase (Auth, PostgreSQL, Storage, Realtime).
*   **Security:** Row Level Security (RLS) ensures students can only access their own data (fees, attendance), while Admins have platform-wide access. API keys are secured via environment variables.

---

## 4. Technology Stack
*   **Frontend:** React 18, Vite, React Router, Tailwind CSS, Lucide Icons.
*   **Backend & Database:** Supabase (PostgreSQL, Auth, Storage).
*   **Hosting:** Vercel (Frontend).
*   **Other Tools:** Git, GitHub, HTML5 Geolocation API, React-QR-Code.

---

## 5. Screenshots / Demo

**Admin Dashboard & Analytics**
![Admin Dashboard](./screenshots/admin_dashboard.png)

**Smart Lecture & GPS Attendance**
![Smart Lecture](./screenshots/smart_lecture.png)

**Digital Notice Board**
![Notice Board](./screenshots/notice_board.png)

**Student Fee Management**
![Student Fees](./screenshots/finance.png)

---

## 6. How to Run the Project Locally

### Prerequisites
*   Node.js (v18+)
*   A Supabase Project

### Installation Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/Adonis255/ISC-Digital-Build-Off-2026-AdonisTeam.git
   cd ISC-Digital-Build-Off-2026-AdonisTeam
2. Install Dependencies
    ```bash
    npm install
3. Set up environment variables:
   Copy the .env.example file to .env and add your Supabase credentials.
     VITE_SUPABASE_URL=your_supabase_project_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
4. Run the Application;
    ```bash
    npm run dev

### (Note: Database schema and SQL scripts are available in the /database folder. Execute them in the Supabase SQL Editor to set up the tables).

## 7. Business Model Summary
    Customer & Problem: Students and staff need a unified platform to manage campus life, reducing wasted time and lost resources.
    Solution & Value: BaratonHub replaces fragmented physical boards and manual paperwork with a streamlined digital portal.
    Costs & Adoption: Hosted on free tiers initially. Cost scales to ~$200/month for a 5,000-user database. Reached via campus ambassadors and orientation programs.
    Risks & Compliance: RLS policies protect sensitive student data (fees, counselling). GPS is only used during active lectures to prevent proxy attendance.

## 8. Testing and User Feedback
    Mobile Responsiveness: We tested the platform on Android and iOS devices to ensure the hamburger menu and Notice Board function smoothly.

    Feedback: Students requested that the fee payment reflect immediately. We implemented a mock payment API that updates the progress bar in real-time without needing a page refresh.

    Security Testing: We tested unauthorized access, ensuring a student logging in cannot access the Admin dashboard, cannot change their own role, and cannot view another student's fee balance or attendance records.

## 9. Team Contributions
    [Adams Omondi]: Full-stack development, database architecture (ERD/RLS), Supabase integration, GPS attendance logic, Vercel deployment.

    [Joan Cherono]: UI/UX design, wireframes, implementation of the purple theme, and user testing.


## 10. Future Improvements & Conclusion
    Future Improvements:

    Real M-Pesa Integration: Replacing the mock payment system with a live Safaricom Daraja API integration.

    Native Mobile App: Building a React Native app to allow push notifications and background GPS tracking for attendance.

    AI Integration: Adding an AI chatbot to help students navigate the academic directory.

    Conclusion: BaratonHub demonstrates how modern web technologies can solve real campus problems. By centralizing notices, automating fee tracking, and securing attendance, we provide a scalable foundation for a smarter university.

    Built with ❤️ by AdonisTeam for the ISC Digital Build-Off 2026.