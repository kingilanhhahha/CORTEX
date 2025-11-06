#!/usr/bin/env python3
"""
Test script for the Quantum Rational Function Solver Backend
This script tests the API endpoints to ensure they're working correctly.
"""

import requests
import json
import sys

# Configuration
BASE_URL = "http://localhost:5001"
TEST_FUNCTIONS = [
    "(x^2-8x-20)/(x+3)",
    "(x^2-4)/(x-2)",
    "(x^3-1)/(x^2-1)"
]

def test_health_check():
    """Test the health check endpoint"""
    print("🔍 Testing health check...")
    try:
        response = requests.get(f"{BASE_URL}/api/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed: {data}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Is it running on port 5001?")
        return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_function_validation():
    """Test the function validation endpoint"""
    print("\n🔍 Testing function validation...")
    for func in TEST_FUNCTIONS:
        try:
            response = requests.post(
                f"{BASE_URL}/api/rational-function/validate",
                json={"function": func}
            )
            if response.status_code == 200:
                data = response.json()
                status = "✅" if data.get('valid') else "❌"
                print(f"{status} {func}: {data.get('message', 'No message')}")
            else:
                print(f"❌ {func}: HTTP {response.status_code}")
        except Exception as e:
            print(f"❌ {func}: Error - {e}")

def test_function_analysis():
    """Test the full function analysis endpoint"""
    print("\n🔍 Testing function analysis...")
    test_func = TEST_FUNCTIONS[0]  # Use first function for detailed test
    
    try:
        print(f"Analyzing: {test_func}")
        response = requests.post(
            f"{BASE_URL}/api/rational-function/analyze",
            json={"function": test_func}
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                analysis = data.get('analysis', {})
                print(f"✅ Analysis successful!")
                print(f"   Domain: {analysis.get('domain', 'N/A')}")
                print(f"   Zeros: {analysis.get('zeros', [])}")
                print(f"   Vertical Asymptotes: {analysis.get('vertical_asymptotes', [])}")
                print(f"   Horizontal Asymptote: {analysis.get('horizontal_asymptote', 'N/A')}")
                print(f"   Steps: {len(analysis.get('steps', []))} steps generated")
            else:
                print(f"❌ Analysis failed: {data.get('error', 'Unknown error')}")
        else:
            print(f"❌ Analysis request failed: HTTP {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Analysis error: {e}")

def test_domain_endpoint():
    """Test the domain endpoint"""
    print("\n🔍 Testing domain endpoint...")
    test_func = TEST_FUNCTIONS[0]
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/rational-function/domain",
            json={"function": test_func}
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print(f"✅ Domain analysis successful!")
                print(f"   Domain: {data.get('domain', 'N/A')}")
                print(f"   Restrictions: {data.get('domain_restrictions', [])}")
            else:
                print(f"❌ Domain analysis failed: {data.get('error', 'Unknown error')}")
        else:
            print(f"❌ Domain request failed: HTTP {response.status_code}")
            
    except Exception as e:
        print(f"❌ Domain analysis error: {e}")

def test_zeros_endpoint():
    """Test the zeros endpoint"""
    print("\n🔍 Testing zeros endpoint...")
    test_func = TEST_FUNCTIONS[0]
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/rational-function/zeros",
            json={"function": test_func}
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print(f"✅ Zeros analysis successful!")
                print(f"   Zeros: {data.get('zeros', [])}")
                print(f"   Common Factors: {data.get('common_factors', [])}")
            else:
                print(f"❌ Zeros analysis failed: {data.get('error', 'Unknown error')}")
        else:
            print(f"❌ Zeros request failed: HTTP {response.status_code}")
            
    except Exception as e:
        print(f"❌ Zeros analysis error: {e}")

def test_asymptotes_endpoint():
    """Test the asymptotes endpoint"""
    print("\n🔍 Testing asymptotes endpoint...")
    test_func = TEST_FUNCTIONS[0]
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/rational-function/asymptotes",
            json={"function": test_func}
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print(f"✅ Asymptotes analysis successful!")
                print(f"   Vertical: {data.get('vertical_asymptotes', [])}")
                print(f"   Horizontal: {data.get('horizontal_asymptote', 'N/A')}")
                print(f"   Oblique: {data.get('oblique_asymptote', 'N/A')}")
            else:
                print(f"❌ Asymptotes analysis failed: {data.get('error', 'Unknown error')}")
        else:
            print(f"❌ Asymptotes request failed: HTTP {response.status_code}")
            
    except Exception as e:
        print(f"❌ Asymptotes analysis error: {e}")

def main():
    """Run all tests"""
    print("🚀 Quantum Rational Function Solver Backend Test")
    print("=" * 50)
    
    # Check if server is running
    if not test_health_check():
        print("\n❌ Server is not running or not accessible.")
        print("Please start the backend server first:")
        print("   cd api")
        print("   python rational_function_solver.py")
        sys.exit(1)
    
    # Run all tests
    test_function_validation()
    test_function_analysis()
    test_domain_endpoint()
    test_zeros_endpoint()
    test_asymptotes_endpoint()
    
    print("\n" + "=" * 50)
    print("✅ All tests completed!")
    print("\nIf all tests passed, your backend is working correctly.")
    print("You can now use the frontend to interact with the solver.")

if __name__ == "__main__":
    main()
