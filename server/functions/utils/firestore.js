import admin from "firebase-admin";
import {logger} from "firebase-functions";

/**
 * Get Firestore database instance
 * @return {admin.firestore.Firestore} Firestore database instance
 */
export const getDb = () => admin.firestore();

/**
 * Collection reference builders
 */

/**
 * Get user profile document reference
 * @param {string} uid - User ID
 * @return {admin.firestore.DocumentReference} Profile document reference
 */
export const getUserProfileRef = (uid) =>
  getDb().collection("users").doc(uid).collection("profile").doc("data");

/**
 * Get user financials document reference
 * @param {string} uid - User ID
 * @return {admin.firestore.DocumentReference} Financials document reference
 */
export const getUserFinancialsRef = (uid) =>
  getDb().collection("users").doc(uid).collection("financials").doc("data");

/**
 * Get user goals document reference
 * @param {string} uid - User ID
 * @return {admin.firestore.DocumentReference} Goals document reference
 */
export const getUserGoalsRef = (uid) =>
  getDb().collection("users").doc(uid).collection("goals").doc("data");

/**
 * Get user skills document reference
 * @param {string} uid - User ID
 * @return {admin.firestore.DocumentReference} Skills document reference
 */
export const getUserSkillsRef = (uid) =>
  getDb().collection("users").doc(uid).collection("skills").doc("data");

/**
 * Common document operations
 */

/**
 * Get a document with error handling
 * @param {DocumentReference} docRef - Firestore document reference
 * @param {string} docType - Type of document for error messages
 * @return {Object|null} - Document data or null if not found
 */
export const getDocument = async (docRef, docType = "document") => {
  try {
    const doc = await docRef.get();
    if (!doc.exists) {
      logger.info(`${docType} not found`);
      return null;
    }
    return doc.data();
  } catch (error) {
    logger.error(`Error getting ${docType}:`, error);
    throw new Error(`Failed to get ${docType}`);
  }
};

/**
 * Create or update a document with timestamps
 * @param {DocumentReference} docRef - Firestore document reference
 * @param {Object} data - Data to save
 * @param {string} uid - User ID
 * @param {boolean} merge - Whether to merge with existing data
 * @return {Object} - Success response
 */
export const saveDocument = async (docRef, data, uid, merge = true) => {
  try {
    const updateData = {
      userId: uid,
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Check if document exists to set createdAt
    const existingDoc = await docRef.get();
    if (!existingDoc.exists) {
      updateData.createdAt = admin.firestore.FieldValue.serverTimestamp();
    }

    await docRef.set(updateData, {merge});

    logger.info(`Document saved for UID: ${uid}`);
    return {success: true, message: "Document saved successfully"};
  } catch (error) {
    logger.error("Error saving document:", error);
    throw new Error("Failed to save document");
  }
};

/**
 * Update a specific section of a document
 * @param {DocumentReference} docRef - Firestore document reference
 * @param {string} section - Section name to update
 * @param {any} data - Data to save in the section
 * @param {string} uid - User ID
 * @return {Object} - Success response
 */
export const updateDocumentSection = async (docRef, section, data, uid) => {
  try {
    if (!section || data === undefined) {
      throw new Error("Section and data are required");
    }

    const updateData = {
      [section]: data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Check if document exists, create if not
    const existingDoc = await docRef.get();
    if (!existingDoc.exists) {
      updateData.userId = uid;
      updateData.createdAt = admin.firestore.FieldValue.serverTimestamp();
      await docRef.set(updateData);
    } else {
      await docRef.update(updateData);
    }

    logger.info(`Updated section '${section}' for UID: ${uid}`);
    return {success: true, message: `${section} updated successfully`};
  } catch (error) {
    logger.error(`Error updating section '${section}':`, error);
    throw new Error(`Failed to update ${section}`);
  }
};

/**
 * Delete a document
 * @param {DocumentReference} docRef - Firestore document reference
 * @param {string} docType - Type of document for logging
 * @return {Object} - Success response
 */
export const deleteDocument = async (docRef, docType = "document") => {
  try {
    await docRef.delete();
    logger.info(`${docType} deleted`);
    return {success: true, message: `${docType} deleted successfully`};
  } catch (error) {
    logger.error(`Error deleting ${docType}:`, error);
    throw new Error(`Failed to delete ${docType}`);
  }
};

/**
 * Batch operations helper
 * @param {Array} operations - Array of {ref, data, operation} objects
 * @return {Object} - Success response
 */
export const batchOperation = async (operations) => {
  try {
    const batch = getDb().batch();

    operations.forEach(({ref, data, operation = "set"}) => {
      switch (operation) {
        case "set":
          batch.set(ref, data);
          break;
        case "update":
          batch.update(ref, data);
          break;
        case "delete":
          batch.delete(ref);
          break;
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
    });

    await batch.commit();
    logger.info(
        `Batch operation completed with ${operations.length} operations`,
    );
    return {success: true, message: "Batch operation completed successfully"};
  } catch (error) {
    logger.error("Error in batch operation:", error);
    throw new Error("Failed to complete batch operation");
  }
};
