# RT1M - Road to 1 Million

A modern personal finance application with AI-powered conversational assistance, built to help users achieve their $1 million net worth goal through intelligent financial planning and management.

## 🎯 Overview

RT1M is a full-stack web application that combines traditional financial tracking with cutting-edge AI assistance. Users can manage their finances through both a comprehensive dashboard interface and natural language conversations with an AI financial advisor.

### Key Features
- **AI Financial Advisor**: ChatGPT-like conversations with automatic data extraction
- **Comprehensive Financial Tracking**: Assets, debts, income, expenses, and goals
- **Real-time Net Worth Calculation**: Live updates across all components
- **Goal Management with Submilestones**: Break down large goals into actionable steps
- **Financial Plan Generation**: AI-created step-by-step financial plans
- **Cross-platform Sync**: Real-time data synchronization
- **Markdown Chat Support**: Rich formatting in AI responses

## 🏗️ Architecture

### Technology Stack

**Frontend (React + TypeScript)**
- React 18 with TypeScript for type safety
- Vite for fast development and building
- Tailwind CSS for responsive, utility-first styling
- Firebase SDK for authentication and real-time data
- React Router for client-side routing
- Context API for state management
- React Markdown for formatted chat messages

**Backend (Firebase Functions)**
- Firebase Cloud Functions (Node.js) for serverless execution
- OpenAI Assistants API with GPT-4 and GPT-4o-mini
- Firebase Firestore for real-time database operations
- Firebase Authentication for secure user management
- Modular AI architecture with specialized assistants

### Project Structure

```
RT1M/
├── client/                    # React frontend application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── ui/           # Base components (Button, Input, Modal, etc.)
│   │   │   ├── dashboard/    # Dashboard-specific components
│   │   │   ├── MiniChatbot.tsx # AI chat widget
│   │   │   └── Navbar.tsx    # Navigation component
│   │   ├── pages/            # Main application pages
│   │   │   ├── Dashboard.tsx # Net worth overview
│   │   │   ├── Financials.tsx # Financial management
│   │   │   ├── Goals.tsx     # Goal tracking
│   │   │   ├── Chatbot.tsx   # Full-screen chat
│   │   │   └── Profile.tsx   # User profile management
│   │   ├── contexts/         # React context providers
│   │   │   ├── AuthContext.tsx # Authentication state
│   │   │   └── ChatContext.tsx # Chat state management
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API and external services
│   │   └── utils/            # Utility functions
│   └── package.json
├── server/
│   └── functions/            # Firebase Cloud Functions
│       ├── handlers/         # Specialized function handlers
│       │   ├── ai_langchain_assistants.js # Main AI orchestration
│       │   ├── ai_context_assistant_schema.js # AI response schemas
│       │   ├── ai_context_assistant_tools.js # AI helper functions
│       │   ├── ai_smart_chat.js # Chat processing
│       │   ├── financials.js # Financial data management
│       │   ├── goals.js      # Goal tracking
│       │   ├── profile.js    # User profile management
│       │   └── skills.js     # Skills tracking
│       ├── utils/            # Shared utilities
│       │   ├── auth.js       # Authentication utilities
│       │   ├── firestore.js  # Database operations
│       │   └── validation.js # Data validation
│       └── index.js          # Functions entry point
└── README.md                 # This file
```

## 🤖 AI System Architecture

### Three-Layer Assistant System

The AI system uses OpenAI Assistants with a sophisticated routing architecture:

```
User Message
     ↓
Router Assistant (GPT-4o-mini)
     ↓
Determines routing path:
├── GENERAL → Direct response for general financial advice
├── CONTEXT → Context Assistant for personalized advice
└── PLAN → Plan Assistant for financial plan generation
```

**1. Router Assistant (GPT-4o-mini)**
- Routes messages to appropriate assistants
- Provides direct responses for general financial questions
- Receives basic profile info (name, occupation, location) for personalization
- Optimized for speed and cost efficiency

**2. Context Assistant (GPT-4)**
- Handles personalized financial advice
- Receives complete user financial profile
- Supports CRUD operations (Create, Read, Update, Delete)
- Automatically extracts and saves financial data from conversations
- Enhanced with submilestone support for goals

**3. Plan Assistant (GPT-4)**
- Generates comprehensive financial plans
- Creates step-by-step action items with timeframes
- Defines milestones and progress tracking
- Validates plan structure and feasibility

### AI Capabilities

**Data Extraction Engine**
The AI automatically identifies and extracts:

- **Financial Information**: Income, expenses, savings, cash flow
- **Assets**: Real estate, vehicles, investments, retirement accounts
- **Debts**: Mortgages, credit cards, loans with interest rates
- **Goals**: Financial targets, timelines, and priorities with submilestones
- **Skills**: Professional skills and interests for career development

**CRUD Operations**
- **Create**: Add new financial data from conversations
- **Read**: Understand complete user financial context
- **Update**: Modify existing data using exact IDs
- **Delete**: Remove outdated or paid-off items

**Example Conversation Flow**:
```
User: "I make $75k and have a $400k house with a $300k mortgage at 3.2%"
↓
AI extracts: income, assets, debts
↓
Saves to appropriate Firebase collections
↓
Responds: "Great! You have solid equity in your home. With your $75k income..."
↓
UI automatically refreshes to show new data
```

## 📊 Database Schema

### Firebase Collections Structure
```
users/{uid}/
├── profile/data          # Personal info, education, experience, financial goals
├── financials/data       # Financial info, assets, debts
├── goals/data           # Intermediate goals and milestones
├── skills/data          # Skills and interests
├── ai_conversations/    # Chat history and extracted data
└── plans/              # AI-generated financial plans
```

### Data Philosophy: Null vs Empty
The application distinguishes between:
- **Null**: Data not entered yet (shows "Add your first..." prompts)
- **Empty Array []**: User confirmed they have none (shows "You have no..." messages)
- **Populated Array**: Actual data with management options

This distinction enables better AI context and user experience.

## 🎨 Frontend Features

### Design System
- **Custom UI Components**: Built with Tailwind CSS
- **Responsive Design**: Mobile-first approach
- **Color Palette**: Primary (blue), Secondary (green), Accent (purple), Surface (gray)
- **Typography**: Consistent hierarchy with responsive text scales
- **Component Variants**: Multiple styles for different contexts

### User Experience
- **Real-time Sync**: Changes appear instantly across all components
- **Optimistic Updates**: UI updates immediately, syncs with server
- **Error Handling**: Graceful error recovery with user notifications
- **Loading States**: Clear feedback during data operations
- **Unsaved Changes Protection**: Prevents navigation with unsaved data

### Chat Interface
- **Mini Chatbot**: Persistent widget available on all pages
- **Full-screen Chat**: Dedicated page for extended conversations
- **Markdown Support**: Rich formatting with **bold**, *italic*, lists, and code blocks
- **Auto-refresh**: Pages update automatically when AI makes changes
- **Conversation History**: Persistent chat history across sessions

## 🔧 API Endpoints

### Authentication & User Management
```javascript
createUserProfile(request)     // Create user profile with all subcollections
getUserStats(request)          // Get user statistics and net worth
cleanupUserData(request)       // Clean up all user data on account deletion
```

### AI Chat & Processing
```javascript
handleSmartChatMessage(request)  // Main AI chat endpoint
// Input: { message, sessionId }
// Output: { message, extractedData, operations, isReadyForPlan }

getAIConversationContext(request)  // Get complete user context for AI
updateUserDataFromAI(request)      // Update user data from AI conversations
```

### Financial Management
```javascript
getUserFinancials(request)                    // Get user financial data
updateUserFinancialsSection(request)          // Update specific financial section
saveUserFinancials(request)                   // Save complete financial data
```

### Goals & Planning
```javascript
getUserIntermediateGoals(request)             // Get user goals
addIntermediateGoal(request)                  // Add new goal
updateIntermediateGoal(request)               // Update existing goal
deleteIntermediateGoal(request)               // Delete goal
generateFinancialPlan(request)                // AI plan generation
```

### Profile & Skills
```javascript
getUserProfile(request)                       // Get user profile
updateUserProfileSection(request)             // Update profile section
getUserSkills(request)                        // Get skills and interests
updateUserSkillsSection(request)              // Update skills section
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Firebase CLI installed globally
- OpenAI API key
- Firebase project with Firestore and Authentication enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/RT1M.git
   cd RT1M
   ```

2. **Setup Frontend**
   ```bash
   cd client
   npm install
   ```

3. **Setup Backend**
   ```bash
   cd ../server/functions
   npm install
   ```

4. **Configure Firebase**
   ```bash
   firebase login
   firebase use your-project-id
   ```

5. **Set Environment Variables**
   ```bash
   # Set OpenAI API key
   firebase functions:secrets:set OPENAI_API_KEY
   
   # Set Assistant IDs (after creating assistants in OpenAI platform)
   firebase functions:secrets:set ROUTER_ASSISTANT_ID
   firebase functions:secrets:set CONTEXT_ASSISTANT_ID
   firebase functions:secrets:set PLAN_ASSISTANT_ID
   ```

6. **Deploy Functions**
   ```bash
   firebase deploy --only functions
   ```

7. **Start Frontend Development Server**
   ```bash
   cd ../../client
   npm run dev
   ```

### OpenAI Assistants Setup

Create three assistants in the OpenAI platform:

1. **Router Assistant** (GPT-4o-mini)
   - Routes messages and provides general financial advice
   - Uses router schema with route, response, confidence, reasoning

2. **Context Assistant** (GPT-4)
   - Handles personalized advice with full user data
   - Uses context schema with CRUD operations support
   - Includes submilestones for goal management

3. **Plan Assistant** (GPT-4)
   - Generates comprehensive financial plans
   - Uses plan schema with steps, milestones, and resources

## 🔒 Security & Privacy

### Authentication
- Firebase Authentication with email/password
- Secure token validation on all API calls
- User data isolation (users can only access their own data)
- Protected routes requiring authentication

### Data Privacy
- AI cannot access or modify personal profile information
- All data encrypted in transit and at rest
- Conversation logging for transparency and debugging
- GDPR-compliant data handling

### Input Validation
- Client-side and server-side validation
- Data sanitization for all user inputs
- Schema validation using TypeScript and Zod
- SQL injection and XSS protection

## 🎯 Key Features in Detail

### Financial Tracking
- **Net Worth Calculation**: Real-time calculation of assets minus debts
- **Cash Flow Analysis**: Income vs expenses with savings rate
- **Asset Management**: Categorized assets with valuation tracking
- **Debt Management**: Interest rates, minimum payments, payoff tracking
- **Progress Visualization**: Charts and progress bars for goals

### AI Conversation Features
- **Natural Language Processing**: Understands complex financial discussions
- **Context Awareness**: Maintains complete financial profile understanding
- **Automatic Data Extraction**: Saves mentioned financial information
- **Personalized Advice**: Tailored recommendations based on user situation
- **Plan Generation**: Creates detailed step-by-step financial plans

### Goal Management
- **Multiple Goal Types**: Financial, skill, lifestyle, networking, project
- **Submilestones**: Break large goals into manageable steps
- **Progress Tracking**: Visual indicators and completion percentages
- **AI Suggestions**: AI can recommend relevant goals
- **Edit/Delete Support**: Modify goals through conversation

### Real-time Updates
- **Live Synchronization**: Changes appear instantly across all components
- **Cross-platform Sync**: Updates sync across all user devices
- **Optimistic UI**: Immediate feedback with server synchronization
- **Auto-refresh**: Pages refresh when AI makes changes
- **Conflict Resolution**: Handles concurrent updates gracefully

## 🧪 Testing & Quality

### Code Quality
- **TypeScript**: Full type safety throughout the application
- **ESLint**: Code linting with React and TypeScript rules
- **Prettier**: Consistent code formatting
- **Git Hooks**: Pre-commit hooks for quality checks

### Error Handling
- **Error Boundaries**: React error boundaries for graceful error handling
- **User Feedback**: Clear error messages and loading states
- **Fallback UI**: Graceful degradation when features are unavailable
- **Comprehensive Logging**: Detailed logging for debugging

### Performance
- **Optimized Bundle**: Code splitting and lazy loading
- **Caching**: Intelligent caching strategies
- **Database Optimization**: Efficient queries and indexing
- **CDN**: Static asset delivery via CDN

## 📈 Future Enhancements

### Planned Features
- **Investment Tracking**: Portfolio management and performance tracking
- **Bill Management**: Recurring bill tracking and payment reminders
- **Tax Planning**: Tax optimization suggestions and document management
- **Credit Score Monitoring**: Integration with credit monitoring services
- **Financial Education**: Interactive learning modules and quizzes

### Technical Improvements
- **Mobile App**: React Native mobile application
- **Offline Support**: Progressive Web App with offline capabilities
- **Advanced Analytics**: Machine learning for spending pattern analysis
- **API Integrations**: Bank account linking and automated data import
- **Multi-currency Support**: International user support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Follow the existing code style

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for the GPT-4 API and Assistants platform
- Firebase for the comprehensive backend platform
- The React and TypeScript communities
- All contributors and testers

---

**RT1M** - Empowering users to achieve their $1 million net worth goal through intelligent financial planning and AI-powered assistance. 