#!/usr/bin/env python3
"""
Test script to verify backend API connectivity and functionality
"""
import requests
import json

def test_backend():
    base_url = "http://localhost:5001"
    
    print("🧪 Testing Quantum Solver Backend Connection")
    print("=" * 50)
    
    # Test 1: Health Check
    print("\n1️⃣ Testing Health Check...")
    try:
        response = requests.get(f"{base_url}/api/health")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Response: {json.dumps(data, indent=2)}")
        else:
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Connection failed: {e}")
        return False
    
    # Test 2: Test Endpoint
    print("\n2️⃣ Testing Calculator Instance...")
    try:
        response = requests.get(f"{base_url}/api/test")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Response: {json.dumps(data, indent=2)}")
        else:
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Test failed: {e}")
        return False
    
    # Test 3: Function Analysis
    print("\n3️⃣ Testing Function Analysis...")
    test_function = "(x^2-4)/(x-2)"
    try:
        response = requests.post(
            f"{base_url}/api/rational-function/analyze",
            json={"function": test_function},
            headers={"Content-Type": "application/json"}
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Success: {data.get('success')}")
            if data.get('success'):
                print(f"   Analysis available: {len(data.get('analysis', {}).get('steps', []))} steps")
            else:
                print(f"   Error: {data.get('error')}")
        else:
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Analysis failed: {e}")
        return False
    
    print("\n✅ Backend tests completed!")
    return True

if __name__ == "__main__":
    test_backend()


