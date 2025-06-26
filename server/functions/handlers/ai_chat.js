import {onCall} from "firebase-functions/v2/https";
import {logger} from "firebase-functions";
import {validateAuth} from "../utils/auth.js";
import {ChatPromptTemplate} from "@langchain/core/prompts";
import {
  initializeChatModel,
  openaiApiKey,
  generateSessionId,
  checkPlanReadiness
} from "./ai_utils.js";
import {getAIContextData, formatUserProfileForAI} from "./ai_context.js";
import {updateUserDataFromAI} from "./ai_data_updates.js";
import admin from "firebase-admin";

/**
 * Log AI conversation for analytics and improvement
 */
const logConversation = async (uid, conversationData) => {
  try {
    const db = admin.firestore();
    const conversationRef = db.collection("users").doc(uid)
      .collection("ai_conversations").doc();

    const conversationLog = {
      userId: uid,
      sessionId: conversationData.sessionId || "unknown",
      userMessage: conversationData.userMessage,
      aiResponse: conversationData.aiResponse?.message || conversationData.aiResponse,
      extractedData: conversationData.extractedData || null,
      confidence: conversationData.confidence || null,
      clientTimestamp: conversationData.clientTimestamp || null,
      serverTimestamp: admin.firestore.FieldValue.serverTimestamp(),
    };

    await conversationRef.set(conversationLog);
    logger.info(`AI conversation logged for UID: ${uid}`, {
      sessionId: conversationData.sessionId,
      hasExtractedData: !!conversationData.extractedData,
    });

    return {success: true, logId: conversationRef.id};
  } catch (error) {
    logger.error("Error logging AI conversation:", error);
    return {success: false, error: error.message};
  }
};

/**
 * Create chat prompt template for AI conversations
 */
const createChatPromptTemplate = () => {
  return ChatPromptTemplate.fromTemplate(`
You are a knowledgeable and friendly AI assistant focused on personal finance and wealth building. Think of yourself as a helpful friend who happens to know a lot about money, investing, and financial planning.

User Profile Context:
{userProfile}

Previous conversation context:
{conversationHistory}

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
    "currentSavings": number,
    
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

ASSET TYPE MAPPING - Use these exact types:
- "savings" for: TFSA, savings accounts, cash, GICs, money market
- "retirement" for: RRSP, 401k, IRA, pension, retirement accounts  
- "real-estate" for: houses, properties, real estate
- "stocks" for: stocks, equities, investment accounts, brokerage accounts
- "bonds" for: bonds, fixed income investments
- "crypto" for: Bitcoin, Ethereum, cryptocurrency
- "business" for: business investments, company ownership
- "other" for: cars, jewelry, art, collectibles

DEBT TYPE MAPPING - Use these exact types:
- "mortgage" for: home loans, mortgages
- "credit-card" for: credit cards, store cards
- "student-loan" for: education loans, student debt
- "car-loan" for: auto loans, vehicle financing
- "personal-loan" for: personal loans, lines of credit
- "business-loan" for: business debt, commercial loans
- "other" for: other types of debt

Example responses:

Basic conversation (no data extraction):
{{
  "message": "That's awesome that you're thinking about investing! The stock market can seem intimidating at first, but starting with index funds is actually a really smart approach. They're diversified, low-cost, and historically perform well over time. Have you looked into any specific brokerages yet?",
  "financialInfo": null,
  "assets": [],
  "debts": [],
  "goals": null,
  "skills": null
}}

Financial info extraction:
{{
  "message": "Wow, $75k is a solid income! You're definitely in a good position to build wealth. With $50k already saved, you've got a great emergency fund foundation. The key now is making that money work for you - have you considered how much you want to allocate between safe savings and growth investments?",
  "financialInfo": {{
    "annualIncome": 75000,
    "currentSavings": 50000
  }},
  "assets": [],
  "debts": [],
  "goals": null,
  "skills": null
}}

Asset extraction (TFSA example):
{{
  "message": "Nice! A $10,000 TFSA is a great start for tax-free savings in Canada. TFSAs are fantastic because any growth is completely tax-free. Have you maxed out your contribution room, or do you have space to add more? You could also consider what investments to hold inside the TFSA - maybe some index funds for long-term growth?",
  "financialInfo": null,
  "assets": [{{
    "name": "TFSA Account",
    "type": "savings",
    "value": 10000,
    "description": "Tax-Free Savings Account"
  }}],
  "debts": [],
  "goals": null,
  "skills": null
}}

Multiple assets example:
{{
  "message": "Wow, you're in a really solid financial position! A $400k house with only $300k left on the mortgage means you have $100k in equity - that's fantastic. Plus $25k in your 401k is a great foundation for retirement. Have you thought about increasing your 401k contributions, especially if your employer offers matching?",
  "financialInfo": null,
  "assets": [{{
    "name": "Primary Home",
    "type": "real-estate", 
    "value": 400000,
    "description": "Primary residence"
  }}, {{
    "name": "401k Account",
    "type": "retirement",
    "value": 25000,
    "description": "Employer 401k plan"
  }}],
  "debts": [{{
    "name": "Mortgage",
    "type": "mortgage",
    "balance": 300000,
    "interestRate": 3.2,
    "description": "Home mortgage"
  }}],
  "goals": null,
  "skills": null
}}

CRITICAL RULES:
1. ONLY extract data that is explicitly mentioned with specific numbers
2. Use the EXACT type values from the mapping above
3. For TFSA, RRSP, GIC → use type "savings" or "retirement" as appropriate
4. For investment/brokerage accounts → use type "stocks" 
5. Always include "name", "type", and "value"/"balance" for assets/debts
6. Set financialInfo, goals, skills to null when no data to extract
7. Set assets and debts to empty arrays [] when no data to extract (never null)
8. Don't calculate totals - let the system handle that automatically

Keep it natural, helpful, and conversational while following the exact schema!
`);
};

/**
 * Handle chat message with AI processing and data extraction
 */
export const handleChatMessage = onCall({
  secrets: [openaiApiKey]
}, async (request) => {
  const uid = validateAuth(request);
  const {
    message,
    sessionId = generateSessionId(),
    conversationHistory = [],
    timestamp,
  } = request.data;

  if (!message) {
    throw new Error("Message is required");
  }

  try {
    logger.info(`Chat message received for UID: ${uid}`, {
      messageLength: message.length,
      sessionId,
      hasHistory: conversationHistory.length > 0,
    });

    // Get user context for AI
    const userContext = await getAIContextData(uid);
    const userProfile = formatUserProfileForAI(userContext);

    // Initialize the chat model
    const model = initializeChatModel();
    const promptTemplate = createChatPromptTemplate();

    // Format conversation history
    const formattedHistory = conversationHistory
      .slice(-5) // Keep last 5 exchanges
      .map(entry => `User: ${entry.user}\nAssistant: ${entry.assistant}`)
      .join("\n\n");

    // Generate AI response
    const chain = promptTemplate.pipe(model);
    const response = await chain.invoke({
      userProfile,
      conversationHistory: formattedHistory || "No previous conversation.",
      message,
    });

    // Parse the structured response
    let structuredResponse;
    try {
      structuredResponse = JSON.parse(response.content);
    } catch (parseError) {
      logger.error("Failed to parse AI response as JSON:", parseError);
      // Fallback response
      structuredResponse = {
        message: response.content || "I'm sorry, I had trouble processing that. Could you try rephrasing your question?",
        financialInfo: null,
        assets: [],
        debts: [],
        goals: null,
        skills: null
      };
    }

    // Validate response structure
    if (!structuredResponse.message) {
      structuredResponse.message = "I'm here to help with your financial questions!";
    }

    // Process extracted data if any
    let updatedSections = {};
    let confidence = 0;
    
    if (structuredResponse.financialInfo || structuredResponse.assets || structuredResponse.debts || structuredResponse.goals || structuredResponse.skills) {
      // No transformation needed - AI now outputs exact database schema
      const extractedData = {
        financialInfo: structuredResponse.financialInfo,
        assets: structuredResponse.assets,
        debts: structuredResponse.debts,
        goals: structuredResponse.goals,
        skills: structuredResponse.skills
      };

      logger.info(`Extracted data for UID: ${uid}`, {
        hasFinancialInfo: !!extractedData.financialInfo,
        assetsCount: extractedData.assets?.length || 0,
        debtsCount: extractedData.debts?.length || 0,
        goalsCount: extractedData.goals?.length || 0,
        hasSkills: !!extractedData.skills,
      });

      // Update user data with extracted information
      const updateResult = await updateUserDataFromAI({
        data: {
          extractedData,
          sessionId,
          source: "ai_chat"
        },
        auth: {uid}
      });
      
      updatedSections = updateResult.data?.updatedSections || {};
      confidence = updateResult.data?.confidence || 0;
    }

    // Log the conversation
    await logConversation(uid, {
      sessionId,
      userMessage: message,
      aiResponse: structuredResponse,
      extractedData: updatedSections,
      confidence,
      clientTimestamp: timestamp,
    });

    // Check if user is ready for plan generation (30% chance suggestion)
    const shouldSuggestPlan = Math.random() < 0.3 && checkPlanReadiness(userContext);

    return {
      success: true,
      message: structuredResponse.message,
      sessionId,
      extractedData: updatedSections,
      confidence,
      suggestPlanGeneration: shouldSuggestPlan,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };
  } catch (error) {
    logger.error("Error in handleChatMessage:", error);
    throw new Error("Failed to process chat message");
  }
}); 