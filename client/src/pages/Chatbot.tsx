import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input } from '../components/ui';
import Footer from '../components/Footer';
import { getUserProfile } from '../services/firestore';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export default function Chatbot() {
  const { currentUser } = useAuth();
  const [userName, setUserName] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Load user's name and set initial message
  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUser) return;
      
      try {
        const profile = await getUserProfile();
        const name = profile?.basicInfo?.name || currentUser.displayName || currentUser.email?.split('@')[0] || 'there';
        setUserName(name.split(' ')[0]); // Use first name only
        
        // Set personalized initial message
        const initialMessage: Message = {
          id: '1',
          text: `Hi ${name.split(' ')[0]}! I'm your AI financial advisor. I can help you with budgeting, goal setting, investment advice, and more. What would you like to discuss today?`,
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages([initialMessage]);
      } catch (error) {
        console.error('Error loading user data:', error);
        // Fallback to generic message
        const fallbackMessage: Message = {
          id: '1',
          text: "Hi! I'm your AI financial advisor. I can help you with budgeting, goal setting, investment advice, and more. What would you like to discuss today?",
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages([fallbackMessage]);
      }
    };

    loadUserData();
  }, [currentUser]);

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

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate bot response (replace with actual AI integration later)
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Thanks for your message! I'm still learning and will be able to provide personalized financial advice soon. In the meantime, feel free to explore your goals and track your progress!",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000);
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
    <div className="h-screen bg-surface-50 flex flex-col overflow-hidden">
      <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full">
          <div className="bg-white rounded-lg shadow-lg border border-surface-200 flex flex-col h-full">
            {/* Header */}
            <div className="bg-white border-b border-surface-200 px-6 py-4 rounded-t-lg flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-surface-900">
                    {userName ? `${userName}'s AI Financial Advisor` : 'AI Financial Advisor'}
                  </h1>
                  <p className="text-sm text-surface-600">
                    {userName ? `Hello ${userName}! Your personal finance assistant` : 'Your personal finance assistant'}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 relative" ref={messagesContainerRef} onScroll={handleScroll}>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-primary-500 text-white'
                        : 'bg-surface-100 border border-surface-200 text-surface-900'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
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
                  <div className="bg-surface-100 border border-surface-200 text-surface-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-1">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-surface-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-xs text-surface-500 ml-2">AI is typing...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />

              {/* Scroll to bottom button */}
              {showScrollButton && (
                <button
                  onClick={scrollToBottom}
                  className="absolute bottom-4 right-4 bg-primary-500 hover:bg-primary-600 text-white p-2 rounded-full shadow-lg transition-colors"
                  title="Scroll to bottom"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </button>
              )}
            </div>

            {/* Quick Questions */}
            {messages.length === 1 && (
              <div className="px-6 py-2 border-t border-surface-100 flex-shrink-0">
                <p className="text-sm text-surface-600 mb-3">Quick questions to get started:</p>
                <div className="flex flex-wrap gap-2">
                  {quickQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickQuestion(question)}
                      className="px-3 py-1 text-sm bg-surface-100 hover:bg-surface-200 text-surface-700 rounded-full transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="bg-white border-t border-surface-200 px-6 py-4 rounded-b-lg flex-shrink-0">
              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Ask me anything about your finances..."
                    className="block w-full px-3 py-2 border border-surface-300 rounded-md shadow-sm placeholder-surface-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <Button 
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping}
                  className="shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </Button>
              </div>
              <p className="text-xs text-surface-500 mt-2">
                Press Enter to send • This is a demo interface - AI responses coming soon!
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
} 