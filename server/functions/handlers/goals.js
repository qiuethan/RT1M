import {onCall} from "firebase-functions/v2/https";
import {logger} from "firebase-functions";
import {validateAuth} from "../utils/auth.js";
import {
  getUserGoalsRef,
  getDocument,
  saveDocument,
  updateDocumentSection,
} from "../utils/firestore.js";
import {validateGoal, validateRequiredFields} from "../utils/validation.js";

/**
 * Get user goals data (legacy function)
 */
export const getUserGoals = onCall(async (request) => {
  const uid = validateAuth(request);

  try {
    const goalsRef = getUserGoalsRef(uid);
    const goalsData = await getDocument(goalsRef, "goals");

    if (!goalsData) {
      return {
        success: true,
        data: {
          intermediateGoals: [],
        },
      };
    }

    logger.info(`Retrieved goals for UID: ${uid}`);
    return {
      success: true,
      data: goalsData,
    };
  } catch (error) {
    logger.error("Error getting user goals:", error);
    throw new Error("Failed to get user goals");
  }
});

/**
 * Get user intermediate goals
 */
export const getUserIntermediateGoals = onCall(async (request) => {
  const uid = validateAuth(request);

  try {
    const goalsRef = getUserGoalsRef(uid);
    const goalsData = await getDocument(goalsRef, "goals");

    if (!goalsData) {
      return {
        success: true,
        data: {
          intermediateGoals: [],
        },
      };
    }

    logger.info(`Retrieved intermediate goals for UID: ${uid}`);
    return {
      success: true,
      data: {
        intermediateGoals: goalsData.intermediateGoals || [],
      },
    };
  } catch (error) {
    logger.error("Error getting user intermediate goals:", error);
    throw new Error("Failed to get user intermediate goals");
  }
});

/**
 * Save complete goals data
 */
export const saveUserIntermediateGoals = onCall(async (request) => {
  const uid = validateAuth(request);
  const {goalsData} = request.data;

  if (!goalsData) {
    throw new Error("Goals data is required");
  }

  try {
    // Validate goals data
    if (goalsData.intermediateGoals &&
        Array.isArray(goalsData.intermediateGoals)) {
      goalsData.intermediateGoals.forEach((goal) => validateGoal(goal));
    }

    const goalsRef = getUserGoalsRef(uid);
    const result = await saveDocument(goalsRef, goalsData, uid);

    logger.info(`Saved intermediate goals for UID: ${uid}`);
    return result;
  } catch (error) {
    logger.error("Error saving user intermediate goals:", error);
    throw new Error("Failed to save user intermediate goals");
  }
});

/**
 * Add a new intermediate goal
 */
export const addIntermediateGoal = onCall(async (request) => {
  const uid = validateAuth(request);
  const {goal} = request.data;

  if (!goal) {
    throw new Error("Goal data is required");
  }

  try {
    // Validate goal
    validateGoal(goal);

    // Get current goals
    const goalsRef = getUserGoalsRef(uid);
    const goalsData = await getDocument(goalsRef, "goals");

    const currentGoals = goalsData && goalsData.intermediateGoals || [];

    // Add new goal with unique ID if not provided
    const newGoal = {
      ...goal,
      id: goal.id || Date.now().toString(),
    };

    const updatedGoals = [...currentGoals, newGoal];

    // Save updated goals
    const result = await updateDocumentSection(
        goalsRef,
        "intermediateGoals",
        updatedGoals,
        uid,
    );

    logger.info(`Added intermediate goal for UID: ${uid}`);
    return result;
  } catch (error) {
    logger.error("Error adding intermediate goal:", error);
    throw new Error("Failed to add intermediate goal");
  }
});

/**
 * Update an existing intermediate goal
 */
export const updateIntermediateGoal = onCall(async (request) => {
  const uid = validateAuth(request);
  const {goalId, goal} = request.data;

  if (!goalId || !goal) {
    throw new Error("Goal ID and goal data are required");
  }

  try {
    // Validate goal
    validateGoal(goal);

    // Get current goals
    const goalsRef = getUserGoalsRef(uid);
    const goalsData = await getDocument(goalsRef, "goals");

    const currentGoals = goalsData && goalsData.intermediateGoals || [];

    // Find and update the goal
    const goalIndex = currentGoals.findIndex((g) => g.id === goalId);
    if (goalIndex === -1) {
      throw new Error("Goal not found");
    }

    currentGoals[goalIndex] = {...goal, id: goalId};

    // Save updated goals
    const result = await updateDocumentSection(
        goalsRef,
        "intermediateGoals",
        currentGoals,
        uid,
    );

    logger.info(`Updated intermediate goal ${goalId} for UID: ${uid}`);
    return result;
  } catch (error) {
    logger.error("Error updating intermediate goal:", error);
    throw new Error("Failed to update intermediate goal");
  }
});

/**
 * Delete an intermediate goal
 */
export const deleteIntermediateGoal = onCall(async (request) => {
  const uid = validateAuth(request);
  const {goalId} = request.data;

  if (!goalId) {
    throw new Error("Goal ID is required");
  }

  try {
    // Get current goals
    const goalsRef = getUserGoalsRef(uid);
    const goalsData = await getDocument(goalsRef, "goals");

    const currentGoals = goalsData && goalsData.intermediateGoals || [];

    // Filter out the goal to delete
    const updatedGoals = currentGoals.filter((g) => g.id !== goalId);

    if (updatedGoals.length === currentGoals.length) {
      throw new Error("Goal not found");
    }

    // Save updated goals
    const result = await updateDocumentSection(
        goalsRef,
        "intermediateGoals",
        updatedGoals,
        uid,
    );

    logger.info(`Deleted intermediate goal ${goalId} for UID: ${uid}`);
    return result;
  } catch (error) {
    logger.error("Error deleting intermediate goal:", error);
    throw new Error("Failed to delete intermediate goal");
  }
});


