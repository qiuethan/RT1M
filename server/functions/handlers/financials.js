import {onCall} from "firebase-functions/v2/https";
import {logger} from "firebase-functions";
import {validateAuth} from "../utils/auth.js";
import {
  getUserFinancialsRef,
  getDocument,
  saveDocument,
  updateDocumentSection,
} from "../utils/firestore.js";
import {validateFinancialData} from "../utils/validation.js";

/**
 * Get user financial data
 */
export const getUserFinancials = onCall(async (request) => {
  const uid = validateAuth(request);

  try {
    const financialsRef = getUserFinancialsRef(uid);
    const financialsData = await getDocument(financialsRef, "financials");

    if (!financialsData) {
      // Return default structure if no data exists
      return {
        success: true,
        data: {
          financialInfo: {
            annualIncome: 0,
            annualExpenses: 0,
            totalAssets: 0,
            totalDebts: 0,
            currentSavings: 0,
          },
          assets: [],
          debts: [],
        },
      };
    }

    logger.info(`Retrieved financials for UID: ${uid}`);
    return {
      success: true,
      data: {
        financialInfo: financialsData.financialInfo || {
          annualIncome: 0,
          annualExpenses: 0,
          totalAssets: 0,
          totalDebts: 0,
          currentSavings: 0,
        },
        assets: financialsData.assets || [],
        debts: financialsData.debts || [],
      },
    };
  } catch (error) {
    logger.error("Error getting user financials:", error);
    throw new Error("Failed to get user financials");
  }
});

/**
 * Save complete financial data
 */
export const saveUserFinancials = onCall(async (request) => {
  const uid = validateAuth(request);
  const {financialData} = request.data;

  if (!financialData) {
    throw new Error("Financial data is required");
  }

  try {
    // Validate financial data
    validateFinancialData(financialData);

    const financialsRef = getUserFinancialsRef(uid);
    const result = await saveDocument(financialsRef, financialData, uid);

    logger.info(`Saved financials for UID: ${uid}`);
    return result;
  } catch (error) {
    logger.error("Error saving user financials:", error);
    throw new Error("Failed to save user financials");
  }
});

/**
 * Update specific section of financial data
 */
export const updateUserFinancialsSection = onCall(async (request) => {
  const uid = validateAuth(request);
  const {section, data} = request.data;

  if (!section || data === undefined) {
    throw new Error("Section and data are required");
  }

  try {
    // Validate section data
    if (section === "financialInfo" ||
        section === "assets" ||
        section === "debts") {
      const tempFinancial = {[section]: data};
      validateFinancialData(tempFinancial);
    }

    const financialsRef = getUserFinancialsRef(uid);
    const result = await updateDocumentSection(
        financialsRef,
        section,
        data,
        uid,
    );

    logger.info(`Updated financials section '${section}' for UID: ${uid}`);
    return result;
  } catch (error) {
    logger.error(`Error updating financials section '${section}':`, error);
    throw new Error(`Failed to update ${section}`);
  }
});

/**
 * Get user statistics (calculated from financial data)
 */
export const getUserStats = onCall(async (request) => {
  const uid = validateAuth(request);

  try {
    const financialsRef = getUserFinancialsRef(uid);
    const financialsData = await getDocument(financialsRef, "financials");

    if (!financialsData) {
      return {
        success: true,
        data: {
          netWorth: 0,
          financialInfo: null,
        },
      };
    }

    // Calculate net worth from assets and debts arrays for accuracy
    const totalAssets = (financialsData.assets || []).reduce(
        (sum, asset) => sum + (asset.value || 0),
        0,
    );
    const totalDebts = (financialsData.debts || []).reduce(
        (sum, debt) => sum + (debt.balance || 0),
        0,
    );
    const netWorth = totalAssets - totalDebts;

    logger.info(`Retrieved stats for UID: ${uid}, Net Worth: ${netWorth}`);
    return {
      success: true,
      data: {
        netWorth: netWorth,
        financialInfo: financialsData.financialInfo || null,
      },
    };
  } catch (error) {
    logger.error("Error getting user stats:", error);
    throw new Error("Failed to get user stats");
  }
});
