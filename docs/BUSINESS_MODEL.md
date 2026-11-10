# BaratonHub - One Page Business Model

### 1. Customer and Problem
**Users:** Students, Lecturers, Administrators, and Campus Workers at UEAB.
**Problem:** Fragmented campus communication. Lost items are never found, notices are missed on physical boards, students wait in long lines for fee clearance, and tracking lecture attendance is manual and prone to proxy (friends signing for friends). 

### 2. Solution and Value
**Solution:** BaratonHub is a unified digital campus platform. It features a centralized Notice Board, a Lost & Found claim system, Smart Lecture GPS attendance, and dynamic fee tracking.
**Value:** Reduces administrative overhead, eliminates paper waste, prevents attendance fraud, and creates a connected campus experience. 

### 3. Costs and Adoption
**Cost:** Hosted on Vercel (free tier) and Supabase (free tier). Estimated scale-up cost to support 5,000 users is ~$100/month for database and storage.
**Adoption:** First 100 users will be reached via ISC department student ambassadors and the Student Affairs office. 

### 4. Risks and Compliance
**Risk:** GPS spoofing for attendance, data privacy for counselling records.
**Compliance:** Supabase Row Level Security (RLS) ensures students only see their own financial and counselling data. GPS is used only during active lectures, and location data is deleted after the session ends.