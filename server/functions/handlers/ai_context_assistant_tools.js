/**
 * Context Assistant Tools Configuration
 * Configures the OpenAI Assistant with function calling for RT1M operations
 */

import {contextAssistantSchema} from "./ai_context_assistant_schema.js";

/**
 * Function tool definition for the Context Assistant
 */
export const contextAssistantFunctionTool = {
  type: "function",
  function: {
    name: "processUserFinancialData",
    description: "Process user's financial data including creating, editing, or deleting goals, assets, and debts",
    parameters: contextAssistantSchema
  }
};

/**
 * Configure Context Assistant with enhanced capabilities
 * This should be used when setting up the assistant in OpenAI platform
 */
export const contextAssistantConfig = {
  name: "RT1M Context Assistant",
  tools: [contextAssistantFunctionTool],
  model: "gpt-4-1106-preview", // Use latest model with function calling
  temperature: 0.7,
  top_p: 1.0
};

/**
 * Helper function to create the Context Assistant
 * Use this when initially setting up the assistant
 */
export const createContextAssistant = async (openaiClient) => {
  try {
    const assistant = await openaiClient.beta.assistants.create(contextAssistantConfig);
    console.log("✅ Context Assistant created:", assistant.id);
    console.log("🔧 Set CONTEXT_ASSISTANT_ID to:", assistant.id);
    return assistant;
  } catch (error) {
    console.error("❌ Failed to create Context Assistant:", error);
    throw error;
  }
};

/**
 * Helper function to update existing Context Assistant
 * Use this to update the assistant with new schema/instructions
 */
export const updateContextAssistant = async (openaiClient, assistantId) => {
  try {
    const assistant = await openaiClient.beta.assistants.update(assistantId, {
      tools: [contextAssistantFunctionTool],
      model: "gpt-4-1106-preview"
    });
    console.log("✅ Context Assistant updated:", assistant.id);
    return assistant;
  } catch (error) {
    console.error("❌ Failed to update Context Assistant:", error);
    throw error;
  }
};

/**
 * Process function call response from Context Assistant
 */
export const processContextAssistantResponse = (response) => {
  // If the assistant used function calling, extract the arguments
  if (response.tool_calls && response.tool_calls.length > 0) {
    const functionCall = response.tool_calls[0];
    if (functionCall.type === "function" && functionCall.function.name === "processUserFinancialData") {
      try {
        const parsedArgs = JSON.parse(functionCall.function.arguments);
        return parsedArgs;
      } catch (error) {
        console.error("Failed to parse function arguments:", error);
        return null;
      }
    }
  }
  
  // Fallback to direct JSON parsing if no function calling
  try {
    return JSON.parse(response);
  } catch (error) {
    console.error("Failed to parse response as JSON:", error);
    return {
      message: response || "I'm here to help with your financial goals!"
    };
  }
}; 