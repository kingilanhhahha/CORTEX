#!/usr/bin/env python3
import sys
sys.path.append('.')
from lcd import preprocess_latex_for_rationals

# Test the problematic equation
test_latex = '4*[(x+2)/(x)=(3)/(4)]4*x'
print(f"Input: {test_latex}")
result = preprocess_latex_for_rationals(test_latex)
print(f"Output: {result}")






