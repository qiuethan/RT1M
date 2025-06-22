import {onCall} from "firebase-functions/v2/https";
import {logger} from "firebase-functions";
import {validateAuth} from "../utils/auth.js";
import {
  getUserProfileRef,
  getUserFinancialsRef,
  getUserGoalsRef,
  getUserSkillsRef,
  getDocument,
  updateDocumentSection,
  batchOperation,
} from "../utils/firestore.js";
import {validateGoal} from "../utils/validation.js";
import admin from "firebase-admin";

/**
 * AI-driven bulk update for user data extracted from conversations
 * Handles personalInfo, financialInfo, and goals from chatbot
 */
export const updateUserDataFromAI = onCall(async (request) => {
  const uid = validateAuth(request);
  const {personalInfo, financialInfo, goals, source = "ai_chat"} = request.data;

  if (!personalInfo && !financialInfo && !goals) {
    throw new Error("At least one data type (personalInfo, financialInfo, goals) is required");
  }

  try {
    logger.info(`AI data update initiated for UID: ${uid}`, {
      hasPersonalInfo: !!personalInfo,
      hasFinancialInfo: !!financialInfo,
      hasGoals: !!goals,
      source,
    });

    const operations = [];
    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    // Handle personal info updates
    if (personalInfo) {
      const profileRef = getUserProfileRef(uid);
      const currentProfile = await getDocument(profileRef, "profile");
      
      // Merge AI data with existing basicInfo, preserving existing data
      const updatedBasicInfo = {
        ...currentProfile?.basicInfo || {},
        ...personalInfo,
        // Add AI metadata
        lastAIUpdate: timestamp,
        aiSource: source,
      };

      operations.push({
        ref: profileRef,
        data: {
          basicInfo: updatedBasicInfo,
          updatedAt: timestamp,
        },
        merge: true,
      });

      logger.info(`Personal info update queued for UID: ${uid}`, personalInfo);
    }

    // Handle financial info updates
    if (financialInfo) {
      const financialsRef = getUserFinancialsRef(uid);
      const currentFinancials = await getDocument(financialsRef, "financials");
      
      // Merge AI financial data with existing data
      const updatedFinancialInfo = {
        ...currentFinancials?.financialInfo || {},
        ...financialInfo,
        // Add AI metadata
        lastAIUpdate: timestamp,
        aiSource: source,
      };

      operations.push({
        ref: financialsRef,
        data: {
          financialInfo: updatedFinancialInfo,
          updatedAt: timestamp,
        },
        merge: true,
      });

      logger.info(`Financial info update queued for UID: ${uid}`, financialInfo);
    }

    // Handle goals updates
    if (goals && Array.isArray(goals)) {
      const goalsRef = getUserGoalsRef(uid);
      const currentGoals = await getDocument(goalsRef, "goals");
      const existingGoals = currentGoals?.intermediateGoals || [];

      const updatedGoals = [...existingGoals];

      for (const aiGoal of goals) {
        // Validate AI goal structure
        const goalToAdd = {
          id: aiGoal.id || `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: aiGoal.title,
          type: aiGoal.category || "financial",
          status: aiGoal.status || "Not Started",
          description: aiGoal.description || "",
          // AI-specific metadata
          aiGenerated: true,
          aiSource: source,
          createdAt: timestamp,
          ...aiGoal.data || {},
        };

        // Check if goal already exists (by title similarity)
        const existingGoal = existingGoals.find(g => 
          g.title.toLowerCase().includes(aiGoal.title.toLowerCase()) ||
          aiGoal.title.toLowerCase().includes(g.title.toLowerCase())
        );

        if (!existingGoal) {
          // Validate the goal before adding
          try {
            validateGoal(goalToAdd);
            updatedGoals.push(goalToAdd);
            logger.info(`New AI goal queued: ${aiGoal.title} for UID: ${uid}`);
          } catch (validationError) {
            logger.warn(`AI goal validation failed for UID: ${uid}`, {
              goal: aiGoal,
              error: validationError.message,
            });
          }
        } else {
          logger.info(`AI goal already exists, skipping: ${aiGoal.title} for UID: ${uid}`);
        }
      }

      operations.push({
        ref: goalsRef,
        data: {
          intermediateGoals: updatedGoals,
          updatedAt: timestamp,
        },
        merge: true,
      });
    }

    // Execute all operations in a batch
    if (operations.length > 0) {
      await batchOperation(operations);
      logger.info(`AI data update completed for UID: ${uid}`, {
        operationsCount: operations.length,
      });
    }

    return {
      success: true,
      message: "AI data update completed successfully",
      updatedSections: {
        personalInfo: !!personalInfo,
        financialInfo: !!financialInfo,
        goals: !!goals,
      },
    };
  } catch (error) {
    logger.error("Error updating user data from AI:", error);
    throw new Error("Failed to update user data from AI");
  }
});

/**
 * Smart financial data merger - handles incremental updates from AI
 */
export const mergeFinancialDataFromAI = onCall(async (request) => {
  const uid = validateAuth(request);
  const {financialUpdates, confidence = 0.8, source = "ai_chat"} = request.data;

  if (!financialUpdates) {
    throw new Error("Financial updates are required");
  }

  try {
    const financialsRef = getUserFinancialsRef(uid);
    const currentData = await getDocument(financialsRef, "financials");
    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    // Smart merging logic
    const mergedFinancialInfo = {
      ...currentData?.financialInfo || {},
    };

    // Only update fields if confidence is high enough or if field is empty
    Object.entries(financialUpdates).forEach(([key, value]) => {
      const currentValue = mergedFinancialInfo[key];
      
      if (confidence >= 0.8 || !currentValue || currentValue === 0) {
        mergedFinancialInfo[key] = value;
        mergedFinancialInfo[`${key}_aiConfidence`] = confidence;
        mergedFinancialInfo[`${key}_aiSource`] = source;
        mergedFinancialInfo[`${key}_aiUpdatedAt`] = timestamp;
      }
    });

    await updateDocumentSection(
      financialsRef,
      "financialInfo",
      mergedFinancialInfo,
      uid
    );

    logger.info(`Smart financial merge completed for UID: ${uid}`, {
      updates: Object.keys(financialUpdates),
      confidence,
    });

    return {
      success: true,
      message: "Financial data merged successfully",
      updatedFields: Object.keys(financialUpdates),
      confidence,
    };
  } catch (error) {
    logger.error("Error merging financial data from AI:", error);
    throw new Error("Failed to merge financial data from AI");
  }
});

/**
 * Add or update skills and interests from AI conversation
 */
export const updateSkillsFromAI = onCall(async (request) => {
  const uid = validateAuth(request);
  const {skills = [], interests = [], source = "ai_chat"} = request.data;

  if (skills.length === 0 && interests.length === 0) {
    throw new Error("At least one skill or interest is required");
  }

  try {
    const skillsRef = getUserSkillsRef(uid);
    const currentData = await getDocument(skillsRef, "skills");
    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    const existingSkills = currentData?.skillsAndInterests?.skills || [];
    const existingInterests = currentData?.skillsAndInterests?.interests || [];

    // Add new skills (avoid duplicates)
    const updatedSkills = [...existingSkills];
    skills.forEach(skill => {
      if (!existingSkills.some(s => s.toLowerCase() === skill.toLowerCase())) {
        updatedSkills.push(skill);
      }
    });

    // Add new interests (avoid duplicates)
    const updatedInterests = [...existingInterests];
    interests.forEach(interest => {
      if (!existingInterests.some(i => i.toLowerCase() === interest.toLowerCase())) {
        updatedInterests.push(interest);
      }
    });

    const updatedSkillsData = {
      skillsAndInterests: {
        skills: updatedSkills,
        interests: updatedInterests,
      },
      lastAIUpdate: timestamp,
      aiSource: source,
      updatedAt: timestamp,
    };

    await updateDocumentSection(
      skillsRef,
      "skillsAndInterests",
      updatedSkillsData.skillsAndInterests,
      uid
    );

    logger.info(`Skills updated from AI for UID: ${uid}`, {
      newSkills: skills,
      newInterests: interests,
    });

    return {
      success: true,
      message: "Skills and interests updated successfully",
      addedSkills: skills,
      addedInterests: interests,
    };
  } catch (error) {
    logger.error("Error updating skills from AI:", error);
    throw new Error("Failed to update skills from AI");
  }
});

/**
 * Get AI conversation context - returns relevant user data for chatbot
 */
export const getAIConversationContext = onCall(async (request) => {
  const uid = validateAuth(request);

  try {
    // Get all user data for AI context
    const [profileData, financialData, goalsData, skillsData] = await Promise.all([
      getDocument(getUserProfileRef(uid), "profile"),
      getDocument(getUserFinancialsRef(uid), "financials"),
      getDocument(getUserGoalsRef(uid), "goals"),
      getDocument(getUserSkillsRef(uid), "skills"),
    ]);

    // Build context object with relevant information
    const context = {
      personalInfo: profileData?.basicInfo || {},
      financialGoal: profileData?.financialGoal || {},
      financialInfo: financialData?.financialInfo || {},
      currentGoals: goalsData?.intermediateGoals || [],
      skills: skillsData?.skillsAndInterests?.skills || [],
      interests: skillsData?.skillsAndInterests?.interests || [],
      // Metadata for AI decision making
      dataCompleteness: {
        hasBasicInfo: !!(profileData?.basicInfo?.name),
        hasFinancialInfo: !!(financialData?.financialInfo?.annualIncome),
        hasGoals: (goalsData?.intermediateGoals?.length || 0) > 0,
        hasSkills: (skillsData?.skillsAndInterests?.skills?.length || 0) > 0,
      },
    };

    logger.info(`AI context retrieved for UID: ${uid}`);
    return {
      success: true,
      data: context,
    };
  } catch (error) {
    logger.error("Error getting AI conversation context:", error);
    throw new Error("Failed to get AI conversation context");
  }
});

/**
 * Log AI conversation for analytics and improvement
 */
export const logAIConversation = onCall(async (request) => {
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