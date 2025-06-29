import { useState, useRef, useEffect } from 'react';
import { Button, LoadingSpinner, MarkdownMessage } from '../components/ui';
import Footer from '../components/Footer';
import { useChatContext } from '../contexts/ChatContext';

export default function Chatbot() {
  const { messages, addMessage, isTyping, userName, clearMessages, sendMessage, generatePlan } = useChatContext();
  const [inputValue, setInputValue] = useState('');
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current && messagesEndRef.current) {
      // Scroll within the messages container only, not the entire page
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Auto-scroll to bottom after every message
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check if user has scrolled up to show scroll button
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
      setShowScrollButton(!isAtBottom && messages.length > 3);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Add user message
    addMessage({
      text: inputValue,
      sender: 'user'
    });

    const messageText = inputValue;
    setInputValue('');

    // Send message to AI
    await sendMessage(messageText);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const quickQuestions = [
    "How can I save more money?",
    "What's a good emergency fund amount?",
    "How do I start investing?",
    "Help me create a budget",
    "What are some side hustle ideas?"
  ];

  const handleQuickQuestion = (question: string) => {
    setInputValue(question);
  };

  return (
    <div className="h-screen bg-surface-50 flex flex-col overflow-hidden pb-20 md:pb-0">
      <div className="flex-1 py-4 sm:py-6 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto h-full">
          <div className="bg-white rounded-lg shadow-lg border border-surface-200 flex flex-col h-full">
            {/* Header */}
            <div className="bg-white border-b border-surface-200 px-4 sm:px-6 py-3 sm:py-4 rounded-t-lg flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-xl font-semibold text-surface-900">
                      {userName ? `${userName}'s AI Financial Advisor` : 'AI Financial Advisor'}
                    </h1>
                    <p className="text-xs sm:text-sm text-surface-600 hidden sm:block">
                      {userName ? `Hello ${userName}! Your personal finance assistant` : 'Your personal finance assistant'}
                    </p>
                  </div>
                </div>
                
                {messages.length > 1 && (
                  <Button
                    onClick={clearMessages}
                    variant="outline"
                    size="sm"
                    className="text-surface-600 hover:text-surface-800 px-2 sm:px-3"
                  >
                    <svg className="w-4 h-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span className="hidden sm:inline">Clear Chat</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4 relative" ref={messagesContainerRef} onScroll={handleScroll}>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-sm lg:max-w-2xl px-3 sm:px-4 py-2 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-primary-500 text-white'
                        : 'bg-surface-100 border border-surface-200 text-surface-900'
                    }`}
                  >
                    {message.sender === 'user' ? (
                      <p className="text-sm sm:text-sm">{message.text}</p>
                    ) : (
                      <MarkdownMessage content={message.text} className="text-sm sm:text-sm" />
                    )}
                    <p
                      className={`text-xs mt-1 ${
                        message.sender === 'user' ? 'text-primary-100' : 'text-surface-500'
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-surface-100 border border-surface-200 text-surface-900 max-w-[85%] sm:max-w-sm lg:max-w-2xl px-3 sm:px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <LoadingSpinner 
                        size="sm" 
                        variant="neutral" 
                        showText={false}
                      />
                      <span className="text-xs text-surface-500">AI is typing...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />

              {/* Scroll to bottom button */}
              {showScrollButton && (
                <button
                  onClick={scrollToBottom}
                  className="absolute bottom-4 right-4 bg-primary-500 hover:bg-primary-600 text-white p-2 sm:p-3 rounded-full shadow-lg transition-colors z-10"
                  title="Scroll to bottom"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </button>
              )}
            </div>

            {/* Star Feature & Quick Questions */}
            {messages.length === 1 && (
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-surface-100 flex-shrink-0 space-y-3 sm:space-y-4">
                {/* Star Feature Button */}
                <div>
                  <p className="text-xs sm:text-sm text-surface-600 mb-2 sm:mb-3 font-medium">⭐ Our most powerful feature:</p>
                  <button
                    onClick={async () => {
                      addMessage({
                        text: "Make me a plan",
                        sender: 'user'
                      });
                      await generatePlan();
                    }}
                    className="w-full flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-4 px-4 sm:px-6 bg-gradient-to-r from-accent-400 to-accent-500 hover:from-accent-500 hover:to-accent-600 text-white rounded-xl font-semibold text-base sm:text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    Make me a plan
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>

                {/* Quick Questions */}
                <div>
                  <p className="text-xs sm:text-sm text-surface-600 mb-2 sm:mb-3 font-medium">💡 Quick questions to get started:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    {quickQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickQuestion(question)}
                        className="text-left p-2 sm:p-3 bg-surface-50 hover:bg-surface-100 border border-surface-200 rounded-lg transition-colors text-xs sm:text-sm text-surface-700 hover:text-surface-900"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-3 sm:p-4 border-t border-surface-200 flex-shrink-0">
              <div className="flex space-x-2 sm:space-x-3">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about your finances..."
                  className="flex-1 min-h-[44px] max-h-32 p-3 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-sm sm:text-base"
                  rows={1}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping}
                  className="px-3 sm:px-4 py-3 min-w-[44px] flex items-center justify-center"
                >
                  {isTyping ? (
                    <LoadingSpinner 
                      size="sm" 
                      variant="white" 
                      showText={false}
                    />
                  ) : (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
} 