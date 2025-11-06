#!/usr/bin/env python3
"""
Test script to verify the rational function calculator integration
with the main backend server.
"""

import requests
import json
import time

# Configuration
BASE_URL = "http://localhost:5055"  # Main backend server port
TEST_FUNCTIONS = [
    "(x^2-8x-20)/(x+3)",
    "(x^2-4)/(x-2)",
    "(x^3-1)/(x^2-1)"
]

def test_backend_health():
    """Test if the main backend is running"""
    try:
        response = requests.get(f"{BASE_URL}/api/rational-function/health", timeout=5)
        print(f"✓ Backend health check: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"  Calculator available: {data.get('rational_function_calculator_available', False)}")
            return True
        return False
    except requests.exceptions.RequestException as e:
        print(f"✗ Backend health check failed: {e}")
        return False

def test_rational_function_analysis(function_str):
    """Test the rational function analysis endpoint"""
    try:
        print(f"\nTesting function: {function_str}")
        
        # Test the analyze endpoint
        response = requests.post(
            f"{BASE_URL}/api/rational-function/analyze",
            json={"function": function_str},
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Analysis successful")
            print(f"  Function: {data.get('function')}")
            print(f"  Message: {data.get('message')}")
            
            # Show first few lines of analysis
            analysis = data.get('analysis', '')
            lines = analysis.split('\n')[:10]
            print("  Analysis preview:")
            for line in lines[:5]:
                if line.strip():
                    print(f"    {line}")
            if len(lines) > 5:
                print(f"    ... ({len(lines)-5} more lines)")
        else:
            print(f"✗ Analysis failed: {response.status_code}")
            try:
                error_data = response.json()
                print(f"  Error: {error_data.get('error', 'Unknown error')}")
            except:
                print(f"  Response: {response.text}")
                
    except requests.exceptions.RequestException as e:
        print(f"✗ Request failed: {e}")

def test_specific_endpoints(function_str):
    """Test specific endpoints for domain, zeros, and asymptotes"""
    try:
        print(f"\nTesting specific endpoints for: {function_str}")
        
        # Test domain endpoint
        response = requests.post(
            f"{BASE_URL}/api/rational-function/domain",
            json={"function": function_str},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Domain analysis successful")
            print(f"  Domain: {data.get('domain')}")
            print(f"  Restrictions: {data.get('domain_restrictions')}")
        else:
            print(f"✗ Domain analysis failed: {response.status_code}")
        
        # Test zeros endpoint
        response = requests.post(
            f"{BASE_URL}/api/rational-function/zeros",
            json={"function": function_str},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Zeros analysis successful")
            print(f"  Zeros: {data.get('zeros')}")
            print(f"  Common factors: {data.get('common_factors')}")
        else:
            print(f"✗ Zeros analysis failed: {response.status_code}")
        
        # Test asymptotes endpoint
        response = requests.post(
            f"{BASE_URL}/api/rational-function/asymptotes",
            json={"function": function_str},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Asymptotes analysis successful")
            print(f"  Vertical: {data.get('vertical_asymptotes')}")
            print(f"  Horizontal: {data.get('horizontal_asymptote')}")
            print(f"  Oblique: {data.get('oblique_asymptote')}")
        else:
            print(f"✗ Asymptotes analysis failed: {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"✗ Request failed: {e}")

def main():
    """Main test function"""
    print("=" * 60)
    print("RATIONAL FUNCTION CALCULATOR INTEGRATION TEST")
    print("=" * 60)
    
    # Check if backend is running
    if not test_backend_health():
        print("\n❌ Backend server is not running!")
        print("Please start the backend server first:")
        print("  cd math-cosmos-tutor-main/api")
        print("  python hybrid_db_server.py")
        return
    
    print("\n✅ Backend server is running and calculator is available!")
    
    # Test each function
    for function in TEST_FUNCTIONS:
        test_rational_function_analysis(function)
        test_specific_endpoints(function)
        time.sleep(1)  # Small delay between tests
    
    print("\n" + "=" * 60)
    print("INTEGRATION TEST COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    main()
