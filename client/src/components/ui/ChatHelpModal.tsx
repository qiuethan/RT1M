import React from 'react';
import Modal from './Modal';

interface ChatHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatHelpModal: React.FC<ChatHelpModalProps> = ({ isOpen, onClose }) => {
  const examples = [
    {
      category: "💰 Financial Planning",
      questions: [
        "I make $50,000 a year now - help me create a realistic budget",
        "I have $15,000 in credit card debt - what's my best payoff strategy?",
        "Should I focus on my emergency fund or investing right now?"
      ]
    },
    {
      category: "📈 Investing & Goals",
      questions: [
        "Make me a goal to buy a house in 3 years for $400,000",
        "I have $10,000 to invest now - what do you recommend for my age?",
        "Make me a retirement plan to have $2M by age 60"
      ]
    },
    {
      category: "🎯 Life Changes",
      questions: [
        "I just got married - how should this change my financial plan?",
        "I'm switching jobs and my salary is increasing by $20,000",
        "We're expecting a baby - what financial changes should I make?"
      ]
    },
    {
      category: "📊 Portfolio Review",
      questions: [
        "Look at all my financial data and tell me what I should prioritize",
        "How am I doing compared to my goals? What needs adjustment?",
        "I feel financially stuck - what's holding me back from my goals?"
      ]
    }
  ];

  const mobileExamples = [
    {
      category: "✏️ Direct Updates",
      questions: [
        "I got a raise to $85,000 annually - update my income",
        "Add a goal to save $30,000 for a wedding by 2026"
      ]
    },
    {
      category: "📝 Life Changes",
      questions: [
        "I paid off my student loan completely",
        "I bought a house worth $450,000 with a $360,000 mortgage"
      ]
    }
  ];

  const tips = [
    {
      icon: "💡",
      title: "Be Specific",
      description: "Include numbers, timeframes, and your current situation for better advice."
    },
    {
      icon: "✏️",
      title: "AI Updates Your Data",
      description: "Just tell the AI about changes - it can directly update your financial info and goals!"
    },
    {
      icon: "🎯", 
      title: "Ask Follow-ups",
      description: "Don't hesitate to ask for clarification or dive deeper into topics."
    },
    {
      icon: "⭐",
      title: "Use 'Make me a plan'",
      description: "Our most powerful feature creates comprehensive financial plans."
    }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="How to Use Your AI Financial Advisor" size="md">
      <div className="space-y-4 sm:space-y-6">
        {/* Introduction */}
        <div className="text-center p-3 sm:p-4 bg-gradient-to-r from-primary-50 to-accent-50 rounded-lg border border-primary-100">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="font-semibold text-sm sm:text-base text-surface-900 mb-1 sm:mb-2">Your Personal Finance AI Assistant</h3>
          <p className="text-xs sm:text-sm text-surface-600">Get personalized financial advice, budgeting help, investment guidance, and comprehensive financial plans.</p>
        </div>

        {/* Tips for better results */}
        <div>
          <h4 className="font-medium text-sm sm:text-base text-surface-900 mb-2 sm:mb-3 flex items-center gap-2">
            <span>🚀</span> Tips for Better Results
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {tips.map((tip, index) => (
              <div key={index} className="p-2 sm:p-3 bg-surface-50 rounded-lg border border-surface-200">
                <div className="flex items-start gap-2">
                  <span className="text-base sm:text-lg">{tip.icon}</span>
                  <div>
                    <h5 className="font-medium text-xs sm:text-sm text-surface-900">{tip.title}</h5>
                    <p className="text-xs text-surface-600 mt-0.5 sm:mt-1">{tip.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Data Integration */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 sm:p-4 rounded-lg border border-blue-200">
          <h4 className="font-medium text-sm sm:text-base text-surface-900 mb-2 sm:mb-3 flex items-center gap-2">
            <span>🔗</span> AI Can Edit Your Data
          </h4>
          <div className="space-y-2 sm:space-y-3">
            <div className="bg-white p-2 sm:p-3 rounded border border-blue-200">
              <div className="flex items-center gap-2 mb-1 sm:mb-2">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-blue-400 to-indigo-500 rounded flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <span className="font-medium text-xs sm:text-sm">Direct Data Updates</span>
              </div>
              <p className="text-xs text-surface-600 mb-1 sm:mb-2">
                <strong>The AI can directly update your financial data and goals through this chat!</strong> Just tell it what changed:
              </p>
              <ul className="text-xs text-surface-600 space-y-0.5 sm:space-y-1 ml-3 sm:ml-4">
                <li>• <strong>Financial Updates:</strong> "I got a raise to $75,000" or "I paid off my credit card"</li>
                <li>• <strong>Goal Changes:</strong> "Add a goal to save $20,000 for a car" or "Update my house goal to $500,000"</li>
                <li>• <strong>Life Events:</strong> "I bought a house" or "I started a new investment account"</li>
              </ul>
              <p className="text-xs text-surface-500 mt-1 sm:mt-2 italic">
                No need to manually update pages - just chat naturally and the AI will handle the updates!
              </p>
            </div>
            
            <div className="bg-white p-2 sm:p-3 rounded border border-blue-200 mt-3 sm:mt-4">
              <div className="flex items-center gap-2 mb-1 sm:mb-2">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-green-400 to-green-500 rounded flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="font-medium text-xs sm:text-sm">Keep App Pages Updated</span>
              </div>
              <p className="text-xs text-surface-600 mb-1 sm:mb-2">
                For the most accurate advice, also keep your data current in:
              </p>
              <ul className="text-xs text-surface-600 space-y-0.5 sm:space-y-1 ml-3 sm:ml-4">
                <li>• <strong>Financials Page:</strong> Income, expenses, assets, and debts</li>
                <li>• <strong>Goals Page:</strong> Financial goals and milestones</li>
                <li>• <strong>Profile Page:</strong> Personal information and preferences</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Example questions */}
        <div>
          <h4 className="font-medium text-sm sm:text-base text-surface-900 mb-2 sm:mb-3 flex items-center gap-2">
            <span>💬</span> Example Questions
          </h4>
          <div className="space-y-2 sm:space-y-4">
            {/* Mobile examples */}
            <div className="block sm:hidden">
              {mobileExamples.map((category, index) => (
                <div key={index} className="mb-2">
                  <h5 className="font-medium text-xs text-surface-800 mb-1">{category.category}</h5>
                  <div className="space-y-1">
                    {category.questions.map((question, qIndex) => (
                      <div key={qIndex} className="text-xs text-surface-600 bg-surface-50 px-2 py-1.5 rounded border border-surface-200">
                        "{question}"
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="text-center mt-2">
                <p className="text-xs text-surface-500">...and many more topics!</p>
              </div>
            </div>

            {/* Desktop examples */}
            <div className="hidden sm:block">
              <div className="space-y-2">
                {examples.slice(0, 2).map((category, index) => (
                  <div key={index} className={index === 1 ? 'mt-4' : ''}>
                    <h5 className="font-medium text-xs text-surface-700 mb-1">{category.category}</h5>
                    <div className="space-y-1">
                      {category.questions.slice(0, 2).map((question, qIndex) => (
                        <div key={qIndex} className="bg-surface-50 p-2 rounded text-xs text-surface-600 italic">
                          "{question}"
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <p className="text-xs text-surface-500 mt-3 italic">...and many more topics!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Special features */}
        <div className="bg-gradient-to-r from-accent-50 to-accent-100 p-3 sm:p-4 rounded-lg border border-accent-200">
          <h4 className="font-medium text-sm sm:text-base text-surface-900 mb-2 sm:mb-3 flex items-center gap-2">
            <span>⭐</span> Special Features
          </h4>
          <div className="space-y-2 sm:space-y-3">
            <div className="bg-white p-2 sm:p-3 rounded border border-accent-200">
              <div className="flex items-center gap-2 mb-1 sm:mb-2">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-accent-400 to-accent-500 rounded flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <span className="font-medium text-xs sm:text-sm">Make me a plan</span>
              </div>
              <p className="text-xs text-surface-600">
                Our most powerful feature! Creates comprehensive, personalized financial plans based on your goals, income, and current situation.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-surface-500 pt-3 sm:pt-4 border-t border-surface-200">
          <p>💡 Remember: This AI provides educational guidance. Always consult with qualified financial professionals for major decisions.</p>
        </div>
      </div>
    </Modal>
  );
};

export default ChatHelpModal; 