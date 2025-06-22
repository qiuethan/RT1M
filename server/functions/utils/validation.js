/**
 * Validation utilities for Firebase Functions
 */

/**
 * Validates required fields in request data
 * @param {Object} data - The data to validate
 * @param {Array} requiredFields - Array of required field names
 * @throws {Error} - If validation fails
 */
export const validateRequiredFields = (data, requiredFields) => {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid data provided");
  }

  const missingFields = requiredFields.filter((field) =>
    data[field] === undefined || data[field] === null || data[field] === "",
  );

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
  }
};

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @return {boolean} - Whether email is valid
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates numeric values
 * @param {any} value - Value to validate
 * @return {boolean} - Whether value is a valid number
 */
export const isValidNumber = (value) => {
  return !isNaN(value) && isFinite(value);
};

/**
 * Validates date format (YYYY-MM-DD)
 * @param {string} date - Date string to validate
 * @return {boolean} - Whether date is valid
 */
export const isValidDate = (date) => {
  if (!date || typeof date !== "string") return false;
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;

  const parsedDate = new Date(date);
  return parsedDate instanceof Date && !isNaN(parsedDate);
};

/**
 * Validates year (reasonable range)
 * @param {number} year - Year to validate
 * @return {boolean} - Whether year is valid
 */
export const isValidYear = (year) => {
  const currentYear = new Date().getFullYear();
  return isValidNumber(year) && year >= 1900 && year <= currentYear + 100;
};

/**
 * Sanitizes string input
 * @param {string} str - String to sanitize
 * @return {string} - Sanitized string
 */
export const sanitizeString = (str) => {
  if (typeof str !== "string") return "";
  // Basic XSS prevention
  return str.trim().replace(/[<>]/g, "");
};

/**
 * Validates goal data structure
 * @param {Object} goal - Goal object to validate
 * @throws {Error} - If validation fails
 */
export const validateGoal = (goal) => {
  validateRequiredFields(goal, ["title", "type"]);

  if (goal.type === "financial") {
    if (goal.targetAmount !== undefined && !isValidNumber(goal.targetAmount)) {
      throw new Error("Invalid target amount");
    }
    if (goal.currentAmount !== undefined &&
        !isValidNumber(goal.currentAmount)) {
      throw new Error("Invalid current amount");
    }
  }

  if (goal.targetDate && !isValidDate(goal.targetDate)) {
    throw new Error("Invalid target date format. Use YYYY-MM-DD");
  }

  const validStatuses = ["Not Started", "In Progress", "Completed"];
  if (goal.status && !validStatuses.includes(goal.status)) {
    throw new Error(
        `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
    );
  }
};

/**
 * Validates financial data
 * @param {Object} financial - Financial object to validate
 * @throws {Error} - If validation fails
 */
export const validateFinancialData = (financial) => {
  if (!financial || typeof financial !== "object") {
    throw new Error("Invalid financial data");
  }

  // Validate financial info numbers
  if (financial.financialInfo) {
    const numericFields = [
      "annualIncome",
      "annualExpenses",
      "totalAssets",
      "totalDebts",
      "currentSavings",
    ];
    numericFields.forEach((field) => {
      if (financial.financialInfo[field] !== undefined &&
          !isValidNumber(financial.financialInfo[field])) {
        throw new Error(`Invalid ${field}: must be a number`);
      }
    });
  }

  // Validate assets
  if (financial.assets && Array.isArray(financial.assets)) {
    financial.assets.forEach((asset, index) => {
      if (!asset.name || typeof asset.name !== "string") {
        throw new Error(`Asset ${index + 1}: name is required`);
      }
      if (asset.value !== undefined && !isValidNumber(asset.value)) {
        throw new Error(`Asset ${index + 1}: invalid value`);
      }
    });
  }

  // Validate debts
  if (financial.debts && Array.isArray(financial.debts)) {
    financial.debts.forEach((debt, index) => {
      if (!debt.name || typeof debt.name !== "string") {
        throw new Error(`Debt ${index + 1}: name is required`);
      }
      if (debt.balance !== undefined && !isValidNumber(debt.balance)) {
        throw new Error(`Debt ${index + 1}: invalid balance`);
      }
      if (debt.interestRate !== undefined &&
          !isValidNumber(debt.interestRate)) {
        throw new Error(`Debt ${index + 1}: invalid interest rate`);
      }
    });
  }
};

/**
 * Validates profile data
 * @param {Object} profile - Profile object to validate
 * @throws {Error} - If validation fails
 */
export const validateProfileData = (profile) => {
  if (!profile || typeof profile !== "object") {
    throw new Error("Invalid profile data");
  }

  // Validate basic info
  if (profile.basicInfo) {
    if (profile.basicInfo.email && !isValidEmail(profile.basicInfo.email)) {
      throw new Error("Invalid email format");
    }
    if (profile.basicInfo.birthday &&
        !isValidDate(profile.basicInfo.birthday)) {
      throw new Error("Invalid birthday format. Use YYYY-MM-DD");
    }
  }

  // Validate education history
  if (profile.educationHistory && Array.isArray(profile.educationHistory)) {
    profile.educationHistory.forEach((edu, index) => {
      if (edu.graduationYear && !isValidYear(edu.graduationYear)) {
        throw new Error(`Education ${index + 1}: invalid graduation year`);
      }
    });
  }

  // Validate experience
  if (profile.experience && Array.isArray(profile.experience)) {
    profile.experience.forEach((exp, index) => {
      if (exp.startYear && !isValidYear(exp.startYear)) {
        throw new Error(`Experience ${index + 1}: invalid start year`);
      }
      if (exp.endYear && !isValidYear(exp.endYear)) {
        throw new Error(`Experience ${index + 1}: invalid end year`);
      }
    });
  }

  // Validate financial goal
  if (profile.financialGoal) {
    if (profile.financialGoal.targetAmount &&
        !isValidNumber(profile.financialGoal.targetAmount)) {
      throw new Error("Invalid target amount in financial goal");
    }
    if (profile.financialGoal.targetYear &&
        !isValidYear(profile.financialGoal.targetYear)) {
      throw new Error("Invalid target year in financial goal");
    }
  }
};
