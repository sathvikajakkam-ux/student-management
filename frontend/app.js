/**
 * Student Feedback Management System - Frontend Application
 * Vanilla JavaScript (ES6+)
 */

// ============================================================================
// 1. STATE MANAGEMENT
// ============================================================================
const state = {
  token: localStorage.getItem('sfs_token') || null,
  user: null,
  courses: [],
  myFeedbacks: [],
  activeView: 'home',
  // Active feedback draft
  feedbackRatings: {
    teaching: 0,
    content: 0,
    support: 0
  }
};

const API_BASE = '/api';

// ============================================================================
// 2. DOM ELEMENT SELECTORS
// ============================================================================
const DOM = {
  // Navigation
  brandLogo: document.getElementById('brand-logo'),
  navHome: document.getElementById('nav-home'),
  navCourses: document.getElementById('nav-courses'),
  navMyFeedback: document.getElementById('nav-my-feedback'),
  navAdmin: document.getElementById('nav-admin'),
  loggedOutActions: document.getElementById('logged-out-actions'),
  loggedInProfile: document.getElementById('logged-in-profile'),
  userAvatar: document.getElementById('user-avatar'),
  userDisplayName: document.getElementById('user-display-name'),
  userDisplayRole: document.getElementById('user-display-role'),
  btnLogout: document.getElementById('btn-logout'),
  btnOpenLogin: document.getElementById('btn-open-login'),
  btnOpenRegister: document.getElementById('btn-open-register'),

  // Views
  views: {
    home: document.getElementById('view-home'),
    courses: document.getElementById('view-courses'),
    'my-feedback': document.getElementById('view-my-feedback'),
    admin: document.getElementById('view-admin')
  },

  // Hero Actions
  heroBtnStart: document.getElementById('hero-btn-start'),
  heroBtnBrowse: document.getElementById('hero-btn-browse'),

  // Demo Banner
  btnQuickFillStudent: document.getElementById('btn-quick-fill-student'),
  btnQuickFillAdmin: document.getElementById('btn-quick-fill-admin'),

  // Courses View
  coursesGrid: document.getElementById('courses-grid'),
  courseSearchInput: document.getElementById('course-search-input'),
  courseSemesterFilter: document.getElementById('course-semester-filter'),

  // My Feedback View
  myFeedbackList: document.getElementById('my-feedback-list'),

  // Admin Dashboard
  statTotalFeedbacks: document.getElementById('stat-total-feedbacks'),
  statAvgRating: document.getElementById('stat-avg-rating'),
  statTotalCourses: document.getElementById('stat-total-courses'),
  statTotalFaculty: document.getElementById('stat-total-faculty'),
  barTeaching: document.getElementById('bar-teaching'),
  scoreTeaching: document.getElementById('score-teaching'),
  barContent: document.getElementById('bar-content'),
  scoreContent: document.getElementById('score-content'),
  barSupport: document.getElementById('bar-support'),
  scoreSupport: document.getElementById('score-support'),
  adminCoursesTableBody: document.getElementById('admin-courses-table-body'),
  adminFilterCourse: document.getElementById('admin-filter-course'),
  adminFeedbacksContainer: document.getElementById('admin-feedbacks-container'),
  btnOpenAddCourse: document.getElementById('btn-open-add-course'),
  btnRefreshAnalytics: document.getElementById('btn-refresh-analytics'),

  // Modals & Forms
  modalAuth: document.getElementById('modal-auth'),
  btnCloseAuthModal: document.getElementById('btn-close-auth-modal'),
  tabBtnLogin: document.getElementById('tab-btn-login'),
  tabBtnRegister: document.getElementById('tab-btn-register'),
  formLogin: document.getElementById('form-login'),
  formRegister: document.getElementById('form-register'),
  regRole: document.getElementById('reg-role'),
  regRollContainer: document.getElementById('reg-roll-container'),

  // Feedback Modal
  modalFeedback: document.getElementById('modal-feedback'),
  btnCloseFeedbackModal: document.getElementById('btn-close-feedback-modal'),
  btnCancelFeedback: document.getElementById('btn-cancel-feedback'),
  formSubmitFeedback: document.getElementById('form-submit-feedback'),
  fbCourseId: document.getElementById('fb-course-id'),
  fbModalCourseTitle: document.getElementById('fb-modal-course-title'),
  fbModalInstructorName: document.getElementById('fb-modal-instructor-name'),
  fbModalDepartment: document.getElementById('fb-modal-department'),
  fbCompositeScore: document.getElementById('fb-composite-score'),
  fbComments: document.getElementById('fb-comments'),
  fbAnonymous: document.getElementById('fb-anonymous'),

  // Add Course Modal
  modalAddCourse: document.getElementById('modal-add-course'),
  btnCloseCourseModal: document.getElementById('btn-close-course-modal'),
  btnCancelCourse: document.getElementById('btn-cancel-course'),
  formAddCourse: document.getElementById('form-add-course'),

  // System & Toasts
  toastContainer: document.getElementById('toast-container'),
  systemStatusText: document.getElementById('system-status-text')
};

// ============================================================================
// 3. TOAST NOTIFICATIONS HELPER
// ============================================================================
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconSvg = type === 'success' 
    ? '✓' 
    : (type === 'error' ? '✕' : 'ℹ');

  toast.innerHTML = `<strong>${iconSvg}</strong> <span>${escapeHtml(message)}</span>`;
  DOM.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// XSS Prevention Utility
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ============================================================================
// 4. API REQUEST WRAPPER
// ============================================================================
async function apiRequest(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (state.token) {
    headers['Authorization'] = `Bearer ${state.token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error on [${endpoint}]:`, error);
    throw error;
  }
}

// ============================================================================
// 5. VIEW ROUTING & NAVIGATION
// ============================================================================
function switchView(viewName) {
  state.activeView = viewName;

  // Update nav buttons
  [DOM.navHome, DOM.navCourses, DOM.navMyFeedback, DOM.navAdmin].forEach(btn => {
    if (btn) btn.classList.remove('active');
  });

  const activeBtn = document.querySelector(`.nav-btn[data-view="${viewName}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  // Switch view containers
  Object.keys(DOM.views).forEach(key => {
    const el = DOM.views[key];
    if (el) {
      if (key === viewName) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    }
  });

  // Trigger relevant view load logic
  if (viewName === 'courses') {
    loadCourses();
  } else if (viewName === 'my-feedback') {
    loadMyFeedbacks();
  } else if (viewName === 'admin') {
    loadAdminAnalytics();
  }
}

// ============================================================================
// 6. AUTHENTICATION & SESSION HANDLING
// ============================================================================
async function initSession() {
  if (!state.token) {
    renderAuthUI();
    return;
  }

  try {
    const data = await apiRequest('/auth/me');
    if (data.success && data.user) {
      state.user = data.user;
      renderAuthUI();
    } else {
      logout();
    }
  } catch (err) {
    console.warn('Session expired or invalid, signing out.');
    logout();
  }
}

function renderAuthUI() {
  if (state.user) {
    // Logged in
    DOM.loggedOutActions.classList.add('hidden');
    DOM.loggedInProfile.classList.remove('hidden');

    DOM.userDisplayName.textContent = state.user.name;
    DOM.userDisplayRole.textContent = state.user.role.toUpperCase();
    DOM.userAvatar.textContent = (state.user.name || 'U').charAt(0).toUpperCase();

    if (state.user.role === 'admin') {
      DOM.navAdmin.classList.remove('hidden');
      DOM.navMyFeedback.classList.add('hidden');
    } else {
      DOM.navMyFeedback.classList.remove('hidden');
      DOM.navAdmin.classList.add('hidden');
    }
  } else {
    // Logged out
    DOM.loggedOutActions.classList.remove('hidden');
    DOM.loggedInProfile.classList.add('hidden');
    DOM.navMyFeedback.classList.add('hidden');
    DOM.navAdmin.classList.add('hidden');
  }
}

function logout() {
  state.token = null;
  state.user = null;
  localStorage.removeItem('sfs_token');
  renderAuthUI();
  showToast('You have been logged out.');
  switchView('home');
}

// Open Auth Modal
function openAuthModal(mode = 'login') {
  DOM.modalAuth.classList.remove('hidden');
  if (mode === 'login') {
    DOM.tabBtnLogin.classList.add('active');
    DOM.tabBtnRegister.classList.remove('active');
    DOM.formLogin.classList.remove('hidden');
    DOM.formRegister.classList.add('hidden');
  } else {
    DOM.tabBtnRegister.classList.add('active');
    DOM.tabBtnLogin.classList.remove('active');
    DOM.formRegister.classList.remove('hidden');
    DOM.formLogin.classList.add('hidden');
  }
}

function closeAuthModal() {
  DOM.modalAuth.classList.add('hidden');
}

// ============================================================================
// 7. COURSES CATALOG & FEEDBACK STATUS
// ============================================================================
async function loadCourses() {
  DOM.coursesGrid.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Loading course catalogue...</p>
    </div>
  `;

  try {
    const data = await apiRequest('/courses');
    state.courses = data.courses || [];
    renderCoursesGrid();
  } catch (error) {
    DOM.coursesGrid.innerHTML = `
      <div class="empty-state">
        <p>⚠️ Failed to load courses: ${escapeHtml(error.message)}</p>
      </div>
    `;
  }
}

function renderCoursesGrid() {
  const searchTerm = DOM.courseSearchInput.value.toLowerCase().trim();
  const semesterFilter = DOM.courseSemesterFilter.value;

  const filtered = state.courses.filter(course => {
    const matchesSearch = 
      course.course_code.toLowerCase().includes(searchTerm) ||
      course.course_name.toLowerCase().includes(searchTerm) ||
      course.instructor_name.toLowerCase().includes(searchTerm);

    const matchesSemester = semesterFilter === 'all' || course.semester === semesterFilter;

    return matchesSearch && matchesSemester;
  });

  if (filtered.length === 0) {
    DOM.coursesGrid.innerHTML = `
      <div class="empty-state">
        <p>No courses match your filter criteria.</p>
      </div>
    `;
    return;
  }

  DOM.coursesGrid.innerHTML = filtered.map(course => {
    const isStudent = state.user && state.user.role === 'student';
    let actionButtonHtml = '';

    if (isStudent) {
      if (course.hasSubmittedFeedback) {
        actionButtonHtml = `<span class="submitted-badge">✓ Submitted</span>`;
      } else {
        actionButtonHtml = `<button class="btn btn-primary btn-sm btn-open-fb" data-id="${course.id}">Give Feedback ✍️</button>`;
      }
    } else if (!state.user) {
      actionButtonHtml = `<button class="btn btn-outline btn-sm btn-prompt-login">Sign in to Review</button>`;
    } else {
      actionButtonHtml = `<span class="text-muted" style="font-size:0.75rem;">Faculty View</span>`;
    }

    const ratingDisplay = course.averageRating 
      ? `<div class="rating-badge"><span>★</span> ${course.averageRating} <small>(${course.totalFeedbacks})</small></div>`
      : `<span class="rating-badge-empty">No reviews yet</span>`;

    return `
      <div class="course-card">
        <div>
          <div class="course-card-top">
            <span class="course-code-badge">${escapeHtml(course.course_code)}</span>
            <span class="course-semester-tag">${escapeHtml(course.semester)}</span>
          </div>
          <h3 class="course-name">${escapeHtml(course.course_name)}</h3>
          <p class="course-instructor">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            ${escapeHtml(course.instructor_name)}
          </p>
          <p class="course-dept">${escapeHtml(course.department)}</p>
        </div>
        <div class="course-card-footer">
          ${ratingDisplay}
          ${actionButtonHtml}
        </div>
      </div>
    `;
  }).join('');

  // Attach event handlers to dynamic cards
  document.querySelectorAll('.btn-open-fb').forEach(btn => {
    btn.addEventListener('click', () => {
      const courseId = btn.getAttribute('data-id');
      openFeedbackModal(courseId);
    });
  });

  document.querySelectorAll('.btn-prompt-login').forEach(btn => {
    btn.addEventListener('click', () => openAuthModal('login'));
  });
}

// ============================================================================
// 8. INTERACTIVE FEEDBACK SUBMISSION
// ============================================================================
function openFeedbackModal(courseId) {
  const course = state.courses.find(c => c.id === courseId);
  if (!course) return;

  DOM.fbCourseId.value = course.id;
  DOM.fbModalCourseTitle.textContent = `${course.course_code} - ${course.course_name}`;
  DOM.fbModalInstructorName.textContent = course.instructor_name;
  DOM.fbModalDepartment.textContent = course.department;

  // Reset ratings
  state.feedbackRatings = { teaching: 0, content: 0, support: 0 };
  updateStarUI('teaching', 0);
  updateStarUI('content', 0);
  updateStarUI('support', 0);
  DOM.fbCompositeScore.textContent = '0.00 / 5.00';
  DOM.fbComments.value = '';
  DOM.fbAnonymous.checked = true;

  DOM.modalFeedback.classList.remove('hidden');
}

function closeFeedbackModal() {
  DOM.modalFeedback.classList.add('hidden');
}

function updateStarUI(metric, rating) {
  state.feedbackRatings[metric] = rating;

  const container = document.querySelector(`.star-rating[data-metric="${metric}"]`);
  if (!container) return;

  const stars = container.querySelectorAll('.star');
  stars.forEach(star => {
    const val = parseInt(star.getAttribute('data-val'), 10);
    if (val <= rating) {
      star.classList.add('selected');
    } else {
      star.classList.remove('selected');
    }
  });

  const badge = document.getElementById(`val-${metric}`);
  if (badge) {
    badge.textContent = rating > 0 ? `${rating} / 5 ★` : 'Select';
  }

  // Calculate live composite score
  const { teaching, content, support } = state.feedbackRatings;
  if (teaching > 0 && content > 0 && support > 0) {
    const composite = ((teaching + content + support) / 3).toFixed(2);
    DOM.fbCompositeScore.textContent = `${composite} / 5.00 ★`;
  } else {
    DOM.fbCompositeScore.textContent = 'Incomplete';
  }
}

// Star rating click and hover events
function setupStarRatingListeners() {
  document.querySelectorAll('.star-rating').forEach(group => {
    const metric = group.getAttribute('data-metric');
    const stars = group.querySelectorAll('.star');

    stars.forEach(star => {
      // Hover effect
      star.addEventListener('mouseenter', () => {
        const hoverVal = parseInt(star.getAttribute('data-val'), 10);
        stars.forEach(s => {
          if (parseInt(s.getAttribute('data-val'), 10) <= hoverVal) {
            s.classList.add('hovered');
          } else {
            s.classList.remove('hovered');
          }
        });
      });

      // Clear hover on mouseleave
      group.addEventListener('mouseleave', () => {
        stars.forEach(s => s.classList.remove('hovered'));
      });

      // Click to select
      star.addEventListener('click', () => {
        const selectedVal = parseInt(star.getAttribute('data-val'), 10);
        updateStarUI(metric, selectedVal);
      });
    });
  });
}

// ============================================================================
// 9. STUDENT: MY SUBMISSIONS HISTORY
// ============================================================================
async function loadMyFeedbacks() {
  DOM.myFeedbackList.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Loading your past submissions...</p>
    </div>
  `;

  try {
    const data = await apiRequest('/feedback/my-submissions');
    state.myFeedbacks = data.feedbacks || [];
    renderMyFeedbacks();
  } catch (err) {
    DOM.myFeedbackList.innerHTML = `
      <div class="empty-state">
        <p>⚠️ Failed to load submissions: ${escapeHtml(err.message)}</p>
      </div>
    `;
  }
}

function renderMyFeedbacks() {
  if (state.myFeedbacks.length === 0) {
    DOM.myFeedbackList.innerHTML = `
      <div class="empty-state">
        <p>You haven't submitted feedback for any courses yet.</p>
        <button class="btn btn-primary btn-sm mt-3" onclick="switchView('courses')">Browse Courses</button>
      </div>
    `;
    return;
  }

  DOM.myFeedbackList.innerHTML = state.myFeedbacks.map(item => {
    const course = item.courses || {};
    const dateFormatted = new Date(item.created_at).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });

    return `
      <div class="history-card">
        <div class="history-top">
          <div>
            <h3 class="history-course-title">${escapeHtml(course.course_code)} - ${escapeHtml(course.course_name)}</h3>
            <p class="history-instructor">Instructor: ${escapeHtml(course.instructor_name)} &bull; ${escapeHtml(course.department)}</p>
          </div>
          <span class="rating-badge">★ ${item.overall_rating} / 5</span>
        </div>

        <div class="history-ratings">
          <div class="hist-metric">Teaching: <strong>${item.teaching_rating}/5 ★</strong></div>
          <div class="hist-metric">Syllabus & Content: <strong>${item.content_rating}/5 ★</strong></div>
          <div class="hist-metric">Lab & Practical: <strong>${item.support_rating}/5 ★</strong></div>
          <div class="hist-metric">Mode: <strong>${item.is_anonymous ? 'Anonymous' : 'Identified'}</strong></div>
          <div class="hist-metric">Submitted on: <strong>${dateFormatted}</strong></div>
        </div>

        ${item.comments ? `
          <div class="fb-text">
            <strong>My Remarks:</strong> "${escapeHtml(item.comments)}"
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

// ============================================================================
// 10. ADMIN DASHBOARD & ANALYTICS
// ============================================================================
async function loadAdminAnalytics() {
  try {
    const statsData = await apiRequest('/feedback/stats');
    const allFeedbacksData = await apiRequest('/feedback/all');

    renderAdminKPIs(statsData.stats);
    renderAdminCourseTable(statsData.stats.courseRankings);
    populateAdminCourseFilter(statsData.stats.courseRankings);
    renderAdminFeedbacks(allFeedbacksData.feedbacks);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderAdminKPIs(stats) {
  if (!stats) return;

  DOM.statTotalFeedbacks.textContent = stats.totalFeedbacks;
  DOM.statAvgRating.innerHTML = `${stats.averageRating} <span class="stat-star">★</span>`;
  DOM.statTotalCourses.textContent = stats.totalCourses;
  DOM.statTotalFaculty.textContent = stats.totalInstructors;

  // Dimension Bars
  const tPercent = ((stats.averages.teaching / 5) * 100).toFixed(0);
  const cPercent = ((stats.averages.content / 5) * 100).toFixed(0);
  const sPercent = ((stats.averages.support / 5) * 100).toFixed(0);

  DOM.barTeaching.style.width = `${tPercent}%`;
  DOM.scoreTeaching.textContent = `${stats.averages.teaching} / 5.0`;

  DOM.barContent.style.width = `${cPercent}%`;
  DOM.scoreContent.textContent = `${stats.averages.content} / 5.0`;

  DOM.barSupport.style.width = `${sPercent}%`;
  DOM.scoreSupport.textContent = `${stats.averages.support} / 5.0`;
}

function renderAdminCourseTable(rankings) {
  if (!rankings || rankings.length === 0) {
    DOM.adminCoursesTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No courses registered.</td></tr>`;
    return;
  }

  DOM.adminCoursesTableBody.innerHTML = rankings.map(item => {
    const ratingDisplay = item.avgOverall 
      ? `<span class="rating-badge">★ ${item.avgOverall}</span>` 
      : `<span class="text-muted">N/A</span>`;

    return `
      <tr>
        <td><strong>${escapeHtml(item.course_code)}</strong></td>
        <td>${escapeHtml(item.course_name)}</td>
        <td>${escapeHtml(item.instructor_name)}</td>
        <td>${escapeHtml(item.department)}</td>
        <td>${item.feedbackCount}</td>
        <td>${ratingDisplay}</td>
        <td>
          <button class="btn btn-ghost btn-sm btn-delete-course" data-id="${item.course_id}" title="Delete Course">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // Delete course event
  document.querySelectorAll('.btn-delete-course').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (confirm('Are you sure you want to remove this course and all associated feedback?')) {
        try {
          await apiRequest(`/courses/${id}`, { method: 'DELETE' });
          showToast('Course deleted successfully.');
          loadAdminAnalytics();
        } catch (err) {
          showToast(err.message, 'error');
        }
      }
    });
  });
}

function populateAdminCourseFilter(rankings) {
  DOM.adminFilterCourse.innerHTML = `<option value="">All Courses (${rankings.length})</option>` +
    rankings.map(r => `<option value="${r.course_id}">${r.course_code} - ${r.course_name}</option>`).join('');
}

function renderAdminFeedbacks(feedbacks) {
  if (!feedbacks || feedbacks.length === 0) {
    DOM.adminFeedbacksContainer.innerHTML = `<p class="text-muted text-center py-4">No student feedback entries found.</p>`;
    return;
  }

  DOM.adminFeedbacksContainer.innerHTML = feedbacks.map(fb => {
    const dateFormatted = new Date(fb.created_at).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });

    const studentTitle = fb.is_anonymous 
      ? `<span class="fb-anon-tag">🔒 Anonymous Submission</span>`
      : `<span class="fb-student-info">${escapeHtml(fb.users?.name || 'Student')} (${escapeHtml(fb.users?.roll_number || 'N/A')})</span>`;

    return `
      <div class="feedback-item-card">
        <div class="fb-header">
          ${studentTitle}
          <div class="rating-badge">★ ${fb.overall_rating}</div>
        </div>
        <div class="fb-stars-row">
          <span><strong>Course:</strong> ${escapeHtml(fb.courses?.course_code)} - ${escapeHtml(fb.courses?.course_name)}</span>
          <span>&bull;</span>
          <span><strong>Instructor:</strong> ${escapeHtml(fb.courses?.instructor_name)}</span>
          <span>&bull;</span>
          <span><strong>Teaching:</strong> ${fb.teaching_rating}/5</span>
          <span>&bull;</span>
          <span><strong>Content:</strong> ${fb.content_rating}/5</span>
          <span>&bull;</span>
          <span><strong>Support:</strong> ${fb.support_rating}/5</span>
          <span>&bull;</span>
          <span>${dateFormatted}</span>
        </div>
        ${fb.comments ? `<div class="fb-text">"${escapeHtml(fb.comments)}"</div>` : '<div class="text-muted" style="font-size:0.8rem; font-style:italic;">No qualitative comments provided.</div>'}
      </div>
    `;
  }).join('');
}

// ============================================================================
// 11. EVENT LISTENERS
// ============================================================================
function setupEventListeners() {
  // Navigation
  DOM.brandLogo.addEventListener('click', () => switchView('home'));
  DOM.navHome.addEventListener('click', () => switchView('home'));
  DOM.navCourses.addEventListener('click', () => switchView('courses'));
  DOM.navMyFeedback.addEventListener('click', () => switchView('my-feedback'));
  DOM.navAdmin.addEventListener('click', () => switchView('admin'));

  // Hero Actions
  DOM.heroBtnStart.addEventListener('click', () => {
    if (!state.user) {
      openAuthModal('login');
    } else {
      switchView('courses');
    }
  });
  DOM.heroBtnBrowse.addEventListener('click', () => switchView('courses'));

  // Auth Modal Triggers
  DOM.btnOpenLogin.addEventListener('click', () => openAuthModal('login'));
  DOM.btnOpenRegister.addEventListener('click', () => openAuthModal('register'));
  DOM.btnCloseAuthModal.addEventListener('click', closeAuthModal);
  DOM.modalAuth.addEventListener('click', (e) => {
    if (e.target === DOM.modalAuth) closeAuthModal();
  });

  // Auth Tabs
  DOM.tabBtnLogin.addEventListener('click', () => openAuthModal('login'));
  DOM.tabBtnRegister.addEventListener('click', () => openAuthModal('register'));

  // Role toggle in registration form
  DOM.regRole.addEventListener('change', (e) => {
    if (e.target.value === 'admin') {
      DOM.regRollContainer.classList.add('hidden');
    } else {
      DOM.regRollContainer.classList.remove('hidden');
    }
  });

  // Quick Demo Fill
  DOM.btnQuickFillStudent.addEventListener('click', () => {
    openAuthModal('login');
    document.getElementById('login-email').value = 'rahul.sharma@college.edu';
    document.getElementById('login-password').value = 'Password123';
  });

  DOM.btnQuickFillAdmin.addEventListener('click', () => {
    openAuthModal('login');
    document.getElementById('login-email').value = 'admin@college.edu';
    document.getElementById('login-password').value = 'Password123';
  });

  // Login Form Submission
  DOM.formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      state.token = data.token;
      state.user = data.user;
      localStorage.setItem('sfs_token', data.token);

      closeAuthModal();
      renderAuthUI();
      showToast(`Welcome back, ${state.user.name}!`);

      if (state.user.role === 'admin') {
        switchView('admin');
      } else {
        switchView('courses');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Register Form Submission
  DOM.formRegister.addEventListener('submit', async (e) => {
    e.preventDefault();
    const role = DOM.regRole.value;
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const roll_number = document.getElementById('reg-roll').value.trim();
    const department = document.getElementById('reg-dept').value;
    const password = document.getElementById('reg-password').value;

    try {
      const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ role, name, email, roll_number, department, password })
      });

      state.token = data.token;
      state.user = data.user;
      localStorage.setItem('sfs_token', data.token);

      closeAuthModal();
      renderAuthUI();
      showToast('Registration successful! Welcome to EduFeedback.');

      if (state.user.role === 'admin') {
        switchView('admin');
      } else {
        switchView('courses');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Logout
  DOM.btnLogout.addEventListener('click', logout);

  // Search & Filter
  DOM.courseSearchInput.addEventListener('input', renderCoursesGrid);
  DOM.courseSemesterFilter.addEventListener('change', renderCoursesGrid);

  // Feedback Modal Close
  DOM.btnCloseFeedbackModal.addEventListener('click', closeFeedbackModal);
  DOM.btnCancelFeedback.addEventListener('click', closeFeedbackModal);
  DOM.modalFeedback.addEventListener('click', (e) => {
    if (e.target === DOM.modalFeedback) closeFeedbackModal();
  });

  // Feedback Submission Form
  DOM.formSubmitFeedback.addEventListener('submit', async (e) => {
    e.preventDefault();
    const course_id = DOM.fbCourseId.value;
    const { teaching, content, support } = state.feedbackRatings;

    if (teaching === 0 || content === 0 || support === 0) {
      showToast('Please rate all three criteria (Teaching, Content, and Support).', 'warning');
      return;
    }

    const payload = {
      course_id,
      teaching_rating: teaching,
      content_rating: content,
      support_rating: support,
      comments: DOM.fbComments.value.trim(),
      is_anonymous: DOM.fbAnonymous.checked
    };

    try {
      await apiRequest('/feedback', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      closeFeedbackModal();
      showToast('Feedback submitted successfully! Thank you.', 'success');
      loadCourses();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Admin Add Course Modal
  DOM.btnOpenAddCourse.addEventListener('click', () => {
    DOM.modalAddCourse.classList.remove('hidden');
  });

  DOM.btnCloseCourseModal.addEventListener('click', () => {
    DOM.modalAddCourse.classList.add('hidden');
  });
  DOM.btnCancelCourse.addEventListener('click', () => {
    DOM.modalAddCourse.classList.add('hidden');
  });

  // Admin Add Course Form
  DOM.formAddCourse.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      course_code: document.getElementById('course-code-input').value.trim(),
      course_name: document.getElementById('course-name-input').value.trim(),
      instructor_name: document.getElementById('course-instructor-input').value.trim(),
      department: document.getElementById('course-dept-input').value,
      semester: document.getElementById('course-semester-input').value
    };

    try {
      await apiRequest('/courses', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      DOM.modalAddCourse.classList.add('hidden');
      DOM.formAddCourse.reset();
      showToast('Course registered successfully!');
      loadAdminAnalytics();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Admin Refresh Analytics
  DOM.btnRefreshAnalytics.addEventListener('click', () => {
    loadAdminAnalytics();
    showToast('Analytics refreshed.');
  });

  // Admin Course Filter on feedbacks
  DOM.adminFilterCourse.addEventListener('change', async (e) => {
    const courseId = e.target.value;
    const url = courseId ? `/feedback/all?course_id=${courseId}` : '/feedback/all';
    try {
      const data = await apiRequest(url);
      renderAdminFeedbacks(data.feedbacks);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

// ============================================================================
// 12. HEALTH CHECK & APP STARTUP
// ============================================================================
async function checkSystemHealth() {
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    if (data.database && data.database.includes('disconnected')) {
      DOM.systemStatusText.textContent = 'Database: Connect Supabase Credentials';
      DOM.systemStatusText.style.color = '#f59e0b';
    } else {
      DOM.systemStatusText.textContent = 'System Status: Operational';
    }
  } catch (err) {
    DOM.systemStatusText.textContent = 'Backend: Offline';
  }
}

// App Initialization
document.addEventListener('DOMContentLoaded', () => {
  setupStarRatingListeners();
  setupEventListeners();
  initSession();
  checkSystemHealth();
});

