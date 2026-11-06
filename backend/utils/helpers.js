/**
 * Utility Helpers for Validation and Formatting
 */

// Email regex pattern validation
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

// Rating must be an integer between 1 and 5
const isValidRating = (rating) => {
  const num = Number(rating);
  return Number.isInteger(num) && num >= 1 && num <= 5;
};

// Calculate overall average rating from 3 sub-metrics rounded to 2 decimals
const calculateOverallRating = (teaching, content, support) => {
  const t = Number(teaching);
  const c = Number(content);
  const s = Number(support);
  const avg = (t + c + s) / 3;
  return Math.round(avg * 100) / 100;
};

// Remove sensitive fields like password_hash from user object before sending in response
const sanitizeUser = (user) => {
  if (!user) return null;
  const { password_hash, ...safeUser } = user;
  return safeUser;
};

module.exports = {
  isValidEmail,
  isValidRating,
  calculateOverallRating,
  sanitizeUser
};

