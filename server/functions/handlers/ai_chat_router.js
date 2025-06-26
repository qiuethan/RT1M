/**
 * AI Chat Router - Layer 1: Determines if user data is needed
 * This saves tokens by only loading full user context when necessary
 * Uses GPT-3.5-turbo for fast, cheap routing decisions
 */

import {logger} from "firebase-functions";
import {ChatOpenAI} from "@langchain/openai";
import {ChatPromptTemplate} from "@langchain/core/prompts";
import {openaiApiKey} from "./ai_utils.js";

// Security configurations
const MAX_INPUT_LENGTH = 2000;
const SENSITIVE_PATTERNS = [
  /\b(?:api[_-]?key|secret|password|token|credential|auth[_-]?token)\b/i,
  /\b[A-Za-z0-9]{20,}\b/, // Long strings that might be keys
  /\$\{.*?\}/, // Environment variable patterns
  /-----BEGIN.*?-----/, // Certificate patterns
  /Bearer\s+[A-Za-z0-9\-_]+/i, // Bearer tokens
  /<script.*?>.*?<\/script>/i, // Script tags
  /javascript:/i, // JavaScript protocols
];

/**
 * Router decision schema
 */
const RouterDecision = {
  needsUserData: false,
  messageType: "general", // general, personal, financial, goal_setting
  simpleResponse: "",
  confidence: 0.8
};

/**
 * Initialize router model (cheaper GPT-3.5-turbo)
 */
const initializeRouterModel = () => {
  const apiKey = openaiApiKey.value();
  
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY secret not configured");
  }

  return new ChatOpenAI({
    model: "gpt-3.5-turbo", // Cheaper and faster for routing
    temperature: 0.1, // Low temperature for consistent routing
    openAIApiKey: apiKey,
    maxTokens: 200, // Small token limit for routing
    timeout: 15000,
  });
};

/**
 * Router prompt template
 */
const createRouterPrompt = () => {
  return ChatPromptTemplate.fromTemplate(`
You are a smart routing assistant for a financial planning chatbot. You have access to basic user profile info for personalization and conversation history for context.

USER PROFILE (for personalization):
{userProfile}

CONVERSATION HISTORY (for context):
{conversationHistory}

ROUTING RULES:
- needsUserData = false: General financial concepts, definitions, educational content
- needsUserData = true: Questions about THEIR data/information, personalized advice, financial analysis

CRITICAL EXAMPLES:
"What information do you have on me?" → needsUserData = true (asking about THEIR data)
"What do you know about me?" → needsUserData = true (asking about THEIR profile)
"Tell me about my situation" → needsUserData = true (asking about THEIR context)
"How much should I save?" → needsUserData = true (needs THEIR financial context)

IMPORTANT: Basic profile is for greetings only. Any question about "my X" or "what do you know" needs full context.

CONTEXT RULES:
- If recent messages show user was asking about their data/situation, simple followups like "yes", "tell me more", "what else" should also use needsUserData = true
- If recent messages were general advice, simple followups can stay general
- Look at the conversation flow to understand what the user is asking about

USER MESSAGE: {input}

Respond with ONLY a JSON object:
{{
  "needsUserData": true/false,
  "needsPlan": false,
  "messageType": "general|personal", 
  "simpleResponse": "response for needsUserData=false, empty for needsUserData=true",
  "confidence": 0.8
}}

Examples:

"hi" → {{"needsUserData": false, "needsPlan": false, "messageType": "general", "simpleResponse": "Hello [Name]! Good to see you. How can I help with your financial goals today?", "confidence": 0.99}}

"What is investing?" → {{"needsUserData": false, "needsPlan": false, "messageType": "general", "simpleResponse": "Investing is putting money into assets to grow wealth over time. Given your background in [field], you might be interested in...", "confidence": 0.95}}

"How much should I save?" → {{"needsUserData": true, "needsPlan": false, "messageType": "personal", "simpleResponse": "", "confidence": 0.9}}

"What information do you have on me?" → {{"needsUserData": true, "needsPlan": false, "messageType": "personal", "simpleResponse": "", "confidence": 0.95}}

"What do you know about me?" → {{"needsUserData": true, "needsPlan": false, "messageType": "personal", "simpleResponse": "", "confidence": 0.95}}

CONTEXT EXAMPLES:

Previous: "What information do you have on me?" (needsUserData=true)
Current: "tell me more" → {{"needsUserData": true, "needsPlan": false, "messageType": "personal", "simpleResponse": "", "confidence": 0.9}}

Previous: "What is investing?" (needsUserData=false) 
Current: "yes" → {{"needsUserData": false, "needsPlan": false, "messageType": "general", "simpleResponse": "Great! Is there a specific aspect of investing you'd like to explore further?", "confidence": 0.85}}
`);
};

/**
 * Sanitize input text
 */
const sanitizeInput = (text) => {
  if (!text || typeof text !== 'string') {
    throw new Error("Input must be a non-empty string");
  }
  
  if (text.length > MAX_INPUT_LENGTH) {
    throw new Error(`Input too long. Maximum ${MAX_INPUT_LENGTH} characters allowed`);
  }
  
  // Check for sensitive patterns
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error("Input contains potentially sensitive information");
    }
  }
  
  return text.trim();
};

/**
 * Route chat message to determine if user data is needed
 */
export const routeChatMessage = async (inputText, userId = null, userContext = null, conversationHistory = []) => {
  const startTime = Date.now();
  
  try {
    logger.info("🚦 ROUTER: Starting message routing", {
      userId,
      message: inputText,
      messageLength: inputText.length
    });

    // Use AI router for all messages - it should be smart enough

    // Sanitize input
    const cleanInput = sanitizeInput(inputText);
    
    logger.info("🤖 ROUTER: Calling AI for routing decision", {
      userId,
      cleanInput: cleanInput,
      hasHistory: conversationHistory && conversationHistory.length > 0,
      historyLength: conversationHistory?.length || 0
    });

    // Initialize router model
    const routerModel = initializeRouterModel();
    const routerPrompt = createRouterPrompt();
    
    // Create the router chain
    const routerChain = routerPrompt.pipe(routerModel);
    
    // Prepare context for router
    const userProfile = userContext ? {
      name: userContext.basicInfo?.name || "User",
      financialGoal: userContext.financialGoal || null,
      hasBasicInfo: !!userContext.basicInfo
    } : "No profile data available";

    // Format conversation history for context
    const formattedHistory = conversationHistory && conversationHistory.length > 0
      ? conversationHistory
          .slice(-3) // Keep last 3 exchanges for context
          .map(entry => `User: ${entry.user || entry.userMessage || 'Unknown'}\nAssistant: ${entry.assistant || entry.aiResponse || 'Unknown'}`)
          .join("\n\n")
      : "No previous conversation.";

    // Get routing decision
    const response = await routerChain.invoke({
      input: cleanInput,
      userProfile: JSON.stringify(userProfile, null, 2),
      conversationHistory: formattedHistory,
      userPlans: "Plans not loaded for routing"
    });
    
    logger.info("🤖 ROUTER: AI response received", {
      userId,
      responseContent: response.content || response
    });
    
    // Parse the response
    let decision;
    try {
      const content = response.content || response;
      decision = JSON.parse(content);
      
      logger.info("✅ ROUTER: Successfully parsed AI response", {
        userId,
        needsUserData: decision.needsUserData,
        messageType: decision.messageType,
        hasSimpleResponse: !!decision.simpleResponse,
        confidence: decision.confidence
      });
      
    } catch (parseError) {
      logger.warn("⚠️ ROUTER: Failed to parse AI response, using fallback", {
        userId,
        error: parseError.message,
        response: response.content || response
      });
      
      // Fallback: assume user data needed to be safe
      decision = {
        needsUserData: true,
        messageType: "general",
        simpleResponse: "",
        confidence: 0.5,
        routingMethod: "parse_error_fallback"
      };
    }
    
    // Validate decision structure
    if (typeof decision.needsUserData !== 'boolean') {
      logger.warn("⚠️ ROUTER: Invalid needsUserData type, defaulting to true", {
        userId,
        needsUserDataValue: decision.needsUserData
      });
      decision.needsUserData = true; // Safe default
    }
    
    const duration = Date.now() - startTime;
    decision.routingMethod = decision.routingMethod || "ai_decision";
    
    logger.info("🎯 ROUTER: Final routing decision", {
      userId,
      inputMessage: inputText,
      needsUserData: decision.needsUserData,
      messageType: decision.messageType,
      confidence: decision.confidence,
      routingMethod: decision.routingMethod,
      duration: `${duration}ms`,
      tokensSavedEstimate: decision.needsUserData ? 0 : 600,
      hasConversationHistory: conversationHistory && conversationHistory.length > 0,
      conversationHistoryLength: conversationHistory?.length || 0,
      lastUserMessage: conversationHistory?.length > 0 ? conversationHistory[conversationHistory.length - 1]?.user?.substring(0, 50) : "N/A"
    });
    
    return decision;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error("❌ ROUTER: Error during routing", {
      userId,
      error: error.message,
      inputMessage: inputText,
      duration: `${duration}ms`
    });
    
    // Safe fallback - assume user data needed
    return {
      needsUserData: true,
      messageType: "general",
      simpleResponse: "",
      confidence: 0.3,
      error: "Routing failed, defaulting to full context",
      routingMethod: "error_fallback"
    };
  }
};

/**
 * Get routing statistics (for monitoring)
 */
export const getRoutingStats = () => {
  return {
    description: "Smart routing saves 30-70% tokens",
    generalAdvice: "Uses GPT-3.5-turbo, ~200 tokens",
    personalAdvice: "Uses GPT-4, ~1000+ tokens", 
    estimatedSavings: "60-80% for general questions"
  };
}; 