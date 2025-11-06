#!/usr/bin/env python3
"""
Test script to verify the complete API flow from OCR to solution generation
"""

import requests
import json
import sys
import os

def test_api_health():
    """Test API health endpoint"""
    print("🔍 Testing API Health...")
    try:
        response = requests.get('http://localhost:5001/api/health')
        if response.status_code == 200:
            data = response.json()
            print(f"✅ API Health: {data['status']}")
            print(f"📷 OCR Available: {data['ocr_available']}")
            print(f"🧮 Solver Available: {data['solver_available']}")
            return True
        else:
            print(f"❌ API Health failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Cannot connect to API: {e}")
        return False

def test_solver_directly():
    """Test solver endpoint directly with a known equation"""
    print("\n🔍 Testing Solver Directly...")
    try:
        test_equation = "2*x + 1 = 5"
        response = requests.post('http://localhost:5001/api/solver/solve', 
                               json={'equation': test_equation})
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print(f"✅ Solver test successful")
                print(f"📝 Equation: {test_equation}")
                print(f"📏 Solution length: {data.get('solution_length', 'N/A')}")
                print(f"🔄 Solution preview: {data.get('solution', '')[:100]}...")
                return True
            else:
                print(f"❌ Solver test failed: {data.get('error')}")
                return False
        else:
            print(f"❌ Solver request failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Solver test error: {e}")
        return False

def test_ocr_with_image(image_path):
    """Test OCR endpoint with an image file"""
    print(f"\n🔍 Testing OCR with image: {image_path}")
    
    if not os.path.exists(image_path):
        print(f"❌ Image file not found: {image_path}")
        return False
    
    try:
        with open(image_path, 'rb') as f:
            files = {'image': (os.path.basename(image_path), f, 'image/png')}
            response = requests.post('http://localhost:5001/api/ocr/process', files=files)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print(f"✅ OCR test successful")
                print(f"📝 Raw LaTeX: {data.get('latex_raw', 'N/A')}")
                print(f"🧹 Cleaned LaTeX: {data.get('latex_clean', 'N/A')}")
                print(f"📊 Extracted Equation: {data.get('equation', 'N/A')}")
                print(f"🔄 Auto-Solved: {data.get('auto_solved', 'N/A')}")
                
                if data.get('solution'):
                    print(f"🧮 Solution generated automatically!")
                    print(f"📏 Solution length: {data.get('solution_length', 'N/A')}")
                    print(f"📝 Solution preview: {data.get('solution', '')[:200]}...")
                else:
                    print(f"ℹ️ No automatic solution generated")
                    if data.get('solve_error'):
                        print(f"❌ Solve error: {data['solve_error']}")
                
                return True
            else:
                print(f"❌ OCR test failed: {data.get('error')}")
                return False
        else:
            print(f"❌ OCR request failed: {response.status_code}")
            print(f"❌ Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ OCR test error: {e}")
        return False

def main():
    """Main test function"""
    print("🚀 API Flow Test Script")
    print("=" * 50)
    
    # Test 1: API Health
    if not test_api_health():
        print("\n❌ API is not available. Please start the API first:")
        print("   cd math-ai-cosmos-main/api")
        print("   python drawing_solver_api.py")
        return
    
    # Test 2: Solver Directly
    if not test_solver_directly():
        print("\n❌ Solver test failed. Check the solver module.")
        return
    
    # Test 3: OCR with image (if provided)
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
        test_ocr_with_image(image_path)
    else:
        print("\n💡 To test OCR, provide an image path:")
        print("   python test_api_flow.py your_image.png")
    
    print("\n" + "=" * 50)
    print("✅ API Flow Test Complete!")
    print("💡 If all tests pass, your API is working correctly.")

if __name__ == "__main__":
    main()

