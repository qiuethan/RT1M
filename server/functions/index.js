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
    const displayName = (request.auth.token && request.auth.token.name) ||
      request.auth.displayName || "";

    logger.info(`Creating profile for user with UID: ${uid}, email: ${email}`);
    const db = admin.firestore();
    const batch = db.batch();

    // Create user profile document with structured data
    const currentYear = new Date().getFullYear();
    const userProfile = {
      userId: uid,

      // Basic Information
      basicInfo: {
        name: displayName,
        email: email,
        birthday: "",
        employmentStatus: "Employed",
      },

      // Financial Information
      financialInfo: {
        annualIncome: 50000,
        annualExpenses: 35000,
        totalAssets: 25000,
        totalDebts: 5000,
        currentSavings: 10000,
      },

      // Financial Goal
      financialGoal: {
        targetAmount: 1000000,
        targetAge: 65,
        targetYear: currentYear + 20,
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

      // Skills & Interests
      skillsAndInterests: {
        skills: [],
        interests: [],
      },

      // Metadata
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const userProfileRef = db.collection("users").doc(uid)
        .collection("profile").doc("data");
    batch.set(userProfileRef, userProfile);

    // Commit the profile document
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

    // Get user profile
    const profileDoc = await db.collection("users").doc(userId)
        .collection("profile").doc("data").get();

    if (!profileDoc.exists) {
      return {
        success: true,
        data: {
          financialInfo: null,
          netWorth: 0,
        },
      };
    }

    const userData = profileDoc.data();
    const financialInfo = userData.financialInfo || {};

    // Calculate net worth
    const netWorth = (financialInfo.totalAssets || 0) -
      (financialInfo.totalDebts || 0);

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

// Test callable function for debugging
export const testCallable = onCall(async (request) => {
  logger.info("testCallable function called");
  logger.info("Request auth:", !!request.auth);
  if (request.auth) {
    logger.info("Auth UID:", request.auth.uid);
  }
  return {
    success: true,
    message: "Test callable function working",
    hasAuth: !!request.auth,
    uid: request.auth ? request.auth.uid : null,
    timestamp: new Date().toISOString(),
  };
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
        employmentStatus: "",
      },

      // Financial Information
      financialInfo: userData.financialInfo || {
        annualIncome: 0,
        annualExpenses: 0,
        totalAssets: 0,
        totalDebts: 0,
        currentSavings: 0,
      },

      // Financial Goal
      financialGoal: userData.financialGoal || {
        targetAmount: 1000000,
        targetAge: 65,
        targetYear: new Date().getFullYear() + 10,
      },

      // Education History
      educationHistory: userData.educationHistory || [],

      // Experience
      experience: userData.experience || [],

      // Skills & Interests
      skillsAndInterests: userData.skillsAndInterests || {
        skills: [],
        interests: [],
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
