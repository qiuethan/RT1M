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
import {processAIData} from "../utils/ai_helpers.js";
import admin from "firebase-admin";

/**
 * AI-driven bulk update for user data extracted from conversations
 * Handles financialInfo, assets, debts, goals, and skills from chatbot
 */
export const updateUserDataFromAI = onCall(async (request) => {
  const uid = validateAuth(request);
  const {extractedData, sessionId = "unknown", source = "ai_chat"} = request.data;

  if (!extractedData) {
    throw new Error("Extracted data is required");
  }

  try {
    // Process and sanitize the AI data using proper schemas
    const processedResult = processAIData(extractedData);
    
    if (!processedResult.hasData) {
      return {
        success: true,
        message: "No valid data to update",
        updatedSections: {},
        confidence: 0
      };
    }

    const {data: sanitizedData, confidence} = processedResult;

    logger.info(`AI data update initiated for UID: ${uid}`, {
      hasFinancialInfo: !!sanitizedData.financialInfo,
      assetsCount: sanitizedData.assets?.length || 0,
      debtsCount: sanitizedData.debts?.length || 0,
      goalsCount: sanitizedData.goals?.length || 0,
      hasSkills: !!sanitizedData.skills,
      confidence,
      sessionId,
    });

    const operations = [];
    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    const updatedSections = {};

    // Handle financial info updates
    if (sanitizedData.financialInfo) {
      const financialsRef = getUserFinancialsRef(uid);
      const currentFinancials = await getDocument(financialsRef, "financials");
      
      // Merge AI financial data with existing data, preserving null values
      const updatedFinancialInfo = {
        ...currentFinancials?.financialInfo || {},
        ...sanitizedData.financialInfo,
        // Add AI metadata
        lastAIUpdate: timestamp,
        aiSource: source,
        aiConfidence: confidence,
      };

      operations.push({
        ref: financialsRef,
        data: {
          financialInfo: updatedFinancialInfo,
          updatedAt: timestamp,
        },
        merge: true,
      });

      updatedSections.financialInfo = true;
      logger.info(`Financial info update queued for UID: ${uid}`, sanitizedData.financialInfo);
    }

    // Handle assets updates
    if (sanitizedData.assets) {
      const financialsRef = getUserFinancialsRef(uid);
      const currentFinancials = await getDocument(financialsRef, "financials");
      const existingAssets = currentFinancials?.assets || [];

      // Smart merge - avoid duplicates based on name and type
      const updatedAssets = [...existingAssets];
      
      for (const newAsset of sanitizedData.assets) {
        const isDuplicate = existingAssets.some(existing => 
          existing.name.toLowerCase() === newAsset.name.toLowerCase() &&
          existing.type === newAsset.type
        );

        if (!isDuplicate) {
          updatedAssets.push({
            ...newAsset,
            aiGenerated: true,
            aiSource: source,
            createdAt: timestamp,
          });
          logger.info(`New AI asset queued: ${newAsset.name} for UID: ${uid}`);
        } else {
          logger.info(`AI asset already exists, skipping: ${newAsset.name} for UID: ${uid}`);
        }
      }

      // Calculate total assets
      const totalAssets = updatedAssets.reduce((sum, asset) => sum + (asset.value || 0), 0);

      // Update financials collection with proper nested structure
      const currentFinancialInfo = currentFinancials?.financialInfo || {};
      operations.push({
        ref: financialsRef,
        data: {
          assets: updatedAssets,
          financialInfo: {
            ...currentFinancialInfo,
            totalAssets: totalAssets,
            lastAIUpdate: timestamp,
            aiSource: source,
            aiConfidence: confidence,
          },
          updatedAt: timestamp,
        },
        merge: true,
      });

      updatedSections.assets = true;
    }

    // Handle debts updates
    if (sanitizedData.debts) {
      const financialsRef = getUserFinancialsRef(uid);
      const currentFinancials = await getDocument(financialsRef, "financials");
      const existingDebts = currentFinancials?.debts || [];

      // Smart merge - avoid duplicates based on name and type
      const updatedDebts = [...existingDebts];
      
      for (const newDebt of sanitizedData.debts) {
        const isDuplicate = existingDebts.some(existing => 
          existing.name.toLowerCase() === newDebt.name.toLowerCase() &&
          existing.type === newDebt.type
        );

        if (!isDuplicate) {
          updatedDebts.push({
            ...newDebt,
            aiGenerated: true,
            aiSource: source,
            createdAt: timestamp,
          });
          logger.info(`New AI debt queued: ${newDebt.name} for UID: ${uid}`);
        } else {
          logger.info(`AI debt already exists, skipping: ${newDebt.name} for UID: ${uid}`);
        }
      }

      // Calculate total debts
      const totalDebts = updatedDebts.reduce((sum, debt) => sum + (debt.balance || 0), 0);

      // Update financials collection with proper nested structure
      const currentFinancialInfo = currentFinancials?.financialInfo || {};
      operations.push({
        ref: financialsRef,
        data: {
          debts: updatedDebts,
          financialInfo: {
            ...currentFinancialInfo,
            totalDebts: totalDebts,
            lastAIUpdate: timestamp,
            aiSource: source,
            aiConfidence: confidence,
          },
          updatedAt: timestamp,
        },
        merge: true,
      });

      updatedSections.debts = true;
    }

    // Handle goals updates
    if (sanitizedData.goals) {
      const goalsRef = getUserGoalsRef(uid);
      const currentGoals = await getDocument(goalsRef, "goals");
      const existingGoals = currentGoals?.intermediateGoals || [];

      const updatedGoals = [...existingGoals];

      for (const aiGoal of sanitizedData.goals) {
        // Check if goal already exists (by title similarity)
        const existingGoal = existingGoals.find(g => 
          g.title.toLowerCase().includes(aiGoal.title.toLowerCase()) ||
          aiGoal.title.toLowerCase().includes(g.title.toLowerCase())
        );

        if (!existingGoal) {
          const goalToAdd = {
            ...aiGoal,
            aiGenerated: true,
            aiSource: source,
            createdAt: timestamp,
          };

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

      // Write to goals collection with proper nested structure
      operations.push({
        ref: goalsRef,
        data: {
          intermediateGoals: updatedGoals,
          lastAIUpdate: timestamp,
          aiSource: source,
          updatedAt: timestamp,
        },
        merge: true,
      });

      updatedSections.goals = true;
    }

    // Handle skills updates
    if (sanitizedData.skills) {
      const skillsRef = getUserSkillsRef(uid);
      const currentSkills = await getDocument(skillsRef, "skills");

      // Merge skills and interests, avoiding duplicates
      const existingSkillsData = currentSkills?.skillsAndInterests || {};
      const existingSkills = existingSkillsData.skills || [];
      const existingInterests = existingSkillsData.interests || [];

      const updatedSkills = [...existingSkills];
      const updatedInterests = [...existingInterests];

      // Add new skills
      if (sanitizedData.skills.skills) {
        for (const skill of sanitizedData.skills.skills) {
          if (!existingSkills.some(s => s.toLowerCase() === skill.toLowerCase())) {
            updatedSkills.push(skill);
            logger.info(`New AI skill queued: ${skill} for UID: ${uid}`);
          }
        }
      }

      // Add new interests
      if (sanitizedData.skills.interests) {
        for (const interest of sanitizedData.skills.interests) {
          if (!existingInterests.some(i => i.toLowerCase() === interest.toLowerCase())) {
            updatedInterests.push(interest);
            logger.info(`New AI interest queued: ${interest} for UID: ${uid}`);
          }
        }
      }

      // Write to skills collection with proper nested structure
      operations.push({
        ref: skillsRef,
        data: {
          skillsAndInterests: {
            skills: updatedSkills,
            interests: updatedInterests,
          },
          lastAIUpdate: timestamp,
          aiSource: source,
          updatedAt: timestamp,
        },
        merge: true,
      });

      updatedSections.skills = true;
    }

    // Execute all operations in a batch
    if (operations.length > 0) {
      await batchOperation(operations);
      logger.info(`AI data update completed for UID: ${uid}`, {
        operationsCount: operations.length,
        confidence,
        sessionId,
      });
    }

    return {
      success: true,
      message: "AI data update completed successfully",
      updatedSections,
      confidence,
      sessionId,
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