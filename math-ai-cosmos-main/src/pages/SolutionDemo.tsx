import React from 'react';
import SolutionDisplay from '../components/solution/SolutionDisplay';

const SolutionDemo: React.FC = () => {
  const solutionData = {
    equation: "\\frac{x-3}{x+2} = 2",
    steps: [
      {
        title: "Find and Factor All Denominators",
        teacherVoice: "Let's look carefully at all bottom parts (denominators): 1. There is one fraction with x + 2 at the bottom 2. Since x + 2 is already simple, we don't need to factor it further 3. Any constant terms have an invisible denominator of 1",
        instruction: "First, let's examine all the denominators in our equation - these are the bottom parts of our fractions. We have two simple denominators here that can't be factored further. Remember, we must also identify any x-values that would make these denominators zero, as those would make our equation undefined.",
        mathSteps: [
          "x + 2  # Already in simplest form",
          "x = -2 (because 5/0 is undefined)  # Never allowed",
          "• LCD: x + 2  # This is our magic cleaner for all fractions"
        ],
        explanation: "Values that would break the math."
      },
      {
        title: "Multiply Both Sides by LCD",
        teacherVoice: "We'll multiply EVERY term by x + 2 to clean up: 1. For fractions: The bottom cancels with our LCD 2. For whole numbers: We distribute like multiplication 3. Watch how each part transforms!",
        instruction: "To make this easier to work with, we'll multiply every single term by our least common denominator (LCD). This will clear all the fractions. Watch carefully how each fraction simplifies when we do this multiplication - the denominators will cancel out beautifully!",
        mathSteps: [
          "• Left Side Transformation:",
          "x + 2 * ((x - 3)/(x + 2))",
          "= x + 2 * x - 3 / x + 2",
          "= x - 3  # After cancellation",
          "• Right Side Transformations:",
          "First Term:",
          "x + 2 * 2",
          "= 2*x + 4  # Distribute",
          "• New Clean Equation:",
          "x - 3 = 2*x + 4  # All fractions gone!"
        ]
      },
      {
        title: "Solve the Simplified Equation",
        teacherVoice: "Now we solve like a regular linear algebra problem: 1. Combine like terms on both sides 2. Move variable terms to one side, constants to the other 3. Divide by the coefficient of x",
        instruction: "Now that we've eliminated the fractions, we have a cleaner equation to work with. Let's gather all the x terms on one side and the constant numbers on the other. Remember to perform the same operation on both sides to keep the equation balanced. Our goal is to isolate x to find its value.",
        mathSteps: [
          "• Combine like terms:",
          "x - 3 = 2*x + 4  # We combined x + 3x",
          "• Move terms:",
          "7 = -1*x  # Added 6 to both sides",
          "7 = -1*x",
          "• Divide both sides to isolate x:",
          "7/-1 = -1*x/-1",
          "-7 = x",
          "• Final solution:",
          "x = -7  # Exact form",
          "x ≈ -7.0000000  # Decimal form"
        ]
      },
      {
        title: "Verify the Solution",
        teacherVoice: "Let's test x = -7 in the original equation: 1. Calculate left side by substituting the value 2. Calculate right side by substituting the value 3. Both sides should give the same result",
        instruction: "It's crucial to verify our answer by plugging it back into the original equation. This ensures our solution doesn't make any denominators zero and that both sides of the equation balance correctly. Let's calculate both sides carefully to confirm our answer works.",
        mathSteps: [
          "• Check denominator safety:",
          "x + 2 = -5 ≠ 0  # Good!",
          "• Left Side Calculation:",
          "(x - 3)/(x + 2) = 2  # Exact",
          "2.0000000  # Decimal",
          "• Right Side Calculation:",
          "2 = 2  # Exact",
          "2.0000000  # Decimal",
          "✓ Both sides match perfectly!"
        ]
      },
      {
        title: "Final Verification",
        teacherVoice: "Double-checking our work: 1. Exact fractions confirm precision 2. Decimal form helps visualize 3. Every step maintains equality",
        instruction: "Let's double-check our work by substituting the solution into both sides of the original equation. We'll calculate using exact fractions first for precision, then look at the decimal equivalents. Both sides should give us identical results if we've solved it correctly.",
        mathSteps: [
          "Substitute x = -7:",
          "• Left Side:",
          "(x - 3)/(x + 2) = 2  # Exact",
          "2.0000000  # Decimal",
          "• Right Side:",
          "2 = 2  # Exact",
          "2.0000000  # Decimal",
          "→ Perfect match! (✓ Valid)"
        ]
      }
    ],
    finalAnswer: "x = -7"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <SolutionDisplay 
          equation={solutionData.equation}
          steps={solutionData.steps}
          finalAnswer={solutionData.finalAnswer}
        />
      </div>
    </div>
  );
};

export default SolutionDemo; 