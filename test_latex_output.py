#!/usr/bin/env python3
"""
Test script to verify LaTeX output is clean and properly formatted
"""

import sys
import os
import importlib.util

# Add the current directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import the module with spaces in filename
spec = importlib.util.spec_from_file_location("solver", "FINAL SOLVING CALCULATOR.py")
solver_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(solver_module)
stepwise_rational_solution_with_explanations = solver_module.stepwise_rational_solution_with_explanations

def test_latex_output():
    """Test the LaTeX output for various equations"""
    
    test_equations = [
        "1/(x-2) = 3/(x+1)",
        "(x+1)/(x-3) = 2",
        "x/(x+1) + 1/(x-1) = 2",
        "2/(x-1) = 1/(x+2) + 1"
    ]
    
    print("Testing LaTeX output for rational equations...")
    print("=" * 60)
    
    for i, equation in enumerate(test_equations, 1):
        print(f"\nTest {i}: {equation}")
        print("-" * 40)
        
        try:
            result = stepwise_rational_solution_with_explanations(equation)
            print("✅ Output generated successfully")
            
            # Check for unwanted characters
            if "****" in result:
                print("❌ Found unwanted asterisks in output")
            else:
                print("✅ No unwanted asterisks found")
            
            # Check for LaTeX formatting
            if "$$" in result:
                print("✅ LaTeX formatting found")
            else:
                print("❌ No LaTeX formatting found")
            
            # Check for clean structure
            if "## Step-by-Step Solution" in result:
                print("✅ Clean header structure")
            else:
                print("❌ Missing clean header structure")
            
            # Show a sample of the output
            lines = result.split('\n')
            print("\nSample output (first 10 lines):")
            for j, line in enumerate(lines[:10]):
                print(f"  {j+1:2d}: {line}")
            
        except Exception as e:
            print(f"❌ Error processing equation: {e}")
        
        print()

if __name__ == "__main__":
    test_latex_output() 