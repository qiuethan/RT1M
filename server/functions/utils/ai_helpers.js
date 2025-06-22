import {logger} from "firebase-functions";

/**
 * Transform AI extracted data to match Firebase schema
 */
export function transformAIDataToFirebaseSchema(aiData) {
  const transformed = {};

  // Transform personal info
  if (aiData.personalInfo) {
    transformed.personalInfo = {};
    
    // Map common AI field names to Firebase schema
    const personalFieldMap = {
      name: "name",
      age: "age", // Note: we might want to convert this to birthday
      email: "email",
      location: "location",
      job: "occupation",
      occupation: "occupation",
      employment: "employmentStatus",
      employmentStatus: "employmentStatus",
      country: "country",
    };

    Object.entries(aiData.personalInfo).forEach(([key, value]) => {
      const mappedKey = personalFieldMap[key] || key;
      if (value !== null && value !== undefined && value !== "") {
        transformed.personalInfo[mappedKey] = value;
      }
    });
  }

  // Transform financial info
  if (aiData.financialInfo) {
    transformed.financialInfo = {};
    
    // Map AI financial fields to Firebase schema
    const financialFieldMap = {
      income: "annualIncome",
      annualIncome: "annualIncome",
      salary: "annualIncome",
      expenses: "annualExpenses",
      annualExpenses: "annualExpenses",
      spending: "annualExpenses",
      savings: "currentSavings",
      currentSavings: "currentSavings",
      assets: "totalAssets",
      totalAssets: "totalAssets",
      debts: "totalDebts",
      totalDebts: "totalDebts",
      debt: "totalDebts",
    };

    Object.entries(aiData.financialInfo).forEach(([key, value]) => {
      const mappedKey = financialFieldMap[key] || key;
      const numericValue = parseFloat(value);
      
      if (!isNaN(numericValue) && numericValue >= 0) {
        transformed.financialInfo[mappedKey] = numericValue;
      }
    });
  }

  // Transform goals
  if (aiData.goals && Array.isArray(aiData.goals)) {
    transformed.goals = aiData.goals.map(goal => transformAIGoalToFirebaseSchema(goal));
  }

  return transformed;
}

/**
 * Transform AI goal to Firebase goal schema
 */
export function transformAIGoalToFirebaseSchema(aiGoal) {
  const transformed = {
    title: aiGoal.title || "",
    type: mapAIGoalCategoryToType(aiGoal.category),
    status: mapAIGoalStatusToFirebaseStatus(aiGoal.status),
    description: aiGoal.description || "",
  };

  // Handle goal data
  if (aiGoal.data) {
    // Financial goals
    if (aiGoal.data.target || aiGoal.data.targetAmount) {
      const targetAmount = parseFloat(aiGoal.data.target || aiGoal.data.targetAmount);
      if (!isNaN(targetAmount)) {
        transformed.targetAmount = targetAmount;
      }
    }

    if (aiGoal.data.current || aiGoal.data.currentAmount) {
      const currentAmount = parseFloat(aiGoal.data.current || aiGoal.data.currentAmount);
      if (!isNaN(currentAmount)) {
        transformed.currentAmount = currentAmount;
      }
    }

    // Deadline/target date
    if (aiGoal.data.deadline || aiGoal.data.targetDate) {
      const targetDate = aiGoal.data.deadline || aiGoal.data.targetDate;
      if (isValidDate(targetDate)) {
        transformed.targetDate = targetDate;
      }
    }

    // Progress for non-financial goals
    if (aiGoal.data.progress !== undefined) {
      const progress = parseFloat(aiGoal.data.progress);
      if (!isNaN(progress) && progress >= 0 && progress <= 100) {
        transformed.progress = progress;
      }
    }
  }

  return transformed;
}

/**
 * Map AI goal categories to Firebase goal types
 */
function mapAIGoalCategoryToType(category) {
  const categoryMap = {
    financial: "financial",
    money: "financial",
    savings: "financial",
    investment: "financial",
    debt: "financial",
    skill: "skill",
    skills: "skill",
    learning: "skill",
    education: "skill",
    behavior: "behavior",
    habit: "behavior",
    lifestyle: "lifestyle",
    health: "lifestyle",
    fitness: "lifestyle",
    networking: "networking",
    network: "networking",
    social: "networking",
    project: "project",
    work: "project",
    career: "project",
  };

  return categoryMap[category?.toLowerCase()] || "financial";
}

/**
 * Map AI goal status to Firebase status
 */
function mapAIGoalStatusToFirebaseStatus(status) {
  const statusMap = {
    active: "In Progress",
    "in progress": "In Progress",
    started: "In Progress",
    ongoing: "In Progress",
    completed: "Completed",
    done: "Completed",
    finished: "Completed",
    achieved: "Completed",
    "not started": "Not Started",
    new: "Not Started",
    planned: "Not Started",
  };

  return statusMap[status?.toLowerCase()] || "Not Started";
}

/**
 * Validate if a string is a valid date
 */
function isValidDate(dateString) {
  if (!dateString) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

/**
 * Calculate confidence score for AI extracted data
 */
export function calculateDataConfidence(aiData, existingData = {}) {
  let score = 0;
  let factors = 0;

  // Personal info confidence
  if (aiData.personalInfo) {
    factors++;
    const personalFields = Object.keys(aiData.personalInfo).length;
    score += Math.min(personalFields / 5, 1) * 0.3; // Max 30% from personal info
  }

  // Financial info confidence
  if (aiData.financialInfo) {
    factors++;
    const financialFields = Object.keys(aiData.financialInfo).length;
    const hasSpecificNumbers = Object.values(aiData.financialInfo).some(val => 
      typeof val === 'number' && val > 0
    );
    
    let financialScore = Math.min(financialFields / 4, 1) * 0.4; // Max 40% from financial
    if (hasSpecificNumbers) financialScore *= 1.2; // Boost for specific numbers
    
    score += Math.min(financialScore, 0.4);
  }

  // Goals confidence
  if (aiData.goals && Array.isArray(aiData.goals)) {
    factors++;
    const goalQuality = aiData.goals.reduce((acc, goal) => {
      let goalScore = 0;
      if (goal.title) goalScore += 0.3;
      if (goal.category) goalScore += 0.2;
      if (goal.data?.target || goal.data?.targetAmount) goalScore += 0.3;
      if (goal.data?.deadline) goalScore += 0.2;
      return acc + Math.min(goalScore, 1);
    }, 0);
    
    score += Math.min(goalQuality / aiData.goals.length, 1) * 0.3; // Max 30% from goals
  }

  // Penalize if no factors found
  if (factors === 0) return 0;

  // Boost confidence if data is consistent with existing data
  if (existingData && Object.keys(existingData).length > 0) {
    const consistencyBoost = checkDataConsistency(aiData, existingData);
    score *= (1 + consistencyBoost * 0.2); // Up to 20% boost for consistency
  }

  return Math.min(Math.max(score, 0), 1); // Clamp between 0 and 1
}

/**
 * Check consistency between AI data and existing user data
 */
function checkDataConsistency(aiData, existingData) {
  let consistencyScore = 0;
  let checks = 0;

  // Check personal info consistency
  if (aiData.personalInfo && existingData.personalInfo) {
    const commonFields = Object.keys(aiData.personalInfo).filter(key => 
      existingData.personalInfo[key]
    );
    
    commonFields.forEach(field => {
      checks++;
      const aiValue = aiData.personalInfo[field]?.toString().toLowerCase();
      const existingValue = existingData.personalInfo[field]?.toString().toLowerCase();
      
      if (aiValue === existingValue || aiValue?.includes(existingValue) || existingValue?.includes(aiValue)) {
        consistencyScore++;
      }
    });
  }

  // Check financial info consistency (allow for reasonable variance)
  if (aiData.financialInfo && existingData.financialInfo) {
    Object.keys(aiData.financialInfo).forEach(field => {
      if (existingData.financialInfo[field] && existingData.financialInfo[field] > 0) {
        checks++;
        const aiValue = aiData.financialInfo[field];
        const existingValue = existingData.financialInfo[field];
        const variance = Math.abs(aiValue - existingValue) / existingValue;
        
        // Consider consistent if within 20% variance
        if (variance <= 0.2) {
          consistencyScore++;
        }
      }
    });
  }

  return checks > 0 ? consistencyScore / checks : 0;
}

/**
 * Sanitize and validate AI extracted data
 */
export function sanitizeAIData(aiData) {
  const sanitized = {};

  // Sanitize personal info
  if (aiData.personalInfo) {
    sanitized.personalInfo = {};
    
    Object.entries(aiData.personalInfo).forEach(([key, value]) => {
      if (typeof value === 'string') {
        // Remove potentially harmful content, trim whitespace
        const cleanValue = value.trim().replace(/[<>]/g, '');
        if (cleanValue.length > 0 && cleanValue.length <= 100) {
          sanitized.personalInfo[key] = cleanValue;
        }
      } else if (typeof value === 'number' && !isNaN(value)) {
        sanitized.personalInfo[key] = value;
      }
    });
  }

  // Sanitize financial info
  if (aiData.financialInfo) {
    sanitized.financialInfo = {};
    
    Object.entries(aiData.financialInfo).forEach(([key, value]) => {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 10000000) { // Reasonable upper limit
        sanitized.financialInfo[key] = numValue;
      }
    });
  }

  // Sanitize goals
  if (aiData.goals && Array.isArray(aiData.goals)) {
    sanitized.goals = aiData.goals
      .filter(goal => goal.title && typeof goal.title === 'string')
      .map(goal => ({
        title: goal.title.trim().substring(0, 200), // Limit title length
        category: goal.category?.trim().substring(0, 50),
        status: goal.status?.trim().substring(0, 50),
        description: goal.description?.trim().substring(0, 500),
        data: goal.data && typeof goal.data === 'object' ? goal.data : undefined,
      }))
      .slice(0, 10); // Limit to 10 goals max
  }

  return sanitized;
}

/**
 * Generate AI update metadata
 */
export function generateAIMetadata(source, confidence, sessionId) {
  return {
    aiGenerated: true,
    aiSource: source,
    aiConfidence: confidence,
    aiSessionId: sessionId,
    aiTimestamp: new Date().toISOString(),
    aiVersion: "1.0", // For tracking AI model versions
  };
}

/**
 * Log AI data processing for debugging and analytics
 */
export function logAIDataProcessing(uid, operation, data, result) {
  logger.info(`AI Data Processing: ${operation}`, {
    uid,
    operation,
    inputDataTypes: Object.keys(data || {}),
    resultSuccess: result?.success || false,
    timestamp: new Date().toISOString(),
  });
} 