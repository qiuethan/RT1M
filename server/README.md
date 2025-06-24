# RT1M Backend - Firebase Functions (Phase 1)

The serverless backend for RT1M, built with Firebase Cloud Functions and featuring modular AI integration with OpenAI GPT-4. Handles user management, financial data processing, AI chat capabilities, and plan generation.

**Phase 1 Demonstration** - Showcasing modular AI architecture, intelligent data extraction, and scalable serverless backend design.

## 🏗️ Architecture

### Technology Stack
- **Firebase Cloud Functions** (Node.js) for serverless execution
- **LangChain** for AI orchestration and prompt management
- **OpenAI GPT-4** for natural language processing and data extraction
- **Firebase Firestore** for real-time database operations
- **Firebase Authentication** for secure user management

### Modular Structure

```
functions/
├── handlers/              # Specialized function handlers
│   ├── ai_chat.js        # AI conversation processing
│   ├── ai_context.js     # User context for AI
│   ├── ai_data_updates.js # AI data extraction & updates
│   ├── ai_plans.js       # Financial plan generation
│   ├── ai_utils.js       # AI utilities and schemas
│   ├── financials.js     # Financial data management
│   ├── goals.js          # Goal tracking and management
│   ├── profile.js        # User profile management
│   ├── skills.js         # Skills and interests tracking
│   └── misc.js           # Utility functions
├── utils/                # Shared utilities
│   ├── ai_helpers.js     # AI data transformation
│   ├── auth.js           # Authentication utilities
│   ├── firestore.js      # Database operations
│   └── validation.js     # Data validation
├── index.js              # Main functions entry point
└── package.json          # Dependencies and configuration
```

## 🤖 AI Integration

### Core AI Features
- **Conversational Chat**: Natural language financial conversations with GPT-4
- **Smart Data Extraction**: Automatically extracts financial info from conversations
- **Context Awareness**: AI understands complete user financial profile
- **Plan Generation**: Creates detailed step-by-step financial plans
- **Real-time Updates**: Extracted data saves immediately to user collections

### AI Data Pipeline
1. **User Message** → AI Chat Handler
2. **Context Retrieval** → Complete user financial profile
3. **AI Processing** → GPT-4 with LangChain orchestration
4. **Data Extraction** → Structured financial data from conversation
5. **Schema Transformation** → Convert AI data to Firebase format
6. **Database Updates** → Save to appropriate user collections
7. **Response** → Natural language response + extracted data

### Supported Data Extraction
- **Financial Info**: Income, expenses, savings, total assets/debts
- **Individual Assets**: Houses, cars, investments, retirement accounts
- **Individual Debts**: Mortgages, credit cards, loans with interest rates
- **Goals**: Financial targets, savings goals, debt payoff plans
- **Skills**: Professional skills and interests for career planning

## 📊 Database Schema

### User Collections Structure
```
users/{uid}/
├── profile/data          # Personal information, education, experience
├── financials/data       # Financial info, assets, debts
├── goals/data           # Intermediate goals and milestones
├── skills/data          # Skills and interests
├── ai_conversations/    # Chat history and extracted data
└── plans/              # AI-generated financial plans
```

### Data Distinction: Null vs Empty
- **Null**: Data not entered yet (user hasn't provided information)
- **Empty Array []**: User confirmed they have none (explicitly stated)
- **Populated Array**: Actual data items

This distinction helps AI provide better context-aware responses.

## 🔧 API Endpoints

### Authentication & User Management
```javascript
// Create user profile with all subcollections
createUserProfile(request)

// Get user statistics and net worth
getUserStats(request)

// Clean up all user data on account deletion
cleanupUserData(request)
```

### AI Chat & Processing
```javascript
// Handle AI chat messages with data extraction
handleChatMessage(request)
// Input: { message, sessionId?, conversationHistory? }
// Output: { message, extractedData, updatedSections, isReadyForPlan }

// Get comprehensive user context for AI
getAIConversationContext(request)
// Output: Complete user profile formatted for AI

// Update user data from AI conversations
updateUserDataFromAI(request)
// Input: { financialInfo?, assets?, debts?, goals?, skills? }
```

### Financial Management
```javascript
// Get/update user financial information
getUserFinancials(request)
updateUserFinancialsSection(request, section, data)

// Asset and debt management
// Assets and debts are managed through financials collection
```

### Goals & Planning
```javascript
// Goal management
getUserIntermediateGoals(request)
addIntermediateGoal(request)
updateIntermediateGoal(request, goalId, updates)
deleteIntermediateGoal(request, goalId)

// AI plan generation
generateFinancialPlan(request)
// Input: { goalId?, goalData? }
// Output: Detailed step-by-step financial plan
```

### Skills & Profile
```javascript
// Skills management
getUserSkills(request)
updateUserSkillsSection(request, section, data)

// Profile management
getUserProfile(request)
updateUserProfileSection(request, section, data)
```

## 🔄 Data Flow Examples

### AI Chat Data Extraction
```javascript
// User: "I make $75k and have $50k saved"
// AI Response:
{
  "message": "Great income and savings! You're in a solid position...",
  "financialInfo": {
    "annualIncome": 75000,
    "currentSavings": 50000
  },
  "assets": null,
  "debts": null,
  "goals": null,
  "skills": null
}

// Result: Updates user's financials collection immediately
```

### Asset/Debt Extraction
```javascript
// User: "I have a $400k house with a $300k mortgage at 3.2%"
// AI Response:
{
  "message": "Nice! That's solid equity in your home...",
  "financialInfo": null,
  "assets": [
    {"name": "Primary Home", "type": "house", "value": 400000}
  ],
  "debts": [
    {"name": "Mortgage", "type": "mortgage", "balance": 300000, "interestRate": 3.2}
  ],
  "goals": null,
  "skills": null
}

// Result: Adds assets/debts to financials, recalculates totals
```

## 🔐 Security & Authentication

### Authentication Flow
- **Firebase Auth**: All functions require authenticated users
- **User Isolation**: Users can only access their own data
- **Token Validation**: Automatic Firebase token verification
- **Security Rules**: Firestore rules enforce user data isolation

### Data Privacy
- **Personal Info Protection**: AI cannot update personal profile information
- **Conversation Logging**: All AI interactions logged for transparency
- **Data Encryption**: All data encrypted in transit and at rest
- **Access Control**: Role-based access to different data types

## 🎯 Phase 1 Demonstration Highlights

### Modular AI Architecture
- **Scalable Design**: Each AI module has specific responsibilities
- **Maintainable Code**: Clean separation of concerns for easy updates
- **Intelligent Processing**: GPT-4 integration with LangChain orchestration
- **Real-time Pipeline**: Immediate data extraction and storage

### Advanced Data Processing
- **Smart Extraction**: Automatically identifies financial information in conversations
- **Schema Transformation**: Converts AI data to proper database format
- **Duplicate Prevention**: Intelligent merging prevents duplicate entries
- **Context Awareness**: AI understands complete user financial profile

### Serverless Scalability
- **Firebase Functions**: Auto-scaling serverless architecture
- **Real-time Database**: Instant synchronization across all clients
- **Secure Operations**: Comprehensive authentication and authorization
- **Performance Optimization**: Efficient data processing and storage

---

This backend demonstrates sophisticated AI integration with personal finance management, showcasing how conversational AI can seamlessly extract and process financial data in a secure, scalable serverless environment. 