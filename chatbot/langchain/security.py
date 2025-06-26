"""
Security utilities for langchain modules
Provides comprehensive input validation, content filtering, and response sanitization
"""

import re
import json
from typing import Any, Dict, List, Union
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Security Configuration
MAX_INPUT_LENGTH = 2000
MAX_OUTPUT_LENGTH = 1500
MAX_JSON_SIZE = 10000
MAX_ARRAY_LENGTH = 50
MAX_STRING_LENGTH = 1000

# Content filtering patterns
SENSITIVE_PATTERNS = [
    r'\b(?:api[_-]?key|secret|password|token|credential|auth[_-]?token)\b',
    r'\b[A-Za-z0-9]{20,}\b',  # Long strings that might be keys
    r'\$\{.*?\}',  # Environment variable patterns
    r'-----BEGIN.*?-----',  # Certificate patterns
    r'Bearer\s+[A-Za-z0-9\-_]+',  # Bearer tokens
    r'<script.*?>.*?</script>',  # Script tags
    r'javascript:',  # JavaScript protocols
    r'data:.*?base64',  # Base64 data URLs
    r'file:\/\/',  # File protocols
    r'localhost:\d+',  # Localhost URLs
    r'\b(?:127\.0\.0\.1|0\.0\.0\.0)\b',  # Local IPs
]

# Banned words/phrases that should never appear in responses
BANNED_PHRASES = [
    'internal error',
    'stack trace',
    'debug',
    'console.log',
    'print(',
    'error:',
    'exception:',
    'traceback',
    'sql error',
    'database error',
]

class SecurityViolationError(Exception):
    """Raised when a security violation is detected"""
    pass

def sanitize_string(text: str, max_length: int = MAX_STRING_LENGTH) -> str:
    """Sanitize and validate a string input"""
    if not isinstance(text, str):
        raise SecurityViolationError("Input must be a string")
    
    if len(text) > max_length:
        raise SecurityViolationError(f"String too long. Maximum {max_length} characters allowed")
    
    # Check for sensitive patterns
    for pattern in SENSITIVE_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            raise SecurityViolationError("String contains potentially sensitive information")
    
    # Check for banned phrases
    for phrase in BANNED_PHRASES:
        if phrase.lower() in text.lower():
            raise SecurityViolationError(f"String contains banned phrase: {phrase}")
    
    return text.strip()

def sanitize_dict(data: Dict[str, Any], max_size: int = MAX_JSON_SIZE) -> Dict[str, Any]:
    """Recursively sanitize a dictionary"""
    if not isinstance(data, dict):
        raise SecurityViolationError("Input must be a dictionary")
    
    # Check overall size
    data_str = json.dumps(data, default=str)
    if len(data_str) > max_size:
        raise SecurityViolationError(f"Dictionary too large. Maximum {max_size} characters allowed")
    
    sanitized = {}
    for key, value in data.items():
        # Sanitize the key
        clean_key = sanitize_string(str(key), 100)
        
        # Sanitize the value based on its type
        if isinstance(value, str):
            clean_value = sanitize_string(value)
        elif isinstance(value, dict):
            clean_value = sanitize_dict(value, max_size // 2)
        elif isinstance(value, list):
            clean_value = sanitize_list(value)
        elif isinstance(value, (int, float, bool)):
            clean_value = value
        elif value is None:
            clean_value = None
        else:
            # Convert to string and sanitize
            clean_value = sanitize_string(str(value))
        
        sanitized[clean_key] = clean_value
    
    return sanitized

def sanitize_list(data: List[Any]) -> List[Any]:
    """Sanitize a list and its contents"""
    if not isinstance(data, list):
        raise SecurityViolationError("Input must be a list")
    
    if len(data) > MAX_ARRAY_LENGTH:
        raise SecurityViolationError(f"List too long. Maximum {MAX_ARRAY_LENGTH} items allowed")
    
    sanitized = []
    for item in data:
        if isinstance(item, str):
            sanitized.append(sanitize_string(item))
        elif isinstance(item, dict):
            sanitized.append(sanitize_dict(item))
        elif isinstance(item, list):
            sanitized.append(sanitize_list(item))
        elif isinstance(item, (int, float, bool)):
            sanitized.append(item)
        elif item is None:
            sanitized.append(None)
        else:
            sanitized.append(sanitize_string(str(item)))
    
    return sanitized

def validate_json_response(response: str) -> Dict[str, Any]:
    """Validate and parse a JSON response"""
    if not isinstance(response, str):
        raise SecurityViolationError("Response must be a string")
    
    if len(response) > MAX_OUTPUT_LENGTH:
        raise SecurityViolationError("Response too long")
    
    # Check for sensitive patterns
    for pattern in SENSITIVE_PATTERNS:
        if re.search(pattern, response, re.IGNORECASE):
            raise SecurityViolationError("Response contains potentially sensitive information")
    
    # Check for banned phrases
    for phrase in BANNED_PHRASES:
        if phrase.lower() in response.lower():
            raise SecurityViolationError(f"Response contains banned phrase: {phrase}")
    
    # Ensure it's valid JSON
    try:
        parsed = json.loads(response)
    except json.JSONDecodeError as e:
        raise SecurityViolationError(f"Invalid JSON response: {e}")
    
    # Sanitize the parsed JSON
    return sanitize_dict(parsed)

def create_safe_fallback_response(message: str = None) -> Dict[str, Any]:
    """Create a safe fallback response when security violations occur"""
    safe_message = (
        message or 
        "I apologize, but I'm having trouble processing your request right now. "
        "Please try rephrasing your question about your financial planning."
    )
    
    return {
        "message": safe_message,
        "personalInfo": None,
        "financialInfo": None,
        "goals": None
    }

def log_security_event(event_type: str, details: str, user_id: str = None):
    """Log security events for monitoring"""
    log_entry = {
        "event_type": event_type,
        "details": details,
        "user_id": user_id,
        "timestamp": "now"  # In production, use proper timestamp
    }
    
    logger.warning(f"Security Event: {log_entry}")

def rate_limit_check(user_id: str, max_requests: int = 100) -> bool:
    """Simple rate limiting check (in production, use Redis or similar)"""
    # This is a placeholder - implement proper rate limiting in production
    return True

def validate_financial_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Specific validation for financial data"""
    if not isinstance(data, dict):
        raise SecurityViolationError("Financial data must be a dictionary")
    
    # Check for reasonable financial values
    for key, value in data.items():
        if isinstance(value, (int, float)):
            if value < 0 and key not in ['debt', 'expenses']:
                raise SecurityViolationError(f"Invalid negative value for {key}")
            if value > 1000000000:  # 1 billion limit
                raise SecurityViolationError(f"Value too large for {key}")
    
    return sanitize_dict(data)

def validate_personal_info(data: Dict[str, Any]) -> Dict[str, Any]:
    """Specific validation for personal information"""
    if not isinstance(data, dict):
        raise SecurityViolationError("Personal info must be a dictionary")
    
    # Additional validation for age
    if 'age' in data:
        age = data['age']
        if isinstance(age, (int, float)):
            if age < 0 or age > 150:
                raise SecurityViolationError("Invalid age value")
    
    return sanitize_dict(data) 