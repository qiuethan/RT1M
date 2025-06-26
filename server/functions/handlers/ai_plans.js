import {onCall} from "firebase-functions/v2/https";
import {logger} from "firebase-functions";
import {validateAuth} from "../utils/auth.js";
import {ChatPromptTemplate} from "@langchain/core/prompts";
import {
  initializeChatModel,
  openaiApiKey,
  validatePlanStructure
} from "./ai_utils.js";
// We'll create a helper function instead of importing the Firebase function
import {
  getUserProfileRef,
  getUserFinancialsRef,
  getUserGoalsRef,
  getUserSkillsRef,
  getDocument,
} from "../utils/firestore.js";
import admin from "firebase-admin";

/**
 * Helper function to get user context
 */
const getUserContext = async (uid) => {
  try {
    // Get all user data for AI context
    const [profileData, financialData, goalsData, skillsData] = await Promise.all([
      getDocument(getUserProfileRef(uid), "profile"),
      getDocument(getUserFinancialsRef(uid), "financials"),
      getDocument(getUserGoalsRef(uid), "goals"),
      getDocument(getUserSkillsRef(uid), "skills"),
    ]);

    // Build context object with ALL relevant information
    const context = {
      // Personal Information
      personalInfo: profileData?.basicInfo || {},
      educationHistory: profileData?.educationHistory || [],
      experience: profileData?.experience || [],
      
      // Financial Goal & Information
      financialGoal: profileData?.financialGoal || {},
      financialInfo: financialData?.financialInfo || {},
      
      // Assets and Debts (the detailed breakdown)
      assets: financialData?.assets || [],
      debts: financialData?.debts || [],
      
      // Goals and Skills
      currentGoals: goalsData?.intermediateGoals || [],
      skills: skillsData?.skillsAndInterests?.skills || [],
      interests: skillsData?.skillsAndInterests?.interests || [],
      
      // Metadata for AI decision making
      dataCompleteness: {
        hasBasicInfo: !!(profileData?.basicInfo?.name),
        hasFinancialInfo: !!(financialData?.financialInfo?.annualIncome),
        hasAssets: (financialData?.assets?.length || 0) > 0,
        hasDebts: (financialData?.debts?.length || 0) > 0,
        hasGoals: (goalsData?.intermediateGoals?.length || 0) > 0,
        hasSkills: (skillsData?.skillsAndInterests?.skills?.length || 0) > 0,
        hasEducation: (profileData?.educationHistory?.length || 0) > 0,
        hasExperience: (profileData?.experience?.length || 0) > 0,
      },
    };

    return {success: true, data: context};
  } catch (error) {
    logger.error("Error getting user context:", error);
    return {success: false, data: {}};
  }
};

/**
 * Generate detailed financial plan using LangChain
 */
export const generateFinancialPlan = onCall(
  {
    secrets: [openaiApiKey]
  },
  async (request) => {
    const uid = validateAuth(request);
    const {goalId, goalData} = request.data;

    if (!goalId && !goalData) {
      throw new Error("Either goalId or goalData is required");
    }

    try {
      logger.info(`Plan generation requested for UID: ${uid}`, {goalId});

      // Get user context
      let userContext = {};
      const contextResult = await getUserContext(uid);
      userContext = contextResult.data || {};

      // Get specific goal data if goalId provided
      let targetGoal = goalData;
      if (goalId && !goalData) {
        const goal = userContext.currentGoals?.find(g => g.id === goalId);
        if (!goal) {
          throw new Error("Goal not found");
        }
        targetGoal = goal;
      }

      if (!targetGoal) {
        throw new Error("Goal data is required for plan generation");
      }

      // Initialize LangChain components
      const llm = initializeChatModel();
      
      // Create plan generation prompt
      const planPrompt = ChatPromptTemplate.fromTemplate(`
You are a financial planning expert. Generate a detailed, realistic financial plan based on the user's profile and goal.

User Profile:
{userProfile}

Goal to Plan For:
{goalData}

Generate a comprehensive financial plan as a JSON object that follows this structure:
- title: Clear, actionable title for the plan
- description: Detailed explanation of the plan
- timeframe: How long the plan will take
- category: One of "investment", "savings", "debt", "income", "budget", "mixed"
- priority: "high", "medium", or "low"
- steps: Array of specific action steps with id, title, description, order, timeframe
- milestones: Array of measurable checkpoints with target dates and amounts
- estimatedCost: Total estimated cost (if applicable)
- expectedReturn: Expected financial return (if applicable)
- riskLevel: "low", "medium", or "high"
- prerequisites: Array of things needed before starting
- resources: Array of helpful resources (links, tools, etc.)

Make the plan specific, actionable, and realistic based on the user's current financial situation.
Limit to maximum 10 steps and 10 milestones.

Respond with ONLY the JSON object.
`);

      // Create the chain
      const chain = planPrompt.pipe(llm);

      // Generate the plan
      const response = await chain.invoke({
        userProfile: JSON.stringify(userContext, null, 2),
        goalData: JSON.stringify(targetGoal, null, 2),
      });

      // Parse the response
      let planData;
      try {
        planData = JSON.parse(response.content);
      } catch (parseError) {
        logger.error(`Failed to parse plan response for UID: ${uid}`, {
          error: parseError.message,
          rawResponse: response.content,
        });
        throw new Error("Failed to generate valid plan structure");
      }

      // Validate and clean plan structure
      planData = validatePlanStructure(planData);

      // Add metadata
      const timestamp = admin.firestore.FieldValue.serverTimestamp();
      const enrichedPlan = {
        ...planData,
        id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        goalId: goalId || targetGoal.id,
        userId: uid,
        createdAt: timestamp,
        updatedAt: timestamp,
        status: "active",
      };

      // Save the plan to Firestore
      const db = admin.firestore();
      const planRef = db.collection("users").doc(uid).collection("plans").doc(enrichedPlan.id);
      await planRef.set(enrichedPlan);

      logger.info(`Plan generated and saved for UID: ${uid}`, {
        planId: enrichedPlan.id,
        stepsCount: planData.steps.length,
        milestonesCount: planData.milestones.length,
      });

      return {
        success: true,
        message: "Financial plan generated successfully",
        plan: enrichedPlan,
      };
    } catch (error) {
      logger.error("Error generating financial plan:", error);
      throw new Error("Failed to generate financial plan");
    }
  }
);

/**
 * Get user's financial plans
 */
export const getUserPlans = onCall(async (request) => {
  const uid = validateAuth(request);
  const {limit = 10, status = "active"} = request.data;

  try {
    const db = admin.firestore();
    let query = db.collection("users").doc(uid).collection("plans");

    if (status) {
      query = query.where("status", "==", status);
    }

    query = query.orderBy("createdAt", "desc").limit(limit);

    const snapshot = await query.get();
    const plans = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    logger.info(`Retrieved ${plans.length} plans for UID: ${uid}`);

    return {
      success: true,
      plans,
    };
  } catch (error) {
    logger.error("Error getting user plans:", error);
    throw new Error("Failed to get user plans");
  }
});

/**
 * Update plan step completion
 */
export const updatePlanStep = onCall(async (request) => {
  const uid = validateAuth(request);
  const {planId, stepId, completed, notes} = request.data;

  if (!planId || !stepId) {
    throw new Error("Plan ID and step ID are required");
  }

  try {
    const db = admin.firestore();
    const planRef = db.collection("users").doc(uid).collection("plans").doc(planId);
    
    const planDoc = await planRef.get();
    if (!planDoc.exists) {
      throw new Error("Plan not found");
    }

    const planData = planDoc.data();
    const steps = planData.steps || [];
    
    // Find and update the step
    const stepIndex = steps.findIndex(step => step.id === stepId);
    if (stepIndex === -1) {
      throw new Error("Step not found");
    }

    steps[stepIndex] = {
      ...steps[stepIndex],
      completed: !!completed,
      completedAt: completed ? admin.firestore.FieldValue.serverTimestamp() : null,
      notes: notes || steps[stepIndex].notes || null,
    };

    // Update the plan
    await planRef.update({
      steps,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info(`Plan step updated for UID: ${uid}`, {
      planId,
      stepId,
      completed,
    });

    return {
      success: true,
      message: "Plan step updated successfully",
    };
  } catch (error) {
    logger.error("Error updating plan step:", error);
    throw new Error("Failed to update plan step");
  }
});

/**
 * Update plan milestone completion
 */
export const updatePlanMilestone = onCall(async (request) => {
  const uid = validateAuth(request);
  const {planId, milestoneId, completed, actualAmount, notes} = request.data;

  if (!planId || !milestoneId) {
    throw new Error("Plan ID and milestone ID are required");
  }

  try {
    const db = admin.firestore();
    const planRef = db.collection("users").doc(uid).collection("plans").doc(planId);
    
    const planDoc = await planRef.get();
    if (!planDoc.exists) {
      throw new Error("Plan not found");
    }

    const planData = planDoc.data();
    const milestones = planData.milestones || [];
    
    // Find and update the milestone
    const milestoneIndex = milestones.findIndex(milestone => milestone.id === milestoneId);
    if (milestoneIndex === -1) {
      throw new Error("Milestone not found");
    }

    milestones[milestoneIndex] = {
      ...milestones[milestoneIndex],
      completed: !!completed,
      completedDate: completed ? admin.firestore.FieldValue.serverTimestamp() : null,
      actualAmount: actualAmount || milestones[milestoneIndex].actualAmount || null,
      notes: notes || milestones[milestoneIndex].notes || null,
    };

    // Update the plan
    await planRef.update({
      milestones,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info(`Plan milestone updated for UID: ${uid}`, {
      planId,
      milestoneId,
      completed,
    });

    return {
      success: true,
      message: "Plan milestone updated successfully",
    };
  } catch (error) {
    logger.error("Error updating plan milestone:", error);
    throw new Error("Failed to update plan milestone");
  }
}); 