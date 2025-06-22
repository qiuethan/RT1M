import {onCall} from "firebase-functions/v2/https";
import {logger} from "firebase-functions";
import {validateAuth} from "../utils/auth.js";
import {
  getUserSkillsRef,
  getDocument,
  saveDocument,
  updateDocumentSection,
} from "../utils/firestore.js";

/**
 * Get user skills data
 */
export const getUserSkills = onCall(async (request) => {
  const uid = validateAuth(request);

  try {
    const skillsRef = getUserSkillsRef(uid);
    const skillsData = await getDocument(skillsRef, "skills");

    if (!skillsData) {
      return {
        success: true,
        data: {
          skillsAndInterests: {
            skills: [],
            interests: [],
          },
        },
      };
    }

    logger.info(`Retrieved skills for UID: ${uid}`);
    return {
      success: true,
      data: skillsData,
    };
  } catch (error) {
    logger.error("Error getting user skills:", error);
    throw new Error("Failed to get user skills");
  }
});

/**
 * Save complete skills data
 */
export const saveUserSkills = onCall(async (request) => {
  const uid = validateAuth(request);
  const {skillsData} = request.data;

  if (!skillsData) {
    throw new Error("Skills data is required");
  }

  try {
    // Basic validation
    if (skillsData.skillsAndInterests) {
      if (skillsData.skillsAndInterests.skills &&
          !Array.isArray(skillsData.skillsAndInterests.skills)) {
        throw new Error("Skills must be an array");
      }
      if (skillsData.skillsAndInterests.interests &&
          !Array.isArray(skillsData.skillsAndInterests.interests)) {
        throw new Error("Interests must be an array");
      }
    }

    const skillsRef = getUserSkillsRef(uid);
    const result = await saveDocument(skillsRef, skillsData, uid);

    logger.info(`Saved skills for UID: ${uid}`);
    return result;
  } catch (error) {
    logger.error("Error saving user skills:", error);
    throw new Error("Failed to save user skills");
  }
});

/**
 * Update specific section of skills data
 */
export const updateUserSkillsSection = onCall(async (request) => {
  const uid = validateAuth(request);
  const {section, data} = request.data;

  if (!section || data === undefined) {
    throw new Error("Section and data are required");
  }

  try {
    // Basic validation for skills sections
    if (section === "skillsAndInterests") {
      if (data.skills && !Array.isArray(data.skills)) {
        throw new Error("Skills must be an array");
      }
      if (data.interests && !Array.isArray(data.interests)) {
        throw new Error("Interests must be an array");
      }
    }

    const skillsRef = getUserSkillsRef(uid);
    const result = await updateDocumentSection(skillsRef, section, data, uid);

    logger.info(`Updated skills section '${section}' for UID: ${uid}`);
    return result;
  } catch (error) {
    logger.error(`Error updating skills section '${section}':`, error);
    throw new Error(`Failed to update ${section}`);
  }
});
