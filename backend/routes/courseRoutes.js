/**
 * Course Routes
 * Manages courses, academic subjects, and instructor allocations.
 */

const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const { authenticateToken, optionalAuth, requireAdmin } = require('../middleware/authMiddleware');

// ============================================================================
// GET /api/courses
// Retrieves all active courses with optional user submission status & aggregate rating
// ============================================================================
router.get('/', optionalAuth, async (req, res) => {
  try {
    // 1. Fetch all active courses ordered by course code
    const { data: courses, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('is_active', true)
      .order('course_code', { ascending: true });

    if (courseError) {
      console.error('Error fetching courses:', courseError);
      return res.status(500).json({ success: false, message: 'Failed to retrieve courses.' });
    }

    // 2. Fetch feedback aggregates to compute ratings
    const { data: feedbacks, error: fbError } = await supabase
      .from('feedbacks')
      .select('id, course_id, student_id, overall_rating');

    const feedbackMap = {};
    if (!fbError && feedbacks) {
      feedbacks.forEach(fb => {
        if (!feedbackMap[fb.course_id]) {
          feedbackMap[fb.course_id] = { total: 0, sum: 0, studentIds: new Set() };
        }
        feedbackMap[fb.course_id].total += 1;
        feedbackMap[fb.course_id].sum += parseFloat(fb.overall_rating || 0);
        feedbackMap[fb.course_id].studentIds.add(fb.student_id);
      });
    }

    const currentStudentId = (req.user && req.user.role === 'student') ? req.user.id : null;

    // 3. Format response with computed properties
    const formattedCourses = courses.map(course => {
      const stats = feedbackMap[course.id] || { total: 0, sum: 0, studentIds: new Set() };
      const avgRating = stats.total > 0 ? (stats.sum / stats.total).toFixed(2) : null;
      const hasSubmitted = currentStudentId ? stats.studentIds.has(currentStudentId) : false;

      return {
        ...course,
        totalFeedbacks: stats.total,
        averageRating: avgRating ? parseFloat(avgRating) : null,
        hasSubmittedFeedback: hasSubmitted
      };
    });

    res.json({
      success: true,
      courses: formattedCourses
    });
  } catch (error) {
    console.error('Unhandled courses fetch error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching courses.' });
  }
});

// ============================================================================
// GET /api/courses/:id
// Get a single course by ID
// ============================================================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: course, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    res.json({ success: true, course });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving course details.' });
  }
});

// ============================================================================
// POST /api/courses
// Creates a new course (Admin only)
// ============================================================================
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { course_code, course_name, instructor_name, department, semester } = req.body;

    if (!course_code || !course_name || !instructor_name || !department || !semester) {
      return res.status(400).json({
        success: false,
        message: 'All fields (course_code, course_name, instructor_name, department, semester) are required.'
      });
    }

    // Check for duplicate course code
    const { data: existingCourse } = await supabase
      .from('courses')
      .select('id')
      .eq('course_code', course_code.toUpperCase().trim())
      .maybeSingle();

    if (existingCourse) {
      return res.status(409).json({
        success: false,
        message: `Course code '${course_code.toUpperCase().trim()}' is already registered.`
      });
    }

    const newCourse = {
      course_code: course_code.toUpperCase().trim(),
      course_name: course_name.trim(),
      instructor_name: instructor_name.trim(),
      department: department.trim(),
      semester: semester.trim(),
      is_active: true
    };

    const { data: createdCourse, error: insertError } = await supabase
      .from('courses')
      .insert([newCourse])
      .select('*')
      .single();

    if (insertError) {
      console.error('Error inserting course:', insertError);
      return res.status(500).json({ success: false, message: 'Failed to create course.' });
    }

    res.status(201).json({
      success: true,
      message: 'Course created successfully!',
      course: createdCourse
    });
  } catch (error) {
    console.error('Unhandled course create error:', error);
    res.status(500).json({ success: false, message: 'Internal server error while creating course.' });
  }
});

// ============================================================================
// DELETE /api/courses/:id
// Removes a course and its associated feedbacks (Admin only)
// ============================================================================
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting course:', error);
      return res.status(500).json({ success: false, message: 'Failed to delete course.' });
    }

    res.json({
      success: true,
      message: 'Course and related feedback deleted successfully.'
    });
  } catch (error) {
    console.error('Unhandled delete course error:', error);
    res.status(500).json({ success: false, message: 'Internal server error deleting course.' });
  }
});

module.exports = router;

