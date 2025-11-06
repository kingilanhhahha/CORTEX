#!/usr/bin/env python3
"""
Test script to verify the improved OCR bracket handling
"""
import sys
import os
sys.path.append('.')

# Import the functions we modified
from lcd import clean_ocr_artifacts, preprocess_latex_for_rationals

def test_bracket_handling():
    """Test the improved bracket handling for equations like 4[x/4 + 3/2 = 5/4]4"""
    
    print("Testing improved OCR bracket handling...")
    print("=" * 50)
    
    # Test case 1: The problematic equation from the image
    test_latex = '4[x/4 + 3/2 = 5/4]4'
    print(f"Original LaTeX: {test_latex}")
    
    # Test clean_ocr_artifacts
    cleaned = clean_ocr_artifacts(test_latex)
    print(f"After clean_ocr_artifacts: {cleaned}")
    
    # Test preprocess_latex_for_rationals
    preprocessed = preprocess_latex_for_rationals(test_latex)
    print(f"After preprocess_latex_for_rationals: {preprocessed}")
    
    print("\n" + "=" * 50)
    
    # Test case 2: Another bracket equation
    test_latex2 = '3[2x + 1 = 7]3'
    print(f"Test 2 - Original: {test_latex2}")
    cleaned2 = clean_ocr_artifacts(test_latex2)
    preprocessed2 = preprocess_latex_for_rationals(test_latex2)
    print(f"Test 2 - Cleaned: {cleaned2}")
    print(f"Test 2 - Preprocessed: {preprocessed2}")
    
    print("\n" + "=" * 50)
    
    # Test case 3: Non-mathematical brackets (should be removed)
    test_latex3 = 'x + 1 = 5 [OCR artifact]'
    print(f"Test 3 - Original: {test_latex3}")
    cleaned3 = clean_ocr_artifacts(test_latex3)
    preprocessed3 = preprocess_latex_for_rationals(test_latex3)
    print(f"Test 3 - Cleaned: {cleaned3}")
    print(f"Test 3 - Preprocessed: {preprocessed3}")
    
    print("\n" + "=" * 50)
    
    # Test case 4: OCR misreading - the actual problem from the image
    test_latex4 = '4·x + 4'  # This is what OCR actually recognized
    print(f"Test 4 - OCR Misreading: {test_latex4}")
    cleaned4 = clean_ocr_artifacts(test_latex4)
    preprocessed4 = preprocess_latex_for_rationals(test_latex4)
    print(f"Test 4 - Cleaned: {cleaned4}")
    print(f"Test 4 - Preprocessed: {preprocessed4}")
    
    print("\n" + "=" * 50)
    
    # Test case 5: Another OCR misreading pattern
    test_latex5 = '4x + 4'  # Alternative misreading
    print(f"Test 5 - OCR Misreading: {test_latex5}")
    cleaned5 = clean_ocr_artifacts(test_latex5)
    preprocessed5 = preprocess_latex_for_rationals(test_latex5)
    print(f"Test 5 - Cleaned: {cleaned5}")
    print(f"Test 5 - Preprocessed: {preprocessed5}")

if __name__ == "__main__":
    test_bracket_handling()