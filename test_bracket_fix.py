#!/usr/bin/env python3
"""
Test script to verify the bracket equation handling fix
"""
import sys
import os
sys.path.append('.')

# Import the functions we modified
from lcd import preprocess_latex_for_rationals

def test_bracket_equation_fix():
    """Test the bracket equation handling for the specific problematic case"""
    
    print("Testing bracket equation handling fix...")
    print("=" * 60)
    
    # Test case 1: The problematic equation from the user
    test_latex = '4*[(x+2)/(x)=(3)/(4)]4*x'
    print(f"Original LaTeX: {test_latex}")
    
    preprocessed = preprocess_latex_for_rationals(test_latex)
    print(f"After preprocess_latex_for_rationals: {preprocessed}")
    
    print("\n" + "=" * 60)
    
    # Test case 2: Another bracket equation
    test_latex2 = '4*[(x+1)/(x-1)=(2)/(3)]4*x'
    print(f"Test 2 - Original: {test_latex2}")
    preprocessed2 = preprocess_latex_for_rationals(test_latex2)
    print(f"Test 2 - Preprocessed: {preprocessed2}")
    
    print("\n" + "=" * 60)
    
    # Test case 3: Simple bracket equation
    test_latex3 = '4[x/4 + 3/2 = 5/4]4'
    print(f"Test 3 - Original: {test_latex3}")
    preprocessed3 = preprocess_latex_for_rationals(test_latex3)
    print(f"Test 3 - Preprocessed: {preprocessed3}")

if __name__ == "__main__":
    test_bracket_equation_fix()






