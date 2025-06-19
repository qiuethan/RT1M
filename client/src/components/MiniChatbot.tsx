import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui';
import { useChatContext, ChatMessage } from '../contexts/ChatContext';

export const MiniChatbot: React.FC = () => {
  const navigate = useNavigate();
  const { messages, addMessage, isTyping, setIsTyping, userName, isMiniChatbotOpen, toggleMiniChatbot } = useChatContext();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Scroll to bottom when mini chatbot opens
  useEffect(() => {
    if (isMiniChatbotOpen) {
      // Small delay to ensure the component is fully rendered
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [isMiniChatbotOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Add user message
    addMessage({
      text: inputValue,
      sender: 'user'
    });

    setInputValue('');
    setIsTyping(true);

    // Simulate bot response (replace with actual AI integration later)
    setTimeout(() => {
      addMessage({
        text: "Thanks for your message! I'm still learning and will be able to provide personalized financial advice soon. For more detailed conversations, visit the full Chatbot page!",
        sender: 'bot'
      });
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

  if (!isMiniChatbotOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={toggleMiniChatbot}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 shadow-lg flex items-center justify-center"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 h-96 bg-white rounded-lg shadow-xl border border-surface-200 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-accent-500 text-white p-4 rounded-t-lg flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-sm">AI Assistant</h3>
            <p className="text-xs text-white/80">Online</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/chatbot')}
            className="text-white/80 hover:text-white p-1 rounded"
            title="Open full chatbot"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>
          <button
            onClick={toggleMiniChatbot}
            className="text-white/80 hover:text-white p-1 rounded"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                message.sender === 'user'
                  ? 'bg-primary-500 text-white'
                  : 'bg-surface-100 border border-surface-200 text-surface-900'
              }`}
            >
              <p>{message.text}</p>
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
            <div className="bg-surface-100 border border-surface-200 text-surface-900 max-w-xs px-3 py-2 rounded-lg">
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
      </div>

      {/* Star Feature Button */}
      {messages.length <= 2 && (
        <div className="px-3 py-2 border-t border-surface-100">
          <button
            onClick={() => {
              addMessage({
                text: "Make me a plan",
                sender: 'user'
              });
              setIsTyping(true);
              setTimeout(() => {
                addMessage({
                  text: "I'd love to help you create a personalized financial plan! To get started, I'll need to analyze your profile data. Please visit the full Chatbot page for a comprehensive planning session where I can create a detailed roadmap to your RT1M goal!",
                  sender: 'bot'
                });
                setIsTyping(false);
              }, 1000);
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-gradient-to-r from-accent-400 to-accent-500 hover:from-accent-500 hover:to-accent-600 text-white rounded-lg font-medium text-sm transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Make me a plan
          </button>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-surface-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 text-sm border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            size="sm"
            className="px-3"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
}; 