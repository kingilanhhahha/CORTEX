#!/usr/bin/env python3
"""
Test script to verify the new bracket equation handling fix
"""
import sys
import os
sys.path.append('.')

# Import the functions we modified
from lcd import preprocess_latex_for_rationals

def test_new_bracket_equation_fix():
    """Test the new bracket equation handling for the specific problematic case"""
    
    print("Testing new bracket equation handling fix...")
    print("=" * 60)
    
    # Test case 1: The new problematic equation from the user
    test_latex = '4x[x+2/x = 3/4]4x'
    print(f"Test 1 - Original: {test_latex}")
    preprocessed = preprocess_latex_for_rationals(test_latex)
    print(f"Test 1 - Preprocessed: {preprocessed}")
    
    print("\n" + "=" * 60)
    
    # Test case 2: The LaTeX converted problematic pattern
    test_latex2 = '(4*x[x+2)/(x)=(3)/(4)]4*x'
    print(f"Test 2 - Original: {test_latex2}")
    preprocessed2 = preprocess_latex_for_rationals(test_latex2)
    print(f"Test 2 - Preprocessed: {preprocessed2}")
    
    print("\n" + "=" * 60)
    
    # Test case 3: Another similar pattern
    test_latex3 = '4x[x+1/x = 2/3]4x'
    print(f"Test 3 - Original: {test_latex3}")
    preprocessed3 = preprocess_latex_for_rationals(test_latex3)
    print(f"Test 3 - Preprocessed: {preprocessed3}")

if __name__ == "__main__":
    test_new_bracket_equation_fix()






