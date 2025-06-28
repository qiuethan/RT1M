/**
 * Setup Script for RT1M Context Assistant
 * Creates or updates the Context Assistant with enhanced edit/delete capabilities
 */

import {OpenAI} from "openai";
import {createContextAssistant, updateContextAssistant} from "../handlers/ai_context_assistant_tools.js";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const CONTEXT_ASSISTANT_ID = process.env.CONTEXT_ASSISTANT_ID;

async function setupContextAssistant() {
  if (!OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY environment variable not set");
    process.exit(1);
  }

  const client = new OpenAI({
    apiKey: OPENAI_API_KEY
  });

  try {
    if (CONTEXT_ASSISTANT_ID) {
      console.log("🔄 Updating existing Context Assistant...");
      console.log("📋 Assistant ID:", CONTEXT_ASSISTANT_ID);
      
      const assistant = await updateContextAssistant(client, CONTEXT_ASSISTANT_ID);
      
      console.log("✅ Context Assistant updated successfully!");
      console.log("🎯 Enhanced capabilities:");
      console.log("   • Create new goals, assets, debts");
      console.log("   • Edit existing items by ID");
      console.log("   • Delete items by ID");
      console.log("   • Submilestones support for goals");
      console.log("   • Enhanced context awareness");
      
    } else {
      console.log("🆕 Creating new Context Assistant...");
      
      const assistant = await createContextAssistant(client);
      
      console.log("✅ Context Assistant created successfully!");
      console.log("🔧 IMPORTANT: Set this environment variable:");
      console.log(`   CONTEXT_ASSISTANT_ID=${assistant.id}`);
      console.log("");
      console.log("🎯 Enhanced capabilities:");
      console.log("   • Create new goals, assets, debts");
      console.log("   • Edit existing items by ID");
      console.log("   • Delete items by ID");
      console.log("   • Submilestones support for goals");
      console.log("   • Enhanced context awareness");
    }
    
  } catch (error) {
    console.error("❌ Setup failed:", error.message);
    process.exit(1);
  }
}

// Run the setup
setupContextAssistant(); 