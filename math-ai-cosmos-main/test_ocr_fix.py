#!/usr/bin/env python3
"""
Test script to verify OCR fixes are working
"""

import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    import lcd
    print("✅ lcd module imported successfully")
    
    # Test the process_image function with a dummy path
    # This will test the error handling without actually calling the API
    print("\n🧪 Testing process_image function...")
    
    # Create a dummy image path that doesn't exist
    dummy_path = "test_dummy_image.png"
    
    try:
        result = lcd.process_image(dummy_path)
        print(f"✅ process_image function executed without crashing")
        print(f"📊 Result structure: {list(result.keys())}")
        print(f"🔍 Error field: {result.get('error')}")
        print(f"📝 LaTeX field: {result.get('latex_raw')}")
        
        if result.get('error'):
            print("⚠️  Expected error due to dummy image path")
        else:
            print("❌ Unexpected: No error for dummy path")
            
    except Exception as e:
        print(f"❌ process_image crashed: {e}")
        
except ImportError as e:
    print(f"❌ Failed to import lcd module: {e}")
    print("Make sure all dependencies are installed:")
    print("pip install requests latex2sympy2 sympy")
