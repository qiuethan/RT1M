import {logger} from "firebase-functions";

/**
 * Validates that the request has proper authentication
 * @param {Object} request - The Firebase function request object
 * @return {string} - The authenticated user's UID
 * @throws {Error} - If authentication is invalid
 */
export const validateAuth = (request) => {
  if (!request.auth) {
    logger.error("Authentication failed: No request.auth found");
    throw new Error("User must be authenticated");
  }

  if (!request.auth.uid) {
    logger.error("Authentication failed: No UID found in request.auth");
    throw new Error("User authentication incomplete - missing UID");
  }

  return request.auth.uid;
};

/**
 * Gets user email from auth token with fallbacks
 * @param {Object} request - The Firebase function request object
 * @return {string} - The user's email
 */
export const getUserEmail = (request) => {
  return (request.auth.token && request.auth.token.email) ||
         request.auth.email || "";
};

/**
 * Logs authentication details for debugging
 * @param {Object} request - The Firebase function request object
 * @param {string} functionName - Name of the calling function
 */
export const logAuthDetails = (request, functionName) => {
  logger.info(`${functionName} function called`);
  logger.info("Request auth details:", {
    hasAuth: !!request.auth,
    authData: request.auth ? {
      uid: request.auth.uid,
      email: request.auth.email,
      displayName: request.auth.displayName,
      token: request.auth.token ? "present" : "missing",
    } : null,
  });
};
