import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getUserProfile, sendChatMessage } from '../services/firestore';

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
  onDataUpdated: (updatedData: any) => void;
  dataRefreshCallbacks: (() => void)[];
  registerDataRefreshCallback: (callback: () => void) => void;
  unregisterDataRefreshCallback: (callback: () => void) => void;
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
  const [dataRefreshCallbacks, setDataRefreshCallbacks] = useState<(() => void)[]>([]);

  // Load user's name and set initial message - Clear state on logout
  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUser) {
        // User logged out - clear all chat state
        console.log('User logged out, clearing chat state');
        setMessages([]);
        setUserName('');
        setIsTyping(false);
        setIsReadyForPlan(false);
        setIsMiniChatbotOpen(true);
        setDataRefreshCallbacks([]);
        return;
      }
      
      try {
        const profile = await getUserProfile();
        const name = profile?.basicInfo?.name || currentUser.displayName || currentUser.email?.split('@')[0] || 'there';
        const firstName = name.split(' ')[0];
        setUserName(firstName);
        
        // Set personalized initial message for new user session
        const initialMessage: ChatMessage = {
          id: '1',
          text: `Hi ${firstName}! I'm your AI financial advisor. How can I help you today?`,
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages([initialMessage]);
        
        console.log(`Chat initialized for user: ${firstName}`);
      } catch (error) {
        console.error('Error loading user data:', error);
        setUserName('there');
        // Fallback to generic message
        const fallbackMessage: ChatMessage = {
          id: '1',
          text: "Hi! I'm your AI financial advisor. How can I help you today?",
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages([fallbackMessage]);
      }
    };

    loadUserData();
  }, [currentUser]);

  // Register/unregister data refresh callbacks
  const registerDataRefreshCallback = useCallback((callback: () => void) => {
    setDataRefreshCallbacks(prev => [...prev, callback]);
  }, []);

  const unregisterDataRefreshCallback = useCallback((callback: () => void) => {
    setDataRefreshCallbacks(prev => prev.filter(cb => cb !== callback));
  }, []);

  // Handle data updates from AI responses
  const onDataUpdated = (updatedData: any) => {
    // Check for limit warnings
    const warnings: string[] = [];
    
    if (updatedData.assets && Array.isArray(updatedData.assets) && updatedData.assets.length >= 10) {
      warnings.push("You've reached the maximum of 10 assets. Remove some assets before adding new ones.");
    }
    
    if (updatedData.debts && Array.isArray(updatedData.debts) && updatedData.debts.length >= 10) {
      warnings.push("You've reached the maximum of 10 debts. Remove some debts before adding new ones.");
    }
    
          if (updatedData.goals && Array.isArray(updatedData.goals) && updatedData.goals.length >= 15) {
              warnings.push("You've reached the maximum of 15 goals. Complete or remove some goals before adding new ones.");
    }

    // Show warnings if any
    if (warnings.length > 0) {
      const warningMessage = warnings.join(' ');
      addMessage({
        text: `⚠️ ${warningMessage}`,
        sender: 'bot'
      });
    }

    // Count operations for more specific feedback
    let operationCount = 0;
    const operationTypes: string[] = [];
    
    if (updatedData.operations) {
      const ops = updatedData.operations;
      if (ops.goalEdits?.length > 0) {
        operationCount += ops.goalEdits.length;
        operationTypes.push(`${ops.goalEdits.length} goal(s) updated`);
      }
      if (ops.goalDeletes?.length > 0) {
        operationCount += ops.goalDeletes.length;
        operationTypes.push(`${ops.goalDeletes.length} goal(s) deleted`);
      }
      if (ops.assetEdits?.length > 0) {
        operationCount += ops.assetEdits.length;
        operationTypes.push(`${ops.assetEdits.length} asset(s) updated`);
      }
      if (ops.assetDeletes?.length > 0) {
        operationCount += ops.assetDeletes.length;
        operationTypes.push(`${ops.assetDeletes.length} asset(s) deleted`);
      }
      if (ops.debtEdits?.length > 0) {
        operationCount += ops.debtEdits.length;
        operationTypes.push(`${ops.debtEdits.length} debt(s) updated`);
      }
      if (ops.debtDeletes?.length > 0) {
        operationCount += ops.debtDeletes.length;
        operationTypes.push(`${ops.debtDeletes.length} debt(s) deleted`);
      }
    }

    // Show success message for data updates
    if (dataRefreshCallbacks.length > 0) {
      let successMessage = "✅ New updates now available!";
      
      if (operationTypes.length > 0) {
        successMessage = `✅ New changes processed: ${operationTypes.join(', ')} now available!`;
      } else if (updatedData.assets?.length || updatedData.debts?.length || updatedData.goals?.length) {
        const newItems: string[] = [];
        if (updatedData.assets?.length) newItems.push(`${updatedData.assets.length} new asset(s)`);
        if (updatedData.debts?.length) newItems.push(`${updatedData.debts.length} new debt(s)`);
        if (updatedData.goals?.length) newItems.push(`${updatedData.goals.length} new goal(s)`);
        if (newItems.length > 0) {
          successMessage = `✅ New additions: ${newItems.join(', ')} now available!`;
        }
      }
      
      addMessage({
        text: successMessage,
        sender: 'bot'
      });
    }

    // Trigger data refresh on current page
    dataRefreshCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in data refresh callback:', error);
      }
    });
  };

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
      
      // Server now loads conversation history from Firestore automatically
      const response = await sendChatMessage(message, `session_${currentUser?.uid}`);
      
      if (response.success) {
        addMessage({
          text: response.data?.message || response.message || "I'm having trouble responding right now.",
          sender: 'bot'
        });
        
        // Handle clarification questions
        if ((response.data as any)?.needsClarification && (response.data as any)?.clarificationQuestions) {
          const questionsText = (response.data as any).clarificationQuestions
            .map((q: string, i: number) => `${i + 1}. ${q}`)
            .join('\n\n');
          
          addMessage({
            text: `${response.data?.message}\n\n${questionsText}`,
            sender: 'bot'
          });
          return; // Don't add the main message again
        }
        
        // Handle suggested goals from plan generation
        if ((response.data as any)?.isGoalSuggestion && response.data?.goals && response.data.goals.length > 0) {
          const goalsText = response.data.goals
            .map((goal: any, i: number) => `${i + 1}. ${goal.title} (${goal.type})${goal.description ? ': ' + goal.description : ''}`)
            .join('\n\n');
          
          addMessage({
            text: `${response.data?.message}\n\n**Suggested Goals:**\n${goalsText}\n\nWould you like me to add any of these goals to your Goals page?`,
            sender: 'bot'
          });
          return; // Don't add the main message again
        }
        
        // Check if AI updated any data and trigger refresh
        if (response.data && (
          response.data.financialInfo || 
          (response.data.assets && response.data.assets.length > 0) ||
          (response.data.debts && response.data.debts.length > 0) ||
          (response.data.goals && response.data.goals.length > 0) ||
          response.data.skills ||
          (response.data as any).operations // Include edit/delete operations
        )) {
          console.log('AI updated user data, triggering refresh');
          onDataUpdated(response.data);
        }
        
        // Update readiness for plan generation  
        if (response.isReadyForPlan !== undefined || response.data?.isReadyForPlan !== undefined) {
          setIsReadyForPlan(response.isReadyForPlan || response.data?.isReadyForPlan || false);
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
    // Route plan generation through new chat system instead of old direct function
    try {
      if (goalId || goalData) {
        // Specific goal-based plan generation (legacy support)
        await sendMessage(`Create a comprehensive plan to help me achieve my specific goal.`);
      } else {
        // General plan generation
        await sendMessage(`I'd like you to create a comprehensive financial plan for me.`);
      }
      return { success: true };
    } catch (error) {
      console.error('Error generating plan:', error);
      addMessage({
        text: "I'm sorry, I couldn't generate a plan right now. Please try again later.",
        sender: 'bot'
      });
      return null;
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
      setIsReadyForPlan,
      onDataUpdated,
      dataRefreshCallbacks,
      registerDataRefreshCallback,
      unregisterDataRefreshCallback
    }}>
      {children}
    </ChatContext.Provider>
  );
}; 