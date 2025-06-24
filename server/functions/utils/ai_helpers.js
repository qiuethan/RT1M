/**
 * AI Helper Functions for RT1M
 * Handles AI data processing, validation, and database updates
 */

import admin from "firebase-admin";
import {logger} from "firebase-functions";

/**
 * Generate unique ID
 */
const generateId = () => {
  return admin.firestore().collection("temp").doc().id;
};

/**
 * Sanitize and validate financial data
 */
const sanitizeFinancialData = (data) => {
  if (!data || typeof data !== "object") return null;
  
  const sanitized = {};
  const numericFields = ["annualIncome", "annualExpenses", "currentSavings", "totalAssets", "totalDebts"];
  
  numericFields.forEach(field => {
    if (data[field] !== undefined && data[field] !== null) {
      const value = parseFloat(data[field]);
      if (!isNaN(value) && value >= 0) {
        sanitized[field] = value;
      }
    }
  });
  
  return Object.keys(sanitized).length > 0 ? sanitized : null;
};

/**
 * Sanitize and validate assets array
 */
const sanitizeAssets = (assets) => {
  if (!Array.isArray(assets)) return null;
  
  const validTypes = ["real-estate", "stocks", "bonds", "savings", "retirement", "crypto", "business", "other"];
  
  const sanitized = assets.map(asset => {
    if (!asset || typeof asset !== "object") return null;
    
    const sanitizedAsset = {
      id: asset.id || generateId(),
      name: String(asset.name || "").trim(),
      type: validTypes.includes(asset.type) ? asset.type : "other",
      value: parseFloat(asset.value) || 0
    };
    
    if (asset.description) {
      sanitizedAsset.description = String(asset.description).trim().substring(0, 200);
    }
    
    return sanitizedAsset.name && sanitizedAsset.value >= 0 ? sanitizedAsset : null;
  }).filter(Boolean);
  
  return sanitized.length > 0 ? sanitized : null;
};

/**
 * Sanitize and validate debts array
 */
const sanitizeDebts = (debts) => {
  if (!Array.isArray(debts)) return null;
  
  const validTypes = ["mortgage", "credit-card", "student-loan", "car-loan", "personal-loan", "business-loan", "other"];
  
  const sanitized = debts.map(debt => {
    if (!debt || typeof debt !== "object") return null;
    
    const sanitizedDebt = {
      id: debt.id || generateId(),
      name: String(debt.name || "").trim(),
      type: validTypes.includes(debt.type) ? debt.type : "other",
      balance: parseFloat(debt.balance) || 0
    };
    
    if (debt.interestRate !== undefined && debt.interestRate !== null) {
      const rate = parseFloat(debt.interestRate);
      if (!isNaN(rate) && rate >= 0) {
        sanitizedDebt.interestRate = rate;
      }
    }
    
    if (debt.description) {
      sanitizedDebt.description = String(debt.description).trim().substring(0, 200);
    }
    
    return sanitizedDebt.name && sanitizedDebt.balance >= 0 ? sanitizedDebt : null;
  }).filter(Boolean);
  
  return sanitized.length > 0 ? sanitized : null;
};

/**
 * Sanitize and validate goals array
 */
const sanitizeGoals = (goals) => {
  if (!Array.isArray(goals)) return null;
  
  const validTypes = ["financial", "skill", "behavior", "lifestyle", "networking", "project"];
  const validStatuses = ["Not Started", "In Progress", "Completed"];
  
  const sanitized = goals.map(goal => {
    if (!goal || typeof goal !== "object") return null;
    
    const sanitizedGoal = {
      id: goal.id || generateId(),
      title: String(goal.title || "").trim(),
      type: validTypes.includes(goal.type) ? goal.type : "project",
      status: validStatuses.includes(goal.status) ? goal.status : "Not Started"
    };
    
    if (goal.description) {
      sanitizedGoal.description = String(goal.description).trim().substring(0, 500);
    }
    
    if (goal.targetAmount !== undefined && goal.targetAmount !== null) {
      const amount = parseFloat(goal.targetAmount);
      if (!isNaN(amount) && amount >= 0) {
        sanitizedGoal.targetAmount = amount;
      }
    }
    
    if (goal.currentAmount !== undefined && goal.currentAmount !== null) {
      const amount = parseFloat(goal.currentAmount);
      if (!isNaN(amount) && amount >= 0) {
        sanitizedGoal.currentAmount = amount;
      }
    }
    
    if (goal.targetDate) {
      const dateStr = String(goal.targetDate).trim();
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        sanitizedGoal.targetDate = dateStr;
      }
    }
    
    if (goal.progress !== undefined && goal.progress !== null) {
      const progress = parseFloat(goal.progress);
      if (!isNaN(progress) && progress >= 0 && progress <= 100) {
        sanitizedGoal.progress = progress;
      }
    }
    
    return sanitizedGoal.title ? sanitizedGoal : null;
  }).filter(Boolean);
  
  return sanitized.length > 0 ? sanitized : null;
};

/**
 * Sanitize and validate skills object
 */
const sanitizeSkills = (skills) => {
  if (!skills || typeof skills !== "object") return null;
  
  const sanitized = {};
  
  if (Array.isArray(skills.skills)) {
    const cleanSkills = skills.skills
      .map(skill => String(skill || "").trim())
      .filter(skill => skill.length > 0 && skill.length <= 50)
      .slice(0, 20); // Max 20 skills
    
    if (cleanSkills.length > 0) {
      sanitized.skills = [...new Set(cleanSkills)]; // Remove duplicates
    }
  }
  
  if (Array.isArray(skills.interests)) {
    const cleanInterests = skills.interests
      .map(interest => String(interest || "").trim())
      .filter(interest => interest.length > 0 && interest.length <= 50)
      .slice(0, 20); // Max 20 interests
    
    if (cleanInterests.length > 0) {
      sanitized.interests = [...new Set(cleanInterests)]; // Remove duplicates
    }
  }
  
  return Object.keys(sanitized).length > 0 ? sanitized : null;
};

/**
 * Calculate confidence score for extracted data
 */
const calculateConfidence = (data) => {
  let score = 0;
  let factors = 0;
  
  // Financial info confidence
  if (data.financialInfo) {
    const fields = Object.keys(data.financialInfo);
    score += Math.min(fields.length * 15, 60); // Max 60 points
    factors++;
  }
  
  // Assets confidence
  if (data.assets && data.assets.length > 0) {
    score += Math.min(data.assets.length * 10, 30); // Max 30 points
    factors++;
  }
  
  // Debts confidence
  if (data.debts && data.debts.length > 0) {
    score += Math.min(data.debts.length * 10, 30); // Max 30 points
    factors++;
  }
  
  // Goals confidence
  if (data.goals && data.goals.length > 0) {
    score += Math.min(data.goals.length * 8, 25); // Max 25 points
    factors++;
  }
  
  // Skills confidence
  if (data.skills) {
    const totalSkills = (data.skills.skills?.length || 0) + (data.skills.interests?.length || 0);
    score += Math.min(totalSkills * 2, 15); // Max 15 points
    factors++;
  }
  
  return factors > 0 ? Math.min(Math.round(score), 100) : 0;
};

/**
 * Process and sanitize AI extracted data
 */
export const processAIData = (extractedData) => {
  const processed = {};
  
  // Process each data type with proper sanitization
  if (extractedData.financialInfo) {
    const sanitized = sanitizeFinancialData(extractedData.financialInfo);
    if (sanitized) processed.financialInfo = sanitized;
  }
  
  if (extractedData.assets) {
    const sanitized = sanitizeAssets(extractedData.assets);
    if (sanitized) processed.assets = sanitized;
  }
  
  if (extractedData.debts) {
    const sanitized = sanitizeDebts(extractedData.debts);
    if (sanitized) processed.debts = sanitized;
  }
  
  if (extractedData.goals) {
    const sanitized = sanitizeGoals(extractedData.goals);
    if (sanitized) processed.goals = sanitized;
  }
  
  if (extractedData.skills) {
    const sanitized = sanitizeSkills(extractedData.skills);
    if (sanitized) processed.skills = sanitized;
  }
  
  // Calculate confidence score
  const confidence = calculateConfidence(processed);
  
  return {
    data: processed,
    confidence,
    hasData: Object.keys(processed).length > 0
  };
};

// Export all functions using ES6 syntax
export {
  sanitizeFinancialData,
  sanitizeAssets,
  sanitizeDebts,
  sanitizeGoals,
  sanitizeSkills,
  calculateConfidence,
  generateId
}; 