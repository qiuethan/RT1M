# RT1M - AI-Powered Personal Finance Assistant (Phase 1)

RT1M is a comprehensive personal finance application that combines intelligent AI chat capabilities with robust financial tracking and planning tools. Built with React, Firebase, and OpenAI's GPT-4, RT1M helps users manage their finances through natural conversation while maintaining detailed financial records.

**This is Phase 1** - A demonstration of core AI-powered financial management capabilities with conversational data extraction and intelligent financial planning.

## 🚀 Features

### 💬 Conversational AI Assistant
- **Natural Language Processing**: Chat naturally about your finances using GPT-4
- **Smart Data Extraction**: AI automatically extracts and saves financial information from conversations
- **Contextual Responses**: AI understands your complete financial profile for personalized advice
- **Plan Generation**: AI can create detailed step-by-step financial plans based on your goals

### 📊 Financial Management
- **Income & Expense Tracking**: Monitor your cash flow and savings rate
- **Asset Management**: Track real estate, investments, retirement accounts, and other assets
- **Debt Management**: Monitor mortgages, credit cards, loans, and payment schedules
- **Net Worth Calculation**: Automatic calculation with visual progress tracking

### 🎯 Goal Setting & Tracking
- **Financial Goals**: Set and track savings, investment, and debt payoff goals
- **Progress Monitoring**: Visual progress bars and milestone tracking
- **AI-Generated Goals**: AI can suggest relevant goals based on your financial situation
- **Multiple Goal Types**: Support for financial, skill, lifestyle, and project goals

### 🔐 Secure User Management
- **Firebase Authentication**: Secure user registration and login
- **Data Privacy**: Personal financial data is encrypted and securely stored
- **User Profiles**: Comprehensive profile management with education and experience tracking

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Modern React**: Built with React 18, TypeScript, and Vite
- **Tailwind CSS**: Beautiful, responsive UI with custom design system
- **Component Library**: Reusable UI components (Button, Input, Modal, etc.)
- **State Management**: Context API for authentication and chat state
- **Real-time Updates**: Live data synchronization with Firebase

### Backend (Firebase Functions)
- **Serverless Architecture**: Firebase Cloud Functions for scalable backend
- **Modular Design**: Organized into specialized handlers (AI, financials, goals, etc.)
- **AI Integration**: LangChain integration with OpenAI GPT-4
- **Data Processing**: Smart data extraction and transformation pipelines

### Database (Firestore)
- **Document-Based**: Flexible NoSQL database structure
- **Real-time Sync**: Instant updates across all connected clients
- **Scalable Collections**: Organized by user with subcollections for different data types
- **Data Integrity**: Null vs empty distinction for better AI context

## 📁 Project Structure

```
RT1M/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Main application pages
│   │   ├── contexts/      # React context providers
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API and Firebase services
│   │   └── utils/         # Utility functions
│   └── public/            # Static assets
├── server/                # Firebase backend
│   └── functions/
│       ├── handlers/      # Modular function handlers
│       ├── utils/         # Backend utilities
│       └── index.js       # Main functions entry point
└── chatbot/              # Standalone chatbot module (legacy)
```

## 🛠️ Technology Stack

**Frontend:**
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Firebase SDK for authentication and data

**Backend:**
- Firebase Cloud Functions (Node.js)
- LangChain for AI orchestration
- OpenAI GPT-4 for natural language processing
- Firebase Firestore for data storage

**AI & Data Processing:**
- OpenAI GPT-4 Turbo for conversations
- Custom data extraction pipelines
- Smart schema transformation
- Duplicate detection and prevention

## 🎯 Key Features Explained

### AI-Powered Data Extraction
The AI assistant can automatically extract and save financial information from natural conversations:

- **Financial Info**: Income, expenses, savings amounts
- **Assets**: Houses, cars, investments, retirement accounts
- **Debts**: Mortgages, credit cards, loans with interest rates
- **Goals**: Financial targets, savings goals, debt payoff plans
- **Skills**: Professional skills and interests for career planning

### Smart Data Handling
- **Null vs Empty**: Distinguishes between "not entered" (null) and "confirmed none" (empty array)
- **Duplicate Prevention**: Prevents duplicate entries when AI extracts similar information
- **Schema Transformation**: Converts AI-extracted data to proper database format
- **Real-time Updates**: Changes appear immediately in the UI after AI conversations

### Comprehensive Financial Tracking
- **Dashboard**: Overview of net worth, cash flow, and key metrics
- **Detailed Views**: Separate pages for financials, goals, and profile management
- **Progress Tracking**: Visual indicators for goal progress and financial health
- **Historical Data**: Maintains conversation history and data change tracking

## 🔒 Security & Privacy

- **Authentication**: Secure Firebase Authentication with email/password
- **Data Encryption**: All data encrypted in transit and at rest
- **User Isolation**: Each user's data is completely isolated
- **Privacy Controls**: Users control what information they share with AI
- **Audit Trail**: All AI interactions are logged for transparency

## 🎨 Phase 1 Demonstration

This Phase 1 implementation showcases:

### Core Functionality
- **Conversational AI**: Natural language financial conversations with GPT-4
- **Data Extraction**: Automatic extraction of financial information from chat
- **Real-time Updates**: Immediate reflection of extracted data in the UI
- **Financial Planning**: AI-generated step-by-step financial plans

### User Experience
- **Intuitive Chat Interface**: Both mini-chatbot widget and full-screen chat
- **Responsive Design**: Works seamlessly across desktop and mobile
- **Real-time Sync**: All changes sync instantly across the application
- **Visual Progress**: Clear indicators of financial health and goal progress

### Technical Innovation
- **Modular AI Architecture**: Scalable, maintainable AI integration
- **Smart Data Pipeline**: Intelligent data transformation and validation
- **Context-Aware AI**: AI understands complete user financial profile
- **Privacy-First Design**: AI cannot access sensitive personal information

## 🔮 Future Phases

Phase 1 establishes the foundation for:
- **Enhanced AI Capabilities**: More sophisticated financial analysis and advice
- **Bank Integration**: Direct connectivity with financial institutions
- **Advanced Analytics**: Predictive insights and trend analysis
- **Mobile Applications**: Dedicated mobile apps with push notifications
- **Investment Tools**: Portfolio management and investment recommendations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for GPT-4 API
- Firebase for backend infrastructure
- LangChain for AI orchestration
- React and the open-source community

## 📧 Contact

For questions or support, please open an issue on GitHub or contact the maintainers.

---

**RT1M Phase 1** - Demonstrating the future of conversational personal finance management. 