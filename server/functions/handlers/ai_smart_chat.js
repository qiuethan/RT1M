/**
 * Assistant Chat System for RT1M
 * Direct integration with OpenAI Assistants configured on the platform
 * Handles: Router → General/Context/Plan responses via assistants
 */

import {onCall} from "firebase-functions/v2/https";
import {logger} from "firebase-functions";
import {validateAuth} from "../utils/auth.js";
import {logAIConversation, openaiApiKey} from "./ai_utils.js";
import admin from "firebase-admin";

// Import the assistant orchestrator and secrets
import {
  assistantChatInvoke,
  routerAssistantId,
  contextAssistantId,
  planAssistantId
} from "./ai_langchain_assistants.js";

/**
 * Load conversation history from Firestore
 */
export const loadConversationHistory = async (userId, limit = 3) => {
  try {
    const db = admin.firestore();
    
    const conversationsRef = db.collection("users").doc(userId)
      .collection("ai_conversations")
      .orderBy("serverTimestamp", "desc")
      .limit(limit * 2);
    
    const snapshot = await conversationsRef.get();
    
    if (snapshot.empty) {
      logger.info("📜 HISTORY: No conversation history found", {userId});
      return [];
    }
    
    const conversations = snapshot.docs
      .map(doc => doc.data())
      .filter(conv => conv.userMessage && conv.aiResponse)
      .slice(0, limit)
      .reverse();
    
    logger.info("📜 HISTORY: Loaded conversation history", {
      userId,
      conversationCount: conversations.length
    });
    
    return conversations.map(conv => ({
      user: conv.userMessage,
      assistant: conv.aiResponse,
      userMessage: conv.userMessage,
      aiResponse: conv.aiResponse
    }));
    
  } catch (error) {
    logger.warn("⚠️ HISTORY: Failed to load conversation history", {
      userId,
      error: error.message
    });
    return [];
  }
};

/**
 * Load basic profile context for router
 */
export const loadBasicUserContext = async (userId) => {
  try {
    const db = admin.firestore();
    
    const profileDoc = await db.collection("users").doc(userId)
      .collection("profile").doc("data").get();
    
    const basicContext = {
      basicInfo: profileDoc.exists ? profileDoc.data()?.basicInfo || null : null,
      educationHistory: profileDoc.exists ? profileDoc.data()?.educationHistory || null : null,
      experience: profileDoc.exists ? profileDoc.data()?.experience || null : null,
      financialGoal: profileDoc.exists ? profileDoc.data()?.financialGoal || null : null
    };
    
    logger.info("📋 BASIC CONTEXT: Loaded for router", {
      userId,
      hasBasicInfo: !!basicContext.basicInfo,
      hasEducation: !!basicContext.educationHistory?.length,
      hasExperience: !!basicContext.experience?.length,
      hasFinancialGoal: !!basicContext.financialGoal
    });
    
    return basicContext;
  } catch (error) {
    logger.warn("⚠️ Failed to load basic user context", {
      userId,
      error: error.message
    });
    return null;
  }
};

/**
 * Main Smart Chat function - direct assistant orchestration
 */
export const smartChatInvoke = async (inputText, userId, userContext = null, sessionId = null) => {
  const startTime = Date.now();
  
  try {
    logger.info("🤖 ASSISTANT CHAT: Starting", {
      userId,
      messageLength: inputText.length,
      sessionId
    });
    
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OpenAI API key not configured");
    }
    
    // Direct call to assistant orchestrator
    const response = await assistantChatInvoke(
      inputText,
      userId,
      userContext,
      sessionId,
      apiKey
    );
    
    const duration = Date.now() - startTime;
    
    logger.info("✅ ASSISTANT CHAT: Success", {
      userId,
      responseSource: response.responseSource,
      duration: `${duration}ms`,
      route: response.routingDecision?.route,
      tokensSaved: response.tokensSaved || 0
    });
    
    return response;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("❌ ASSISTANT CHAT: Error", {
      userId,
      error: error.message,
      duration: `${duration}ms`
    });
    
    return {
      message: "I'm experiencing technical difficulties. Please try again in a moment.",
      financialInfo: null,
      assets: [],
      debts: [],
      goals: null,
      skills: null,
      usedUserData: false,
      tokensSaved: 0,
      routingDecision: {route: "ERROR", error: error.message},
      responseSource: "fallback"
    };
  }
};

/**
 * Handle Smart Chat Message (Firebase Function)
 */
export const handleSmartChatMessage = onCall({
  secrets: [openaiApiKey, routerAssistantId, contextAssistantId, planAssistantId]
}, async (request) => {
  try {
    const userId = validateAuth(request);
    const {message, sessionId = null} = request.data;
    
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      throw new Error("Message is required and must be a non-empty string");
    }
    
    logger.info("💬 Smart Chat Handler", {
      userId,
      messageLength: message.length,
      sessionId
    });
    
    const response = await smartChatInvoke(
      message.trim(),
      userId,
      null,
      sessionId
    );
    
    // 🧠 MEMORY FIX: Automatically log conversation to maintain memory
    try {
      const db = admin.firestore();
      const conversationRef = db.collection("users").doc(userId)
        .collection("ai_conversations").doc();

      const conversationLog = {
        userId: userId,
        sessionId: sessionId || "unknown",
        userMessage: message.trim(),
        aiResponse: response.message,
        extractedData: {
          financialInfo: response.financialInfo,
          assets: response.assets,
          debts: response.debts,
          goals: response.goals,
          skills: response.skills
        },
        confidence: null, // Could be enhanced later
        clientTimestamp: null,
        serverTimestamp: admin.firestore.FieldValue.serverTimestamp(),
        routingDecision: response.routingDecision,
        responseSource: response.responseSource
      };

      await conversationRef.set(conversationLog);
      
      logger.info("🧠 MEMORY: Conversation logged successfully", {
        userId,
        sessionId,
        route: response.routingDecision?.route,
        responseSource: response.responseSource
      });
      
    } catch (loggingError) {
      // Don't fail the chat if logging fails
      logger.warn("⚠️ MEMORY: Failed to log conversation", {
        userId,
        sessionId,
        error: loggingError.message
      });
    }
    
    return {
      success: true,
      data: response
    };
    
  } catch (error) {
    logger.error("❌ Smart Chat Handler Error", {
      error: error.message
    });
    
    return {
      success: false,
      error: error.message,
      data: {
        message: "I'm experiencing technical difficulties. Please try again in a moment.",
        financialInfo: null,
        assets: [],
        debts: [],
        goals: null,
        skills: null,
        usedUserData: false,
        tokensSaved: 0,
        responseSource: "error_fallback"
      }
    };
  }
});

/**
 * Get Smart Chat Statistics
 */
export const getSmartChatStats = onCall(async (request) => {
  try {
    const userId = validateAuth(request);
    
    logger.info("📊 Assistant Chat Stats", {userId});
    
    return {
      success: true,
      data: {
        chatSystem: "OpenAI Assistants",
        routerAssistant: "GPT-4o-mini",
        contextAssistant: "GPT-4", 
        planAssistant: "GPT-4",
        tokenOptimization: "Dynamic routing",
        averageResponseTime: "1-3 seconds",
        accuracy: "Pre-configured assistants",
        features: [
          "Smart routing",
          "Conversation history",
          "Data extraction",
          "Plan generation",
          "Security sanitization"
        ]
      }
    };
    
  } catch (error) {
    logger.error("❌ Assistant Chat Stats Error", {
      error: error.message
    });
    
    return {
      success: false,
      error: error.message
    };
  }
}); 