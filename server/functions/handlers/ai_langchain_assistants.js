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
import {contextAssistantSchema} from "./ai_context_assistant_schema.js";
import {processContextAssistantResponse} from "./ai_context_assistant_tools.js";

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
        
        // For Context Assistant, use enhanced response processing
        if (assistantId === getAssistantId("context_id")) {
          response = processContextAssistantResponse(textContent);
          logger.info(`✅ CONTEXT ASSISTANT: Enhanced response processed`, {
            userId,
            hasOperations: !!(response?.operations),
            hasGoals: !!(response?.goals?.length),
            hasAssets: !!(response?.assets?.length),
            hasDebts: !!(response?.debts?.length)
          });
        } else {
          // Try to parse as JSON first - handle cases where JSON has extra text
          try {
            // First try direct parsing
            response = JSON.parse(textContent);
            logger.info(`✅ ASSISTANT: JSON response parsed`, {
              userId,
              assistantId: assistantId.substring(0, 10),
            duration: `${duration}ms`,
            hasResponse: !!response
          });
        } catch (parseError) {
          // Try to extract JSON from mixed content
          const jsonMatch = textContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              response = JSON.parse(jsonMatch[0]);
              logger.info(`✅ ASSISTANT: JSON extracted from mixed content`, {
                userId,
                assistantId: assistantId.substring(0, 10),
                duration: `${duration}ms`,
                originalLength: textContent.length,
                extractedLength: jsonMatch[0].length
              });
            } catch (extractError) {
              // If JSON extraction fails, treat as plain text
              response = { message: textContent };
              logger.warn(`⚠️ ASSISTANT: JSON extraction failed, using as text`, {
                userId,
                assistantId: assistantId.substring(0, 10),
                parseError: parseError.message,
                extractError: extractError.message,
                contentPreview: textContent.substring(0, 200)
              });
            }
          } else {
            // No JSON found, treat as plain text
            response = { message: textContent };
            logger.info(`📝 ASSISTANT: Text response (no JSON found)`, {
              userId,
              assistantId: assistantId.substring(0, 10),
              duration: `${duration}ms`,
              responseLength: textContent.length
            });
          }
        }
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
    
    // Prepare minimal context for router (complete profile info + routing metadata)
    const routerContext = {
      conversationHistory: conversationHistory.slice(-3), // Last 3 exchanges
      hasUserData: !!(userContext && Object.keys(userContext).length > 0),
      profile: userContext ? {
        // Basic Information
        basicInfo: userContext.basicInfo || null,
        
        // Education History (simplified for router)
        education: userContext.educationHistory ? userContext.educationHistory.map(edu => ({
          school: edu.school,
          field: edu.field,
          graduationYear: edu.graduationYear
        })) : null,
        
        // Experience (simplified for router)
        experience: userContext.experience ? userContext.experience.map(exp => ({
          company: exp.company,
          position: exp.position,
          startYear: exp.startYear,
          endYear: exp.endYear
        })) : null,
        
        // Financial Goal (key info for routing decisions)
        financialGoal: userContext.financialGoal ? {
          targetAmount: userContext.financialGoal.targetAmount,
          targetYear: userContext.financialGoal.targetYear,
          timeframe: userContext.financialGoal.timeframe,
          riskTolerance: userContext.financialGoal.riskTolerance,
          primaryStrategy: userContext.financialGoal.primaryStrategy
        } : null
      } : null,
      timestamp: new Date().toISOString()
    };
    
    logger.info("🚦 DEBUG: Calling Router Assistant", {
      userId,
      message: message,
      routerContext: JSON.stringify(routerContext),
      routerId: routerId.substring(0, 15) + "..."
    });
    
    const response = await runAssistant(
      client, 
      routerId, 
      message, 
      routerContext,
      userId
    );
    
    logger.info("🚦 DEBUG: Router Assistant raw response", {
      userId,
      response: JSON.stringify(response, null, 2).substring(0, 500) + "...",
      responseKeys: response ? Object.keys(response) : []
    });
    
    // Validate router response (matches new schema)
    if (!response || !response.route) {
      logger.error("🚦 ERROR: Invalid router response", {
        userId,
        response: response,
        hasRoute: !!(response?.route)
      });
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
      error: error.message,
      stack: error.stack
    });
    
    // Fallback to GENERAL for simple messages, not CONTEXT
    return {
      route: "GENERAL",
      message: "Hello! I'm here to help you with your financial planning journey. How can I assist you today?",
      confidence: 0.3,
      reasoning: "Router error - providing general greeting"
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
    
    // Prepare enhanced context for personalized assistant with edit/delete capabilities
    const fullContext = {
      userProfile: {
        financialGoal: userContext.financialGoal || {},
        financialInfo: userContext.financialInfo || {},
        personalInfo: userContext.personalInfo || {}
      },
      
      // COMPLETE existing data with IDs for edit/delete operations
      existingData: {
        goals: (userContext.currentGoals || []).map(g => ({
          id: g.id,
          title: g.title,
          type: g.type,
          targetAmount: g.targetAmount,
          currentAmount: g.currentAmount,
          progress: g.progress,
          targetDate: g.targetDate,
          status: g.status,
          description: g.description,
          category: g.category,
          submilestones: g.submilestones || []
        })),
        
        assets: (userContext.assets || []).map(a => ({
          id: a.id,
          name: a.name,
          type: a.type,
          value: a.value,
          description: a.description
        })),
        
        debts: (userContext.debts || []).map(d => ({
          id: d.id,
          name: d.name,
          type: d.type,
          balance: d.balance,
          interestRate: d.interestRate,
          description: d.description
        })),
        
        skills: userContext.skills || [],
        interests: userContext.interests || []
      },
      
      // Summary stats for AI decision making
      summary: {
        totalGoals: (userContext.currentGoals || []).length,
        completedGoals: (userContext.currentGoals || []).filter(g => g.status === 'Completed').length,
        totalAssets: (userContext.assets || []).length,
        totalDebts: (userContext.debts || []).length,
        netWorth: (userContext.assets || []).reduce((sum, a) => sum + (a.value || 0), 0) - 
                  (userContext.debts || []).reduce((sum, d) => sum + (d.balance || 0), 0),
        progressToRT1M: ((userContext.assets || []).reduce((sum, a) => sum + (a.value || 0), 0) - 
                        (userContext.debts || []).reduce((sum, d) => sum + (d.balance || 0), 0)) / 
                        (userContext.financialGoal?.targetAmount || 1000000) * 100
      },
      
      responseSchema: contextAssistantSchema,
      timestamp: new Date().toISOString()
    };
    
    const response = await runAssistant(
      client, 
      contextId, 
      message, 
      fullContext,
      userId
    );
    
    // Map context response to expected format (enhanced for edit/delete operations)
    const financialInfo = {};
    if (response.income !== undefined) financialInfo.annualIncome = response.income;
    if (response.expenses !== undefined) financialInfo.annualExpenses = response.expenses;
    if (response.savings !== undefined) financialInfo.currentSavings = response.savings;
    
    // Handle goals operations (create, edit, delete)
    let processedGoals = [];
    let goalsOperations = null;
    
    if (response.goals && Array.isArray(response.goals)) {
      // New goals to create with proper submilestone processing
      processedGoals = response.goals.map(goal => {
        const processedGoal = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          title: goal.title,
          type: goal.type,
          targetAmount: goal.amount || goal.targetAmount || 0,
          targetDate: goal.date || goal.targetDate || null,
          status: goal.status || "Not Started",
          currentAmount: goal.currentAmount || 0,
          progress: goal.progress || 0,
          description: goal.description || "",
          category: goal.category || goal.type
        };
        
        // Process submilestones if provided
        if (goal.submilestones && Array.isArray(goal.submilestones)) {
          processedGoal.submilestones = goal.submilestones.map((sub, index) => ({
            id: Date.now().toString() + index.toString() + Math.random().toString(36).substr(2, 9),
            title: sub.title,
            description: sub.description || "",
            targetAmount: sub.targetAmount || undefined,
            targetDate: sub.targetDate || undefined,
            completed: Boolean(sub.completed),
            order: typeof sub.order === 'number' ? sub.order : index
          }));
        } else {
          processedGoal.submilestones = [];
        }
        
        return processedGoal;
      });
    }
    
    // Handle edit/delete operations if specified
    if (response.operations) {
      goalsOperations = {
        goalEdits: response.operations.goalEdits || [],
        goalDeletes: response.operations.goalDeletes || [],
        assetEdits: response.operations.assetEdits || [],
        assetDeletes: response.operations.assetDeletes || [],
        debtEdits: response.operations.debtEdits || [],
        debtDeletes: response.operations.debtDeletes || []
      };
    }
    
    return {
      message: response.message || "I'd be happy to provide personalized advice based on your financial situation!",
      financialInfo: Object.keys(financialInfo).length > 0 ? financialInfo : null,
      assets: response.assets || [],
      debts: response.debts || [],
      goals: processedGoals.length > 0 ? processedGoals : null,
      skills: response.skills || null,
      operations: goalsOperations
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
    
    logger.info("🔍 DEBUG: About to route message", {
      userId,
      inputText: inputText.substring(0, 50),
      hasBasicContext: !!basicContext,
      conversationHistoryCount: conversationHistory.length
    });
    
    // LAYER 1: Route the message
    const routingDecision = await routeWithAssistant(
      client, 
      inputText, 
      basicContext, 
      conversationHistory, 
      userId
    );
    
    logger.info("🎯 DEBUG: Routing decision received", {
      userId,
      route: routingDecision.route,
      hasMessage: !!routingDecision.message,
      messagePreview: routingDecision.message?.substring(0, 100) + "...",
      confidence: routingDecision.confidence,
      reasoning: routingDecision.reasoning
    });
    
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
        operations: personalizedResponse.operations, // Include operations for frontend refresh
        usedUserData: true,
        tokensSaved,
        routingDecision,
        responseSource
      };
      
      // Update user data if extracted using existing database functions
      if (personalizedResponse.financialInfo || personalizedResponse.assets?.length || 
          personalizedResponse.debts?.length || personalizedResponse.goals || personalizedResponse.skills ||
          personalizedResponse.operations) {
        try {
          // Use existing updateUserDataFromAI function with proper wrapper
          await updateUserDataViaAssistant(userId, personalizedResponse);
          logger.info("📝 ASSISTANT: Updated user data from extraction", {
            userId,
            hasFinancialInfo: !!personalizedResponse.financialInfo,
            assetsCount: personalizedResponse.assets?.length || 0,
            debtsCount: personalizedResponse.debts?.length || 0,
            goalsCount: personalizedResponse.goals?.length || 0,
            skillsCount: personalizedResponse.skills?.length || 0,
            hasOperations: !!personalizedResponse.operations
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
 * Enhanced to support edit and delete operations
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

    // Update assets - preserve null vs [] distinction with 10-item limit
    if (assistantResponse.assets && assistantResponse.assets.length > 0) {
      const financialsRef = db.collection("users").doc(userId).collection("financials").doc("data");
      
      // Get existing data to merge assets - preserve null vs [] distinction
      const existingFinancials = await financialsRef.get();
      const currentAssets = existingFinancials.exists ? existingFinancials.data()?.assets : null;
      const currentAssetsArray = currentAssets === null ? [] : currentAssets;
      
      // Check if adding new assets would exceed limit
      const availableSlots = Math.max(0, 10 - currentAssetsArray.length);
      const assetsToAdd = assistantResponse.assets.slice(0, availableSlots);
      
      if (assetsToAdd.length > 0) {
        // Add new assets (with IDs for tracking) - use Date instead of FieldValue for arrays
        const now = new Date();
        const newAssets = assetsToAdd.map(asset => ({
          ...asset,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          createdAt: now.toISOString(),
          addedViaAI: true
        }));
        
        // Merge with existing assets: null becomes [], [] stays [], [items] gets merged
        const mergedAssets = currentAssets === null ? newAssets : [...currentAssets, ...newAssets];
        
        batch.update(financialsRef, {
          assets: mergedAssets,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        updateCount++;
        
        logger.info("🏦 ASSISTANT UPDATE: Assets prepared", {
          userId,
          previousState: currentAssets === null ? 'null (not-entered)' : `array (${currentAssets.length} items)`,
          newAssetsCount: newAssets.length,
          totalAssetsCount: mergedAssets.length,
          assetsRequested: assistantResponse.assets.length,
          assetsSkipped: assistantResponse.assets.length - assetsToAdd.length,
          limitEnforced: assetsToAdd.length < assistantResponse.assets.length
        });
      } else {
        logger.warn("🚫 ASSISTANT UPDATE: Assets limit reached", {
          userId,
          currentAssetsCount: currentAssetsArray.length,
          requestedAssetsCount: assistantResponse.assets.length,
          limit: 10
        });
      }
    }

    // Update debts - preserve null vs [] distinction with 10-item limit
    if (assistantResponse.debts && assistantResponse.debts.length > 0) {
      const financialsRef = db.collection("users").doc(userId).collection("financials").doc("data");
      
      // Get existing data to merge debts - preserve null vs [] distinction
      const existingFinancials = await financialsRef.get();
      const currentDebts = existingFinancials.exists ? existingFinancials.data()?.debts : null;
      const currentDebtsArray = currentDebts === null ? [] : currentDebts;
      
      // Check if adding new debts would exceed limit
      const availableSlots = Math.max(0, 10 - currentDebtsArray.length);
      const debtsToAdd = assistantResponse.debts.slice(0, availableSlots);
      
      if (debtsToAdd.length > 0) {
        // Add new debts (with IDs for tracking) - use Date instead of FieldValue for arrays
        const now = new Date();
        const newDebts = debtsToAdd.map(debt => ({
          ...debt,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          createdAt: now.toISOString(),
          addedViaAI: true
        }));
        
        // Merge with existing debts: null becomes [], [] stays [], [items] gets merged
        const mergedDebts = currentDebts === null ? newDebts : [...currentDebts, ...newDebts];
        
        batch.update(financialsRef, {
          debts: mergedDebts,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        updateCount++;
        
        logger.info("💳 ASSISTANT UPDATE: Debts prepared", {
          userId,
          previousState: currentDebts === null ? 'null (not-entered)' : `array (${currentDebts.length} items)`,
          newDebtsCount: newDebts.length,
          totalDebtsCount: mergedDebts.length,
          debtsRequested: assistantResponse.debts.length,
          debtsSkipped: assistantResponse.debts.length - debtsToAdd.length,
          limitEnforced: debtsToAdd.length < assistantResponse.debts.length
        });
      } else {
        logger.warn("🚫 ASSISTANT UPDATE: Debts limit reached", {
          userId,
          currentDebtsCount: currentDebtsArray.length,
          requestedDebtsCount: assistantResponse.debts.length,
          limit: 10
        });
      }
    }

    // Update goals (intermediate goals) - preserve null vs [] distinction with 10-item limit
    if (assistantResponse.goals && assistantResponse.goals.length > 0) {
      const goalsRef = db.collection("users").doc(userId).collection("goals").doc("data");
      
      // Get existing goals to merge - preserve null vs [] distinction
      const existingGoals = await goalsRef.get();
      const currentGoals = existingGoals.exists ? existingGoals.data()?.intermediateGoals : null;
      const currentGoalsArray = currentGoals === null ? [] : currentGoals;
      
      // Check if adding new goals would exceed limit
      const availableSlots = Math.max(0, 10 - currentGoalsArray.length);
      const goalsToAdd = assistantResponse.goals.slice(0, availableSlots);
      
      if (goalsToAdd.length > 0) {
        // Merge new goals: null becomes [], [] stays [], [items] gets merged
        const mergedGoals = currentGoals === null ? goalsToAdd : [...currentGoals, ...goalsToAdd];
        
        batch.update(goalsRef, {
          intermediateGoals: mergedGoals,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        updateCount++;
        
        logger.info("🎯 ASSISTANT UPDATE: Goals prepared", {
          userId,
          previousState: currentGoals === null ? 'null (not-entered)' : `array (${currentGoals.length} items)`,
          newGoalsCount: goalsToAdd.length,
          totalGoalsCount: mergedGoals.length,
          goalsRequested: assistantResponse.goals.length,
          goalsSkipped: assistantResponse.goals.length - goalsToAdd.length,
          limitEnforced: goalsToAdd.length < assistantResponse.goals.length
        });
      } else {
        logger.warn("🚫 ASSISTANT UPDATE: Goals limit reached", {
          userId,
          currentGoalsCount: currentGoalsArray.length,
          requestedGoalsCount: assistantResponse.goals.length,
          limit: 10
        });
      }
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

    // Handle edit and delete operations
    if (assistantResponse.operations) {
      const operations = assistantResponse.operations;
      
      // Handle goal edits and deletes
      if ((operations.goalEdits?.length > 0) || (operations.goalDeletes?.length > 0)) {
        const goalsRef = db.collection("users").doc(userId).collection("goals").doc("data");
        const existingGoals = await goalsRef.get();
        
        if (existingGoals.exists) {
          let currentGoals = existingGoals.data()?.intermediateGoals || [];
          
          // Apply deletes
          if (operations.goalDeletes?.length > 0) {
            currentGoals = currentGoals.filter(goal => !operations.goalDeletes.includes(goal.id));
            logger.info("🗑️ ASSISTANT DELETE: Removed goals", {
              userId,
              deletedIds: operations.goalDeletes,
              remainingGoals: currentGoals.length
            });
          }
          
          // Apply edits
          if (operations.goalEdits?.length > 0) {
            operations.goalEdits.forEach(edit => {
              const goalIndex = currentGoals.findIndex(goal => goal.id === edit.id);
              if (goalIndex !== -1) {
                currentGoals[goalIndex] = { ...currentGoals[goalIndex], ...edit.updates };
                logger.info("✏️ ASSISTANT EDIT: Updated goal", {
                  userId,
                  goalId: edit.id,
                  updates: Object.keys(edit.updates)
                });
              }
            });
          }
          
          batch.update(goalsRef, {
            intermediateGoals: currentGoals,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          updateCount++;
        }
      }
      
      // Handle asset edits and deletes
      if ((operations.assetEdits?.length > 0) || (operations.assetDeletes?.length > 0)) {
        const financialsRef = db.collection("users").doc(userId).collection("financials").doc("data");
        const existingFinancials = await financialsRef.get();
        
        if (existingFinancials.exists) {
          let currentAssets = existingFinancials.data()?.assets || [];
          
          // Apply deletes
          if (operations.assetDeletes?.length > 0) {
            currentAssets = currentAssets.filter(asset => !operations.assetDeletes.includes(asset.id));
            logger.info("🗑️ ASSISTANT DELETE: Removed assets", {
              userId,
              deletedIds: operations.assetDeletes,
              remainingAssets: currentAssets.length
            });
          }
          
          // Apply edits
          if (operations.assetEdits?.length > 0) {
            operations.assetEdits.forEach(edit => {
              const assetIndex = currentAssets.findIndex(asset => asset.id === edit.id);
              if (assetIndex !== -1) {
                currentAssets[assetIndex] = { ...currentAssets[assetIndex], ...edit.updates };
                logger.info("✏️ ASSISTANT EDIT: Updated asset", {
                  userId,
                  assetId: edit.id,
                  updates: Object.keys(edit.updates)
                });
              }
            });
          }
          
          batch.update(financialsRef, {
            assets: currentAssets,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          updateCount++;
        }
      }
      
      // Handle debt edits and deletes
      if ((operations.debtEdits?.length > 0) || (operations.debtDeletes?.length > 0)) {
        const financialsRef = db.collection("users").doc(userId).collection("financials").doc("data");
        const existingFinancials = await financialsRef.get();
        
        if (existingFinancials.exists) {
          let currentDebts = existingFinancials.data()?.debts || [];
          
          // Apply deletes
          if (operations.debtDeletes?.length > 0) {
            currentDebts = currentDebts.filter(debt => !operations.debtDeletes.includes(debt.id));
            logger.info("🗑️ ASSISTANT DELETE: Removed debts", {
              userId,
              deletedIds: operations.debtDeletes,
              remainingDebts: currentDebts.length
            });
          }
          
          // Apply edits
          if (operations.debtEdits?.length > 0) {
            operations.debtEdits.forEach(edit => {
              const debtIndex = currentDebts.findIndex(debt => debt.id === edit.id);
              if (debtIndex !== -1) {
                currentDebts[debtIndex] = { ...currentDebts[debtIndex], ...edit.updates };
                logger.info("✏️ ASSISTANT EDIT: Updated debt", {
                  userId,
                  debtId: edit.id,
                  updates: Object.keys(edit.updates)
                });
              }
            });
          }
          
          batch.update(financialsRef, {
            debts: currentDebts,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          updateCount++;
        }
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
        hasSkills: !!(assistantResponse.skills?.length),
        hasOperations: !!assistantResponse.operations
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

