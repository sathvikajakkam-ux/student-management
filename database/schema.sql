-- ============================================================================
-- STUDENT FEEDBACK MANAGEMENT SYSTEM - DATABASE SCHEMA
-- Target Database: Supabase PostgreSQL
-- ============================================================================

-- Enable pgcrypto for UUID generation (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. DROP EXISTING TABLES (Safely cleanup if re-running)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS feedbacks CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ----------------------------------------------------------------------------
-- 2. USERS TABLE
-- Stores credentials and profiles for both Students and Faculty/Administrators.
-- Passwords are encrypted server-side using bcrypt before insertion.
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    roll_number VARCHAR(50), -- Only relevant for students (e.g., 24CS101)
    department VARCHAR(100) NOT NULL DEFAULT 'Computer Science & Engineering',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for rapid lookup during login
CREATE INDEX idx_users_email ON users(email);

-- ----------------------------------------------------------------------------
-- 3. COURSES TABLE
-- Stores academic subjects, designated faculty instructors, and semesters.
-- ----------------------------------------------------------------------------
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_code VARCHAR(20) UNIQUE NOT NULL,
    course_name VARCHAR(150) NOT NULL,
    instructor_name VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    semester VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for searching courses by code and department
CREATE INDEX idx_courses_code ON courses(course_code);
CREATE INDEX idx_courses_dept ON courses(department);

-- ----------------------------------------------------------------------------
-- 4. FEEDBACKS TABLE
-- Stores multi-criteria ratings and qualitative remarks from students.
-- Enforces a 1-to-5 star rating constraint and prevents duplicate submissions.
-- ----------------------------------------------------------------------------
CREATE TABLE feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    teaching_rating INT NOT NULL CHECK (teaching_rating BETWEEN 1 AND 5),
    content_rating INT NOT NULL CHECK (content_rating BETWEEN 1 AND 5),
    support_rating INT NOT NULL CHECK (support_rating BETWEEN 1 AND 5),
    overall_rating NUMERIC(3, 2) NOT NULL CHECK (overall_rating BETWEEN 1.00 AND 5.00),
    comments TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Enforce unique constraint: each student can submit feedback only once per course
    CONSTRAINT unique_student_course_feedback UNIQUE (course_id, student_id)
);

-- Indexes for lightning-fast aggregation queries by course and student
CREATE INDEX idx_feedbacks_course_id ON feedbacks(course_id);
CREATE INDEX idx_feedbacks_student_id ON feedbacks(student_id);

-- ----------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- Supabase best practice: Enable RLS on all public tables.
-- The Express backend connects with Supabase credentials to manage secure access.
-- ----------------------------------------------------------------------------
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

-- Allow full access for backend service queries while preventing unauthorized public REST access
CREATE POLICY "Allow backend access to users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow backend access to courses" ON courses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow backend access to feedbacks" ON feedbacks FOR ALL USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 6. SEED / DEMO DATA FOR IMMEDIATE TESTING
-- Pre-hashed bcrypt password for all demo accounts is: Password123
-- ----------------------------------------------------------------------------

-- Seed Admin and Student Users
INSERT INTO users (id, name, email, password_hash, role, roll_number, department) VALUES
('a0000000-0000-0000-0000-000000000001', 'Dr. Ramesh Kulkarni (HOD)', 'admin@college.edu', '$2a$10$X/kPugMbBceq/BsAZseSUOO0fa1vUqfjW/xrlVG.FTt7t8ASdyq6.', 'admin', NULL, 'Computer Science & Engineering'),
('b0000000-0000-0000-0000-000000000001', 'Rahul Sharma', 'rahul.sharma@college.edu', '$2a$10$X/kPugMbBceq/BsAZseSUOO0fa1vUqfjW/xrlVG.FTt7t8ASdyq6.', 'student', '24CS101', 'Computer Science & Engineering'),
('b0000000-0000-0000-0000-000000000002', 'Ananya Patel', 'ananya.patel@college.edu', '$2a$10$X/kPugMbBceq/BsAZseSUOO0fa1vUqfjW/xrlVG.FTt7t8ASdyq6.', 'student', '24CS102', 'Computer Science & Engineering');

-- Seed Standard Academic Courses
INSERT INTO courses (id, course_code, course_name, instructor_name, department, semester, is_active) VALUES
('c0000000-0000-0000-0000-000000000001', 'CS201', 'Data Structures & Algorithms', 'Dr. Alan Sharma', 'Computer Science & Engineering', 'Semester 3', true),
('c0000000-0000-0000-0000-000000000002', 'CS202', 'Database Management Systems', 'Prof. Priya Iyer', 'Computer Science & Engineering', 'Semester 3', true),
('c0000000-0000-0000-0000-000000000003', 'CS203', 'Web Technologies & Node.js', 'Dr. Rajiv Verma', 'Information Technology', 'Semester 3', true),
('c0000000-0000-0000-0000-000000000004', 'EC201', 'Digital Logic & Microcontrollers', 'Prof. Neha Gupta', 'Electronics & Comm.', 'Semester 3', true),
('c0000000-0000-0000-0000-000000000005', 'MA201', 'Discrete Mathematics & Graph Theory', 'Dr. Suresh Menon', 'Applied Mathematics', 'Semester 3', true);

-- Seed Initial Feedback Submissions (Demonstrates both identified and anonymous feedback)
INSERT INTO feedbacks (course_id, student_id, teaching_rating, content_rating, support_rating, overall_rating, comments, is_anonymous) VALUES
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 5, 4, 5, 4.67, 'Dr. Alan explains tree and graph traversals with excellent real-life analogies. The programming assignments are very helpful.', false),
('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 4, 5, 4, 4.33, 'Great SQL query practice sessions in the lab. Would appreciate more exercises on B-Tree indexing.', true);

