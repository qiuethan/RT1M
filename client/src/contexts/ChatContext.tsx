import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getUserProfile, sendChatMessage, generateFinancialPlan } from '../services/firestore';

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
  sendMessage: (message: string) => Promise<void>;
  generatePlan: (goalId?: string, goalData?: any) => Promise<any>;
  isReadyForPlan: boolean;
  setIsReadyForPlan: (ready: boolean) => void;
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
  const [isMiniChatbotOpen, setIsMiniChatbotOpen] = useState(true);
  const [isReadyForPlan, setIsReadyForPlan] = useState(false);

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

  const sendMessage = async (message: string) => {
    try {
      setIsTyping(true);
      const response = await sendChatMessage(message, `session_${currentUser?.uid}`);
      
      if (response.success) {
        addMessage({
          text: response.message,
          sender: 'bot'
        });
        
        // Update readiness for plan generation
        if (response.isReadyForPlan !== undefined) {
          setIsReadyForPlan(response.isReadyForPlan);
        }
      } else {
        addMessage({
          text: "I'm sorry, I'm having trouble responding right now. Please try again later.",
          sender: 'bot'
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage({
        text: "I'm sorry I had trouble understanding that. Could you please try rephrasing your message?",
        sender: 'bot'
      });
    } finally {
      setIsTyping(false);
    }
  };

  const generatePlan = async (goalId?: string, goalData?: any) => {
    try {
      setIsTyping(true);
      const response = await generateFinancialPlan(goalId, goalData);
      
      if (response.success && response.plan) {
        addMessage({
          text: `Great! I've created a comprehensive financial plan for you: "${response.plan.title}". The plan includes ${response.plan.steps?.length || 0} actionable steps and ${response.plan.milestones?.length || 0} milestones to track your progress. You can view and manage your plans in your dashboard.`,
          sender: 'bot'
        });
        return response.plan;
      } else {
        addMessage({
          text: "I had trouble creating your plan. Please make sure you have some goals set up and try again.",
          sender: 'bot'
        });
        return null;
      }
    } catch (error) {
      console.error('Error generating plan:', error);
      addMessage({
        text: "I'm sorry, I couldn't generate a plan right now. Please try again later.",
        sender: 'bot'
      });
      return null;
    } finally {
      setIsTyping(false);
    }
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
      toggleMiniChatbot,
      sendMessage,
      generatePlan,
      isReadyForPlan,
      setIsReadyForPlan
    }}>
      {children}
    </ChatContext.Provider>
  );
}; 