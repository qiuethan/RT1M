# OpenAI Assistants Setup for RT1M

## Overview
The Smart Chat system has been upgraded to use OpenAI Assistants instead of LangChain models. This provides better accuracy, consistency, and performance.

## Required Environment Variables

Add these to your Firebase Functions configuration:

```bash
# Set the assistant IDs after creating them in OpenAI platform
firebase functions:config:set \
  router_assistant_id="asst_xxxxxxxxxxxxxxxxxxxx" \
  context_assistant_id="asst_xxxxxxxxxxxxxxxxxxxx" \
  plan_assistant_id="asst_xxxxxxxxxxxxxxxxxxxx"
```

Or set them directly in your environment:
```bash
export ROUTER_ASSISTANT_ID="asst_xxxxxxxxxxxxxxxxxxxx"
export CONTEXT_ASSISTANT_ID="asst_xxxxxxxxxxxxxxxxxxxx"
export PLAN_ASSISTANT_ID="asst_xxxxxxxxxxxxxxxxxxxx"
```

## Assistants Configuration

You need to create 3 assistants in the OpenAI platform using the schemas and instructions provided in our previous conversation:

### 1. Router Assistant (GPT-4o-mini)
- **Purpose**: Routes messages between GENERAL, CONTEXT, and PLAN paths + provides general responses
- **Model**: gpt-4o-mini
- **Schema**: Router schema with route, response, confidence, reasoning
- **Instructions**: Router prompt with conversation history context + general advice capability
- **Key Feature**: For GENERAL routes, provides complete response (no second assistant needed)

### 2. Context Assistant (GPT-4)
- **Purpose**: Handles personalized advice with full user financial data
- **Model**: gpt-4
- **Schema**: Context schema matching database structure exactly
- **Instructions**: Personalized advice prompt with data extraction

### 3. Plan Assistant (GPT-4)
- **Purpose**: Generates comprehensive financial plans
- **Model**: gpt-4
- **Schema**: Plan schema with steps, milestones, resources
- **Instructions**: Plan generation prompt with corrected schema

## Testing the Migration

After setting up the assistants and environment variables:

1. **Test Basic Chat**: Send a simple message like "hi" to verify routing works
2. **Test General Advice**: Ask "What is investing?" to test router's general response
3. **Test Personal Context**: Ask "How much should I save?" to test context assistant
4. **Test Plan Generation**: Ask "Create a retirement plan" to test plan assistant

## Benefits of Assistants

✅ **Better Accuracy**: Pre-configured assistants with optimized prompts
✅ **Consistent Responses**: No prompt variations between requests  
✅ **Token Optimization**: Only relevant context sent to each assistant
✅ **Conversation Memory**: Assistants maintain context within conversations
✅ **Structured Outputs**: Guaranteed schema compliance with function calling
✅ **Performance**: Faster responses with dedicated assistant endpoints

## Monitoring

The system includes comprehensive logging with emojis for easy debugging:
- 🧠 Smart Chat operations
- 🤖 Individual assistant calls  
- 🚦 Router decisions
- ✅ Successful operations
- ❌ Error handling
- 📊 Performance metrics

## Fallback Behavior

If any assistant fails, the system gracefully falls back to helpful error messages and maintains the expected response structure for the client.

## Architecture

```
User Message
     ↓
Smart Chat Handler 
     ↓
Assistant Chat Invoke
     ↓
Router Assistant → Determines path
     ↓
Router Response (general advice)
  OR
Context Assistant (full data)
  OR  
Plan Assistant (plan generation)
     ↓
Response + Data Updates
     ↓
Client Application
```

The system automatically handles conversation history, user context loading, data extraction, and response logging. 