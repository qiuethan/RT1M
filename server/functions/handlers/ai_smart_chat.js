/**
 * Smart Chat Orchestrator - Two-layer system to optimize token usage
 * 1. Router determines if user data is needed
 * 2. Routes to appropriate chat model (general vs full context)
 */

import {onCall} from "firebase-functions/v2/https";
import {logger} from "firebase-functions";
import {validateAuth} from "../utils/auth.js";
import {routeChatMessage, getRoutingStats} from "./ai_chat_router.js";
import {getGeneralAdvice, getQuickAdvice} from "./ai_general_chat.js";
import {getAIContextData} from "./ai_context.js";
import {updateUserDataFromAI} from "./ai_data_updates.js";
import admin from "firebase-admin";
import {openaiApiKey} from "./ai_utils.js";

// Import the existing full chat functionality
import {ChatPromptTemplate} from "@langchain/core/prompts";
import {initializeChatModel} from "./ai_utils.js";

// Security patterns for detecting sensitive information leakage
const SENSITIVE_PATTERNS = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email addresses
  /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, // Credit card numbers
  /\b\d{3}-\d{2}-\d{4}\b/g, // SSN format
  /\b\d{9}\b/g, // SIN format
  /\b[A-Z]{2}\d{7}[A-Z]?\b/g, // Passport format
  /"message":\s*"/g, // Raw JSON structure
  /\{[\s\S]*"message"[\s\S]*\}/g, // JSON object with message
];

/**
 * Sanitize AI response to prevent sensitive information leakage
 */
const sanitizeResponse = (message) => {
  if (!message || typeof message !== 'string') {
    return message;
  }
  
  let sanitized = message;
  let foundSensitive = false;
  
  // Check for and redact sensitive patterns
  SENSITIVE_PATTERNS.forEach((pattern, index) => {
    if (pattern.test(sanitized)) {
      foundSensitive = true;
      logger.warn("🚨 SECURITY: Detected sensitive pattern in AI response", {
        patternIndex: index,
        preview: sanitized.substring(0, 100)
      });
      
      // Redact the sensitive content
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    }
  });
  
  // If any sensitive content was found, log it
  if (foundSensitive) {
    logger.warn("🚨 SECURITY: Sanitized AI response", {
      originalLength: message.length,
      sanitizedLength: sanitized.length,
      containedSensitiveInfo: true
    });
  }
  
  return sanitized;
};

/**
 * Load conversation history from Firestore
 */
const loadConversationHistory = async (userId, limit = 3) => {
  try {
    const db = admin.firestore();
    
    // Get last few conversations ordered by timestamp
    const conversationsRef = db.collection("users").doc(userId)
      .collection("ai_conversations")
      .orderBy("serverTimestamp", "desc")
      .limit(limit * 2); // Get more to account for potential duplicates
    
    const snapshot = await conversationsRef.get();
    
    if (snapshot.empty) {
      logger.info("📜 HISTORY: No conversation history found", {userId});
      return [];
    }
    
    const conversations = snapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          ...data,
          docId: doc.id // Keep document ID for debugging
        };
      })
      .filter(conv => conv.userMessage && conv.aiResponse) // Ensure both messages exist
      .slice(0, limit) // Take only the requested number
      .reverse(); // Reverse to get chronological order (oldest first)
    
    logger.info("📜 HISTORY: Loaded conversation history", {
      userId,
      conversationCount: conversations.length,
      requestedLimit: limit,
      totalDocsFound: snapshot.docs.length,
      lastConversationPreview: conversations.length > 0 ? conversations[conversations.length - 1]?.userMessage?.substring(0, 50) : "N/A"
    });
    
    return conversations.map(conv => ({
      user: conv.userMessage,
      assistant: conv.aiResponse,
      userMessage: conv.userMessage, // Alternative format
      aiResponse: conv.aiResponse // Alternative format
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
const loadBasicUserContext = async (userId) => {
  try {
    const db = admin.firestore();
    
    // Load basic profile for router personalization (lightweight data)
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
 * Smart Chat Response class
 */
class SmartChatResponse {
  constructor({
    message,
    financialInfo = null,
    assets = [],
    debts = [],
    goals = null,
    skills = null,
    usedUserData = false,
    tokensSaved = 0,
    routingDecision = null,
    responseSource = "unknown"
  }) {
    this.message = message;
    this.financialInfo = financialInfo;
    this.assets = assets;
    this.debts = debts;
    this.goals = goals;
    this.skills = skills;
    this.usedUserData = usedUserData;
    this.tokensSaved = tokensSaved;
    this.routingDecision = routingDecision;
    this.responseSource = responseSource;
  }
}

/**
 * Log conversation with smart routing metadata
 */
const logSmartConversation = async (uid, conversationData) => {
  try {
    const db = admin.firestore();
    const conversationRef = db.collection("users").doc(uid)
      .collection("ai_conversations").doc();

    const conversationLog = {
      userId: uid,
      sessionId: conversationData.sessionId || "unknown",
      userMessage: conversationData.userMessage || "Unknown message",
      aiResponse: conversationData.aiResponse || "No response generated",
      
      // Smart routing metadata
      routingDecision: conversationData.routingDecision || {},
      usedUserData: conversationData.usedUserData || false,
      tokensSaved: conversationData.tokensSaved || 0,
      responseSource: conversationData.responseSource || "unknown",
      
      // Existing fields
      extractedData: conversationData.extractedData || null,
      confidence: conversationData.confidence || null,
      clientTimestamp: conversationData.clientTimestamp || null,
      serverTimestamp: admin.firestore.FieldValue.serverTimestamp(),
    };

    await conversationRef.set(conversationLog);
    logger.info(`Smart AI conversation logged for UID: ${uid}`, {
      sessionId: conversationData.sessionId,
      usedUserData: conversationData.usedUserData,
      tokensSaved: conversationData.tokensSaved,
      responseSource: conversationData.responseSource
    });

    return {success: true, logId: conversationRef.id};
  } catch (error) {
    logger.error("Error logging smart AI conversation:", error);
    return {success: false, error: error.message};
  }
};

/**
 * Handle full context chat (existing functionality)
 */
const handleFullContextChat = async (message, userContext, uid) => {
  try {
    logger.info("🔧 FULL CONTEXT: Starting full context chat", {
      uid,
      messageLength: message?.length || 0,
      hasUserContext: !!userContext
    });
    
    const model = initializeChatModel();
    
    // Use the real chat prompt template
    const prompt = ChatPromptTemplate.fromTemplate(`
You are a knowledgeable and friendly AI assistant focused on personal finance and wealth building. Think of yourself as a helpful friend who happens to know a lot about money, investing, and financial planning.

User Profile Context:
{userProfile}

User's message: {message}

Your personality and approach:
- Be conversational, warm, and relatable (like ChatGPT)
- Share insights, tips, and strategies naturally
- Don't be overly formal or robotic
- You can discuss a wide range of topics, but gently steer financial conversations toward helpful advice
- Only extract information that's naturally mentioned - never interrogate or explicitly ask for personal details
- Be encouraging but realistic about financial goals

IMPORTANT: Respond with a JSON object that matches the EXACT database schema:

{{
  "message": "Your natural, conversational response",
  "financialInfo": null or {{
    "annualIncome": number,
    "annualExpenses": number, 
    "currentSavings": number
  }},
  "assets": [{{
    "name": "Asset Name",
    "type": "real-estate|stocks|bonds|savings|retirement|crypto|business|other",
    "value": number,
    "description": "Optional description"
  }}] (empty array [] if no assets mentioned),
  "debts": [{{
    "name": "Debt Name", 
    "type": "mortgage|credit-card|student-loan|car-loan|personal-loan|business-loan|other",
    "balance": number,
    "interestRate": number (optional),
    "description": "Optional description"
  }}] (empty array [] if no debts mentioned),
  "goals": null or [{{
    "title": "Goal Title",
    "type": "financial|skill|behavior|lifestyle|networking|project", 
    "status": "Not Started|In Progress|Completed",
    "description": "Goal description",
    "targetAmount": number (for financial goals),
    "currentAmount": number (optional),
    "targetDate": "YYYY-MM-DD" (optional)
  }}],
  "skills": null or {{
    "skills": ["Professional skill 1", "Professional skill 2"],
    "interests": ["Interest 1", "Interest 2"]
  }}
}}

CRITICAL RULES:
1. ONLY extract data that is explicitly mentioned with specific numbers
2. Always include "message" field with your response
3. Set financialInfo, goals, skills to null when no data to extract
4. Set assets and debts to empty arrays [] when no data to extract (never null)
5. Your message should be helpful and conversational

Keep it natural, helpful, and conversational while following the exact schema!
`);

    const chain = prompt.pipe(model);
    
    const response = await chain.invoke({
      userProfile: JSON.stringify(userContext, null, 2),
      message: message
    });

    logger.info("🔧 FULL CONTEXT: AI response received", {
      uid,
      hasResponse: !!response,
      hasContent: !!(response?.content),
      contentLength: response?.content?.length || 0,
      contentPreview: response?.content?.substring(0, 200) || "N/A"
    });

    // Parse response
    let parsedResponse;
    try {
      const content = response.content || response;
      
      // SECURITY: Check if AI returned raw JSON as text (security issue)
      if (typeof content === 'string' && content.trim().startsWith('{') && content.includes('"message"')) {
        logger.warn("🚨 SECURITY: AI returned raw JSON as message", {
          uid,
          preview: content.substring(0, 200)
        });
        
        // Try to parse the JSON first
        try {
          const tempParsed = JSON.parse(content);
          if (tempParsed.message) {
                         // Extract just the message, ignore the JSON structure, and sanitize
             parsedResponse = {
               message: sanitizeResponse(tempParsed.message),
               financialInfo: tempParsed.financialInfo || null,
               assets: tempParsed.assets || [],
               debts: tempParsed.debts || [],
               goals: tempParsed.goals || null,
               skills: tempParsed.skills || null
             };
            logger.info("✅ SECURITY: Extracted and sanitized message from raw JSON", {
              uid,
              messageLength: parsedResponse.message.length
            });
          } else {
            throw new Error("No message in JSON");
          }
        } catch (jsonParseError) {
          // If we can't parse it, treat as regular text but sanitize
                     parsedResponse = {
             message: "I understand you're asking about your information. Let me provide a proper response based on your profile data.",
             financialInfo: null,
             assets: [],
             debts: [],
             goals: null,
             skills: null
           };
          logger.warn("🚨 SECURITY: Failed to parse raw JSON, using sanitized fallback", {
            uid,
            error: jsonParseError.message
          });
        }
      } else {
        // Normal JSON parsing
        parsedResponse = JSON.parse(content);
        
        // Ensure message field exists
        if (!parsedResponse.message || parsedResponse.message.trim().length === 0) {
          throw new Error("No message in AI response");
        }
        
        // Sanitize the message
        parsedResponse.message = sanitizeResponse(parsedResponse.message);
        
        logger.info("🔧 FULL CONTEXT: Successfully parsed and sanitized response", {
          uid,
          messageLength: parsedResponse.message.length,
          hasFinancialInfo: !!parsedResponse.financialInfo
        });
      }
      
    } catch (parseError) {
      logger.warn("Failed to parse full context response", {
        error: parseError.message,
        response: response.content || response
      });
      
      // Safe fallback with guaranteed message
      parsedResponse = {
        message: response.content || "I apologize, but I'm having trouble processing your request right now. Could you please try rephrasing your question?",
        financialInfo: null,
        assets: [],
        debts: [],
        goals: null,
        skills: null
      };
    }

    logger.info("🔧 FULL CONTEXT: Returning successful response", {
      uid,
      messageLength: parsedResponse.message.length
    });
    
    return parsedResponse;
    
  } catch (error) {
    logger.error("🚨 FULL CONTEXT: Error in full context chat", {
      error: error.message, 
      uid,
      stack: error.stack?.substring(0, 500)
    });
    
    // Safe fallback that always returns a message
    const fallbackResponse = {
      message: "I'm experiencing technical difficulties right now. Please try your question again in a moment.",
      financialInfo: null,
      assets: null,
      debts: null,
      goals: null,
      skills: null
    };
    
    logger.info("🔧 FULL CONTEXT: Returning fallback response", {
      uid,
      fallbackMessage: fallbackResponse.message
    });
    
    return fallbackResponse;
  }
};

/**
 * Main smart chat function
 */
export const smartChatInvoke = async (inputText, userId, userContext = null, sessionId = null) => {
  const startTime = Date.now();
  
  try {
    logger.info("🧠 SMART CHAT: Starting orchestration", {
      userId, 
      messageLength: inputText.length,
      hasUserContext: !!userContext,
      sessionId
    });
    
    // LAYER 0: Load basic context and conversation history for router
    logger.info("📋 SMART CHAT: Loading basic context and history for router", {userId});
    const [basicContext, conversationHistory] = await Promise.all([
      loadBasicUserContext(userId),
      loadConversationHistory(userId, 3) // Load last 3 exchanges
    ]);
    
    logger.info("📋 SMART CHAT: Basic context and history loaded", {
      userId,
      hasBasicInfo: !!(basicContext?.basicInfo),
      hasFinancialGoal: !!(basicContext?.financialGoal),
      conversationHistoryLength: conversationHistory?.length || 0,
      lastConversationPreview: conversationHistory?.length > 0 ? conversationHistory[conversationHistory.length - 1]?.user?.substring(0, 50) : "N/A"
    });
    
    // LAYER 1: Route the message with basic context
    logger.info("🚦 SMART CHAT: Routing message to determine if user data needed", {
      userId,
      originalMessage: inputText,
      messageLength: inputText.length,
      messageCharCodes: Array.from(inputText).map(c => c.charCodeAt(0)),
      trimmedMessage: inputText.trim(),
      lowerMessage: inputText.toLowerCase().trim()
    });
    const routingDecision = await routeChatMessage(inputText, userId, basicContext, conversationHistory);
    
    logger.info("🎯 SMART CHAT: Routing decision received", {
      userId,
      needsUserData: routingDecision.needsUserData,
      messageType: routingDecision.messageType,
      confidence: routingDecision.confidence,
      routingMethod: routingDecision.routingMethod,
      hasSimpleResponse: !!routingDecision.simpleResponse,
      simpleResponseLength: routingDecision.simpleResponse?.length || 0,
      simpleResponsePreview: routingDecision.simpleResponse?.substring(0, 100) || "N/A",
      usedBasicContext: !!basicContext,
      needsPlan: !!routingDecision.needsPlan
    });
    
    let response;
    let responseSource;
    let tokensSaved = 0;
    
    // LAYER 2a: Handle general advice (no user data needed)
    if (!routingDecision.needsUserData) {
      logger.info("✅ SMART CHAT: Using general advice path - NO USER DATA NEEDED", {
        userId,
        messageType: routingDecision.messageType,
        confidence: routingDecision.confidence,
        routingMethod: routingDecision.routingMethod
      });
      
      // Try quick cached response first
      const quickResponse = getQuickAdvice(inputText);
      if (quickResponse) {
        logger.info("⚡ SMART CHAT: Using cached response", {userId});
        responseSource = "cache";
        tokensSaved = 800; // Estimated tokens saved vs full context
        
        response = new SmartChatResponse({
          message: quickResponse.message,
          usedUserData: false,
          tokensSaved,
          routingDecision,
          responseSource
        });
      } else if (routingDecision.simpleResponse) {
        // Use router's simple response
        logger.info("⚡ SMART CHAT: Using router's simple response", {
          userId,
          responseLength: routingDecision.simpleResponse.length,
          response: routingDecision.simpleResponse
        });
        responseSource = "router";
        tokensSaved = 600; // Estimated tokens saved
        
        response = new SmartChatResponse({
          message: routingDecision.simpleResponse,
          usedUserData: false,
          tokensSaved,
          routingDecision,
          responseSource
        });
      } else {
        // Get detailed general advice with basic context
        logger.info("🤖 SMART CHAT: Getting detailed general advice with basic context", {
          userId,
          hasBasicContext: !!basicContext
        });
        const generalResponse = await getGeneralAdvice(inputText, userId, basicContext);
        responseSource = "general";
        tokensSaved = 500; // Estimated tokens saved vs full context
        
        response = new SmartChatResponse({
          message: generalResponse.message,
          usedUserData: false,
          tokensSaved,
          routingDecision,
          responseSource
        });
      }
    }
    // LAYER 2b: Handle personalized advice OR plan generation (user data needed)
    else if (routingDecision.needsUserData && !routingDecision.needsPlan) {
      logger.info("🔍 SMART CHAT: User data needed - loading context", {
        userId,
        messageType: routingDecision.messageType,
        hasUserContext: !!userContext
      });
      
      // Load user context if not already provided
      if (!userContext) {
        logger.info("📊 SMART CHAT: Loading user context from database", {userId});
        try {
          userContext = await getAIContextData(userId);
          logger.info("✅ SMART CHAT: User context loaded successfully", {
            userId,
            hasFinancialInfo: !!(userContext?.financialInfo),
            hasGoals: !!(userContext?.goals),
            hasAssets: !!(userContext?.assets)
          });
        } catch (contextError) {
          logger.warn("⚠️ SMART CHAT: Failed to load user context", {
            userId,
            error: contextError.message
          });
          userContext = null;
        }
      }
      
      // Check if user context is available
      if (!userContext) {
        logger.info("❓ SMART CHAT: No user context available, prompting for details", {userId});
        responseSource = "prompt";
        response = new SmartChatResponse({
          message: "I'd be happy to provide personalized advice! To give you the best recommendations, could you share some details about your financial situation, goals, or what specific area you'd like help with?",
          usedUserData: false,
          tokensSaved: 400, // Saved by not having context to analyze
          routingDecision,
          responseSource
        });
      } else {
        // Use full chat model with user data
        logger.info("🎯 SMART CHAT: Using full context chat with user data", {userId});
        const fullResponse = await handleFullContextChat(inputText, userContext, userId);
        
        logger.info("🔍 SMART CHAT: Full response received", {
          userId,
          hasMessage: !!fullResponse?.message,
          messageLength: fullResponse?.message?.length || 0,
          messagePreview: fullResponse?.message?.substring(0, 100) || "N/A",
          hasFinancialInfo: !!fullResponse?.financialInfo,
          fullResponseKeys: Object.keys(fullResponse || {})
        });
        
        responseSource = "full";
        tokensSaved = 0; // No savings for full context
        
        response = new SmartChatResponse({
          message: fullResponse?.message || "I apologize, but I'm having trouble generating a response right now.",
          financialInfo: fullResponse?.financialInfo || null,
          assets: fullResponse?.assets || [],
          debts: fullResponse?.debts || [],
          goals: fullResponse?.goals || null,
          skills: fullResponse?.skills || null,
          usedUserData: true,
          tokensSaved,
          routingDecision,
          responseSource
        });
        
        // Update user data if extracted
        if (fullResponse.financialInfo || fullResponse.assets || fullResponse.debts || 
            fullResponse.goals || fullResponse.skills) {
          try {
            await updateUserDataFromAI(userId, fullResponse);
            logger.info("📝 SMART CHAT: Updated user data from AI extraction", {userId});
          } catch (updateError) {
            logger.warn("⚠️ SMART CHAT: Failed to update user data from AI", {
              userId,
              error: updateError.message
            });
          }
        }
      }
    }
    // LAYER 2c: Handle plan generation (user data needed + plan creation)
    else if (routingDecision.needsUserData && routingDecision.needsPlan) {
      logger.info("📋 SMART CHAT: Plan generation requested - loading context", {
        userId,
        messageType: routingDecision.messageType
      });
      
      // Load user context if not already provided
      if (!userContext) {
        logger.info("📊 SMART CHAT: Loading user context for plan generation", {userId});
        try {
          userContext = await getAIContextData(userId);
          logger.info("✅ SMART CHAT: User context loaded for plan generation", {
            userId,
            hasFinancialInfo: !!(userContext?.financialInfo),
            hasGoals: !!(userContext?.goals)
          });
        } catch (contextError) {
          logger.warn("⚠️ SMART CHAT: Failed to load user context for plan", {
            userId,
            error: contextError.message
          });
          userContext = null;
        }
      }
      
      // Check if user context is available for plan generation
      if (!userContext) {
        logger.info("❓ SMART CHAT: No user context for plan, prompting for details", {userId});
        responseSource = "prompt";
        response = new SmartChatResponse({
          message: "I'd love to create a financial plan for you! To generate a personalized plan, I'll need some information about your financial situation and goals. Could you share details about your income, expenses, and what you're trying to achieve?",
          usedUserData: false,
          tokensSaved: 800, // Saved by not generating plan
          routingDecision,
          responseSource
        });
      } else {
        // Generate financial plan
        logger.info("🎯 SMART CHAT: Generating financial plan with user data", {userId});
        responseSource = "plan";
        tokensSaved = 0; // No savings for plan generation (it's complex)
        
        // For now, return a plan generation response
        // TODO: Integrate with actual plan generation function
        response = new SmartChatResponse({
          message: "I'm working on creating a comprehensive financial plan based on your profile and goals. This will include specific steps, milestones, and recommendations tailored to your situation. Plan generation is currently being implemented.",
          usedUserData: true,
          tokensSaved,
          routingDecision,
          responseSource
        });
      }
    }
    
    const duration = Date.now() - startTime;
    
    // Log the conversation
    await logSmartConversation(userId, {
      sessionId,
      userMessage: inputText,
      aiResponse: response.message,
      routingDecision,
      usedUserData: response.usedUserData,
      tokensSaved: response.tokensSaved,
      responseSource,
      confidence: routingDecision.confidence,
      duration
    });
    
    logger.info("🎉 SMART CHAT: Completed successfully", {
      userId,
      inputMessage: inputText.substring(0, 50),
      duration: `${duration}ms`,
      usedUserData: response.usedUserData,
      tokensSaved: response.tokensSaved,
      responseSource,
      routingMethod: routingDecision.routingMethod,
      messageType: routingDecision.messageType,
      finalDecision: response.usedUserData ? "LOADED USER DATA" : "NO USER DATA LOADED"
    });
    
    return response;
    
  } catch (error) {
    logger.error("Error in smart chat", {error: error.message, userId});
    
    // Safe fallback
    return new SmartChatResponse({
      message: "I apologize, but I'm experiencing technical difficulties. Please try rephrasing your question about financial planning.",
      financialInfo: null,
      assets: [],
      debts: [],
      goals: null,
      skills: null,
      usedUserData: false,
      tokensSaved: 0,
      routingDecision: {error: "System error"},
      responseSource: "fallback"
    });
  }
};

/**
 * Firebase function for smart chat
 */
export const handleSmartChatMessage = onCall({
  secrets: [openaiApiKey],
  timeoutSeconds: 60,
  memory: "1GiB"
}, async (request) => {
  logger.info("Smart chat message function called");

  // Validate authentication
  const uid = validateAuth(request);
  const {message, sessionId, clientTimestamp} = request.data;

  if (!message) {
    throw new Error("Message is required");
  }

  try {
    logger.info("📞 SMART CHAT: Function called", {
      uid,
      message: message.substring(0, 100),
      hasSessionId: !!sessionId
    });

    // IMPORTANT: Don't load user context yet - let the router decide first!
    // Execute smart chat which will route first, then load context only if needed
    // Conversation history is now loaded from Firestore automatically
    const response = await smartChatInvoke(message, uid, null, sessionId);

    return {
      success: true,
      data: {
        message: response.message,
        financialInfo: response.financialInfo,
        assets: response.assets,
        debts: response.debts,
        goals: response.goals,
        skills: response.skills,
        
        // Smart routing metadata
        usedUserData: response.usedUserData,
        tokensSaved: response.tokensSaved,
        routingDecision: response.routingDecision,
        responseSource: response.responseSource
      }
    };

  } catch (error) {
    logger.error("Smart chat message error:", error);
    throw new Error("Failed to process chat message");
  }
});

/**
 * Get smart chat statistics
 */
export const getSmartChatStats = onCall(async (request) => {
  const uid = validateAuth(request);

  return {
    success: true,
    data: {
      ...getRoutingStats(),
      description: "Smart three-layer chat system",
      layers: {
        routing: "GPT-3.5-turbo, ~200 tokens",
        general: "GPT-3.5-turbo, ~500 tokens", 
        full: "GPT-4, ~1000+ tokens",
        plan: "GPT-4, ~1500+ tokens"
      },
      estimatedSavings: "30-70% overall token reduction"
    }
  };
}); 