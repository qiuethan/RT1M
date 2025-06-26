import {onCall} from "firebase-functions/v2/https";
import {logger} from "firebase-functions";
import {defineSecret} from "firebase-functions/params";
import {validateAuth} from "../utils/auth.js";
import {ChatOpenAI} from "@langchain/openai";
import admin from "firebase-admin";

// Define the secret
export const openaiApiKey = defineSecret("OPENAI_API_KEY");

/**
 * Initialize LangChain ChatOpenAI model
 */
export const initializeChatModel = () => {
  const apiKey = openaiApiKey.value();
  
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY secret not configured. Please run: firebase functions:secrets:set OPENAI_API_KEY");
  }

  return new ChatOpenAI({
    model: "gpt-4",
    temperature: 0.7,
    openAIApiKey: apiKey,
    maxTokens: 1000,
    timeout: 60000,
  });
};

/**
 * Database-matching schemas for AI data extraction
 */

// Asset schema matching the exact database structure
export const assetSchema = {
  type: "object",
  properties: {
    id: {type: "string", description: "Unique identifier (auto-generated if not provided)"},
    name: {type: "string", description: "Asset name (e.g., 'Primary Home', 'TFSA Account')"},
    type: {
      type: "string", 
      enum: ["real-estate", "stocks", "bonds", "savings", "retirement", "crypto", "business", "other"],
      description: "Asset type from predefined list"
    },
    value: {type: "number", minimum: 0, description: "Current value in dollars"},
    description: {type: "string", description: "Optional description"}
  },
  required: ["name", "type", "value"]
};

// Debt schema matching the exact database structure
export const debtSchema = {
  type: "object",
  properties: {
    id: {type: "string", description: "Unique identifier (auto-generated if not provided)"},
    name: {type: "string", description: "Debt name (e.g., 'Mortgage', 'Credit Card')"},
    type: {
      type: "string",
      enum: ["mortgage", "credit-card", "student-loan", "car-loan", "personal-loan", "business-loan", "other"],
      description: "Debt type from predefined list"
    },
    balance: {type: "number", minimum: 0, description: "Current balance owed in dollars"},
    interestRate: {type: "number", minimum: 0, description: "Annual interest rate as percentage (optional)"},
    description: {type: "string", description: "Optional description"}
  },
  required: ["name", "type", "balance"]
};

// Goal schema matching the exact database structure
export const goalSchema = {
  type: "object",
  properties: {
    id: {type: "string", description: "Unique identifier (auto-generated if not provided)"},
    title: {type: "string", description: "Goal title"},
    type: {
      type: "string",
      enum: ["financial", "skill", "behavior", "lifestyle", "networking", "project"],
      description: "Goal category"
    },
    status: {
      type: "string",
      enum: ["Not Started", "In Progress", "Completed"],
      description: "Current status"
    },
    description: {type: "string", description: "Goal description"},
    targetAmount: {type: "number", minimum: 0, description: "Target amount for financial goals"},
    currentAmount: {type: "number", minimum: 0, description: "Current progress amount"},
    targetDate: {type: "string", format: "date", description: "Target completion date (YYYY-MM-DD)"},
    progress: {type: "number", minimum: 0, maximum: 100, description: "Progress percentage for non-financial goals"}
  },
  required: ["title", "type"]
};

// Skills schema matching the exact database structure
export const skillsSchema = {
  type: "object",
  properties: {
    skills: {
      type: "array",
      items: {type: "string"},
      description: "Array of professional skills"
    },
    interests: {
      type: "array", 
      items: {type: "string"},
      description: "Array of personal interests"
    }
  }
};

// Financial info schema matching the exact database structure
export const financialInfoSchema = {
  type: "object",
  properties: {
    annualIncome: {type: "number", minimum: 0, description: "Annual income in dollars"},
    annualExpenses: {type: "number", minimum: 0, description: "Annual expenses in dollars"},
    currentSavings: {type: "number", minimum: 0, description: "Current savings amount in dollars"},
    totalAssets: {type: "number", minimum: 0, description: "Total assets value (usually calculated automatically)"},
    totalDebts: {type: "number", minimum: 0, description: "Total debts balance (usually calculated automatically)"}
  }
};

/**
 * Complete AI response schema with proper database structure
 */
export const chatResponseSchema = {
  type: "object",
  properties: {
    message: {
      type: "string",
      description: "The assistant's friendly reply in natural language"
    },
    financialInfo: {
      oneOf: [
        financialInfoSchema,
        {type: "null"}
      ],
      description: "Financial information (income, expenses, savings) - only extract if explicitly mentioned"
    },
    assets: {
      oneOf: [
        {
          type: "array",
          items: assetSchema
        },
        {type: "null"}
      ],
      description: "Individual assets (house, car, TFSA, 401k, etc.) - only extract if specifically mentioned"
    },
    debts: {
      oneOf: [
        {
          type: "array", 
          items: debtSchema
        },
        {type: "null"}
      ],
      description: "Individual debts (mortgage, credit card, loans, etc.) - only extract if specifically mentioned"
    },
    goals: {
      oneOf: [
        {
          type: "array",
          items: goalSchema
        },
        {type: "null"}
      ],
      description: "Goals and objectives - only extract if user mentions specific targets or aspirations"
    },
    skills: {
      oneOf: [
        skillsSchema,
        {type: "null"}
      ],
      description: "Skills and interests - only extract if naturally mentioned in conversation"
    }
  },
  required: ["message"],
  additionalProperties: false
};

/**
 * Plan generation schema for structured financial plans
 */
export const planSchema = {
  type: "object",
  properties: {
    title: {type: "string"},
    description: {type: "string"},
    timeframe: {type: "string"},
    category: {
      type: "string",
      enum: ["investment", "savings", "debt", "income", "budget", "mixed"],
    },
    priority: {
      type: "string",
      enum: ["high", "medium", "low"],
    },
    steps: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: {type: "string"},
          title: {type: "string"},
          description: {type: "string"},
          order: {type: "integer"},
          timeframe: {type: "string"},
          completed: {type: "boolean", default: false},
          dueDate: {type: "string"},
          cost: {type: "number"},
          resources: {
            type: "array",
            items: {type: "string"},
          },
        },
        required: ["id", "title", "description", "order", "timeframe"],
      },
    },
    milestones: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: {type: "string"},
          title: {type: "string"},
          description: {type: "string"},
          targetAmount: {type: "number"},
          targetDate: {type: "string"},
          completed: {type: "boolean", default: false},
          completedDate: {type: "string"},
        },
        required: ["id", "title", "description", "targetDate"],
      },
    },
    estimatedCost: {type: "number"},
    expectedReturn: {type: "number"},
    riskLevel: {
      type: "string",
      enum: ["low", "medium", "high"],
    },
    prerequisites: {
      type: "array",
      items: {type: "string"},
    },
    resources: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["link", "document", "tool", "contact"],
          },
          title: {type: "string"},
          url: {type: "string"},
          description: {type: "string"},
        },
        required: ["type", "title"],
      },
    },
  },
  required: ["title", "description", "timeframe", "category", "priority", "steps", "milestones", "riskLevel"],
};

/**
 * Log AI conversation for analytics and improvement
 */
export const logAIConversation = onCall({
  secrets: [openaiApiKey]
}, async (request) => {
  const uid = validateAuth(request);
  const {
    userMessage,
    aiResponse,
    extractedData,
    confidence,
    sessionId,
    timestamp: clientTimestamp,
  } = request.data;

  try {
    const db = admin.firestore();
    const conversationRef = db.collection("users").doc(uid)
      .collection("ai_conversations").doc();

    const conversationLog = {
      userId: uid,
      sessionId: sessionId || "unknown",
      userMessage,
      aiResponse: aiResponse?.message || aiResponse,
      extractedData: extractedData || null,
      confidence: confidence || null,
      clientTimestamp: clientTimestamp || null,
      serverTimestamp: admin.firestore.FieldValue.serverTimestamp(),
    };

    await conversationRef.set(conversationLog);

    logger.info(`AI conversation logged for UID: ${uid}`, {
      sessionId,
      hasExtractedData: !!extractedData,
    });

    return {
      success: true,
      message: "Conversation logged successfully",
      logId: conversationRef.id,
    };
  } catch (error) {
    logger.error("Error logging AI conversation:", error);
    throw new Error("Failed to log AI conversation");
  }
});

/**
 * Generate session ID for conversation tracking
 */
export const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Check if user is ready for plan generation based on data completeness
 */
export const checkPlanReadiness = (userContext) => {
  if (!userContext.currentGoals || userContext.currentGoals.length === 0) {
    return false;
  }
  
  // Basic readiness check - can be made more sophisticated
  return userContext.dataCompleteness.hasBasicInfo && 
         userContext.dataCompleteness.hasFinancialInfo;
};

/**
 * Validate plan structure before saving
 */
export const validatePlanStructure = (planData) => {
  if (!planData.steps || !Array.isArray(planData.steps) || planData.steps.length === 0) {
    throw new Error("Plan must include at least one step");
  }

  if (!planData.milestones || !Array.isArray(planData.milestones)) {
    planData.milestones = [];
  }

  // Apply limits
  if (planData.steps.length > 10) {
    planData.steps = planData.steps.slice(0, 10);
    logger.warn(`Plan steps limited to 10`);
  }

  if (planData.milestones.length > 10) {
    planData.milestones = planData.milestones.slice(0, 10);
    logger.warn(`Plan milestones limited to 10`);
  }

  return planData;
}; 