/**
 * Test script for the JavaScript Smart Chat Routing System
 * Demonstrates token savings through intelligent routing
 * 
 * Usage: node test_smart_chat.js
 */

import {smartChatInvoke} from "./handlers/ai_smart_chat.js";
import {getRoutingStats} from "./handlers/ai_chat_router.js";
import {getGeneralAdviceStats} from "./handlers/ai_general_chat.js";

/**
 * Test the smart chat routing with various message types
 */
async function testSmartChatRouting() {
  console.log("🧠 JavaScript Smart Chat Routing Test");
  console.log("=" .repeat(50));
  
  // Test messages that should NOT need user data (general advice)
  const generalMessages = [
    "What is a 401k?",
    "How does compound interest work?", 
    "What are the basics of budgeting?",
    "Should I invest in stocks or bonds?",
    "What's the difference between a Roth and traditional IRA?",
    "How do I build an emergency fund?"
  ];
  
  // Test messages that SHOULD need user data (personalized advice)
  const personalMessages = [
    "How much should I save based on my income?",
    "Am I on track for my retirement goals?",
    "Should I pay off my debt or invest?",
    "What's my net worth?",
    "How much emergency fund do I need based on my expenses?",
    "Can I afford to buy a house?"
  ];
  
  console.log("\n🎯 GENERAL MESSAGES (Should use lightweight models):");
  console.log("-".repeat(30));
  
  let totalTokensSaved = 0;
  let generalMessageCount = 0;
  
  for (const msg of generalMessages) {
    try {
      console.log(`\n💬 User: ${msg}`);
      const response = await smartChatInvoke(msg, "test_user");
      
      console.log(`🤖 Bot: ${response.message.substring(0, 100)}...`);
      console.log(`📊 Used user data: ${response.usedUserData}`);
      console.log(`💰 Tokens saved: ${response.tokensSaved}`);
      console.log(`🔧 Response source: ${response.responseSource}`);
      console.log(`🎯 Route decision: ${response.routingDecision?.messageType || 'unknown'}`);
      
      totalTokensSaved += response.tokensSaved;
      generalMessageCount++;
      
    } catch (error) {
      console.error(`❌ Error with message "${msg}":`, error.message);
    }
  }
  
  console.log("\n\n🎯 PERSONAL MESSAGES (Should route to full model when user data available):");
  console.log("-".repeat(30));
  
  // Mock user profile for testing
  const mockUserProfile = {
    basicInfo: {
      name: "Test User",
      age: 30,
      occupation: "Software Engineer"
    },
    financialInfo: {
      annualIncome: 75000,
      annualExpenses: 45000,
      currentSavings: 25000,
      totalAssets: 50000,
      totalDebts: 15000
    },
    goals: [
      {
        title: "Buy a house",
        targetAmount: 400000,
        targetDate: "2026-01-01"
      }
    ]
  };
  
  let personalMessageCount = 0;
  
  for (const msg of personalMessages) {
    try {
      console.log(`\n💬 User: ${msg}`);
      
      // Test without user context first
      const responseWithoutContext = await smartChatInvoke(msg, "test_user");
      console.log(`🤖 Bot (no context): ${responseWithoutContext.message.substring(0, 80)}...`);
      console.log(`📊 Used user data: ${responseWithoutContext.usedUserData}`);
      console.log(`💰 Tokens saved: ${responseWithoutContext.tokensSaved}`);
      
      // Test with user context
      const responseWithContext = await smartChatInvoke(msg, "test_user", mockUserProfile);
      console.log(`🤖 Bot (with context): ${responseWithContext.message.substring(0, 80)}...`);
      console.log(`📊 Used user data: ${responseWithContext.usedUserData}`);
      console.log(`🔧 Response source: ${responseWithContext.responseSource}`);
      
      personalMessageCount++;
      
    } catch (error) {
      console.error(`❌ Error with message "${msg}":`, error.message);
    }
  }
  
  console.log("\n\n📈 SMART ROUTING STATISTICS:");
  console.log("-".repeat(30));
  
  try {
    const routingStats = getRoutingStats();
    const generalStats = getGeneralAdviceStats();
    
    console.log("• Routing System:", routingStats.description);
    console.log("• General Advice Model:", generalStats.model);
    console.log("• Average Token Savings:", generalStats.tokenSavings);
    console.log("• Cache Hit Rate:", generalStats.cacheHitRate);
    console.log("• Response Time:", generalStats.responseTime);
    
    console.log(`\n📊 Test Results:`);
    console.log(`• General messages tested: ${generalMessageCount}`);
    console.log(`• Personal messages tested: ${personalMessageCount}`);
    console.log(`• Total tokens saved in test: ${totalTokensSaved}`);
    console.log(`• Average savings per general message: ${Math.round(totalTokensSaved / generalMessageCount)} tokens`);
    
    // Estimated cost savings (rough calculation)
    const estimatedMonthlySavings = calculateMonthlySavings(totalTokensSaved, generalMessageCount);
    console.log(`• Estimated monthly cost savings: $${estimatedMonthlySavings}`);
    
  } catch (error) {
    console.error("❌ Error getting statistics:", error.message);
  }
}

/**
 * Calculate estimated monthly savings based on usage patterns
 */
function calculateMonthlySavings(tokensSaved, messageCount) {
  // Assumptions:
  // - Average user sends 50 messages per month
  // - 60% are general advice (can be optimized)
  // - GPT-4 costs ~$0.03 per 1K tokens
  // - GPT-3.5-turbo costs ~$0.002 per 1K tokens
  
  const messagesPerMonth = 50;
  const generalAdvicePercentage = 0.6;
  const avgTokensSavedPerMessage = tokensSaved / messageCount;
  
  const generalMessagesPerMonth = messagesPerMonth * generalAdvicePercentage;
  const totalTokensSavedPerMonth = generalMessagesPerMonth * avgTokensSavedPerMessage;
  
  // Cost difference: GPT-4 vs GPT-3.5-turbo
  const costSavingsPerToken = (0.03 - 0.002) / 1000; // $0.028 per 1K tokens
  const monthlySavings = totalTokensSavedPerMonth * costSavingsPerToken;
  
  return monthlySavings.toFixed(2);
}

/**
 * Test specific routing scenarios
 */
async function testSpecificScenarios() {
  console.log("\n\n🧪 SPECIFIC ROUTING SCENARIOS:");
  console.log("-".repeat(30));
  
  const scenarios = [
    {
      name: "Cached Response",
      message: "what is a 401k",
      expectedSource: "cache"
    },
    {
      name: "Router Simple Response", 
      message: "explain diversification",
      expectedSource: "router"
    },
    {
      name: "General AI Response",
      message: "how to start investing as a beginner",
      expectedSource: "general"
    },
    {
      name: "Personal Advice Prompt",
      message: "should I max out my 401k contribution",
      expectedSource: "prompt"
    }
  ];
  
  for (const scenario of scenarios) {
    try {
      console.log(`\n🔬 Testing: ${scenario.name}`);
      console.log(`💬 Message: "${scenario.message}"`);
      
      const response = await smartChatInvoke(scenario.message, "test_user");
      
      console.log(`✅ Expected source: ${scenario.expectedSource}`);
      console.log(`📍 Actual source: ${response.responseSource}`);
      console.log(`💰 Tokens saved: ${response.tokensSaved}`);
      console.log(`🎯 Correct routing: ${response.responseSource === scenario.expectedSource ? '✅' : '❌'}`);
      
    } catch (error) {
      console.error(`❌ Error in scenario "${scenario.name}":`, error.message);
    }
  }
}

// Run the tests
async function runAllTests() {
  try {
    await testSmartChatRouting();
    await testSpecificScenarios();
    
    console.log("\n\n🎉 Smart Chat Testing Complete!");
    console.log("The system successfully routes messages to optimize token usage.");
    
  } catch (error) {
    console.error("❌ Test suite failed:", error);
  }
}

// Export for use as module or run directly
export {testSmartChatRouting, testSpecificScenarios, runAllTests};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
} 