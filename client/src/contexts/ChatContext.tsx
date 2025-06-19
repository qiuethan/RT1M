import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getUserProfile } from '../services/firestore';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatContextType {
  messages: ChatMessage[];
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;
  isTyping: boolean;
  setIsTyping: (typing: boolean) => void;
  userName: string;
  isMiniChatbotOpen: boolean;
  setIsMiniChatbotOpen: (open: boolean) => void;
  toggleMiniChatbot: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [isMiniChatbotOpen, setIsMiniChatbotOpen] = useState(false);

  // Load user's name and set initial message
  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUser) return;
      
      try {
        const profile = await getUserProfile();
        const name = profile?.basicInfo?.name || currentUser.displayName || currentUser.email?.split('@')[0] || 'there';
        const firstName = name.split(' ')[0];
        setUserName(firstName);
        
        // Set personalized initial message if no messages exist
        if (messages.length === 0) {
          const initialMessage: ChatMessage = {
            id: '1',
            text: `Hi ${firstName}! I'm your AI financial advisor. How can I help you today?`,
            sender: 'bot',
            timestamp: new Date()
          };
          setMessages([initialMessage]);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setUserName('there');
        // Fallback to generic message
        if (messages.length === 0) {
          const fallbackMessage: ChatMessage = {
            id: '1',
            text: "Hi! I'm your AI financial advisor. How can I help you today?",
            sender: 'bot',
            timestamp: new Date()
          };
          setMessages([fallbackMessage]);
        }
      }
    };

    loadUserData();
  }, [currentUser, messages.length]);

  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const clearMessages = () => {
    const firstName = userName || 'there';
    const initialMessage: ChatMessage = {
      id: '1',
      text: `Hi ${firstName}! I'm your AI financial advisor. How can I help you today?`,
      sender: 'bot',
      timestamp: new Date()
    };
    setMessages([initialMessage]);
  };

  const toggleMiniChatbot = () => {
    setIsMiniChatbotOpen(prev => !prev);
  };

  return (
    <ChatContext.Provider value={{
      messages,
      addMessage,
      clearMessages,
      isTyping,
      setIsTyping,
      userName,
      isMiniChatbotOpen,
      setIsMiniChatbotOpen,
      toggleMiniChatbot
    }}>
      {children}
    </ChatContext.Provider>
  );
}; 