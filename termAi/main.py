#!/usr/bin/env python3
"""Test script for TermAI library"""

from termAi import ChatBot, preprocess_message, extract_keywords

def main():
    # Initialize AI chatbot
    bot = ChatBot()
    
    # Test messages
    test_messages = [
        "Labas! Kaip sekasi?",
        "Ačiū už pagalbą",
        "Kas yra dirbtinis intelektas?",
        "Gražus oras šiandien",
        "Hi there!"
    ]
    
    print("=== TermAI Test ===")
    print("Testing ChatBot responses:\n")
    
    for message in test_messages:
        # Preprocess message
        clean_msg = preprocess_message(message)
        keywords = extract_keywords(message)
        
        # Get AI response
        response = bot.predict(message)
        
        print(f"User: {message}")
        print(f"Keywords: {keywords}")
        print(f"AI: {response}")
        print("-" * 40)

if __name__ == "__main__":
    main()