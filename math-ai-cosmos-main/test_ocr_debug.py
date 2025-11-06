#!/usr/bin/env python3
"""
Test script to debug OCR recognition issues
"""

import sys
import os
import requests
import json

# Add the parent directory to the path to import our modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# SimpleTex configuration
SIMPLETEX_UAT = "mOha3P9qrzXqWTbl5DosMWNQZXU9f0hhD80HXJ1O1uew77n43VT2pOys3Afw6s2n"
SIMPLETEX_API_URL = "https://server.simpletex.net/api/latex_ocr"

def test_simpletex_api(image_path):
    """Test SimpleTex API directly"""
    print(f"🔍 Testing SimpleTex API with image: {image_path}")
    print(f"🔑 Token: {SIMPLETEX_UAT[:10]}...")
    
    if not os.path.exists(image_path):
        print(f"❌ Image file not found: {image_path}")
        return None
    
    headers = {"token": SIMPLETEX_UAT}
    
    try:
        with open(image_path, "rb") as f:
            files = {"file": ("image.png", f, "image/png")}
            
            print("📤 Sending request to SimpleTex...")
            resp = requests.post(SIMPLETEX_API_URL, headers=headers, files=files, timeout=30)
            
            print(f"📥 Response status: {resp.status_code}")
            print(f"📥 Response headers: {dict(resp.headers)}")
            
            if resp.status_code != 200:
                print(f"❌ API request failed with status {resp.status_code}")
                print(f"❌ Response text: {resp.text}")
                return None
            
            try:
                res_json = resp.json()
                print(f"📥 Response JSON: {json.dumps(res_json, indent=2)}")
                
                if not res_json.get("status"):
                    print(f"❌ SimpleTex returned error status: {res_json}")
                    return None
                
                latex = res_json["res"].get("latex")
                if not latex:
                    print("❌ No 'latex' field in response")
                    return None
                
                print(f"✅ LaTeX extracted: {latex}")
                return latex
                
            except json.JSONDecodeError as e:
                print(f"❌ Failed to parse JSON response: {e}")
                print(f"❌ Raw response: {resp.text}")
                return None
                
    except requests.RequestException as e:
        print(f"❌ Request failed: {e}")
        return None
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return None

def test_lcd_module(image_path):
    """Test the LCD module directly"""
    print(f"\n🔍 Testing LCD module with image: {image_path}")
    
    try:
        import lcd
        print("✅ LCD module imported successfully")
        
        result = lcd.process_image(image_path)
        print(f"📊 LCD processing result:")
        print(f"   Raw LaTeX: {result.get('latex_raw')}")
        print(f"   Cleaned LaTeX: {result.get('latex_clean')}")
        print(f"   Extracted Equation: {result.get('equation')}")
        print(f"   SymPy Output: {result.get('sympy_out')}")
        print(f"   Error: {result.get('error')}")
        
        if result.get('debug_info'):
            print(f"   Debug Info:")
            for key, value in result['debug_info'].items():
                print(f"     {key}: {value}")
        
        return result
        
    except ImportError as e:
        print(f"❌ Failed to import LCD module: {e}")
        return None
    except Exception as e:
        print(f"❌ LCD module error: {e}")
        import traceback
        print(f"❌ Full traceback: {traceback.format_exc()}")
        return None

def test_solver_module():
    """Test the solver module directly"""
    print(f"\n🔍 Testing Solver module")
    
    try:
        import olol_hahahaa
        print("✅ Solver module imported successfully")
        
        # Test with a simple equation
        test_eq = "2*x + 1 = 5"
        print(f"🧮 Testing equation: {test_eq}")
        
        solution = olol_hahahaa.stepwise_rational_solution_with_explanations(test_eq)
        print(f"✅ Solution generated successfully")
        print(f"📏 Solution length: {len(solution)} characters")
        print(f"📝 Solution preview: {solution[:200]}...")
        
        return True
        
    except ImportError as e:
        print(f"❌ Failed to import solver module: {e}")
        return False
    except Exception as e:
        print(f"❌ Solver module error: {e}")
        import traceback
        print(f"❌ Full traceback: {traceback.format_exc()}")
        return False

def main():
    """Main test function"""
    print("🚀 OCR Debug Test Script")
    print("=" * 50)
    
    # Check command line arguments
    if len(sys.argv) < 2:
        print("❌ Usage: python test_ocr_debug.py <image_path>")
        print("💡 Example: python test_ocr_debug.py test_image.png")
        return
    
    image_path = sys.argv[1]
    
    # Test 1: SimpleTex API directly
    print("\n" + "=" * 50)
    print("🧪 TEST 1: SimpleTex API Direct Test")
    print("=" * 50)
    latex_result = test_simpletex_api(image_path)
    
    # Test 2: LCD module
    print("\n" + "=" * 50)
    print("🧪 TEST 2: LCD Module Test")
    print("=" * 50)
    lcd_result = test_lcd_module(image_path)
    
    # Test 3: Solver module
    print("\n" + "=" * 50)
    print("🧪 TEST 3: Solver Module Test")
    print("=" * 50)
    solver_result = test_solver_module()
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    print(f"✅ SimpleTex API: {'Working' if latex_result else 'Failed'}")
    print(f"✅ LCD Module: {'Working' if lcd_result else 'Failed'}")
    print(f"✅ Solver Module: {'Working' if solver_result else 'Failed'}")
    
    if latex_result and lcd_result:
        print(f"\n🔍 OCR COMPARISON:")
        print(f"   SimpleTex direct: {latex_result}")
        print(f"   LCD processed: {lcd_result.get('latex_raw')}")
        
        if latex_result != lcd_result.get('latex_raw'):
            print(f"   ⚠️  WARNING: Results differ between direct API and LCD module!")
        else:
            print(f"   ✅ Results match between direct API and LCD module")
    
    if lcd_result and lcd_result.get('equation'):
        print(f"\n📝 FINAL EQUATION EXTRACTED:")
        print(f"   {lcd_result['equation']}")
        
        # Check if this looks like what was expected
        expected = "(x^2 - 3) / 2"
        print(f"\n🎯 EXPECTED vs ACTUAL:")
        print(f"   Expected: {expected}")
        print(f"   Actual:   {lcd_result['equation']}")
        
        if expected in lcd_result['equation'] or lcd_result['equation'] in expected:
            print(f"   ✅ Partial match found")
        else:
            print(f"   ❌ No match found - OCR recognition issue detected!")

if __name__ == "__main__":
    main()

