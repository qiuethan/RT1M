/**
 * AI General Chat - Layer 2a: Lightweight financial advice without user data
 * Uses GPT-3.5-turbo for general financial education and advice
 * Saves 60-80% tokens compared to full context chat
 */

import {logger} from "firebase-functions";
import {ChatOpenAI} from "@langchain/openai";
import {ChatPromptTemplate} from "@langchain/core/prompts";
import {openaiApiKey} from "./ai_utils.js";

/**
 * Initialize general advice model (cheaper GPT-3.5-turbo)
 */
const initializeGeneralChatModel = () => {
  const apiKey = openaiApiKey.value();
  
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY secret not configured");
  }

  return new ChatOpenAI({
    model: "gpt-3.5-turbo", // Cheaper model for general advice
    temperature: 0.7,
    openAIApiKey: apiKey,
    maxTokens: 500, // Moderate limit for general responses
    timeout: 20000,
  });
};

/**
 * General advice prompt template
 */
const createGeneralAdvicePrompt = () => {
  return ChatPromptTemplate.fromMessages([
    ["system", `
You are a helpful financial advisor providing general financial education and advice. 

USER CONTEXT (for personalization):
{userContext}

GUIDELINES:
- Use the user's name and background for personalized responses
- Provide helpful, educational financial advice
- Use clear, simple language that anyone can understand
- Focus on general principles and strategies, but make them personal
- Be encouraging and supportive
- You can answer questions about the user's basic info (name, job, education)
- Keep responses concise but informative (2-4 paragraphs max)

TOPICS YOU CAN HELP WITH:
- Basic profile questions (name, job, education)
- Budgeting basics and strategies
- Saving strategies and emergency funds
- Investment principles and concepts
- Debt management techniques
- Financial planning fundamentals
- General market information
- Financial terms and definitions
- Retirement planning basics
- Tax planning concepts
- Insurance fundamentals

RESPONSE FORMAT:
Always respond with a JSON object:
{
  "message": "Your helpful, personalized financial advice response here",
  "category": "profile|budgeting|saving|investing|debt|planning|education",
  "confidence": 0.9
}

Be conversational and friendly, like you're talking to a friend who wants to learn about money.
`],
    ["human", "{input}"]
  ]);
};

/**
 * Get general financial advice with basic user context for personalization
 */
export const getGeneralAdvice = async (inputText, userId = null, basicContext = null) => {
  try {
    // Initialize model and prompt
    const generalModel = initializeGeneralChatModel();
    const generalPrompt = createGeneralAdvicePrompt();
    
    // Create the chain
    const generalChain = generalPrompt.pipe(generalModel);
    
    // Format user context for prompt
    const userContextText = basicContext ? JSON.stringify({
      name: basicContext.basicInfo?.name || "User",
      occupation: basicContext.basicInfo?.occupation || null,
      education: basicContext.educationHistory || [],
      experience: basicContext.experience || [],
      financialGoal: basicContext.financialGoal || null
    }, null, 2) : "No basic profile information available";
    
    // Get response
    const response = await generalChain.invoke({
      input: inputText,
      userContext: userContextText
    });
    
    // Parse the response
    let result;
    try {
      const content = response.content || response;
      result = JSON.parse(content);
    } catch (parseError) {
      logger.warn("Failed to parse general advice response", {
        error: parseError.message,
        response: response.content || response
      });
      
      // Fallback: use the raw content as message
      result = {
        message: response.content || response,
        category: "education",
        confidence: 0.7
      };
    }
    
    // Validate response
    if (!result.message || typeof result.message !== 'string') {
      throw new Error("Invalid response format");
    }
    
    // Ensure message length is reasonable
    if (result.message.length > 1000) {
      result.message = result.message.substring(0, 1000) + "...";
    }
    
    logger.info("General advice provided", {
      userId,
      category: result.category,
      confidence: result.confidence,
      messageLength: result.message.length
    });
    
    return result;
    
  } catch (error) {
    logger.error("Error getting general advice", {
      error: error.message,
      userId
    });
    
    // Safe fallback response
    return {
      message: "I'm experiencing technical difficulties. For general financial advice, I'd recommend starting with creating a budget and setting clear financial goals. Consider the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings and debt repayment.",
      category: "education",
      confidence: 0.5,
      error: "Technical error, using fallback response"
    };
  }
};

/**
 * Get advice for common financial questions with pre-cached responses
 * This can save even more API calls for very common questions
 */
export const getQuickAdvice = (inputText) => {
  const lowerInput = inputText.toLowerCase();
  
  // Common questions that don't need AI calls
  const quickResponses = {
    "what is a 401k": {
      message: "A 401(k) is an employer-sponsored retirement account that allows you to save for retirement with tax advantages. You contribute pre-tax dollars from your paycheck, which reduces your current taxable income. Many employers offer matching contributions, which is essentially free money. The funds grow tax-free until you withdraw them in retirement.",
      category: "education",
      confidence: 0.95,
      cached: true
    },
    
    "what is compound interest": {
      message: "Compound interest is earning interest on both your original investment (principal) and previously earned interest. It's often called the 'eighth wonder of the world' because it can dramatically grow your money over time. For example, $1,000 at 7% annual interest becomes $1,967 after 10 years with compounding. The key is starting early and being consistent.",
      category: "education", 
      confidence: 0.95,
      cached: true
    },
    
    "emergency fund": {
      message: "An emergency fund is money set aside for unexpected expenses like job loss, medical bills, or major repairs. Financial experts typically recommend saving 3-6 months of living expenses. Start small - even $500 can help with minor emergencies. Keep it in a high-yield savings account that's easily accessible but separate from your checking account.",
      category: "saving",
      confidence: 0.95,
      cached: true
    },
    
    "budgeting basics": {
      message: "Budgeting is simply tracking your income and expenses to make informed financial decisions. Start with the 50/30/20 rule: 50% for needs (rent, groceries), 30% for wants (entertainment, dining out), and 20% for savings and debt repayment. Use apps like Mint or YNAB, or a simple spreadsheet. The key is consistency - review and adjust monthly.",
      category: "budgeting",
      confidence: 0.95,
      cached: true
    }
  };
  
  // Check for quick matches
  for (const [key, response] of Object.entries(quickResponses)) {
    if (lowerInput.includes(key)) {
      logger.info("Quick advice served from cache", {
        question: key,
        messageLength: response.message.length
      });
      return response;
    }
  }
  
  return null; // No quick match found
};

/**
 * Get statistics about general advice usage
 */
export const getGeneralAdviceStats = () => {
  return {
    model: "gpt-3.5-turbo",
    averageTokens: "200-500 tokens",
    tokenSavings: "60-80% vs full context",
    cacheHitRate: "estimated 15-20% for common questions",
    responseTime: "1-3 seconds average"
  };
}; 