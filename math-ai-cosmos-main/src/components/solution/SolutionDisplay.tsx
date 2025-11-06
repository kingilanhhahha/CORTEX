import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertTriangle, 
  Calculator, 
  Brain, 
  Target, 
  Lightbulb,
  ArrowRight,
  BookOpen,
  Zap,
  Trophy
} from 'lucide-react';
import { InlineMath, BlockMath } from 'react-katex';

interface SolutionStep {
  title: string;
  teacherVoice: string;
  instruction: string;
  mathSteps: string[];
  explanation?: string;
  icon?: React.ReactNode;
  color?: string;
}

interface SolutionDisplayProps {
  equation: string;
  steps: SolutionStep[];
  finalAnswer: string;
}

const SolutionDisplay: React.FC<SolutionDisplayProps> = ({ equation, steps, finalAnswer }) => {
  const getStepIcon = (stepIndex: number) => {
    const icons = [
      <Target key="target" className="w-5 h-5" />,
      <Calculator key="calculator" className="w-5 h-5" />,
      <Brain key="brain" className="w-5 h-5" />,
      <CheckCircle key="check" className="w-5 h-5" />
    ];
    return icons[stepIndex] || <Lightbulb key="lightbulb" className="w-5 h-5" />;
  };

  const getStepColor = (stepIndex: number) => {
    const colors = ['text-blue-500', 'text-purple-500', 'text-green-500', 'text-orange-500'];
    return colors[stepIndex] || 'text-primary';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <motion.div 
        className="text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-orbitron font-bold text-3xl bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            🎓 Step-by-Step Solution Guide
          </h1>
        </div>
        <Badge variant="secondary" className="text-sm">
          Debug - Raw Solution
        </Badge>
      </motion.div>

      {/* Original Equation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-bold text-gray-800">
              **Step-by-Step Solution with Teacher-Level Explanations:**
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="font-bold text-lg text-gray-800 mb-2">
                  **Raw Equation:**
                </h3>
                <div className="flex justify-center mb-2">
                  <BlockMath math={equation} />
                </div>
                <p className="text-sm text-gray-600 italic">
                  *(We're solving for x in this fraction equation)*
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Solution Steps */}
      <div className="space-y-6">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
          >
            <Card className="bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 ${getStepColor(index)}`}>
                    {getStepIcon(index)}
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-800">
                    **Step {index + 1}: {step.title}**
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Teacher's Voice */}
                <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg p-4 border-l-4 border-blue-400">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-500 rounded-full">
                      <Lightbulb className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-800 mb-2">
                        **TEACHER'S VOICE:**
                      </h4>
                      <p className="text-blue-700 leading-relaxed">
                        "{step.teacherVoice}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Instruction */}
                <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-lg p-4 border-l-4 border-green-400">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-500 rounded-full">
                      <Brain className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-green-800 mb-2">
                        INSTRUCTION:
                      </h4>
                      <p className="text-green-700 leading-relaxed">
                        {step.instruction}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Math Steps */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="space-y-3">
                    {step.mathSteps.map((mathStep, mathIndex) => (
                      <div key={mathIndex} className="flex items-center gap-3">
                        <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div className="flex-1">
                          {mathStep.includes('\\') ? (
                            <div className="flex justify-center">
                              <BlockMath math={mathStep} />
                            </div>
                          ) : (
                            <p className="text-gray-700 font-mono text-sm">
                              {mathStep}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Explanation */}
                {step.explanation && (
                  <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg p-4 border-l-4 border-yellow-400">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-yellow-500 rounded-full">
                        <Zap className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-yellow-800 mb-2">
                          EXPLANATION:
                        </h4>
                        <p className="text-yellow-700 leading-relaxed">
                          {step.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Final Answer */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Trophy className="w-8 h-8 text-green-600" />
              <CardTitle className="text-2xl font-bold text-green-800">
                **Final Answer:**
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-center">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-green-200">
              <div className="flex justify-center mb-2">
                <BlockMath math={finalAnswer} />
              </div>
              <p className="text-sm text-gray-600 italic">
                *(The solution checks out mathematically!)*
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default SolutionDisplay; 