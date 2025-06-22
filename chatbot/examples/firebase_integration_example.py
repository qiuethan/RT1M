"""
Example: Integrating RT1M Chatbot with Firebase AI Endpoints

This example shows how to connect your existing chatbot to the new Firebase endpoints
for seamless data saving and retrieval.
"""

import os
import requests
import json
from datetime import datetime
from chatbot.langchain.chat_model import chat_chain
from chatbot.schemas.chat_response import ChatResponse

# Firebase configuration
FIREBASE_PROJECT_ID = "your-project-id"  # Replace with your actual project ID
FIREBASE_REGION = "us-central1"  # Or your deployed region
FIREBASE_BASE_URL = f"https://{FIREBASE_REGION}-{FIREBASE_PROJECT_ID}.cloudfunctions.net"

class RT1MFirebaseIntegration:
    def __init__(self, user_token):
        """
        Initialize with user's Firebase ID token
        """
        self.user_token = user_token
        self.session_id = f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
    def _make_firebase_request(self, endpoint, data):
        """
        Make authenticated request to Firebase Cloud Function
        """
        url = f"{FIREBASE_BASE_URL}/{endpoint}"
        headers = {
            "Authorization": f"Bearer {self.user_token}",
            "Content-Type": "application/json"
        }
        
        response = requests.post(url, json={"data": data}, headers=headers)
        return response.json()
    
    def get_user_context(self):
        """
        Get user's current data for AI context
        """
        try:
            result = self._make_firebase_request("getAIConversationContext", {})
            if result.get("success"):
                return result.get("data", {})
            return {}
        except Exception as e:
            print(f"Error getting user context: {e}")
            return {}
    
    def process_conversation(self, user_message):
        """
        Process a conversation turn with AI data extraction and Firebase saving
        """
        try:
            # Get current user context for better AI responses
            user_context = self.get_user_context()
            
            # Build conversation history (you might want to store this)
            conversation_history = []  # Add previous messages here
            
            # Get AI response with structured data extraction
            ai_response = chat_chain.invoke({
                "input": user_message,
                "history": conversation_history
            })
            
            # Extract the structured data
            extracted_data = {
                "personalInfo": ai_response.personalInfo,
                "financialInfo": ai_response.financialInfo,
                "goals": ai_response.goals
            }
            
            # Calculate confidence score (simple version)
            confidence = self._calculate_confidence(extracted_data)
            
            # Save extracted data to Firebase if confidence is high enough
            if confidence > 0.5 and any(extracted_data.values()):
                update_result = self._save_ai_data_to_firebase(
                    extracted_data, 
                    confidence
                )
                print(f"Data saved to Firebase: {update_result}")
            
            # Log the conversation for analytics
            self._log_conversation(
                user_message, 
                ai_response, 
                extracted_data, 
                confidence
            )
            
            return {
                "ai_message": ai_response.message,
                "extracted_data": extracted_data,
                "confidence": confidence,
                "data_saved": confidence > 0.5 and any(extracted_data.values())
            }
            
        except Exception as e:
            print(f"Error processing conversation: {e}")
            return {
                "ai_message": "I'm sorry, I encountered an error. Please try again.",
                "extracted_data": {},
                "confidence": 0,
                "data_saved": False
            }
    
    def _save_ai_data_to_firebase(self, extracted_data, confidence):
        """
        Save AI extracted data to Firebase using the new AI endpoints
        """
        # Clean the data (remove None values)
        clean_data = {}
        
        if extracted_data.get("personalInfo"):
            clean_data["personalInfo"] = {
                k: v for k, v in extracted_data["personalInfo"].items() 
                if v is not None
            }
        
        if extracted_data.get("financialInfo"):
            clean_data["financialInfo"] = {
                k: v for k, v in extracted_data["financialInfo"].items() 
                if v is not None
            }
        
        if extracted_data.get("goals"):
            clean_data["goals"] = [
                goal for goal in extracted_data["goals"] 
                if goal and goal.get("title")
            ]
        
        # Use the main AI update endpoint
        if clean_data:
            return self._make_firebase_request("updateUserDataFromAI", {
                **clean_data,
                "source": "rt1m_chatbot",
                "confidence": confidence,
                "sessionId": self.session_id
            })
        
        return {"success": False, "message": "No data to save"}
    
    def _log_conversation(self, user_message, ai_response, extracted_data, confidence):
        """
        Log conversation for analytics and improvement
        """
        try:
            self._make_firebase_request("logAIConversation", {
                "userMessage": user_message,
                "aiResponse": ai_response.message,
                "extractedData": extracted_data,
                "confidence": confidence,
                "sessionId": self.session_id,
                "timestamp": datetime.now().isoformat()
            })
        except Exception as e:
            print(f"Error logging conversation: {e}")
    
    def _calculate_confidence(self, extracted_data):
        """
        Simple confidence calculation based on data completeness
        """
        score = 0
        
        # Personal info scoring
        if extracted_data.get("personalInfo"):
            personal_fields = len([v for v in extracted_data["personalInfo"].values() if v])
            score += min(personal_fields / 5, 1) * 0.3
        
        # Financial info scoring
        if extracted_data.get("financialInfo"):
            financial_fields = len([v for v in extracted_data["financialInfo"].values() if v])
            score += min(financial_fields / 4, 1) * 0.4
        
        # Goals scoring
        if extracted_data.get("goals"):
            goals_quality = sum(
                1 for goal in extracted_data["goals"] 
                if goal.get("title") and goal.get("category")
            )
            score += min(goals_quality / len(extracted_data["goals"]), 1) * 0.3
        
        return min(score, 1.0)

# Example usage
def example_conversation_flow():
    """
    Example of how to use the integration in a conversation flow
    """
    # Initialize with user's Firebase token (get this from your auth system)
    user_token = "your-firebase-id-token"  # Replace with actual token
    integration = RT1MFirebaseIntegration(user_token)
    
    # Example conversation turns
    conversation_examples = [
        "Hi, I'm Sarah and I'm 28 years old. I want to save money for a house.",
        "I make about $75,000 per year and currently have $15,000 in savings.",
        "My goal is to save $50,000 for a down payment by 2026.",
        "I also want to learn Python programming to advance my career."
    ]
    
    for user_message in conversation_examples:
        print(f"\nUser: {user_message}")
        
        result = integration.process_conversation(user_message)
        
        print(f"AI: {result['ai_message']}")
        print(f"Confidence: {result['confidence']:.2f}")
        print(f"Data Saved: {result['data_saved']}")
        
        if result['extracted_data']:
            print("Extracted Data:")
            for data_type, data in result['extracted_data'].items():
                if data:
                    print(f"  {data_type}: {data}")

# Advanced example: Batch processing with smart merging
def example_smart_financial_update():
    """
    Example of using the smart financial merger for incremental updates
    """
    user_token = "your-firebase-id-token"
    integration = RT1MFirebaseIntegration(user_token)
    
    # Simulate AI extracting financial info with varying confidence
    financial_updates = {
        "annualIncome": 75000,
        "currentSavings": 15000
    }
    
    # Use the smart merger for high-confidence financial data
    result = integration._make_firebase_request("mergeFinancialDataFromAI", {
        "financialUpdates": financial_updates,
        "confidence": 0.9,
        "source": "rt1m_chatbot"
    })
    
    print(f"Smart financial merge result: {result}")

if __name__ == "__main__":
    print("RT1M Chatbot Firebase Integration Example")
    print("=" * 50)
    
    # Run the example (uncomment to test)
    # example_conversation_flow()
    # example_smart_financial_update()
    
    print("\nTo use this integration:")
    print("1. Replace FIREBASE_PROJECT_ID with your actual project ID")
    print("2. Get user's Firebase ID token from your auth system")
    print("3. Initialize RT1MFirebaseIntegration with the token")
    print("4. Call process_conversation() for each user message")
    print("5. The system will automatically extract and save data!") 