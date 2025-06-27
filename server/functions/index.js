/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onCall, onRequest} from "firebase-functions/v2/https";
import {logger} from "firebase-functions";
import admin from "firebase-admin";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Create user profile when a new user signs up
export const createUserProfile = onCall(async (request) => {
  logger.info("createUserProfile function called");
  logger.info("Request auth details:", {
    hasAuth: !!request.auth,
    authData: request.auth ? {
      uid: request.auth.uid,
      email: request.auth.email,
      displayName: request.auth.displayName,
      token: request.auth.token ? "present" : "missing",
    } : null,
  });

  // Verify user is authenticated
  if (!request.auth) {
    logger.error("Authentication failed: No request.auth found");
    throw new Error("User must be authenticated");
  }

  if (!request.auth.uid) {
    logger.error("Authentication failed: No UID found in request.auth");
    throw new Error("User authentication incomplete - missing UID");
  }

  try {
    const uid = request.auth.uid;
    const email = (request.auth.token && request.auth.token.email) ||
      request.auth.email || "";

    logger.info(`Creating profile for user with UID: ${uid}, email: ${email}`);
    const db = admin.firestore();
    const batch = db.batch();

    // Create user profile document (basic info, education, experience, skills)
    const currentYear = new Date().getFullYear();
    const userProfile = {
      userId: uid,

      // Basic Information
      basicInfo: {
        name: null,
        email: email,
        birthday: null,
        location: null,
        occupation: null,
        country: null,
        employmentStatus: null,
      },

      // Education History
      educationHistory: [
        // Example: { school: "", field: "", graduationYear: "" }
      ],

      // Experience
      experience: [
        // Example: { company: "", position: "", startYear: "",
        // endYear: "", description: "" }
      ],

      // Financial Goal
      financialGoal: {
        targetAmount: 1000000,
        targetYear: currentYear + 20,
        timeframe: null,
        riskTolerance: null,
        primaryStrategy: null,
      },

      // Metadata
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Create financials document
    const userFinancials = {
      userId: uid,

      // Financial Information
      financialInfo: {
        annualIncome: null,
        annualExpenses: null,

        currentSavings: null,
      },

      // Asset Objects (null = not entered, [] = no assets)
      assets: null,

      // Debt Objects (null = not entered, [] = no debts)
      debts: null,

      // Metadata
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Create goals document
    const userGoals = {
      userId: uid,

      // Intermediate Goals (null = not entered, [] = no goals)
      intermediateGoals: null,

      // Metadata
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Create skills document
    const userSkills = {
      userId: uid,

      // Skills & Interests
      skillsAndInterests: {
        skills: [],
        interests: [],
      },

      // Metadata
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Create all documents
    const userProfileRef = db.collection("users").doc(uid)
        .collection("profile").doc("data");
    const userFinancialsRef = db.collection("users").doc(uid)
        .collection("financials").doc("data");
    const userGoalsRef = db.collection("users").doc(uid)
        .collection("goals").doc("data");
    const userSkillsRef = db.collection("users").doc(uid)
        .collection("skills").doc("data");

    batch.set(userProfileRef, userProfile);
    batch.set(userFinancialsRef, userFinancials);
    batch.set(userGoalsRef, userGoals);
    batch.set(userSkillsRef, userSkills);

    // Commit all documents
    await batch.commit();

    logger.info(`Created user profile for UID: ${uid}`);
    return {
      success: true,
      message: "User profile created successfully",
    };
  } catch (error) {
    logger.error("Error creating user profile:", error);
    throw new Error("Failed to create user profile");
  }
});


// Get user statistics
export const getUserStats = onCall(async (request) => {
  // Verify user is authenticated
  if (!request.auth) {
    throw new Error("User must be authenticated");
  }

  try {
    const db = admin.firestore();
    const userId = request.auth.uid;

    // Get user financials
    const financialsDoc = await db.collection("users").doc(userId)
        .collection("financials").doc("data").get();

    if (!financialsDoc.exists) {
      return {
        success: true,
        data: {
          financialInfo: null,
          netWorth: 0,
        },
      };
    }

    const financialsData = financialsDoc.data();
    const financialInfo = financialsData.financialInfo || {};

    // Calculate net worth from individual assets and debts (more accurate)
    const assets = financialsData.assets || [];
    const debts = financialsData.debts || [];

    logger.info(`getUserStats - Assets found: ${assets.length}`, assets);
    logger.info(`getUserStats - Debts found: ${debts.length}`, debts);

    // Only calculate if we have actual arrays (not null)
    const totalAssetsFromList = Array.isArray(assets) ?
      assets.reduce((sum, asset) => sum + (asset.value || 0), 0) : 0;
    const totalDebtsFromList = Array.isArray(debts) ?
      debts.reduce((sum, debt) => sum + (debt.balance || 0), 0) : 0;

    logger.info(`getUserStats - Total assets: ${totalAssetsFromList}, 
      Total debts: ${totalDebtsFromList}`);

    const netWorth = totalAssetsFromList - totalDebtsFromList;

    logger.info(`getUserStats - Calculated net worth: ${netWorth}`);

    return {
      success: true,
      data: {
        financialInfo: financialInfo,
        netWorth: netWorth,
      },
    };
  } catch (error) {
    logger.error("Error getting user stats:", error);
    throw new Error("Unable to get user statistics");
  }
});


// Clean up user data when account is deleted
export const cleanupUserData = onCall(async (request) => {
  if (!request.auth) {
    throw new Error("User must be authenticated");
  }

  try {
    const userId = request.auth.uid;
    const db = admin.firestore();
    const batch = db.batch();

    // Delete user profile
    const userProfileRef = db.collection("users").doc(userId)
        .collection("profile").doc("data");
    batch.delete(userProfileRef);

    // Delete user financials
    const userFinancialsRef = db.collection("users").doc(userId)
        .collection("financials").doc("data");
    batch.delete(userFinancialsRef);

    // Delete user goals
    const userGoalsRef = db.collection("users").doc(userId)
        .collection("goals").doc("data");
    batch.delete(userGoalsRef);

    // Delete user skills
    const userSkillsRef = db.collection("users").doc(userId)
        .collection("skills").doc("data");
    batch.delete(userSkillsRef);

    // Delete the main user document
    const userRef = db.collection("users").doc(userId);
    batch.delete(userRef);

    await batch.commit();
    logger.info(`User data deleted for ${userId}`);
    return {success: true, message: "User data cleaned up successfully"};
  } catch (error) {
    logger.error("Error deleting user data:", error);
    throw new Error("Failed to cleanup user data");
  }
});

// Health check endpoint
export const healthCheck = onRequest(async (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "RT1M Firebase Functions",
  });
});

// Get user profile
export const getUserProfile = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new Error("Authentication required");
    }

    const uid = request.auth.uid;
    const db = admin.firestore();

    const userDoc = await db.collection("users").doc(uid)
        .collection("profile").doc("data").get();

    if (!userDoc.exists) {
      return null;
    }

    const userData = userDoc.data();

    return {
      id: userDoc.id,
      userId: userData.userId,

      // Basic Information
      basicInfo: userData.basicInfo || {
        name: "",
        email: "",
        birthday: "",
        location: "",
        occupation: "",
        country: "",
        employmentStatus: "",
      },

      // Education History
      educationHistory: userData.educationHistory || [],

      // Experience
      experience: userData.experience || [],

      // Financial Goal
      financialGoal: userData.financialGoal || {
        targetAmount: 1000000,
        targetYear: new Date().getFullYear() + 20,
        timeframe: "",
        riskTolerance: "",
        primaryStrategy: "",
      },

      // Metadata
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
    };
  } catch (error) {
    logger.error("Error getting user profile:", error);
    throw new Error("Failed to get user profile");
  }
});

// Save user profile
export const saveUserProfile = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new Error("Authentication required");
    }

    const uid = request.auth.uid;
    const profileData = request.data;
    const db = admin.firestore();

    const updateData = {
      ...profileData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const profileRef = db.collection("users").doc(uid)
        .collection("profile").doc("data");
    await profileRef.set(updateData, {merge: true});

    logger.info(`Updated user profile for UID: ${uid}`);
    return {success: true, message: "Profile saved successfully"};
  } catch (error) {
    logger.error("Error saving user profile:", error);
    throw new Error("Failed to save user profile");
  }
});

// Update specific section of user profile
export const updateUserProfileSection = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new Error("Authentication required");
    }

    const uid = request.auth.uid;
    const {profileSection, data} = request.data;
    const db = admin.firestore();

    if (!profileSection || !data) {
      throw new Error("Profile section and data are required");
    }

    const updateData = {
      [profileSection]: data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const profileRef = db.collection("users").doc(uid)
        .collection("profile").doc("data");
    await profileRef.update(updateData);

    logger.info(`Updated ${profileSection} for UID: ${uid}`);
    return {success: true, message: `${profileSection} updated successfully`};
  } catch (error) {
    logger.error(`Error updating profile ${request.data.profileSection ?
      request.data.profileSection : "unknown section"}:`, error);
    throw new Error(`Failed to update profile ${request.data.profileSection ?
      request.data.profileSection : "unknown section"}`);
  }
});

// Get user goals
export const getUserGoals = onCall(async (request) => {
  if (!request.auth) {
    throw new Error("User must be authenticated");
  }

  try {
    const db = admin.firestore();
    const userId = request.auth.uid;

    const goalsQuery = await db.collection("goals")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .get();

    const goals = goalsQuery.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        deadline: data.deadline && data.deadline.toDate ?
          data.deadline.toDate().toISOString() : null,
        createdAt: data.createdAt && data.createdAt.toDate ?
          data.createdAt.toDate().toISOString() : null,
        updatedAt: data.updatedAt && data.updatedAt.toDate ?
          data.updatedAt.toDate().toISOString() : null,
      };
    });

    return {
      success: true,
      data: goals,
    };
  } catch (error) {
    logger.error("Error getting user goals:", error);
    throw new Error("Failed to get user goals");
  }
});

// Add a new goal
export const addGoal = onCall(async (request) => {
  if (!request.auth) {
    throw new Error("User must be authenticated");
  }

  try {
    const {title, targetAmount, deadline, category} = request.data;
    const userId = request.auth.uid;
    const db = admin.firestore();

    // Validate input
    if (!title || !deadline) {
      throw new Error("Title and deadline are required");
    }

    // Create goal
    const goalRef = await db.collection("goals").add({
      userId: userId,
      title: title,
      targetAmount: targetAmount ? parseFloat(targetAmount) : null,
      deadline: admin.firestore.Timestamp.fromDate(new Date(deadline)),
      category: category || "general",
      status: "Not Started",
      progress: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info(`Goal added for user ${userId}: ${title}`);
    return {
      success: true,
      data: {
        goalId: goalRef.id,
      },
      message: "Goal added successfully",
    };
  } catch (error) {
    logger.error("Error adding goal:", error);
    throw new Error(error.message || "Failed to add goal");
  }
});

// Update goal
export const updateGoal = onCall(async (request) => {
  if (!request.auth) {
    throw new Error("User must be authenticated");
  }

  try {
    const {goalId, updates} = request.data;
    const userId = request.auth.uid;
    const db = admin.firestore();

    if (!goalId || !updates) {
      throw new Error("Missing required fields");
    }

    // Verify the goal belongs to the user
    const goalDoc = await db.collection("goals").doc(goalId).get();
    if (!goalDoc.exists || goalDoc.data().userId !== userId) {
      throw new Error("Goal not found or access denied");
    }

    // Prepare update data
    const updateData = {...updates};
    if (updates.deadline) {
      updateData.deadline = admin.firestore.Timestamp
          .fromDate(new Date(updates.deadline));
    }
    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await goalDoc.ref.update(updateData);

    logger.info(`Updated goal ${goalId} for user ${userId}`);
    return {success: true, message: "Goal updated successfully"};
  } catch (error) {
    logger.error("Error updating goal:", error);
    throw new Error(error.message || "Failed to update goal");
  }
});

// Delete goal
export const deleteGoal = onCall(async (request) => {
  if (!request.auth) {
    throw new Error("User must be authenticated");
  }

  try {
    const {goalId} = request.data;
    const userId = request.auth.uid;
    const db = admin.firestore();

    if (!goalId) {
      throw new Error("Goal ID is required");
    }

    // Verify the goal belongs to the user
    const goalDoc = await db.collection("goals").doc(goalId).get();
    if (!goalDoc.exists || goalDoc.data().userId !== userId) {
      throw new Error("Goal not found or access denied");
    }

    await goalDoc.ref.delete();

    logger.info(`Deleted goal ${goalId} for user ${userId}`);
    return {success: true, message: "Goal deleted successfully"};
  } catch (error) {
    logger.error("Error deleting goal:", error);
    throw new Error(error.message || "Failed to delete goal");
  }
});

// ===== NEW RESTRUCTURED DATA FUNCTIONS =====

// Get user financials
export const getUserFinancials = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new Error("Authentication required");
    }

    const uid = request.auth.uid;
    const db = admin.firestore();

    const financialsDoc = await db.collection("users").doc(uid)
        .collection("financials").doc("data").get();

    if (!financialsDoc.exists) {
      return null;
    }

    const financialsData = financialsDoc.data();

    return {
      id: financialsDoc.id,
      userId: financialsData.userId,
      financialInfo: financialsData.financialInfo || {
        annualIncome: 0,
        annualExpenses: 0,

        currentSavings: 0,
      },
      assets: financialsData.assets || [],
      debts: financialsData.debts || [],
      createdAt: financialsData.createdAt,
      updatedAt: financialsData.updatedAt,
    };
  } catch (error) {
    logger.error("Error getting user financials:", error);
    throw new Error("Failed to get user financials");
  }
});

// Save user financials
export const saveUserFinancials = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new Error("Authentication required");
    }

    const uid = request.auth.uid;
    const financialsData = request.data;
    const db = admin.firestore();

    const updateData = {
      userId: uid,
      ...financialsData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Set createdAt if it doesn't exist
    const financialsRef = db.collection("users").doc(uid)
        .collection("financials").doc("data");
    const existingDoc = await financialsRef.get();

    if (!existingDoc.exists) {
      updateData.createdAt = admin.firestore.FieldValue.serverTimestamp();
    }

    await financialsRef.set(updateData, {merge: true});

    logger.info(`Updated user financials for UID: ${uid}`);
    return {success: true, message: "Financials saved successfully"};
  } catch (error) {
    logger.error("Error saving user financials:", error);
    throw new Error("Failed to save user financials");
  }
});

// Update specific section of user financials
export const updateUserFinancialsSection = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new Error("Authentication required");
    }

    const uid = request.auth.uid;
    const {section, data} = request.data;
    const db = admin.firestore();

    if (!section || !data) {
      throw new Error("Section and data are required");
    }

    const updateData = {
      [section]: data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const financialsRef = db.collection("users").doc(uid)
        .collection("financials").doc("data");

    // Check if document exists, create if not
    const existingDoc = await financialsRef.get();
    if (!existingDoc.exists) {
      updateData.userId = uid;
      updateData.createdAt = admin.firestore.FieldValue.serverTimestamp();
      await financialsRef.set(updateData);
    } else {
      await financialsRef.update(updateData);
    }

    logger.info(`Updated financials ${section} for UID: ${uid}`);
    return {success: true, message: `${section} updated successfully`};
  } catch (error) {
    logger.error(`Error updating financials 
      ${request.data.section || "unknown section"}:`, error);
    throw new Error(`Failed to update financials 
      ${request.data.section || "unknown section"}`);
  }
});

// Get user intermediate goals
export const getUserIntermediateGoals = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new Error("Authentication required");
    }

    const uid = request.auth.uid;
    const db = admin.firestore();

    const goalsDoc = await db.collection("users").doc(uid)
        .collection("goals").doc("data").get();

    if (!goalsDoc.exists) {
      return null;
    }

    const goalsData = goalsDoc.data();

    return {
      id: goalsDoc.id,
      userId: goalsData.userId,
      intermediateGoals: goalsData.intermediateGoals || [],
      createdAt: goalsData.createdAt,
      updatedAt: goalsData.updatedAt,
    };
  } catch (error) {
    logger.error("Error getting user intermediate goals:", error);
    throw new Error("Failed to get user intermediate goals");
  }
});

// Save user intermediate goals
export const saveUserIntermediateGoals = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new Error("Authentication required");
    }

    const uid = request.auth.uid;
    const goalsData = request.data;
    const db = admin.firestore();

    const updateData = {
      userId: uid,
      ...goalsData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Set createdAt if it doesn't exist
    const goalsRef = db.collection("users").doc(uid)
        .collection("goals").doc("data");
    const existingDoc = await goalsRef.get();

    if (!existingDoc.exists) {
      updateData.createdAt = admin.firestore.FieldValue.serverTimestamp();
    }

    await goalsRef.set(updateData, {merge: true});

    logger.info(`Updated user intermediate goals for UID: ${uid}`);
    return {success: true, message: "Goals saved successfully"};
  } catch (error) {
    logger.error("Error saving user intermediate goals:", error);
    throw new Error("Failed to save user intermediate goals");
  }
});

// Add intermediate goal
export const addIntermediateGoal = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new Error("Authentication required");
    }

    const uid = request.auth.uid;
    const goalData = request.data;
    const db = admin.firestore();

    const goalsRef = db.collection("users").doc(uid)
        .collection("goals").doc("data");

    // Get existing goals or create new document
    const existingDoc = await goalsRef.get();
    let currentGoals = [];

    if (existingDoc.exists) {
      currentGoals = existingDoc.data().intermediateGoals || [];
    }

    // Add new goal
    currentGoals.push(goalData);

    const updateData = {
      userId: uid,
      intermediateGoals: currentGoals,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (!existingDoc.exists) {
      updateData.createdAt = admin.firestore.FieldValue.serverTimestamp();
    }

    await goalsRef.set(updateData, {merge: true});

    logger.info(`Added intermediate goal for UID: ${uid}`);
    return {success: true, message: "Goal added successfully"};
  } catch (error) {
    logger.error("Error adding intermediate goal:", error);
    throw new Error("Failed to add intermediate goal");
  }
});

// Update intermediate goal
export const updateIntermediateGoal = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new Error("Authentication required");
    }

    const uid = request.auth.uid;
    const {goalId, updates} = request.data;
    const db = admin.firestore();

    if (!goalId || !updates) {
      throw new Error("Goal ID and updates are required");
    }

    const goalsRef = db.collection("users").doc(uid)
        .collection("goals").doc("data");

    const existingDoc = await goalsRef.get();
    if (!existingDoc.exists) {
      throw new Error("No goals found for user");
    }

    const currentGoals = existingDoc.data().intermediateGoals || [];
    const goalIndex = currentGoals.findIndex((goal) => goal.id === goalId);

    if (goalIndex === -1) {
      throw new Error("Goal not found");
    }

    // Update the goal
    currentGoals[goalIndex] = {...currentGoals[goalIndex], ...updates};

    await goalsRef.update({
      intermediateGoals: currentGoals,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info(`Updated intermediate goal ${goalId} for UID: ${uid}`);
    return {success: true, message: "Goal updated successfully"};
  } catch (error) {
    logger.error("Error updating intermediate goal:", error);
    throw new Error("Failed to update intermediate goal");
  }
});

// Delete intermediate goal
export const deleteIntermediateGoal = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new Error("Authentication required");
    }

    const uid = request.auth.uid;
    const {goalId} = request.data;
    const db = admin.firestore();

    if (!goalId) {
      throw new Error("Goal ID is required");
    }

    const goalsRef = db.collection("users").doc(uid)
        .collection("goals").doc("data");

    const existingDoc = await goalsRef.get();
    if (!existingDoc.exists) {
      throw new Error("No goals found for user");
    }

    const currentGoals = existingDoc.data().intermediateGoals || [];
    const filteredGoals = currentGoals.filter((goal) => goal.id !== goalId);

    await goalsRef.update({
      intermediateGoals: filteredGoals,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info(`Deleted intermediate goal ${goalId} for UID: ${uid}`);
    return {success: true, message: "Goal deleted successfully"};
  } catch (error) {
    logger.error("Error deleting intermediate goal:", error);
    throw new Error("Failed to delete intermediate goal");
  }
});

// Get user skills
export const getUserSkills = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new Error("Authentication required");
    }

    const uid = request.auth.uid;
    const db = admin.firestore();

    const skillsDoc = await db.collection("users").doc(uid)
        .collection("skills").doc("data").get();

    if (!skillsDoc.exists) {
      return null;
    }

    const skillsData = skillsDoc.data();

    return {
      id: skillsDoc.id,
      userId: skillsData.userId,
      skillsAndInterests: skillsData.skillsAndInterests || {
        skills: [],
        interests: [],
      },
      createdAt: skillsData.createdAt,
      updatedAt: skillsData.updatedAt,
    };
  } catch (error) {
    logger.error("Error getting user skills:", error);
    throw new Error("Failed to get user skills");
  }
});

// Save user skills
export const saveUserSkills = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new Error("Authentication required");
    }

    const uid = request.auth.uid;
    const skillsData = request.data;
    const db = admin.firestore();

    const updateData = {
      userId: uid,
      ...skillsData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Set createdAt if it doesn't exist
    const skillsRef = db.collection("users").doc(uid)
        .collection("skills").doc("data");
    const existingDoc = await skillsRef.get();

    if (!existingDoc.exists) {
      updateData.createdAt = admin.firestore.FieldValue.serverTimestamp();
    }

    await skillsRef.set(updateData, {merge: true});

    logger.info(`Updated user skills for UID: ${uid}`);
    return {success: true, message: "Skills saved successfully"};
  } catch (error) {
    logger.error("Error saving user skills:", error);
    throw new Error("Failed to save user skills");
  }
});

// Update specific section of user skills
export const updateUserSkillsSection = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new Error("Authentication required");
    }

    const uid = request.auth.uid;
    const {section, data} = request.data;
    const db = admin.firestore();

    if (!section || !data) {
      throw new Error("Section and data are required");
    }

    const updateData = {
      [section]: data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const skillsRef = db.collection("users").doc(uid)
        .collection("skills").doc("data");

    // Check if document exists, create if not
    const existingDoc = await skillsRef.get();
    if (!existingDoc.exists) {
      updateData.userId = uid;
      updateData.createdAt = admin.firestore.FieldValue.serverTimestamp();
      await skillsRef.set(updateData);
    } else {
      await skillsRef.update(updateData);
    }

    logger.info(`Updated skills ${section} for UID: ${uid}`);
    return {success: true, message: `${section} updated successfully`};
  } catch (error) {
    logger.error(`Error updating skills 
      ${request.data.section || "unknown section"}:`, error);
    throw new Error(`Failed to update skills 
      ${request.data.section || "unknown section"}`);
  }
});

// Update tour completion status
export const updateTourCompletion = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new Error("Authentication required");
    }

    const uid = request.auth.uid;
    const {tourName, completed = true} = request.data;
    const db = admin.firestore();

    if (!tourName) {
      throw new Error("Tour name is required");
    }

    const profileRef = db.collection("users").doc(uid)
        .collection("profile").doc("data");

    // Get existing profile data
    const existingDoc = await profileRef.get();
    if (!existingDoc.exists) {
      throw new Error("User profile not found");
    }

    const existingData = existingDoc.data();
    const tourCompletions = existingData.tourCompletions || {};

    // Update tour completion status
    tourCompletions[tourName] = {
      completed,
      completedAt: completed ? admin.firestore.FieldValue.serverTimestamp() : null,
    };

    await profileRef.update({
      tourCompletions,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info(`Updated tour completion for ${tourName} (${completed}) for UID: ${uid}`);
    return {
      success: true,
      message: `Tour ${tourName} completion status updated`,
      tourCompletions,
    };
  } catch (error) {
    logger.error("Error updating tour completion:", error);
    throw new Error("Failed to update tour completion");
  }
});

// Get tour completion status
export const getTourCompletions = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new Error("Authentication required");
    }

    const uid = request.auth.uid;
    const db = admin.firestore();

    const profileDoc = await db.collection("users").doc(uid)
        .collection("profile").doc("data").get();

    if (!profileDoc.exists) {
      return {tourCompletions: {}};
    }

    const profileData = profileDoc.data();
    return {
      tourCompletions: profileData.tourCompletions || {},
    };
  } catch (error) {
    logger.error("Error getting tour completions:", error);
    throw new Error("Failed to get tour completions");
  }
});

// AI Integration Functions - Active Handlers Only
// Smart Chat Handling (OpenAI Assistants)
export {
  handleSmartChatMessage,
  getSmartChatStats,
} from "./handlers/ai_smart_chat.js";

// Plan Generation
export {
  generateFinancialPlan,
  getUserPlans,
  updatePlanStep,
  updatePlanMilestone,
} from "./handlers/ai_plans.js";

// Utilities & Logging
export {
  logAIConversation,
} from "./handlers/ai_utils.js";
