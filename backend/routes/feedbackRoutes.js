/**
 * Feedback Routes
 * Handles submission of student feedback and retrieval of analytics for administrators.
 */

const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const { isValidRating, calculateOverallRating } = require('../utils/helpers');
const { authenticateToken, requireStudent, requireAdmin } = require('../middleware/authMiddleware');

// ============================================================================
// POST /api/feedback
// Submit course feedback (Student only)
// ============================================================================
router.post('/', authenticateToken, requireStudent, async (req, res) => {
  try {
    const { course_id, teaching_rating, content_rating, support_rating, comments, is_anonymous } = req.body;
    const student_id = req.user.id;

    // 1. Validation
    if (!course_id) {
      return res.status(400).json({ success: false, message: 'Please select a valid course.' });
    }

    if (!isValidRating(teaching_rating) || !isValidRating(content_rating) || !isValidRating(support_rating)) {
      return res.status(400).json({
        success: false,
        message: 'All ratings (Teaching, Content, and Support) must be integers between 1 and 5 stars.'
      });
    }

    // 2. Verify that course exists
    const { data: course, error: courseCheckErr } = await supabase
      .from('courses')
      .select('id, course_name')
      .eq('id', course_id)
      .maybeSingle();

    if (courseCheckErr || !course) {
      return res.status(404).json({ success: false, message: 'Selected course does not exist.' });
    }

    // 3. Check if feedback has already been submitted for this course by this student
    const { data: existingFeedback } = await supabase
      .from('feedbacks')
      .select('id')
      .eq('course_id', course_id)
      .eq('student_id', student_id)
      .maybeSingle();

    if (existingFeedback) {
      return res.status(409).json({
        success: false,
        message: 'You have already submitted feedback for this course. Duplicate submissions are not allowed.'
      });
    }

    // 4. Calculate overall composite rating
    const overall_rating = calculateOverallRating(teaching_rating, content_rating, support_rating);

    // 5. Insert feedback
    const feedbackPayload = {
      course_id,
      student_id,
      teaching_rating: Number(teaching_rating),
      content_rating: Number(content_rating),
      support_rating: Number(support_rating),
      overall_rating,
      comments: comments && comments.trim() ? comments.trim() : null,
      is_anonymous: Boolean(is_anonymous)
    };

    const { data: insertedFeedback, error: insertError } = await supabase
      .from('feedbacks')
      .insert([feedbackPayload])
      .select('*')
      .single();

    if (insertError) {
      console.error('Error inserting feedback:', insertError);
      return res.status(500).json({ success: false, message: 'Failed to record feedback. Please try again.' });
    }

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully! Thank you for your evaluation.',
      feedback: insertedFeedback
    });
  } catch (error) {
    console.error('Unhandled feedback submission error:', error);
    res.status(500).json({ success: false, message: 'Internal server error submitting feedback.' });
  }
});

// ============================================================================
// GET /api/feedback/my-submissions
// Retrieves all feedbacks submitted by the logged-in student
// ============================================================================
router.get('/my-submissions', authenticateToken, requireStudent, async (req, res) => {
  try {
    const student_id = req.user.id;

    const { data: feedbacks, error } = await supabase
      .from('feedbacks')
      .select(`
        id,
        teaching_rating,
        content_rating,
        support_rating,
        overall_rating,
        comments,
        is_anonymous,
        created_at,
        courses (
          id,
          course_code,
          course_name,
          instructor_name,
          department,
          semester
        )
      `)
      .eq('student_id', student_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching student submissions:', error);
      return res.status(500).json({ success: false, message: 'Failed to retrieve your feedback history.' });
    }

    res.json({
      success: true,
      feedbacks: feedbacks || []
    });
  } catch (error) {
    console.error('Unhandled my-submissions error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving submissions.' });
  }
});

// ============================================================================
// GET /api/feedback/stats
// High-level dashboard metrics and analytics (Admin only)
// ============================================================================
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // 1. Fetch courses
    const { data: courses, error: courseErr } = await supabase
      .from('courses')
      .select('*');

    // 2. Fetch all feedbacks
    const { data: feedbacks, error: fbErr } = await supabase
      .from('feedbacks')
      .select('id, course_id, teaching_rating, content_rating, support_rating, overall_rating');

    if (courseErr || fbErr) {
      return res.status(500).json({ success: false, message: 'Failed to aggregate statistics.' });
    }

    const totalCourses = courses ? courses.length : 0;
    const totalFeedbacks = feedbacks ? feedbacks.length : 0;

    let sumOverall = 0;
    let sumTeaching = 0;
    let sumContent = 0;
    let sumSupport = 0;

    // Aggregate course-level metrics
    const courseStatsMap = {};
    (courses || []).forEach(c => {
      courseStatsMap[c.id] = {
        course: c,
        count: 0,
        sumOverall: 0,
        sumTeaching: 0,
        sumContent: 0,
        sumSupport: 0
      };
    });

    (feedbacks || []).forEach(fb => {
      const o = parseFloat(fb.overall_rating || 0);
      const t = Number(fb.teaching_rating || 0);
      const c = Number(fb.content_rating || 0);
      const s = Number(fb.support_rating || 0);

      sumOverall += o;
      sumTeaching += t;
      sumContent += c;
      sumSupport += s;

      if (courseStatsMap[fb.course_id]) {
        courseStatsMap[fb.course_id].count += 1;
        courseStatsMap[fb.course_id].sumOverall += o;
        courseStatsMap[fb.course_id].sumTeaching += t;
        courseStatsMap[fb.course_id].sumContent += c;
        courseStatsMap[fb.course_id].sumSupport += s;
      }
    });

    const averageRating = totalFeedbacks > 0 ? (sumOverall / totalFeedbacks).toFixed(2) : 0;
    const averageTeaching = totalFeedbacks > 0 ? (sumTeaching / totalFeedbacks).toFixed(2) : 0;
    const averageContent = totalFeedbacks > 0 ? (sumContent / totalFeedbacks).toFixed(2) : 0;
    const averageSupport = totalFeedbacks > 0 ? (sumSupport / totalFeedbacks).toFixed(2) : 0;

    // Extract unique instructors count
    const uniqueInstructors = new Set((courses || []).map(c => c.instructor_name)).size;

    // Prepare course performance ranking
    const courseRankings = Object.values(courseStatsMap).map(item => ({
      course_id: item.course.id,
      course_code: item.course.course_code,
      course_name: item.course.course_name,
      instructor_name: item.course.instructor_name,
      department: item.course.department,
      feedbackCount: item.count,
      avgOverall: item.count > 0 ? Number((item.sumOverall / item.count).toFixed(2)) : null,
      avgTeaching: item.count > 0 ? Number((item.sumTeaching / item.count).toFixed(2)) : null,
      avgContent: item.count > 0 ? Number((item.sumContent / item.count).toFixed(2)) : null,
      avgSupport: item.count > 0 ? Number((item.sumSupport / item.count).toFixed(2)) : null
    }));

    res.json({
      success: true,
      stats: {
        totalFeedbacks,
        totalCourses,
        totalInstructors: uniqueInstructors,
        averageRating: Number(averageRating),
        averages: {
          teaching: Number(averageTeaching),
          content: Number(averageContent),
          support: Number(averageSupport)
        },
        courseRankings
      }
    });
  } catch (error) {
    console.error('Unhandled stats error:', error);
    res.status(500).json({ success: false, message: 'Internal server error computing stats.' });
  }
});

// ============================================================================
// GET /api/feedback/all
// Detailed listing of all feedbacks (Admin only)
// Preserves student anonymity when is_anonymous is true.
// ============================================================================
router.get('/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { course_id } = req.query;

    let query = supabase
      .from('feedbacks')
      .select(`
        id,
        course_id,
        student_id,
        teaching_rating,
        content_rating,
        support_rating,
        overall_rating,
        comments,
        is_anonymous,
        created_at,
        courses (
          id,
          course_code,
          course_name,
          instructor_name,
          department,
          semester
        ),
        users (
          id,
          name,
          roll_number,
          department
        )
      `)
      .order('created_at', { ascending: false });

    if (course_id) {
      query = query.eq('course_id', course_id);
    }

    const { data: feedbacks, error } = await query;

    if (error) {
      console.error('Error fetching all feedbacks:', error);
      return res.status(500).json({ success: false, message: 'Failed to retrieve feedback records.' });
    }

    // Anonymize records where is_anonymous is true to protect student privacy
    const sanitizedFeedbacks = (feedbacks || []).map(item => {
      if (item.is_anonymous) {
        return {
          ...item,
          student_id: null,
          users: {
            id: null,
            name: 'Anonymous Student',
            roll_number: 'Hidden',
            department: item.users ? item.users.department : 'Confidential'
          }
        };
      }
      return item;
    });

    res.json({
      success: true,
      feedbacks: sanitizedFeedbacks
    });
  } catch (error) {
    console.error('Unhandled all feedbacks fetch error:', error);
    res.status(500).json({ success: false, message: 'Internal server error fetching feedback records.' });
  }
});

// ============================================================================
// DELETE /api/feedback/:id
// Admin can delete inappropriate or flagged feedback
// ============================================================================
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('feedbacks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting feedback:', error);
      return res.status(500).json({ success: false, message: 'Failed to delete feedback entry.' });
    }

    res.json({ success: true, message: 'Feedback entry deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting feedback.' });
  }
});

module.exports = router;

