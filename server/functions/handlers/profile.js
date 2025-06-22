import {onCall} from "firebase-functions/v2/https";
import {logger} from "firebase-functions";
import admin from "firebase-admin";
import {validateAuth, logAuthDetails, getUserEmail} from "../utils/auth.js";
import {
  getUserProfileRef,
  getUserFinancialsRef,
  getUserGoalsRef,
  getUserSkillsRef,
  getDocument,
  saveDocument,
  updateDocumentSection,
  batchOperation,
} from "../utils/firestore.js";
import {validateProfileData} from "../utils/validation.js";

/**
 * Create user profile when a new user signs up
 */
export const createUserProfile = onCall(async (request) => {
  logAuthDetails(request, "createUserProfile");

  const uid = validateAuth(request);
  const email = getUserEmail(request);

  try {
    logger.info(`Creating profile for user with UID: ${uid}, email: ${email}`);

    const currentYear = new Date().getFullYear();

    // Prepare all user documents
    const userProfile = {
      userId: uid,
      basicInfo: {
        name: "",
        email: email,
        birthday: "",
        location: "",
        occupation: "",
        country: "",
        employmentStatus: "Employed",
      },
      educationHistory: [],
      experience: [],
      financialGoal: {
        targetAmount: 1000000,
        targetYear: currentYear + 20,
        timeframe: "",
        riskTolerance: "",
        primaryStrategy: "",
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const userFinancials = {
      userId: uid,
      financialInfo: {
        annualIncome: 0,
        annualExpenses: 0,
        totalAssets: 0,
        totalDebts: 0,
        currentSavings: 0,
      },
      assets: [],
      debts: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const userGoals = {
      userId: uid,
      intermediateGoals: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const userSkills = {
      userId: uid,
      skillsAndInterests: {
        skills: [],
        interests: [],
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Use batch operation to create all documents
    const operations = [
      {ref: getUserProfileRef(uid), data: userProfile},
      {ref: getUserFinancialsRef(uid), data: userFinancials},
      {ref: getUserGoalsRef(uid), data: userGoals},
      {ref: getUserSkillsRef(uid), data: userSkills},
    ];

    await batchOperation(operations);

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

/**
 * Get user profile data
 */
export const getUserProfile = onCall(async (request) => {
  const uid = validateAuth(request);

  try {
    const profileRef = getUserProfileRef(uid);
    const profileData = await getDocument(profileRef, "profile");

    if (!profileData) {
      return {success: false, message: "Profile not found"};
    }

    logger.info(`Retrieved profile for UID: ${uid}`);
    return {
      success: true,
      data: profileData,
    };
  } catch (error) {
    logger.error("Error getting user profile:", error);
    throw new Error("Failed to get user profile");
  }
});

/**
 * Save complete user profile
 */
export const saveUserProfile = onCall(async (request) => {
  const uid = validateAuth(request);
  const {profileData} = request.data;

  if (!profileData) {
    throw new Error("Profile data is required");
  }

  try {
    // Validate profile data
    validateProfileData(profileData);

    const profileRef = getUserProfileRef(uid);
    const result = await saveDocument(profileRef, profileData, uid);

    logger.info(`Saved profile for UID: ${uid}`);
    return result;
  } catch (error) {
    logger.error("Error saving user profile:", error);
    throw new Error("Failed to save user profile");
  }
});

/**
 * Update specific section of user profile
 */
export const updateUserProfileSection = onCall(async (request) => {
  const uid = validateAuth(request);
  const {section, data} = request.data;

  if (!section || data === undefined) {
    throw new Error("Section and data are required");
  }

  try {
    // Validate section data based on section type
    if (section === "basicInfo" || section === "financialGoal") {
      const tempProfile = {[section]: data};
      validateProfileData(tempProfile);
    }

    const profileRef = getUserProfileRef(uid);
    const result = await updateDocumentSection(profileRef, section, data, uid);

    logger.info(`Updated profile section '${section}' for UID: ${uid}`);
    return result;
  } catch (error) {
    logger.error(`Error updating profile section '${section}':`, error);
    throw new Error(`Failed to update ${section}`);
  }
});

/**
 * Clean up user data when account is deleted
 */
export const cleanupUserData = onCall(async (request) => {
  const uid = validateAuth(request);

  try {
    // Delete all user collections
    const operations = [
      {ref: getUserProfileRef(uid), operation: "delete"},
      {ref: getUserFinancialsRef(uid), operation: "delete"},
      {ref: getUserGoalsRef(uid), operation: "delete"},
      {ref: getUserSkillsRef(uid), operation: "delete"},
    ];

    await batchOperation(operations);

    logger.info(`Cleaned up user data for UID: ${uid}`);
    return {
      success: true,
      message: "User data cleaned up successfully",
    };
  } catch (error) {
    logger.error("Error cleaning up user data:", error);
    throw new Error("Failed to clean up user data");
  }
});
