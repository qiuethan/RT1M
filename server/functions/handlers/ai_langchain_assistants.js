/**
 * LangChain OpenAI Assistants Integration for RT1M
 * Replaces existing chat models with configured OpenAI Assistants
 */

import {OpenAI} from "openai";
import {logger} from "firebase-functions";
import {defineSecret} from "firebase-functions/params";
import admin from "firebase-admin";

// Import necessary functions from existing modules
import {loadBasicUserContext, loadConversationHistory} from "./ai_smart_chat.js";

/**
 * Load comprehensive user context for AI processing
 * Replacement for deleted getAIContextData function
 */
const getAIContextData = async (userId) => {
  try {
    const db = admin.firestore();
    
    // Get all user data
    const [profileDoc, financialDoc, goalsDoc, skillsDoc] = await Promise.all([
      db.collection("users").doc(userId).collection("profile").doc("data").get(),
      db.collection("users").doc(userId).collection("financials").doc("data").get(),
      db.collection("users").doc(userId).collection("goals").doc("data").get(),
      db.collection("users").doc(userId).collection("skills").doc("data").get()
    ]);

    // Build comprehensive context
    const context = {
      // Personal Information
      personalInfo: profileDoc.exists ? profileDoc.data()?.basicInfo || {} : {},
      educationHistory: profileDoc.exists ? profileDoc.data()?.educationHistory || [] : [],
      experience: profileDoc.exists ? profileDoc.data()?.experience || [] : [],
      
      // Financial Goal & Information
      financialGoal: profileDoc.exists ? profileDoc.data()?.financialGoal || {} : {},
      financialInfo: financialDoc.exists ? financialDoc.data()?.financialInfo || {} : {},
      
      // Assets and Debts
      assets: financialDoc.exists ? financialDoc.data()?.assets || [] : [],
      debts: financialDoc.exists ? financialDoc.data()?.debts || [] : [],
      
      // Goals and Skills
      currentGoals: goalsDoc.exists ? goalsDoc.data()?.intermediateGoals || [] : [],
      skills: skillsDoc.exists ? skillsDoc.data()?.skillsAndInterests?.skills || [] : [],
      interests: skillsDoc.exists ? skillsDoc.data()?.skillsAndInterests?.interests || [] : [],
      
      // Metadata for AI decision making
      dataCompleteness: {
        hasBasicInfo: !!(profileDoc.exists && profileDoc.data()?.basicInfo?.name),
        hasFinancialInfo: !!(financialDoc.exists && financialDoc.data()?.financialInfo?.annualIncome),
        hasAssets: (financialDoc.exists ? financialDoc.data()?.assets?.length || 0 : 0) > 0,
        hasDebts: (financialDoc.exists ? financialDoc.data()?.debts?.length || 0 : 0) > 0,
        hasGoals: (goalsDoc.exists ? goalsDoc.data()?.intermediateGoals?.length || 0 : 0) > 0,
        hasSkills: (skillsDoc.exists ? skillsDoc.data()?.skillsAndInterests?.skills?.length || 0 : 0) > 0,
        hasEducation: (profileDoc.exists ? profileDoc.data()?.educationHistory?.length || 0 : 0) > 0,
        hasExperience: (profileDoc.exists ? profileDoc.data()?.experience?.length || 0 : 0) > 0,
      },
    };

    logger.info("📋 AI CONTEXT: Loaded comprehensive user data", {
      userId,
      hasPersonalInfo: !!context.personalInfo.name,
      hasFinancialInfo: !!context.financialInfo.annualIncome,
      assetsCount: context.assets.length,
      debtsCount: context.debts.length,
      goalsCount: context.currentGoals.length,
      skillsCount: context.skills.length
    });

    return context;
  } catch (error) {
    logger.error("❌ Failed to load AI context data", {
      userId,
      error: error.message
    });
    return {};
  }
};

// Define assistant ID secrets
export const routerAssistantId = defineSecret("ROUTER_ASSISTANT_ID");
export const contextAssistantId = defineSecret("CONTEXT_ASSISTANT_ID");
export const planAssistantId = defineSecret("PLAN_ASSISTANT_ID");

// Get assistant IDs from Firebase secrets
const getAssistantId = (name) => {
  const secretMap = {
    "router_id": routerAssistantId,
    "context_id": contextAssistantId,
    "plan_id": planAssistantId
  };
  
  const secret = secretMap[name];
  const value = secret?.value();
  
  logger.info(`🔧 CONFIG: Using secret ${name}`, {
    hasValue: !!value,
    assistantId: value ? value.substring(0, 10) + "..." : "NOT_CONFIGURED"
  });
  
  return value || "";
};

// Note: No separate GENERAL_ASSISTANT_ID needed - router handles general responses

/**
 * Initialize OpenAI client for assistants
 */
export const initializeAssistantClient = (apiKey) => {
  return new OpenAI({
    apiKey: apiKey
  });
};

/**
 * Run OpenAI Assistant with message and context
 */
const runAssistant = async (client, assistantId, message, context = {}, userId = null) => {
  const startTime = Date.now();
  
  try {
    logger.info(`🤖 ASSISTANT: Starting ${assistantId}`, {
      userId,
      messageLength: message?.length || 0,
      hasContext: Object.keys(context).length > 0
    });

    // Create thread
    const thread = await client.beta.threads.create();
    
    // Prepare context message (simplified for faster processing)
    let contextMessage = "";
    if (Object.keys(context).length > 0) {
      // Simplify context to reduce processing time
      const simplifiedContext = {
        ...context,
        // Remove verbose arrays for faster processing
        educationHistory: context.educationHistory?.length > 0 ? `${context.educationHistory.length} entries` : [],
        experience: context.experience?.length > 0 ? `${context.experience.length} entries` : [],
        assets: context.assets?.length > 0 ? `${context.assets.length} assets` : [],
        debts: context.debts?.length > 0 ? `${context.debts.length} debts` : [],
        currentGoals: context.currentGoals?.length > 0 ? `${context.currentGoals.length} goals` : []
      };
      contextMessage = `\n\nCONTEXT:\n${JSON.stringify(simplifiedContext, null, 2)}`;
    }
    
    // Add message to thread
    await client.beta.threads.messages.create(thread.id, {
      role: "user",
      content: `${message}${contextMessage}`
    });
    
    // Run assistant
    const run = await client.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId
    });
    
    // Wait for completion with timeout
    let runStatus = await client.beta.threads.runs.retrieve(thread.id, run.id);
    let attempts = 0;
    const maxAttempts = 120; // 120 seconds timeout (increased for complex processing)
    
    while ((runStatus.status === 'running' || runStatus.status === 'queued' || runStatus.status === 'in_progress') && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await client.beta.threads.runs.retrieve(thread.id, run.id);
      attempts++;
      
      // Log progress every 10 seconds
      if (attempts % 10 === 0) {
        logger.info(`🔄 ASSISTANT: Still processing ${assistantId.substring(0, 10)}`, {
          userId,
          status: runStatus.status,
          attempts: attempts,
          duration: `${Date.now() - startTime}ms`
        });
      }
    }
    
    const duration = Date.now() - startTime;
    
    if (runStatus.status === 'completed') {
      const messages = await client.beta.threads.messages.list(thread.id);
      const assistantMessage = messages.data[0];
      
      let response = null;
      
      // Handle different response types
      if (assistantMessage.content[0].type === 'text') {
        const textContent = assistantMessage.content[0].text.value;
        
        // Try to parse as JSON first
        try {
          response = JSON.parse(textContent);
          logger.info(`✅ ASSISTANT: JSON response parsed`, {
            userId,
            assistantId: assistantId.substring(0, 10),
            duration: `${duration}ms`,
            hasResponse: !!response
          });
        } catch (parseError) {
          // If not JSON, treat as plain text
          response = { message: textContent };
          logger.info(`📝 ASSISTANT: Text response`, {
            userId,
            assistantId: assistantId.substring(0, 10),
            duration: `${duration}ms`,
            responseLength: textContent.length
          });
        }
      }
      
      return response;
      
    } else if (runStatus.status === 'requires_action') {
      // Handle function calls
      const toolCalls = runStatus.required_action?.submit_tool_outputs?.tool_calls || [];
      
      if (toolCalls.length > 0) {
        logger.info(`🔧 ASSISTANT: Function calls required`, {
          userId,
          assistantId: assistantId.substring(0, 10),
          toolCallsCount: toolCalls.length
        });
        
        // For now, extract the function arguments as the response
        const functionCall = toolCalls[0];
        const functionArgs = JSON.parse(functionCall.function.arguments);
        
        logger.info(`✅ ASSISTANT: Function call response`, {
          userId,
          assistantId: assistantId.substring(0, 10),
          functionName: functionCall.function.name,
          duration: `${duration}ms`
        });
        
        return functionArgs;
      }
    }
    
    throw new Error(`Assistant run failed with status: ${runStatus.status} after ${duration}ms`);
    
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`❌ ASSISTANT: Error running ${assistantId}`, {
      userId,
      error: error.message,
      duration: `${duration}ms`
    });
    throw error;
  }
};

/**
 * Router Assistant - Route messages to appropriate layers
 */
export const routeWithAssistant = async (client, message, userContext = {}, conversationHistory = [], userId = null) => {
  try {
    const routerId = getAssistantId("router_id");
    if (!routerId) {
      throw new Error("ROUTER_ASSISTANT_ID not configured");
    }
    
    // Prepare context for router
    const routerContext = {
      userProfile: userContext,
      conversationHistory: conversationHistory.slice(-3), // Last 3 exchanges
      timestamp: new Date().toISOString()
    };
    
    const response = await runAssistant(
      client, 
      routerId, 
      message, 
      routerContext,
      userId
    );
    
    // Validate router response (matches new schema)
    if (!response || !response.route) {
      throw new Error("Invalid router response - missing route");
    }
    
    // For GENERAL routes, ensure we have a message from the router
    if (response.route === "GENERAL" && !response.response?.message) {
      throw new Error("Router must provide message for GENERAL route");
    }
    
    logger.info(`🚦 ROUTER: Decision made`, {
      userId,
      route: response.route,
      hasMessage: !!(response.response?.message),
      messagePreview: response.response?.message?.substring(0, 100) || "N/A"
    });
    
    return {
      route: response.route,
      message: response.response?.message || "",
      confidence: 0.9, // Fixed confidence since schema doesn't include it
      reasoning: "Router assistant decision"
    };
    
  } catch (error) {
    logger.error("❌ ROUTER: Assistant routing failed", {
      userId,
      error: error.message
    });
    
    // Fallback to safe routing
    return {
      route: "CONTEXT",
      message: "",
      confidence: 0.3,
      reasoning: "Router error - defaulting to context"
    };
  }
};

// Note: General Assistant removed - Router handles general responses directly

/**
 * Context Assistant - Handle personalized advice with data extraction
 */
export const getPersonalizedAdviceWithAssistant = async (client, message, userContext = {}, userId = null) => {
  try {
    const contextId = getAssistantId("context_id");
    if (!contextId) {
      throw new Error("CONTEXT_ASSISTANT_ID not configured");
    }
    
    // Prepare full context for personalized assistant
    const fullContext = {
      ...userContext,
      timestamp: new Date().toISOString()
    };
    
    const response = await runAssistant(
      client, 
      contextId, 
      message, 
      fullContext,
      userId
    );
    
    // Map context response to expected format (matches new schema)
    const financialInfo = {};
    if (response.income !== undefined) financialInfo.annualIncome = response.income;
    if (response.expenses !== undefined) financialInfo.annualExpenses = response.expenses;
    if (response.savings !== undefined) financialInfo.currentSavings = response.savings;
    
    // Map goals to intermediate goals format
    const intermediateGoals = response.goals?.map(goal => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      title: goal.title,
      type: goal.type,
      targetAmount: goal.amount || 0,
      targetDate: goal.date || null,
      status: goal.status || "Not Started",
      currentAmount: 0,
      progress: 0,
      description: goal.description || "",
      category: goal.category || goal.type
    })) || [];
    
    return {
      message: response.message || "I'd be happy to provide personalized advice based on your financial situation!",
      financialInfo: Object.keys(financialInfo).length > 0 ? financialInfo : null,
      assets: response.assets || [],
      debts: response.debts || [],
      goals: intermediateGoals.length > 0 ? intermediateGoals : null,
      skills: response.skills || null
    };
    
  } catch (error) {
    logger.error("❌ CONTEXT: Assistant failed", {
      userId,
      error: error.message
    });
    
    return {
      message: "I'm having trouble analyzing your situation right now, but I'm here to help with personalized financial advice!",
      financialInfo: null,
      assets: [],
      debts: [],
      goals: null,
      skills: null
    };
  }
};

/**
 * Plan Assistant - Generate comprehensive financial plans
 */
export const generatePlanWithAssistant = async (client, message, userContext = {}, userId = null) => {
  try {
    const planId = getAssistantId("plan_id");
    if (!planId) {
      throw new Error("PLAN_ASSISTANT_ID not configured");
    }
    
    // Prepare full context for plan generation
    const planContext = {
      ...userContext,
      requestType: "plan_generation",
      timestamp: new Date().toISOString()
    };
    
    const response = await runAssistant(
      client, 
      planId, 
      message, 
      planContext,
      userId
    );
    
    // Validate plan response (matches new schema - array of intermediate goals)
    if (!response.intermediateGoals || !Array.isArray(response.intermediateGoals)) {
      throw new Error("Invalid plan response - missing intermediateGoals array");
    }
    
    // Map each goal to include required IDs and defaults
    const processedGoals = response.intermediateGoals.map((goal, index) => ({
      id: Date.now().toString() + index.toString() + Math.random().toString(36).substr(2, 9),
      title: goal.title,
      type: goal.type,
      targetAmount: goal.targetAmount || 0,
      targetDate: goal.targetDate,
      status: goal.status || "Not Started",
      currentAmount: goal.currentAmount || 0,
      progress: goal.progress || 0,
      description: goal.description || "",
      category: goal.category || goal.type
    }));
    
    return {
      intermediateGoals: processedGoals
    };
    
  } catch (error) {
    logger.error("❌ PLAN: Assistant failed", {
      userId,
      error: error.message
    });
    
    throw new Error("Plan generation failed. Please try again with more specific details about your financial goals.");
  }
};

/**
 * Main assistant orchestrator - replaces smartChatInvoke
 */
export const assistantChatInvoke = async (inputText, userId, userContext = null, sessionId = null, apiKey) => {
  const startTime = Date.now();
  
  try {
    logger.info("🧠 ASSISTANT CHAT: Starting orchestration", {
      userId,
      messageLength: inputText.length,
      hasUserContext: !!userContext,
      sessionId
    });
    
    // Initialize OpenAI client
    const client = initializeAssistantClient(apiKey);
    
    // Load basic context and conversation history
    const [basicContext, conversationHistory] = await Promise.all([
      loadBasicUserContext(userId),
      loadConversationHistory(userId, 3)
    ]);
    
    // LAYER 1: Route the message
    const routingDecision = await routeWithAssistant(
      client, 
      inputText, 
      basicContext, 
      conversationHistory, 
      userId
    );
    
    let response;
    let responseSource;
    let tokensSaved = 0;
    
    // LAYER 2: Handle based on routing decision
    if (routingDecision.route === "GENERAL") {
      logger.info("✅ ASSISTANT: Using router response for general advice", {userId});
      
      // Router already provided the general response - no need for separate assistant
      responseSource = "router_assistant";
      tokensSaved = 800; // Major savings - no second assistant call needed
      
      response = {
        message: routingDecision.message || "I'd be happy to help with general financial advice!",
        financialInfo: null,
        assets: [],
        debts: [],
        goals: null,
        skills: null,
        usedUserData: false,
        tokensSaved,
        routingDecision,
        responseSource
      };
      
    } else if (routingDecision.route === "CONTEXT") {
      logger.info("🎯 ASSISTANT: Using personalized advice", {userId});
      
      // Load full user context if not provided
      if (!userContext) {
        userContext = await getAIContextData(userId);
      }
      
      const personalizedResponse = await getPersonalizedAdviceWithAssistant(
        client, 
        inputText, 
        userContext, 
        userId
      );
      
      responseSource = "context_assistant";
      tokensSaved = 0; // No savings for full context
      
      response = {
        message: personalizedResponse.message,
        financialInfo: personalizedResponse.financialInfo,
        assets: personalizedResponse.assets,
        debts: personalizedResponse.debts,
        goals: personalizedResponse.goals,
        skills: personalizedResponse.skills,
        usedUserData: true,
        tokensSaved,
        routingDecision,
        responseSource
      };
      
      // Update user data if extracted using existing database functions
      if (personalizedResponse.financialInfo || personalizedResponse.assets?.length || 
          personalizedResponse.debts?.length || personalizedResponse.goals || personalizedResponse.skills) {
        try {
          // Use existing updateUserDataFromAI function with proper wrapper
          await updateUserDataViaAssistant(userId, personalizedResponse);
          logger.info("📝 ASSISTANT: Updated user data from extraction", {
            userId,
            hasFinancialInfo: !!personalizedResponse.financialInfo,
            assetsCount: personalizedResponse.assets?.length || 0,
            debtsCount: personalizedResponse.debts?.length || 0,
            goalsCount: personalizedResponse.goals?.length || 0,
            skillsCount: personalizedResponse.skills?.length || 0
          });
        } catch (updateError) {
          logger.warn("⚠️ ASSISTANT: Failed to update user data", {
            userId,
            error: updateError.message
          });
        }
      }
      
    } else if (routingDecision.route === "PLAN") {
      logger.info("📋 ASSISTANT: Generating financial plan", {userId});
      
      // Load full user context if not provided
      if (!userContext) {
        userContext = await getAIContextData(userId);
      }
      
      const planResponse = await generatePlanWithAssistant(
        client, 
        inputText, 
        userContext, 
        userId
      );
      
      responseSource = "plan_assistant";
      tokensSaved = 0; // No savings for plan generation
      
      response = {
        message: `I've created a plan with ${planResponse.intermediateGoals?.length || 0} intermediate goals to help you achieve your financial objectives. These goals will guide your progress step by step.`,
        financialInfo: null,
        assets: [],
        debts: [],
        goals: planResponse.intermediateGoals, // The plan is the goals
        skills: null,
        plan: planResponse, // Include the full plan structure
        usedUserData: true,
        tokensSaved,
        routingDecision,
        responseSource
      };
      
      // Note: Plan data is returned to client - client will save via existing UI flows
      logger.info("💾 ASSISTANT: Plan generated - client will handle saving", {
        userId, 
        goalsCount: planResponse.intermediateGoals?.length
      });
    }
    
    const duration = Date.now() - startTime;
    
    logger.info("🎉 ASSISTANT CHAT: Completed successfully", {
      userId,
      route: routingDecision.route,
      duration: `${duration}ms`,
      responseSource,
      tokensSaved
    });
    
    return response;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("❌ ASSISTANT CHAT: Error", {
      userId,
      error: error.message,
      duration: `${duration}ms`
    });
    
    // Safe fallback
    return {
      message: "I'm experiencing technical difficulties with my AI assistants. Please try rephrasing your question.",
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
 * Update user data via Assistant extraction
 * Wrapper function to update various user data collections from AI responses
 */
const updateUserDataViaAssistant = async (userId, assistantResponse) => {
  try {
    const db = admin.firestore();
    const batch = db.batch();
    let updateCount = 0;

    // Update financial information
    if (assistantResponse.financialInfo && Object.keys(assistantResponse.financialInfo).length > 0) {
      const financialsRef = db.collection("users").doc(userId).collection("financials").doc("data");
      
      // Get existing data first
      const existingFinancials = await financialsRef.get();
      const currentData = existingFinancials.exists ? existingFinancials.data() : {};
      
      const updatedFinancialInfo = {
        ...currentData.financialInfo,
        ...assistantResponse.financialInfo
      };
      
      batch.update(financialsRef, {
        financialInfo: updatedFinancialInfo,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      updateCount++;
      
      logger.info("📊 ASSISTANT UPDATE: Financial info prepared", {
        userId,
        updates: Object.keys(assistantResponse.financialInfo)
      });
    }

    // Update assets
    if (assistantResponse.assets && assistantResponse.assets.length > 0) {
      const financialsRef = db.collection("users").doc(userId).collection("financials").doc("data");
      
      // Get existing data to merge assets
      const existingFinancials = await financialsRef.get();
      const currentAssets = existingFinancials.exists ? existingFinancials.data()?.assets || [] : [];
      
      // Add new assets (with IDs for tracking)
      const newAssets = assistantResponse.assets.map(asset => ({
        ...asset,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }));
      
      const mergedAssets = [...currentAssets, ...newAssets];
      
      batch.update(financialsRef, {
        assets: mergedAssets,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      updateCount++;
      
      logger.info("🏦 ASSISTANT UPDATE: Assets prepared", {
        userId,
        newAssetsCount: newAssets.length,
        totalAssetsCount: mergedAssets.length
      });
    }

    // Update debts
    if (assistantResponse.debts && assistantResponse.debts.length > 0) {
      const financialsRef = db.collection("users").doc(userId).collection("financials").doc("data");
      
      // Get existing data to merge debts
      const existingFinancials = await financialsRef.get();
      const currentDebts = existingFinancials.exists ? existingFinancials.data()?.debts || [] : [];
      
      // Add new debts (with IDs for tracking)
      const newDebts = assistantResponse.debts.map(debt => ({
        ...debt,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }));
      
      const mergedDebts = [...currentDebts, ...newDebts];
      
      batch.update(financialsRef, {
        debts: mergedDebts,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      updateCount++;
      
      logger.info("💳 ASSISTANT UPDATE: Debts prepared", {
        userId,
        newDebtsCount: newDebts.length,
        totalDebtsCount: mergedDebts.length
      });
    }

    // Update goals (intermediate goals)
    if (assistantResponse.goals && assistantResponse.goals.length > 0) {
      const goalsRef = db.collection("users").doc(userId).collection("goals").doc("data");
      
      // Get existing goals to merge
      const existingGoals = await goalsRef.get();
      const currentGoals = existingGoals.exists ? existingGoals.data()?.intermediateGoals || [] : [];
      
      // Merge new goals (they already have IDs from the assistant processing)
      const mergedGoals = [...currentGoals, ...assistantResponse.goals];
      
      batch.update(goalsRef, {
        intermediateGoals: mergedGoals,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      updateCount++;
      
      logger.info("🎯 ASSISTANT UPDATE: Goals prepared", {
        userId,
        newGoalsCount: assistantResponse.goals.length,
        totalGoalsCount: mergedGoals.length
      });
    }

    // Update skills
    if (assistantResponse.skills && assistantResponse.skills.length > 0) {
      const skillsRef = db.collection("users").doc(userId).collection("skills").doc("data");
      
      // Get existing skills to merge
      const existingSkills = await skillsRef.get();
      const currentSkills = existingSkills.exists ? existingSkills.data()?.skillsAndInterests?.skills || [] : [];
      
      // Merge new skills (avoiding duplicates)
      const newSkills = assistantResponse.skills.filter(skill => 
        !currentSkills.some(existing => existing.toLowerCase() === skill.toLowerCase())
      );
      
      if (newSkills.length > 0) {
        const mergedSkills = [...currentSkills, ...newSkills];
        
        batch.update(skillsRef, {
          'skillsAndInterests.skills': mergedSkills,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        updateCount++;
        
        logger.info("🔧 ASSISTANT UPDATE: Skills prepared", {
          userId,
          newSkillsCount: newSkills.length,
          totalSkillsCount: mergedSkills.length
        });
      }
    }

    // Commit all updates if any were prepared
    if (updateCount > 0) {
      await batch.commit();
      
      logger.info("✅ ASSISTANT UPDATE: Successfully updated user data", {
        userId,
        collectionsUpdated: updateCount,
        hasFinancialInfo: !!assistantResponse.financialInfo,
        hasAssets: !!(assistantResponse.assets?.length),
        hasDebts: !!(assistantResponse.debts?.length),
        hasGoals: !!(assistantResponse.goals?.length),
        hasSkills: !!(assistantResponse.skills?.length)
      });
      
      return {
        success: true,
        collectionsUpdated: updateCount
      };
    } else {
      logger.info("ℹ️ ASSISTANT UPDATE: No data to update", {userId});
      return {
        success: true,
        collectionsUpdated: 0
      };
    }
    
  } catch (error) {
    logger.error("❌ ASSISTANT UPDATE: Failed to update user data", {
      userId,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

 