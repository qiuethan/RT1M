import {onRequest} from "firebase-functions/v2/https";
import {logger} from "firebase-functions";

/**
 * Health check endpoint
 */
export const healthCheck = onRequest(async (req, res) => {
  try {
    logger.info("Health check endpoint called");

    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      message: "RT1M Firebase Functions are running",
    });
  } catch (error) {
    logger.error("Health check failed:", error);
    res.status(500).json({
      status: "error",
      message: "Health check failed",
    });
  }
});
