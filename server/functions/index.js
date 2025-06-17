/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onCall, onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
admin.initializeApp();

// Create user profile when a new user signs up
exports.createUserProfile = onCall(async (request) => {
  // Verify user is authenticated
  if (!request.auth) {
    throw new Error("User must be authenticated");
  }

  try {
    const {email, displayName, uid} = request.auth;
    const db = admin.firestore();
    const batch = db.batch();

    // Create user profile document
    const userProfile = {
      userId: uid,
      email: email,
      displayName: displayName || "",
      birthday: "",
      employmentStatus: "",
      income: 0,
      expenses: 0,
      currentSavings: 0,
      assets: 0,
      debts: 0,
      targetAmount: 1000000,
      targetAge: 65,
      targetYear: new Date().getFullYear() + 10,
      education: [],
      skills: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const userProfileRef = db.collection("userProfiles").doc(uid);
    batch.set(userProfileRef, userProfile);

    // Create initial user progress document
    const userProgress = {
      userId: uid,
      currentAmount: 0,
      targetAmount: 1000000,
      goalDate: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const userProgressRef = db.collection("userProgress").doc();
    batch.set(userProgressRef, userProgress);

    // Commit both documents atomically
    await batch.commit();

    logger.info(`Created complete user profile and progress for 
      ${email} with UID: ${uid}`);
    return {success: true,
      message: "User profile and progress created successfully"};
  } catch (error) {
    logger.error("Error creating user profile:", error);
    throw new Error("Failed to create user profile");
  }
});

// Get user progress
exports.getUserProgress = onCall(async (request) => {
  if (!request.auth) {
    throw new Error("User must be authenticated");
  }

  try {
    const db = admin.firestore();
    const userId = request.auth.uid;

    const progressQuery = await db.collection("userProgress")
        .where("userId", "==", userId).get();

    if (progressQuery.empty) {
      return {success: true, data: null};
    }

    const doc = progressQuery.docs[0];
    const data = doc.data();

    return {
      success: true,
      data: {
        id: doc.id,
        ...data,
        createdAt: data.createdAt && data.createdAt.toDate ?
          data.createdAt.toDate().toISOString() : null,
        updatedAt: data.updatedAt && data.updatedAt.toDate ?
          data.updatedAt.toDate().toISOString() : null,
        goalDate: data.goalDate && data.goalDate.toDate ?
          data.goalDate.toDate().toISOString() : null,
      },
    };
  } catch (error) {
    logger.error("Error getting user progress:", error);
    throw new Error("Failed to get user progress");
  }
});

// Update user progress
exports.updateUserProgress = onCall(async (request) => {
  if (!request.auth) {
    throw new Error("User must be authenticated");
  }

  try {
    const {progressId, updates} = request.data;
    const userId = request.auth.uid;
    const db = admin.firestore();

    if (!progressId || !updates) {
      throw new Error("Missing required fields");
    }

    // Verify the progress document belongs to the user
    const progressDoc = await db.collection("userProgress")
        .doc(progressId).get();
    if (!progressDoc.exists || progressDoc.data().userId !== userId) {
      throw new Error("Progress document not found or access denied");
    }

    // Update the document
    await progressDoc.ref.update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info(`Updated progress for user ${userId}`);
    return {success: true, message: "Progress updated successfully"};
  } catch (error) {
    logger.error("Error updating user progress:", error);
    throw new Error(error.message || "Failed to update user progress");
  }
});


// Get user statistics
exports.getUserStats = onCall(async (request) => {
  // Verify user is authenticated
  if (!request.auth) {
    throw new Error("User must be authenticated");
  }

  try {
    const db = admin.firestore();
    const userId = request.auth.uid;

    // Get user progress
    const progressQuery = await db.collection("userProgress")
        .where("userId", "==", userId).get();
    let userProgress = null;
    if (!progressQuery.empty) {
      const doc = progressQuery.docs[0];
      const data = doc.data();
      userProgress = {
        id: doc.id,
        ...data,
        createdAt: data.createdAt && data.createdAt.toDate ?
          data.createdAt.toDate().toISOString() : null,
        updatedAt: data.updatedAt && data.updatedAt.toDate ?
          data.updatedAt.toDate().toISOString() : null,
        goalDate: data.goalDate && data.goalDate.toDate ?
          data.goalDate.toDate().toISOString() : null,
      };
    }

    return {
      success: true,
      data: {
        userProgress,
        // Simplified stats without transactions
        totalIncome: 0,
        totalExpenses: 0,
        netAmount: userProgress ? userProgress.currentAmount : 0,
      },
    };
  } catch (error) {
    logger.error("Error getting user stats:", error);
    throw new Error("Unable to get user statistics");
  }
});


// Clean up user data when account is deleted
exports.cleanupUserData = onCall(async (request) => {
  if (!request.auth) {
    throw new Error("User must be authenticated");
  }

  try {
    const userId = request.auth.uid;
    const db = admin.firestore();
    const batch = db.batch();

    // Delete user profile
    const userProfileRef = db.collection("userProfiles").doc(userId);
    batch.delete(userProfileRef);

    // Delete user progress
    const progressQuery = await db.collection("userProgress")
        .where("userId", "==", userId).get();
    progressQuery.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });


    await batch.commit();
    logger.info(`User data deleted for ${userId}`);
    return {success: true, message: "User data cleaned up successfully"};
  } catch (error) {
    logger.error("Error deleting user data:", error);
    throw new Error("Failed to cleanup user data");
  }
});

// Health check endpoint
exports.healthCheck = onRequest(async (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "RT1M Firebase Functions",
  });
});

// Update user progress target
exports.updateProgressTarget = onCall(async (request) => {
  if (!request.auth) {
    throw new Error("User must be authenticated");
  }

  try {
    const {targetAmount} = request.data;
    const userId = request.auth.uid;
    const db = admin.firestore();

    if (!targetAmount || targetAmount <= 0) {
      throw new Error("Invalid target amount");
    }

    // Find and update user's progress document
    const progressQuery = await db.collection("userProgress")
        .where("userId", "==", userId).get();

    if (progressQuery.empty) {
      throw new Error("User progress not found");
    }

    const progressDoc = progressQuery.docs[0];
    await progressDoc.ref.update({
      targetAmount: parseFloat(targetAmount),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info(`Updated target for user ${userId}: ${targetAmount}`);
    return {success: true, message: "Target updated successfully"};
  } catch (error) {
    logger.error("Error updating target:", error);
    throw new Error(error.message || "Failed to update target");
  }
});

// Get user profile
exports.getUserProfile = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new Error("Authentication required");
    }

    const uid = request.auth.uid;
    const db = admin.firestore();

    const userDoc = await db.collection("userProfiles").doc(uid).get();

    if (!userDoc.exists) {
      return null;
    }

    const userData = userDoc.data();

    return {
      id: userDoc.id,
      ...userData,
      birthday: userData.birthday || "",
      employmentStatus: userData.employmentStatus || "",
      income: userData.income || 0,
      expenses: userData.expenses || 0,
      currentSavings: userData.currentSavings || 0,
      assets: userData.assets || 0,
      debts: userData.debts || 0,
      targetAmount: userData.targetAmount || 1000000,
      targetAge: userData.targetAge || 65,
      targetYear: userData.targetYear || new Date().getFullYear() + 10,
      education: userData.education || [],
      skills: userData.skills || [],
    };
  } catch (error) {
    logger.error("Error getting user profile:", error);
    throw new Error("Failed to get user profile");
  }
});

// Save user profile
exports.saveUserProfile = onCall(async (request) => {
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

    await db.collection("userProfiles").doc(uid).set(updateData, {merge: true});

    logger.info(`Updated user profile for UID: ${uid}`);
    return {success: true, message: "Profile saved successfully"};
  } catch (error) {
    logger.error("Error saving user profile:", error);
    throw new Error("Failed to save user profile");
  }
});

// Update specific section of user profile
exports.updateUserProfileSection = onCall(async (request) => {
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

    await db.collection("userProfiles").doc(uid).update(updateData);

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
exports.getUserGoals = onCall(async (request) => {
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
exports.addGoal = onCall(async (request) => {
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
exports.updateGoal = onCall(async (request) => {
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
exports.deleteGoal = onCall(async (request) => {
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
