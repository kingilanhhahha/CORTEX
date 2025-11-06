import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Button } from './button';
import { Clock, Zap, Database, AlertTriangle } from 'lucide-react';

interface PerformanceMetrics {
  lessonCompletionTime: number;
  databaseSaveTime: number;
  apiResponseTime: number;
  errors: string[];
  timestamp: Date;
}

interface PerformanceMonitorProps {
  isVisible?: boolean;
  onToggle?: () => void;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  isVisible = false,
  onToggle
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    if (isMonitoring) {
      // Monitor lesson completion performance
      const originalFetch = window.fetch;
      let startTime: number;

      window.fetch = async (...args) => {
        startTime = performance.now();
        try {
          const response = await originalFetch(...args);
          const endTime = performance.now();
          
          if (args[0].toString().includes('/api/progress')) {
            addMetric({
              lessonCompletionTime: 0,
              databaseSaveTime: 0,
              apiResponseTime: endTime - startTime,
              errors: [],
              timestamp: new Date()
            });
          }
          
          return response;
        } catch (error) {
          const endTime = performance.now();
          addMetric({
            lessonCompletionTime: 0,
            databaseSaveTime: 0,
            apiResponseTime: endTime - startTime,
            errors: [error.toString()],
            timestamp: new Date()
          });
          throw error;
        }
      };

      return () => {
        window.fetch = originalFetch;
      };
    }
  }, [isMonitoring]);

  const addMetric = (metric: PerformanceMetrics) => {
    setMetrics(prev => [metric, ...prev.slice(0, 9)]); // Keep last 10 metrics
  };

  const startMonitoring = () => {
    setIsMonitoring(true);
    setMetrics([]);
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
  };

  const clearMetrics = () => {
    setMetrics([]);
  };

  const getAverageTime = (key: keyof PerformanceMetrics) => {
    if (metrics.length === 0) return 0;
    const values = metrics.map(m => m[key]).filter(v => typeof v === 'number') as number[];
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  };

  const getErrorCount = () => {
    return metrics.reduce((count, m) => count + m.errors.length, 0);
  };

  if (!isVisible) return null;

  return (
    <Card className="w-96 bg-black/90 border-white/20 text-white">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="w-5 h-5 text-yellow-400" />
          Performance Monitor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          {!isMonitoring ? (
            <Button onClick={startMonitoring} size="sm" className="bg-green-600 hover:bg-green-700">
              Start Monitoring
            </Button>
          ) : (
            <Button onClick={stopMonitoring} size="sm" variant="destructive">
              Stop Monitoring
            </Button>
          )}
          <Button onClick={clearMetrics} size="sm" variant="outline">
            Clear
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {getAverageTime('apiResponseTime').toFixed(0)}ms
            </div>
            <div className="text-xs text-gray-400">Avg API Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">
              {getErrorCount()}
            </div>
            <div className="text-xs text-gray-400">Total Errors</div>
          </div>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto">
          {metrics.map((metric, index) => (
            <div key={index} className="text-xs bg-white/5 p-2 rounded">
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-400">
                  {metric.timestamp.toLocaleTimeString()}
                </span>
                <Badge variant={metric.errors.length > 0 ? "destructive" : "secondary"}>
                  {metric.apiResponseTime.toFixed(0)}ms
                </Badge>
              </div>
              {metric.errors.length > 0 && (
                <div className="text-red-400 text-xs">
                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                  {metric.errors.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-xs text-gray-500 text-center">
          Monitor lesson completion performance and identify bottlenecks
        </div>
      </CardContent>
    </Card>
  );
};
