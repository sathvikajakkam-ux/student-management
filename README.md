# Student Feedback Management System

A complete, modern full-stack web application designed for engineering colleges to collect, manage, and analyze student feedback on academic courses and faculty instructors with multi-criteria ratings and guaranteed anonymity.

---

## 1. Project Overview & Real-World Problem

### The Real-World Problem
In traditional college environments, feedback collection is often conducted via paper forms or clunky ad-hoc surveys. This outdated method poses serious challenges:
- **Fear of Reprisal:** Students often hesitate to submit candid, constructive feedback when they worry that faculty might identify them and penalize their internal grades.
- **Low Participation & Redundancy:** Paper-based processes lead to incomplete forms, lost surveys, or duplicate submissions.
- **Delayed Analysis:** Academic administrators (Heads of Department, Deans, Principals) often spend weeks manually tabulating scores in spreadsheets before recognizing problems with curriculum pacing or lab support.

### The Solution: EduFeedback
The **Student Feedback Management System** provides an automated, role-based, database-backed portal where:
1. **Students** can review all registered subjects for their semester, submit 1-to-5 star evaluations across distinct teaching dimensions (Clarity & Teaching Effectiveness, Syllabus Coverage, and Practical/Lab Guidance), optionally enable **Anonymity**, and add constructive feedback comments.
2. **Administrators / Department Heads** receive instant real-time analytics, institutional averages, dimensional score breakdowns, and transparent qualitative feedback to improve teaching methodologies.
3. **Integrity is Guaranteed:** The system enforces database-level unique constraints so each student can evaluate each course only once per semester, preventing ballot stuffing.

---

## 2. Project Objectives

- Provide a beginner-friendly full-stack application built strictly with core web fundamentals (HTML5, CSS3, Vanilla JS, Node.js, Express, Supabase PostgreSQL).
- Demonstrate secure user authentication with password encryption (`bcryptjs`) and stateless session management (`jsonwebtoken`).
- Guarantee student confidentiality via optional anonymous feedback while preventing duplicate submissions.
- Deliver real-time analytics and KPI dashboards for academic administrators.

---

## 3. Target Users & Roles

| Role | Target User | Capabilities |
| :--- | :--- | :--- |
| **Student** | Enrolled B.Tech students | Register account with Roll Number, log in, browse semester courses, submit ratings and constructive remarks, choose anonymous submission, view history of personal submissions. |
| **Admin** | HOD / Faculty Administrator | Log in, view institutional KPI dashboard, analyze course-level and teacher-level scores, inspect dimension progress bars, review student comments (with anonymity respected), add new courses, delete courses. |
| **Visitor** | Unauthenticated guest | Browse the homepage and active courses; prompted to sign in when attempting to submit evaluations. |

---

## 4. Key Implemented Features

- **Multi-Dimension 5-Star Rating System:**
  - Dimension 1: Teaching Effectiveness & Clarity
  - Dimension 2: Course Content & Syllabus Coverage
  - Dimension 3: Practical & Lab Guidance
  - Auto-calculated Overall Composite Rating (rounded to 2 decimal places).
- **Student Privacy & Guaranteed Anonymity:** When enabled, the backend masks the student's name and roll number in all administrative reports (`Anonymous Student`).
- **Duplicate Prevention:** A composite database constraint `UNIQUE(course_id, student_id)` prevents a student from reviewing the same subject multiple times.
- **Interactive UI with Vanilla JavaScript:** Star hover and click states, live score calculation, non-blocking toast notifications (no browser `alert()`), modal dialogues, search & filter bars.
- **Administrative Analytics Dashboard:** Institutional average, department breakdown, course performance rankings, review count, and feedback comment explorer.
- **RESTful API Backend:** Modular Express.js architecture with JWT authentication, role verification middleware, and centralized error handling.
- **Cloud Database:** Persistent PostgreSQL hosted on Supabase with foreign keys, cascading deletions, and indexing.

---

## 5. Technology Stack

- **Frontend:**
  - HTML5 (Semantic document markup)
  - CSS3 (Custom design system, CSS variables, Flexbox, CSS Grid, mobile responsive media queries)
  - Vanilla JavaScript (ES6+, DOM manipulation, Fetch API, client state management)
- **Backend:**
  - Node.js (JavaScript runtime)
  - Express.js (REST API server framework)
- **Database:**
  - Supabase PostgreSQL (Cloud SQL database with triggers, constraints, and relational integrity)
- **Security & Utilities:**
  - `bcryptjs` (Password hashing)
  - `jsonwebtoken` (JWT stateless authorization)
  - `dotenv` (Environment variable configuration)
  - `cors` (Cross-Origin Resource Sharing)
- **Version Control:** Git & GitHub

---

## 6. Complete Folder Structure

```text
student-feedback-management-system/
├── frontend/
│   ├── index.html            # Main single-page interface with modals and dashboards
│   ├── styles.css            # Custom responsive styles and design system
│   └── app.js                # Frontend controller, API fetch calls, and UI state
├── backend/
│   ├── server.js             # Express server setup, middleware, static serving
│   ├── supabase.js           # Supabase client initialization
│   ├── routes/
│   │   ├── authRoutes.js     # User registration, login, and profile (/api/auth)
│   │   ├── courseRoutes.js   # Courses listing and management (/api/courses)
│   │   └── feedbackRoutes.js # Feedback submission and analytics (/api/feedback)
│   ├── middleware/
│   │   └── authMiddleware.js # JWT verification and role-based guards (Admin/Student)
│   ├── utils/
│   │   └── helpers.js        # Input validation and rating calculations
│   ├── package.json          # Backend npm scripts and dependencies
│   ├── .env                  # Local secret configuration (never commit to Git!)
│   ├── .env.example          # Template showing required environment variables
│   └── .gitignore            # Backend git exclusions (node_modules, .env)
├── database/
│   └── schema.sql            # Complete PostgreSQL DDL, tables, constraints, indexes & seeds
├── .gitignore                # Root git exclusions
└── README.md                 # Complete documentation
```

---

## 7. Prerequisites & Software Requirements

Before setting up the project, install:
1. **Node.js (v18.x or v20.x+ LTS)**: [https://nodejs.org](https://nodejs.org) (Includes `npm`)
2. **Git**: [https://git-scm.com](https://git-scm.com)
3. **Visual Studio Code (VS Code)**: [https://code.visualstudio.com](https://code.visualstudio.com)
4. A free **Supabase** account: [https://supabase.com](https://supabase.com)

---

## 8. Step-by-Step Setup Guide

### Step 1: Open the Project in VS Code
1. Open Visual Studio Code.
2. Click **File > Open Folder...** and select the project directory (`student-feedback-management-system`).
3. Open the integrated terminal (`Ctrl + ` ` ` or **Terminal > New Terminal**).

### Step 2: Install Backend Dependencies
In the terminal, run:
```bash
cd backend
npm install
```
*(On Windows systems where PowerShell restricts `.ps1` execution, run `npm.cmd install`)*.

### Step 3: Create and Set Up Your Supabase Database
1. Go to [https://supabase.com](https://supabase.com) and log in.
2. Click **New Project**.
3. Choose a name (e.g., `student-feedback-db`), set a secure database password, and select your region.
4. Once the project dashboard finishes provisioning:
   - Click the **SQL Editor** tab (icon `>_` on the left sidebar).
   - Click **New Query**.
   - Open `database/schema.sql` from your local project, copy the entire SQL script, and paste it into the Supabase SQL editor.
   - Click the green **Run** button.
   - You should see `Success. No rows returned`.
5. Verify your tables:
   - Click the **Table Editor** on the left sidebar.
   - You should see three tables: `users`, `courses`, and `feedbacks` populated with initial demo data.

### Step 4: Configure Backend Environment Variables
1. In the Supabase dashboard, click the gear icon (**Project Settings**) on the left sidebar.
2. Select **API**.
3. Copy the **Project URL** (e.g., `https://xyzcompany.supabase.co`).
4. Copy the **Project API Keys > anon / public** (or **service_role**).
5. Open `backend/.env` in VS Code and paste your credentials:
   ```env
   PORT=3000
   NODE_ENV=development
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_KEY=your-supabase-api-key-here
   JWT_SECRET=super_secret_jwt_key_for_btech_student_feedback_system_2024
   ```

### Step 5: Start the Backend Server
From the `backend` folder, run:
```bash
npm start
```
You will see output resembling:
```text
====================================================
🚀 Student Feedback System Server is running!
🌐 Local URL: http://localhost:3000
🩺 Health API: http://localhost:3000/api/health
📁 Static files served from: .../frontend
====================================================
```

### Step 6: Open the Application
Open your browser and navigate to:
```text
http://localhost:3000
```
The application is fully loaded and ready to use!

---

## 9. Demo Accounts for Immediate Testing

You can use the built-in demo accounts to test both student and admin roles immediately:

| Role | Email Address | Password | Roll Number |
| :--- | :--- | :--- | :--- |
| **Admin / HOD** | `admin@college.edu` | `Password123` | *N/A (HOD)* |
| **Student 1** | `rahul.sharma@college.edu` | `Password123` | `24CS101` |
| **Student 2** | `ananya.patel@college.edu` | `Password123` | `24CS102` |

> **Tip:** You can also click the **"Fill Student"** or **"Fill Admin"** buttons in the demo banner at the top of the webpage to populate the login form with 1 click!

---

## 10. System Architecture

```text
[ Browser / Frontend Client ]
  HTML5 + CSS3 + Vanilla JavaScript (Fetch API)
          |
          | HTTP REST Requests with JSON & JWT Authorization Bearer
          v
[ Backend / Node.js + Express.js ]
  ├── server.js (Static file hosting & Routing)
  ├── middleware/authMiddleware.js (JWT Verification & RBAC)
  └── routes/ (authRoutes, courseRoutes, feedbackRoutes)
          |
          | Supabase JS SDK (PostgREST queries)
          v
[ Database / Supabase PostgreSQL ]
  ├── users (UUID, email, bcrypt password_hash, role)
  ├── courses (UUID, course_code, course_name, instructor, semester)
  └── feedbacks (Ratings 1-5, overall_rating, comments, is_anonymous)
```

---

## 11. REST API Specification

### Authentication (`/api/auth`)
- `POST /api/auth/register`
  - **Body:** `{ name, email, password, role, roll_number, department }`
  - **Returns:** `{ success: true, token, user }`
- `POST /api/auth/login`
  - **Body:** `{ email, password }`
  - **Returns:** `{ success: true, token, user }`
- `GET /api/auth/me`
  - **Headers:** `Authorization: Bearer <token>`
  - **Returns:** `{ success: true, user }`

### Courses (`/api/courses`)
- `GET /api/courses`
  - **Auth:** Public / Optional Bearer token (attaches `hasSubmittedFeedback` if student).
  - **Returns:** List of active courses with rating averages and review counts.
- `POST /api/courses`
  - **Auth:** Admin only (`role: 'admin'`).
  - **Body:** `{ course_code, course_name, instructor_name, department, semester }`
  - **Returns:** Created course object.
- `DELETE /api/courses/:id`
  - **Auth:** Admin only (`role: 'admin'`).
  - **Returns:** Success confirmation.

### Feedback (`/api/feedback`)
- `POST /api/feedback`
  - **Auth:** Student only (`role: 'student'`).
  - **Body:** `{ course_id, teaching_rating, content_rating, support_rating, comments, is_anonymous }`
  - **Returns:** Created feedback record.
- `GET /api/feedback/my-submissions`
  - **Auth:** Student only (`role: 'student'`).
  - **Returns:** All feedbacks submitted by the logged-in student.
- `GET /api/feedback/stats`
  - **Auth:** Admin only (`role: 'admin'`).
  - **Returns:** Institutional average, dimension breakdown, total feedbacks, courses rankings.
- `GET /api/feedback/all`
  - **Auth:** Admin only (`role: 'admin'`).
  - **Query Params:** Optional `?course_id=<uuid>`
  - **Returns:** All student reviews. If `is_anonymous: true`, student name is replaced with `"Anonymous Student"` and roll number is `"Hidden"`.

---

## 12. Manual Testing Checklist

| Test Scenario | Action | Expected Result |
| :--- | :--- | :--- |
| **1. Visitor Browsing** | Open `http://localhost:3000` without logging in. Click "Browse Courses". | Courses catalogue displays with ratings. "Give Feedback" prompts to sign in. |
| **2. Student Login** | Sign in with `rahul.sharma@college.edu` / `Password123`. | Welcome badge appears with role `STUDENT`. "My Submissions" appears in navbar. |
| **3. Duplicate Prevention** | Rahul tries to review `CS201` (already submitted in seed data). | Card displays `✓ Submitted` badge; submit button is disabled. Backend rejects direct POST with `409 Conflict`. |
| **4. Submit New Feedback** | Select `CS203` (Web Technologies). Rate Teaching (5★), Content (4★), Support (5★). Leave comments. Check "Submit Anonymously". Submit. | Toast confirms success. Live score `4.67★` appears. Course card changes to `✓ Submitted`. |
| **5. Student History** | Click "My Submissions" in navbar. | Newly submitted review for `CS203` displays with date, star breakdown, and "Anonymous" tag. |
| **6. Admin Analytics** | Log out and sign in with `admin@college.edu` / `Password123`. Click "Admin Dashboard". | KPI cards update with real counts. Dimension progress bars display scores. |
| **7. Anonymity Verification** | In Admin Dashboard, inspect student comments. | Rahul's `CS203` review shows `🔒 Anonymous Student (Roll: Hidden)`, protecting student privacy. |
| **8. Role Guard Check** | Log in as Student and attempt to fetch `/api/feedback/stats`. | Backend returns `403 Forbidden` (`Only administrators can access this resource`). |
| **9. Add Course** | In Admin Dashboard, click "+ Add New Course", fill fields, and submit. | Course appears in table and in the student catalog immediately. |

---

## 13. Troubleshooting Common Issues

### Issue 1: `npm : File ... npm.ps1 cannot be loaded because running scripts is disabled`
- **Cause:** Windows PowerShell script execution policy.
- **Solution:** Use `npm.cmd install` and `npm.cmd start` instead of `npm`.

### Issue 2: `Error: listen EADDRINUSE: address already in use :::3000`
- **Cause:** Another process is using port 3000.
- **Solution:** Change `PORT=3001` or `PORT=5001` in `backend/.env` and restart.

### Issue 3: `Database: Connect Supabase Credentials` in footer
- **Cause:** `backend/.env` still has placeholder values.
- **Solution:** Paste your actual Supabase URL and Key into `backend/.env` and restart the server.

### Issue 4: `Invalid email or password`
- **Cause:** Password is case-sensitive or user does not exist.
- **Solution:** Check the Demo Credentials section or register a new student account using the "Register" tab.

---

## 14. Git & GitHub Upload Instructions

Follow these exact steps from the root project directory:

```bash
# 1. Initialize git repository
git init

# 2. Check that .env files and node_modules are ignored
git status

# 3. Add all files to staging
git add .

# 4. Commit changes
git commit -m "Build complete student feedback management system"

# 5. Rename default branch to main
git branch -M main

# 6. Add your GitHub repository remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/student-feedback-management-system.git

# 7. Push code to GitHub
git push -u origin main
```

> **Security Reminder:** Never remove `.env` from `.gitignore`. Keep your database password and private API keys out of GitHub commits.

---

## 15. Future Enhancements

- PDF/Excel export of semester feedback reports for academic accreditation audits (NAAC / NBA).
- Faculty response portal allowing instructors to publish improvement action plans for their courses.
- Department-wide sentiment analysis using natural language keywords.

